from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from db import get_db
from models.user import User, RoleEnum
from models.knowledge import KnowledgeEntry
from services.auth import get_current_user, require_role
from services.ai_service import generate_embedding

router = APIRouter()

class KnowledgeCreate(BaseModel):
    title: str
    content: str
    department: str = None
    category: str = None

class KnowledgeResponse(BaseModel):
    id: int
    title: str
    content: str
    department: str | None
    category: str | None
    author_id: int | None
    confidence_score: float
    source: str | None
    source_file_name: str | None
    source_url: str | None

    class Config:
        from_attributes = True

@router.post("", response_model=KnowledgeResponse, status_code=201)
def create_knowledge(
    entry: KnowledgeCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.user]))
):
    # Generate vector embedding for semantic search
    embedding = generate_embedding(entry.title + " " + entry.content)
    
    new_entry = KnowledgeEntry(
        title=entry.title,
        content=entry.content,
        department=entry.department,
        category=entry.category,
        author_id=current_user.id,
        source="manual",
        embedding=embedding
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

@router.get("", response_model=List[KnowledgeResponse])
def get_knowledge_entries(
    source: Optional[str] = Query(None, description="Filter by source: manual, company, onedrive"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Any authenticated user can read
):
    query = db.query(KnowledgeEntry)
    
    if source:
        query = query.filter(KnowledgeEntry.source == source)
    if category:
        query = query.filter(KnowledgeEntry.category == category)
    
    entries = query.order_by(KnowledgeEntry.created_at.desc()).limit(100).all()
    return entries

@router.delete("/{entry_id}", status_code=204)
def delete_knowledge(
    entry_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin])) # Only admin can delete
):
    entry = db.query(KnowledgeEntry).filter(KnowledgeEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    db.delete(entry)
    db.commit()
    return None

@router.delete("/source/{source_type}", status_code=200)
def delete_knowledge_by_source(
    source_type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin]))
):
    """Delete all knowledge entries of a given source type (admin only)."""
    if source_type not in ("manual", "company", "onedrive"):
        raise HTTPException(status_code=400, detail="Invalid source type. Use: manual, company, onedrive")
    
    count = db.query(KnowledgeEntry).filter(KnowledgeEntry.source == source_type).delete()
    db.commit()
    return {"message": f"Deleted {count} entries with source '{source_type}'"}

@router.post("/sync/manual", status_code=200)
def manual_sync(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin]))
):
    """Manually trigger data scraping and OneDrive sync."""
    from services.scraper_service import run_daily_scraper_sync
    from services.knowledge_sync import sync_onedrive_documents
    from services.onedrive_service import is_configured
    import logging
    logger = logging.getLogger(__name__)
    
    results = {}
    # 1. Scrape News & PowerBI
    try:
        run_daily_scraper_sync()
        results["scraper"] = "Success"
    except Exception as e:
        logger.error(f"Manual scraper sync failed: {e}")
        results["scraper"] = f"Failed: {str(e)}"
        
    # 2. Sync OneDrive
    if is_configured():
        try:
            od_res = sync_onedrive_documents(db)
            results["onedrive"] = od_res.to_dict()
        except Exception as e:
            logger.error(f"Manual OneDrive sync failed: {e}")
            results["onedrive"] = f"Failed: {str(e)}"
    else:
        results["onedrive"] = "Skipped (Not configured)"
        
    return {"message": "Manual sync completed", "details": results}
