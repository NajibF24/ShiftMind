"""
Sync Routes — Admin endpoints for triggering knowledge sync operations.
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from db import get_db
from models.user import User, RoleEnum
from services.auth import require_role
from services.knowledge_sync import sync_onedrive_documents, SyncResult
from services.onedrive_service import is_configured
from seed_company_knowledge import seed_company_knowledge

router = APIRouter()

# In-memory sync status tracking
_sync_status = {
    "is_running": False,
    "last_result": None,
    "last_run_at": None,
}


def _run_onedrive_sync(db_session_factory):
    """Background task for OneDrive sync."""
    from db import SessionLocal
    from datetime import datetime, timezone

    _sync_status["is_running"] = True
    db = SessionLocal()
    try:
        result = sync_onedrive_documents(db)
        _sync_status["last_result"] = result.to_dict()
        _sync_status["last_run_at"] = datetime.now(timezone.utc).isoformat()
    except Exception as e:
        _sync_status["last_result"] = {"error": str(e)}
    finally:
        _sync_status["is_running"] = False
        db.close()


@router.post("/onedrive")
def trigger_onedrive_sync(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(require_role([RoleEnum.admin])),
):
    """Trigger OneDrive SOP/Policy sync (admin only). Runs in background."""
    if not is_configured():
        raise HTTPException(
            status_code=400,
            detail="Microsoft Graph credentials not configured. Check MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET in .env"
        )

    if _sync_status["is_running"]:
        raise HTTPException(status_code=409, detail="Sync is already running")

    background_tasks.add_task(_run_onedrive_sync, None)
    return {"message": "OneDrive sync started in background", "status": "running"}


@router.get("/status")
def get_sync_status(
    current_user: User = Depends(require_role([RoleEnum.admin])),
):
    """Get the status of the last sync operation."""
    return {
        "is_running": _sync_status["is_running"],
        "last_result": _sync_status["last_result"],
        "last_run_at": _sync_status["last_run_at"],
        "onedrive_configured": is_configured(),
    }


@router.post("/seed-company")
def trigger_seed_company(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin])),
):
    """Seed company knowledge from website data (admin only). Idempotent."""
    try:
        stats = seed_company_knowledge(db)
        return {
            "message": "Company knowledge seeding complete",
            "stats": stats,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Seeding failed: {str(e)}")
