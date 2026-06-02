"""
LDAP Service — Active Directory authentication via ldap3.
Strategy: Direct bind (no search) — try multiple DN formats for the user.
This avoids needing a service account with read-directory permissions.
"""
import os
import logging
import ssl
from typing import Optional

from ldap3 import Server, Connection, Tls, SAFE_SYNC, SUBTREE
from ldap3.core.exceptions import LDAPException, LDAPBindError, LDAPSocketOpenError

logger = logging.getLogger(__name__)

# ── Config ─────────────────────────────────────────────────────────────────────
LDAP_URL           = os.getenv("LDAP_URL", "")
LDAP_BIND_DN       = os.getenv("LDAP_BIND_DN", "")
LDAP_BIND_PASSWORD = os.getenv("LDAP_BIND_PASSWORD", "")
LDAP_BASE_DN       = os.getenv("LDAP_BASE_DN", "DC=gyssteel,DC=com")
LDAP_SEARCH_FILTER = os.getenv("LDAP_SEARCH_FILTER", "(sAMAccountName={username})")
LDAP_USERNAME_ATTR = os.getenv("LDAP_USERNAME_ATTRIBUTE", "sAMAccountName")
LDAP_MAIL_ATTR     = os.getenv("LDAP_MAIL_ATTRIBUTE", "mail")
LDAP_DISPLAY_ATTR  = os.getenv("LDAP_DISPLAYNAME_ATTRIBUTE", "cn")
LDAP_FIRST_ATTR    = os.getenv("LDAP_FIRSTNAME_ATTRIBUTE", "givenName")
LDAP_LAST_ATTR     = os.getenv("LDAP_LASTNAME_ATTRIBUTE", "sn")

_raw_admins = os.getenv("LDAP_ADMIN_USERS", "")
LDAP_ADMIN_USERS: set = {u.strip().lower() for u in _raw_admins.split(",") if u.strip()}

# Domain name extracted from LDAP_BASE_DN (e.g. DC=gyssteel,DC=com → gyssteel.com)
def _dn_to_domain(base_dn: str) -> str:
    parts = [p.split("=")[1] for p in base_dn.split(",") if p.lower().startswith("dc=")]
    return ".".join(parts)

LDAP_DOMAIN = _dn_to_domain(LDAP_BASE_DN)  # gyssteel.com


def is_configured() -> bool:
    return bool(LDAP_URL and LDAP_BASE_DN)


def _parse_ldap_url(url: str):
    use_ssl = url.lower().startswith("ldaps://")
    host = url.split("://", 1)[1] if "://" in url else url
    if ":" in host:
        host, port_str = host.rsplit(":", 1)
        port = int(port_str)
    else:
        port = 636 if use_ssl else 389
    return host, port, use_ssl


def _make_server(host: str, port: int, use_ssl: bool) -> Server:
    if use_ssl:
        tls = Tls(validate=ssl.CERT_NONE, version=ssl.PROTOCOL_TLS)
        return Server(host, port=port, use_ssl=True, tls=tls, connect_timeout=15, get_info=None)
    return Server(host, port=port, connect_timeout=15, get_info=None)


def _safe_attr(entry, attr_name: str, default: str = "") -> str:
    try:
        val = entry[attr_name].value
        if val is None:
            return default
        if isinstance(val, list):
            return str(val[0]) if val else default
        return str(val)
    except Exception:
        return default


class LDAPUserInfo:
    def __init__(self, username: str, email: str, display_name: str, dn: str):
        self.username     = username
        self.email        = email
        self.display_name = display_name
        self.dn           = dn

    @property
    def is_admin(self) -> bool:
        return self.username.lower() in LDAP_ADMIN_USERS


