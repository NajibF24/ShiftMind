from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db import get_db
from models.user import User, RoleEnum
from models.knowledge import KnowledgeEntry
from services.auth import get_current_user, require_role
from services.knowledge_health import get_knowledge_health_summary

import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("")
def get_knowledge_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get knowledge health summary: freshness, staleness, contradictions."""
    try:
        return get_knowledge_health_summary(db)
    except Exception as e:
        logger.error(f"Error generating knowledge health report: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")


@router.post("/mark-valid/{entry_id}", status_code=200)
def mark_entry_valid(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin]))
):
    """Mark a stale knowledge entry as still valid (resets its updated_at timestamp)."""
    entry = db.query(KnowledgeEntry).filter(KnowledgeEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    from datetime import datetime
    entry.updated_at = datetime.utcnow()
    db.commit()
    return {"message": f"Entry '{entry.title}' marked as still valid."}
