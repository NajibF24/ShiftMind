from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date, timedelta
import asyncio
import json
import logging

from db import get_db, SessionLocal
from models.user import User
from models.knowledge import KnowledgeEntry
from models.query_log import QueryLog
from models.work_journal import WorkJournal
from models.workflow import Workflow
from models.approval import ApprovalRequest
from models.checklist import DailyChecklist
from services.auth import get_current_user, SECRET_KEY, ALGORITHM
from jose import jwt, JWTError

logger = logging.getLogger(__name__)
router = APIRouter()

def _get_dashboard_stats(db: Session):
    today = date.today()
    yesterday = today - timedelta(days=1)
    seven_days_ago = today - timedelta(days=7)
    
    # 1. Total Knowledge Entries
    total_entries = db.query(func.count(KnowledgeEntry.id)).scalar() or 0
    
    # 2. AI Queries
    ai_queries_today = db.query(func.count(QueryLog.id)).filter(
        func.date(QueryLog.created_at) == today
    ).scalar() or 0
    
    ai_queries_yesterday = db.query(func.count(QueryLog.id)).filter(
        func.date(QueryLog.created_at) == yesterday
    ).scalar() or 0
    
    # Calculate trend percentage
    query_trend = 0
    if ai_queries_yesterday > 0:
        query_trend = round(((ai_queries_today - ai_queries_yesterday) / ai_queries_yesterday) * 100, 1)
    elif ai_queries_today > 0:
        query_trend = 100
        
    # 3. Active Contributors
    active_contributors = db.query(func.count(func.distinct(KnowledgeEntry.author_id))).filter(
        KnowledgeEntry.author_id.isnot(None)
    ).scalar() or 0
    
    # 4. Journal Entries Today
    journal_entries_today = db.query(func.count(WorkJournal.id)).filter(
        func.date(WorkJournal.created_at) == today
    ).scalar() or 0
    
    # 5. Pending Workflows
    pending_workflows = db.query(func.count(Workflow.id)).filter(
        Workflow.is_approved == 0
    ).scalar() or 0
    
    # 6. Pending Approvals
    pending_approvals = db.query(func.count(ApprovalRequest.id)).filter(
        ApprovalRequest.status == "pending"
    ).scalar() or 0
    
    # 7. Checklist FAILs (7 days)
    # Using python-side filtering for JSON field since JSONB querying depends on DB dialect
    recent_checklists = db.query(DailyChecklist).filter(
        func.date(DailyChecklist.created_at) >= seven_days_ago
    ).all()
    
    checklist_fails_7d = 0
    for cl in recent_checklists:
        if any(item.get("status") == "FAIL" for item in cl.items):
            checklist_fails_7d += 1

    # 8. Knowledge by source breakdown
    source_breakdown = {}
    source_counts = db.query(
        KnowledgeEntry.source, func.count(KnowledgeEntry.id)
    ).group_by(KnowledgeEntry.source).all()
    
    for source, count in source_counts:
        source_breakdown[source or "manual"] = count

    # 9. OneDrive sync info
    last_synced = db.query(func.max(KnowledgeEntry.last_synced_at)).filter(
        KnowledgeEntry.source == "onedrive"
    ).scalar()

    # 10. Unique OneDrive documents
    onedrive_documents = db.query(
        func.count(func.distinct(KnowledgeEntry.source_file_id))
    ).filter(
        KnowledgeEntry.source == "onedrive",
        KnowledgeEntry.source_file_id.isnot(None)
    ).scalar() or 0
    
    return {
        "total_entries": total_entries,
        "ai_queries_today": ai_queries_today,
        "query_trend": query_trend,
        "active_contributors": active_contributors,
        "journal_entries_today": journal_entries_today,
        "pending_workflows": pending_workflows,
        "pending_approvals": pending_approvals,
        "checklist_fails_7d": checklist_fails_7d,
        "source_breakdown": source_breakdown,
        "last_onedrive_sync": last_synced.isoformat() if last_synced else None,
        "onedrive_documents": onedrive_documents,
    }

@router.get("/stats")
def get_dashboard_stats_endpoint(
    db: Session = Depends(get_db)
    # We might need auth depending on requirements, but stats are usually global.
):
    """Get single-shot dashboard statistics."""
    return _get_dashboard_stats(db)

@router.get("/stream")
async def dashboard_stream(request: Request, token: str):
    """Server-Sent Events (SSE) endpoint to stream dashboard stats."""
    
    # Validate token manually since SSE EventSource doesn't support headers well
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if not username:
            raise ValueError("Invalid token")
    except Exception as e:
        logger.warning(f"SSE connection rejected due to invalid token: {e}")
        return StreamingResponse(
            iter([f"data: {json.dumps({'error': 'Unauthorized'})}\n\n"]),
            media_type="text/event-stream"
        )
        
    async def event_generator():
        try:
            while True:
                # Check if client disconnected
                if await request.is_disconnected():
                    break
                    
                # Fetch fresh stats
                db = SessionLocal()
                try:
                    stats = _get_dashboard_stats(db)
                    yield f"data: {json.dumps(stats)}\n\n"
                except Exception as e:
                    logger.error(f"Error fetching stats for SSE: {e}")
                    yield f"data: {json.dumps({'error': 'Server Error'})}\n\n"
                finally:
                    db.close()
                
                # Wait 15 seconds before next update
                await asyncio.sleep(15)
        except asyncio.CancelledError:
            # Client disconnected
            pass

    return StreamingResponse(event_generator(), media_type="text/event-stream")