def _try_bind(server, user_identity: str, password: str) -> Optional[Connection]:
    """Try to bind to LDAP with given identity. Returns open connection or None."""
    try:
        conn = Connection(
            server,
            user=user_identity,
            password=password,
            client_strategy=SAFE_SYNC,
            auto_bind=True,
            raise_exceptions=True,
            receive_timeout=15,
        )
        return conn
    except LDAPBindError:
        return None
    except Exception as e:
        logger.debug(f"Bind failed for '{user_identity}': {e}")
        return None


def authenticate(username: str, password: str) -> Optional[LDAPUserInfo]:
    """
    Authenticate against Active Directory using direct bind strategy.

    Tries multiple identity formats:
    1. UPN:               username@domain.com   (most common in modern AD)
    2. NetBIOS:           DOMAIN\\username
    3. Service-account search + re-bind (if service account configured)

    Returns LDAPUserInfo on success, None on failure.
    """
    if not is_configured():
        logger.warning("LDAP not configured")
        return None
    if not username or not password:
        return None

    try:
        host, port, use_ssl = _parse_ldap_url(LDAP_URL)
        server = _make_server(host, port, use_ssl)
        domain_short = LDAP_DOMAIN.split(".")[0].upper()  # GYSSTEEL

        # Build candidate identities to try
        candidates = []

        # 1. UPN: najib.fauzan@gyssteel.com
        if "@" not in username:
            candidates.append(f"{username}@{LDAP_DOMAIN}")
        else:
            candidates.append(username)

        # 2. NetBIOS: GYSSTEEL\najib.fauzan
        sam = username.split("@")[0]
        candidates.append(f"{domain_short}\\{sam}")

        # 3. Legacy: DOMAIN\username (lowercase)
        candidates.append(f"{LDAP_DOMAIN.split('.')[0]}\\{sam}")

        # 4. If service account configured, try search-then-bind
        has_service_account = bool(LDAP_BIND_DN and LDAP_BIND_PASSWORD)

        logger.info(f"LDAP: trying direct bind for '{username}' with {len(candidates)} formats")

        successful_conn = None
        used_identity = None

        for identity in candidates:
            logger.info(f"LDAP: trying bind as '{identity}'")
            conn = _try_bind(server, identity, password)
            if conn is not None:
                successful_conn = conn
                used_identity = identity
                logger.info(f"LDAP: bind succeeded with '{identity}'")
                break

        if successful_conn is None and has_service_account:
            # Last resort: service account search → re-bind
            logger.info("LDAP: direct bind failed, trying service-account search")
            return _service_account_auth(server, sam, password)

        if successful_conn is None:
            logger.warning(f"LDAP: all bind attempts failed for '{username}'")
            return None

        # Fetch user attributes using the authenticated connection
        search_filter = LDAP_SEARCH_FILTER.replace("{username}", sam)
        successful_conn.search(
            search_base=LDAP_BASE_DN,
            search_filter=search_filter,
            search_scope=SUBTREE,
            attributes=[LDAP_USERNAME_ATTR, LDAP_MAIL_ATTR, LDAP_DISPLAY_ATTR,
                        LDAP_FIRST_ATTR, LDAP_LAST_ATTR, "distinguishedName", "userPrincipalName"],
        )

        if successful_conn.entries:
            entry   = successful_conn.entries[0]
            user_dn = str(entry.entry_dn)
            sam_val = _safe_attr(entry, LDAP_USERNAME_ATTR, sam)
            email   = _safe_attr(entry, LDAP_MAIL_ATTR, "")
            display = _safe_attr(entry, LDAP_DISPLAY_ATTR, "")
            if not display:
                first = _safe_attr(entry, LDAP_FIRST_ATTR, "")
                last  = _safe_attr(entry, LDAP_LAST_ATTR, "")
                display = f"{first} {last}".strip()
            if not email:
                email = _safe_attr(entry, "userPrincipalName", f"{sam}@{LDAP_DOMAIN}")
        else:
            # Could not search own record — use what we know
            logger.info(f"LDAP: self-search failed, using minimal info")
            user_dn = used_identity
            sam_val = sam
            email   = f"{sam}@{LDAP_DOMAIN}"
            display = sam

        successful_conn.unbind()

        logger.info(f"LDAP: '{sam}' authenticated OK (admin={sam.lower() in LDAP_ADMIN_USERS})")
        return LDAPUserInfo(
            username=sam_val, email=email, display_name=display, dn=user_dn
        )

    except LDAPSocketOpenError as e:
        logger.error(f"LDAP cannot connect to server: {e}")
        return None
    except Exception as e:
        logger.error(f"LDAP unexpected error for '{username}': {e}", exc_info=True)
        return None


