from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from pydantic import BaseModel
import os

from db import get_db
from models.user import User, RoleEnum
from services.auth import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from services.ldap_service import authenticate as ldap_authenticate, is_configured as ldap_is_configured

router = APIRouter()


class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: RoleEnum = RoleEnum.viewer


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Register a local (non-LDAP) user. In production, restrict this endpoint to admins."""
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed_password = get_password_hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        role=user.role,
        is_ldap_user=False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"msg": "User created successfully"}


@router.post("/login")
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Login endpoint — tries LDAP first (if configured), then falls back to local DB.

    LDAP flow:
    1. Bind to AD with service account
    2. Search for user by sAMAccountName
    3. Re-bind as user with provided password
    4. Auto-create / update user record in local DB
    5. Issue JWT token

    Local flow:
    1. Look up user in local DB by username
    2. Verify bcrypt password
    3. Issue JWT token
    """
    username = form_data.username.strip()
    password = form_data.password

    # ── Try LDAP authentication first ─────────────────────────────────────────
    if ldap_is_configured():
        ldap_user = ldap_authenticate(username, password)

        if ldap_user is not None:
            # LDAP auth succeeded — upsert user in local DB
            db_user = db.query(User).filter(User.username == ldap_user.username).first()

            if db_user is None:
                # First time this LDAP user logs in — create local record
                role = RoleEnum.admin if ldap_user.is_admin else RoleEnum.user
                db_user = User(
                    username=ldap_user.username,
                    email=ldap_user.email or f"{ldap_user.username}@gyssteel.com",
                    hashed_password=None,           # No local password for LDAP users
                    role=role,
                    is_ldap_user=True,
                    display_name=ldap_user.display_name,
                )
                db.add(db_user)
                db.commit()
                db.refresh(db_user)
            else:
                # User exists — update info from LDAP and enforce admin whitelist
                updated = False
                if ldap_user.is_admin and db_user.role != RoleEnum.admin:
                    db_user.role = RoleEnum.admin
                    updated = True
                if ldap_user.display_name and db_user.display_name != ldap_user.display_name:
                    db_user.display_name = ldap_user.display_name
                    updated = True
                if ldap_user.email and db_user.email != ldap_user.email:
                    db_user.email = ldap_user.email
                    updated = True
                db_user.is_ldap_user = True
                if updated:
                    db.commit()
                    db.refresh(db_user)

            # Issue JWT
            token = _issue_token(db_user)
            return {
                "access_token": token,
                "token_type": "bearer",
                "role": db_user.role.value,
                "display_name": db_user.display_name or db_user.username,
                "auth_method": "ldap",
            }

        # If LDAP returned None but LDAP IS configured, check if this might be
        # a local-only user (e.g. fallback admin created before LDAP was set up)
        # We still allow local auth below.

    # ── Fallback: local database authentication ───────────────────────────────
    db_user = db.query(User).filter(User.username == username).first()
    if not db_user or db_user.is_ldap_user:
        # LDAP users cannot log in with local password
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not db_user.hashed_password or not verify_password(password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = _issue_token(db_user)
    return {
        "access_token": token,
        "token_type": "bearer",
        "role": db_user.role.value,
        "display_name": db_user.display_name or db_user.username,
        "auth_method": "local",
    }


def _issue_token(user: User) -> str:
    """Create a JWT access token for a user."""
    expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return create_access_token(
        data={"sub": user.username, "role": user.role.value},
        expires_delta=expires,
    )


@router.get("/me")
def get_current_user_info():
    """Check LDAP config status."""
    return {
        "ldap_enabled": ldap_is_configured(),
        "ldap_server": os.getenv("LDAP_URL", "not set"),
        "ldap_admin_users": os.getenv("LDAP_ADMIN_USERS", ""),
    }


@router.get("/test-ldap")
def test_ldap_connection():
    """Test LDAP service account connection — for debugging only."""
    from services.ldap_service import test_connection
    return test_connection()


@router.post("/test-ldap-auth")
def test_ldap_auth(body: dict):
    """Test a specific user's LDAP auth — for debugging only. Remove in production."""
    username = body.get("username", "")
    password = body.get("password", "")
    ldap_user = ldap_authenticate(username, password)
    if ldap_user:
        return {
            "success": True,
            "username": ldap_user.username,
            "email": ldap_user.email,
            "display_name": ldap_user.display_name,
            "dn": ldap_user.dn,
            "is_admin": ldap_user.is_admin,
        }
    return {"success": False, "message": "Authentication failed — check backend logs for details"}


@router.get("/search-ldap/{username}")
def search_ldap_user(username: str):
    """Debug: search for a user in LDAP and return what we find."""
    from services.ldap_service import (
        _parse_ldap_url, _make_server, LDAP_URL, LDAP_BIND_DN,
        LDAP_BIND_PASSWORD, LDAP_BASE_DN, LDAP_USERNAME_ATTR
    )
    from ldap3 import Connection, SUBTREE, SAFE_SYNC, ALL_ATTRIBUTES

    if not LDAP_URL:
        return {"error": "LDAP not configured"}

    try:
        host, port, use_ssl = _parse_ldap_url(LDAP_URL)
        server = _make_server(host, port, use_ssl)

        conn = Connection(
            server, user=LDAP_BIND_DN, password=LDAP_BIND_PASSWORD,
            client_strategy=SAFE_SYNC, auto_bind=True, raise_exceptions=True, receive_timeout=15,
        )

        results = {}

        # Try multiple search strategies
        searches = [
            ("exact_filter", LDAP_BASE_DN, f"({LDAP_USERNAME_ATTR}={username})"),
            ("wildcard_sam", LDAP_BASE_DN, f"({LDAP_USERNAME_ATTR}=*{username}*)"),
            ("by_upn", LDAP_BASE_DN, f"(userPrincipalName={username}*)"),
            ("by_cn", LDAP_BASE_DN, f"(cn=*{username}*)"),
            ("by_mail", LDAP_BASE_DN, f"(mail={username}*)"),
        ]

        for label, base, fltr in searches:
            try:
                conn.search(
                    search_base=base,
                    search_filter=fltr,
                    search_scope=SUBTREE,
                    attributes=["sAMAccountName", "mail", "cn", "distinguishedName",
                                "userPrincipalName", "givenName", "sn", "objectClass"],
                )
                found = []
                for entry in conn.entries[:3]:  # max 3 results
                    found.append({
                        "dn": str(entry.entry_dn),
                        "sAMAccountName": str(entry["sAMAccountName"].value) if "sAMAccountName" in entry else "",
                        "mail": str(entry["mail"].value) if "mail" in entry else "",
                        "cn": str(entry["cn"].value) if "cn" in entry else "",
                        "userPrincipalName": str(entry["userPrincipalName"].value) if "userPrincipalName" in entry else "",
                    })
                results[label] = {"filter": fltr, "count": len(conn.entries), "entries": found}
            except Exception as e:
                results[label] = {"filter": fltr, "error": str(e)}

        conn.unbind()
        return {"base_dn": LDAP_BASE_DN, "username_attr": LDAP_USERNAME_ATTR, "results": results}

    except Exception as e:
        return {"error": str(e)}
