from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date

from db import get_db
from models.user import User
from models.knowledge import KnowledgeEntry
from models.query_log import QueryLog
from services.auth import get_current_user

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Total Knowledge Entries
    total_entries = db.query(func.count(KnowledgeEntry.id)).scalar() or 0
    
    # AI Queries Today
    today = date.today()
    ai_queries_today = db.query(func.count(QueryLog.id)).filter(
        func.date(QueryLog.created_at) == today
    ).scalar() or 0
    
    # Active Contributors
    active_contributors = db.query(func.count(func.distinct(KnowledgeEntry.author_id))).filter(
        KnowledgeEntry.author_id.isnot(None)
    ).scalar() or 0

    # Knowledge by source breakdown
    source_breakdown = {}
    source_counts = db.query(
        KnowledgeEntry.source, func.count(KnowledgeEntry.id)
    ).group_by(KnowledgeEntry.source).all()
    
    for source, count in source_counts:
        source_breakdown[source or "manual"] = count

    # OneDrive sync info
    last_synced = db.query(func.max(KnowledgeEntry.last_synced_at)).filter(
        KnowledgeEntry.source == "onedrive"
    ).scalar()

    # Unique OneDrive documents
    onedrive_documents = db.query(
        func.count(func.distinct(KnowledgeEntry.source_file_id))
    ).filter(
        KnowledgeEntry.source == "onedrive",
        KnowledgeEntry.source_file_id.isnot(None)
    ).scalar() or 0
    
    return {
        "total_entries": total_entries,
        "ai_queries_today": ai_queries_today,
        "active_contributors": active_contributors,
        "source_breakdown": source_breakdown,
        "last_onedrive_sync": last_synced.isoformat() if last_synced else None,
        "onedrive_documents": onedrive_documents,
    }
