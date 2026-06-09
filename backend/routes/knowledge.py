from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from db import get_db
from models.user import User, RoleEnum
from models.knowledge import KnowledgeEntry
from services.auth import get_current_user, require_role
from services.ai_service import generate_embedding
from services.document_parser import parse_document, chunk_text

import logging
logger = logging.getLogger(__name__)

router = APIRouter()

class KnowledgeCreate(BaseModel):
    title: str
    content: str
    department: str = None
    category: str = None

class KnowledgeUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    department: Optional[str] = None
    category: Optional[str] = None

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
    page: int = 1,
    per_page: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user) # Any authenticated user can read
):
    query = db.query(KnowledgeEntry)
    
    if source:
        query = query.filter(KnowledgeEntry.source == source)
    if category:
        query = query.filter(KnowledgeEntry.category == category)
    
    offset = (page - 1) * per_page
    entries = query.order_by(KnowledgeEntry.created_at.desc()).offset(offset).limit(per_page).all()
    return entries


@router.put("/{entry_id}", response_model=KnowledgeResponse)
def update_knowledge(
    entry_id: int,
    data: KnowledgeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.user]))
):
    """Edit a knowledge entry. Admin or original author can edit."""
    entry = db.query(KnowledgeEntry).filter(KnowledgeEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    # Only admin or the author can edit
    if current_user.role.value != "admin" and entry.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this entry")
    
    if data.title is not None:
        entry.title = data.title
    if data.content is not None:
        entry.content = data.content
    if data.department is not None:
        entry.department = data.department
    if data.category is not None:
        entry.category = data.category

    # Re-generate embedding
    embedding = generate_embedding((entry.title or "") + " " + (entry.content or ""))
    entry.embedding = embedding
    
    db.commit()
    db.refresh(entry)
    return entry


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


# ─── File Upload ─────────────────────────────────────────────────────────────

@router.post("/upload-file", status_code=201)
async def upload_knowledge_file(
    file: UploadFile = File(...),
    category: str = Form(None),
    department: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin, RoleEnum.user]))
):
    """Upload a document (PDF, DOCX, XLSX, PPTX, TXT) and parse it into knowledge entries."""
    content = await file.read()
    text = parse_document(content, file.filename)
    if not text or not text.strip():
        raise HTTPException(status_code=400, detail=f"Gagal membaca dokumen atau dokumen kosong: {file.filename}")

    # Chunk the text
    chunks = chunk_text(text, chunk_size=500, overlap=50)
    if not chunks:
        raise HTTPException(status_code=400, detail="Dokumen tidak menghasilkan teks yang cukup.")

    entries_created = 0
    for idx, chunk in enumerate(chunks):
        if len(chunks) == 1:
            title = f"[Upload] {file.filename}"
        else:
            title = f"[Upload] {file.filename} (Bagian {idx + 1}/{len(chunks)})"

        embedding = generate_embedding(title + " " + chunk)

        entry = KnowledgeEntry(
            title=title,
            content=chunk,
            department=department,
            category=category or "Document",
            author_id=current_user.id,
            confidence_score=0.85,
            source="manual_upload",
            source_file_name=file.filename,
            chunk_index=idx,
            embedding=embedding,
        )
        db.add(entry)
        entries_created += 1

    db.commit()
    logger.info(f"Uploaded {file.filename}: {entries_created} chunks created")

    return {
        "message": f"Dokumen '{file.filename}' berhasil diproses",
        "filename": file.filename,
        "chunks_created": entries_created,
    }


# ─── Manual Sync ─────────────────────────────────────────────────────────────

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


# ─── Draft Approval Workflow ─────────────────────────────────────────────────

@router.get("/drafts")
def list_draft_entries(
    page: int = 1,
    per_page: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin]))
):
    """List all knowledge entries pending approval (status=draft)."""
    offset = (page - 1) * per_page
    total = db.query(KnowledgeEntry).filter(KnowledgeEntry.status == "draft").count()
    items = db.query(KnowledgeEntry).filter(
        KnowledgeEntry.status == "draft"
    ).order_by(KnowledgeEntry.created_at.desc()).offset(offset).limit(per_page).all()
    return {"items": [
        {
            "id": e.id, "title": e.title, "content": e.content,
            "category": e.category, "department": e.department,
            "source": e.source, "confidence_score": e.confidence_score,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        } for e in items
    ], "total": total}


@router.post("/{entry_id}/approve", status_code=200)
def approve_draft(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin]))
):
    """Promote a draft knowledge entry to active (visible in search)."""
    entry = db.query(KnowledgeEntry).filter(KnowledgeEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    if entry.status != "draft":
        raise HTTPException(status_code=400, detail="Entry is not a draft")
    entry.status = "active"
    db.commit()
    return {"message": f"Entry '{entry.title}' approved and now active in search."}


@router.delete("/{entry_id}/reject", status_code=200)
def reject_draft(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin]))
):
    """Reject and delete a draft knowledge entry."""
    entry = db.query(KnowledgeEntry).filter(KnowledgeEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    if entry.status != "draft":
        raise HTTPException(status_code=400, detail="Entry is not a draft")
    title = entry.title
    db.delete(entry)
    db.commit()
    return {"message": f"Draft '{title}' rejected and removed."}