def _service_account_auth(server, sam: str, password: str) -> Optional[LDAPUserInfo]:
    """Fallback: use service account to find user DN, then re-bind as user."""
    try:
        conn = Connection(
            server, user=LDAP_BIND_DN, password=LDAP_BIND_PASSWORD,
            client_strategy=SAFE_SYNC, auto_bind=True, raise_exceptions=True, receive_timeout=15,
        )
        search_filter = LDAP_SEARCH_FILTER.replace("{username}", sam)
        conn.search(
            search_base=LDAP_BASE_DN,
            search_filter=search_filter,
            search_scope=SUBTREE,
            attributes=[LDAP_USERNAME_ATTR, LDAP_MAIL_ATTR, LDAP_DISPLAY_ATTR,
                        LDAP_FIRST_ATTR, LDAP_LAST_ATTR, "distinguishedName"],
        )
        if not conn.entries:
            conn.unbind()
            logger.warning(f"LDAP service-account search: '{sam}' not found")
            return None

        entry   = conn.entries[0]
        user_dn = str(entry.entry_dn)
        sam_val = _safe_attr(entry, LDAP_USERNAME_ATTR, sam)
        email   = _safe_attr(entry, LDAP_MAIL_ATTR, f"{sam}@{LDAP_DOMAIN}")
        display = _safe_attr(entry, LDAP_DISPLAY_ATTR, "")
        if not display:
            first = _safe_attr(entry, LDAP_FIRST_ATTR, "")
            last  = _safe_attr(entry, LDAP_LAST_ATTR, "")
            display = f"{first} {last}".strip() or sam
        conn.unbind()

        # Re-bind as the user
        user_conn = _try_bind(server, user_dn, password)
        if user_conn is None:
            logger.warning(f"LDAP re-bind as '{user_dn}' failed — wrong password?")
            return None
        user_conn.unbind()

        logger.info(f"LDAP service-account: '{sam}' authenticated OK")
        return LDAPUserInfo(username=sam_val, email=email, display_name=display, dn=user_dn)
    except Exception as e:
        logger.warning(f"LDAP service-account auth failed: {e}")
        return None


def test_connection() -> dict:
    """Test LDAP service account connection."""
    if not is_configured():
        return {"ok": False, "error": "LDAP not configured (missing env vars)"}
    try:
        host, port, use_ssl = _parse_ldap_url(LDAP_URL)
        server = _make_server(host, port, use_ssl)

        if LDAP_BIND_DN and LDAP_BIND_PASSWORD:
            conn = Connection(
                server, user=LDAP_BIND_DN, password=LDAP_BIND_PASSWORD,
                client_strategy=SAFE_SYNC, auto_bind=True, raise_exceptions=True, receive_timeout=10,
            )
            conn.unbind()
            return {"ok": True, "server": f"{host}:{port}", "ssl": use_ssl,
                    "bind_dn": LDAP_BIND_DN, "domain": LDAP_DOMAIN}
        else:
            # Anonymous bind test
            conn = Connection(server, client_strategy=SAFE_SYNC, auto_bind=True, receive_timeout=10)
            conn.unbind()
            return {"ok": True, "server": f"{host}:{port}", "ssl": use_ssl, "mode": "anonymous"}
    except Exception as e:
        return {"ok": False, "error": str(e)}
