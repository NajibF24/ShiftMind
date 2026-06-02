from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

from db import get_db
from models.user import User, RoleEnum
from models.workflow import Workflow
from models.knowledge import KnowledgeEntry
from services.auth import get_current_user, require_role
from services.ai_service import generate_embedding, get_chat_completion

router = APIRouter()


# ─── Schemas ─────────────────────────────────────────────────────────────────

class StepInput(BaseModel):
    step: int
    action: str
    notes: Optional[str] = None
    duration: Optional[str] = None


class WorkflowCreate(BaseModel):
    title: str
    description: Optional[str] = None
    steps: List[StepInput]
    category: Optional[str] = None
    department: Optional[str] = None
    area: Optional[str] = None


class WorkflowResponse(BaseModel):
    id: int
    user_id: int
    title: str
    description: Optional[str]
    steps: List[Dict[str, Any]]
    category: Optional[str]
    department: Optional[str]
    area: Optional[str]
    ai_sop_draft: Optional[str]
    ai_safety_notes: Optional[str]
    ai_optimization: Optional[str]
    ai_estimated_time: Optional[str]
    tags: Optional[List[str]]
    version: int
    is_approved: int
    used_count: int
    created_at: str
    author_name: Optional[str] = None

    class Config:
        from_attributes = True


# ─── AI Processing ──────────────────────────────────────────────────────────

def _ai_generate_sop(title: str, description: str, steps: list) -> dict:
    """AI converts raw workflow steps into formal SOP + safety analysis."""

    steps_text = ""
    for s in steps:
        s_dict = s if isinstance(s, dict) else s.dict()
        steps_text += f"  Langkah {s_dict['step']}: {s_dict['action']}"
        if s_dict.get('notes'):
            steps_text += f" (catatan: {s_dict['notes']})"
        if s_dict.get('duration'):
            steps_text += f" [durasi: {s_dict['duration']}]"
        steps_text += "\n"

    messages = [
        {
            "role": "system",
            "content": (
                "Kamu adalah ShiftMind AI untuk PT Garuda Yamato Steel (GYS).\n"
                "User mencatat workflow/prosedur kerja mereka. Tugasmu mengkonversinya menjadi dokumen SOP formal.\n\n"
                "Jawab dalam format JSON SAJA (tanpa markdown code block):\n"
                "{\n"
                '  "sop_draft": "Dokumen SOP formal lengkap dalam format markdown. Termasuk: Tujuan, Ruang Lingkup, Peralatan yang Dibutuhkan, Langkah-langkah Prosedur (numbered, detail), Catatan Penting. Format professional.",\n'
                '  "safety_notes": "Analisis keselamatan: potensi bahaya di setiap langkah, APD yang diperlukan, prosedur darurat jika ada.",\n'
                '  "optimization": "Saran untuk mengoptimalkan workflow ini: efisiensi waktu, urutan langkah, tools yang bisa membantu.",\n'
                '  "estimated_time": "Estimasi total waktu pengerjaan (contoh: 45 menit)",\n'
                '  "tags": ["tag1", "tag2", "tag3"]\n'
                "}\n\n"
                "PENTING: Output HANYA JSON. SOP harus professional dan siap pakai."
            )
        },
        {
            "role": "user",
            "content": (
                f"Judul Workflow: {title}\n"
                f"Deskripsi: {description or 'Tidak ada deskripsi'}\n"
                f"Langkah-langkah:\n{steps_text}"
            )
        }
    ]

    try:
        response = get_chat_completion(messages)
        import json
        clean = response.strip()
        if clean.startswith("```"):
            clean = clean.split("\n", 1)[1] if "\n" in clean else clean[3:]
            if clean.endswith("```"):
                clean = clean[:-3]
            clean = clean.strip()

        data = json.loads(clean)
        return {
            "ai_sop_draft": data.get("sop_draft", ""),
            "ai_safety_notes": data.get("safety_notes", ""),
            "ai_optimization": data.get("optimization", ""),
            "ai_estimated_time": data.get("estimated_time", ""),
            "tags": data.get("tags", []),
        }
    except Exception as e:
        print(f"AI SOP generation failed: {e}")
        return {
            "ai_sop_draft": "",
            "ai_safety_notes": "",
            "ai_optimization": "",
            "ai_estimated_time": "",
            "tags": [],
        }


# ─── Routes ──────────────────────────────────────────────────────────────────

@router.post("", response_model=WorkflowResponse)
def create_workflow(
    data: WorkflowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Record a workflow. AI auto-generates SOP draft + safety analysis."""

    steps_dicts = [s.dict() for s in data.steps]

    # Embedding
    text = f"{data.title}\n{data.description or ''}\n" + "\n".join(
        [f"Step {s.step}: {s.action}" for s in data.steps]
    )
    embedding = generate_embedding(text)

    # AI processing
    ai_result = _ai_generate_sop(data.title, data.description, data.steps)

    wf = Workflow(
        user_id=current_user.id,
        title=data.title,
        description=data.description,
        steps=steps_dicts,
        category=data.category,
        department=data.department,
        area=data.area,
        ai_sop_draft=ai_result["ai_sop_draft"],
        ai_safety_notes=ai_result["ai_safety_notes"],
        ai_optimization=ai_result["ai_optimization"],
        ai_estimated_time=ai_result["ai_estimated_time"],
        tags=ai_result["tags"],
        embedding=embedding,
    )
    db.add(wf)

    # Also inject into knowledge base (confidence 0.6, needs approval)
    # Skip if similar entry already exists
    existing_kb = db.query(KnowledgeEntry).filter(
        KnowledgeEntry.source == "workflow",
        KnowledgeEntry.title == f"[Workflow] {data.title}"
    ).first()
    
    if not existing_kb:
        kb_entry = KnowledgeEntry(
            title=f"[Workflow] {data.title}",
            content=ai_result["ai_sop_draft"] or text,
            category=data.category or "Workflow",
            department=data.department,
            source="workflow",
            source_file_id=str(wf.id),
            confidence_score=0.6,
            embedding=embedding,
            author_id=current_user.id,
        )
        db.add(kb_entry)

    db.commit()
    db.refresh(wf)

    return _to_response(wf, current_user.display_name or current_user.username)


@router.get("", response_model=List[WorkflowResponse])
def list_workflows(
    category: Optional[str] = None,
    area: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all workflows."""
    from models.user import User as UserModel

    query = db.query(Workflow, UserModel.display_name, UserModel.username).join(
        UserModel, Workflow.user_id == UserModel.id
    )

    query = query.filter(Workflow.is_latest == 1)

    if category:
        query = query.filter(Workflow.category == category)
    if area:
        query = query.filter(Workflow.area == area)
    if search:
        emb = generate_embedding(search)
        # Hybrid search: semantic sorting + text filtering
        query = query.filter(Workflow.title.ilike(f"%{search}%"))
        query = query.order_by(Workflow.embedding.l2_distance(emb))
    else:
        query = query.order_by(desc(Workflow.created_at))

    offset = (page - 1) * per_page
    results = query.offset(offset).limit(per_page).all()
    return [_to_response(w, dn or un) for w, dn, un in results]


@router.get("/{workflow_id}", response_model=WorkflowResponse)
def get_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get single workflow by ID, increment used_count."""
    from models.user import User as UserModel

    result = db.query(Workflow, UserModel.display_name, UserModel.username).join(
        UserModel, Workflow.user_id == UserModel.id
    ).filter(Workflow.id == workflow_id).first()

    if not result:
        raise HTTPException(status_code=404, detail="Workflow not found")

    wf, dn, un = result
    
    return _to_response(wf, dn or un)


@router.post("/{workflow_id}/approve")
def approve_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin]))
):
    """Admin approves a workflow as official SOP."""
    wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")

    wf.is_approved = 1

    # Upgrade confidence in knowledge base
    from models.knowledge import KnowledgeEntry
    kb = db.query(KnowledgeEntry).filter(
        KnowledgeEntry.title == f"[Workflow] {wf.title}",
        KnowledgeEntry.source == "workflow"
    ).first()
    if kb:
        kb.confidence_score = 1.0

    db.commit()
    return {"message": "Workflow approved as official SOP", "id": wf.id}


@router.put("/{workflow_id}", response_model=WorkflowResponse)
def update_workflow(
    workflow_id: int,
    data: WorkflowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Edit a workflow. Increments version, re-generates AI SOP."""
    wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    if wf.user_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to edit this workflow")

    steps_dicts = [s.dict() for s in data.steps]

    # Re-generate embedding
    text = f"{data.title}\n{data.description or ''}\n" + "\n".join(
        [f"Step {s.step}: {s.action}" for s in data.steps]
    )
    embedding = generate_embedding(text)

    # Re-generate AI SOP
    ai_result = _ai_generate_sop(data.title, data.description, data.steps)

    # Versioning: Deprecate old workflow, create a new one
    wf.is_latest = 0
    db.add(wf)

    new_wf = Workflow(
        user_id=wf.user_id, # maintain original author
        title=data.title,
        description=data.description,
        steps=steps_dicts,
        category=data.category,
        department=data.department,
        area=data.area,
        ai_sop_draft=ai_result["ai_sop_draft"],
        ai_safety_notes=ai_result["ai_safety_notes"],
        ai_optimization=ai_result["ai_optimization"],
        ai_estimated_time=ai_result["ai_estimated_time"],
        tags=ai_result["tags"],
        embedding=embedding,
        version=(wf.version or 1) + 1,
        parent_id=wf.id,
        is_latest=1,
        is_approved=0,
        used_count=wf.used_count
    )
    db.add(new_wf)
    db.flush()

    # Update linked knowledge entry
    kb = db.query(KnowledgeEntry).filter(
        KnowledgeEntry.source == "workflow",
        KnowledgeEntry.source_file_id == str(wf.id)
    ).first()
    if kb:
        kb.title = f"[Workflow] {data.title}"
        kb.content = ai_result["ai_sop_draft"] or text
        kb.embedding = embedding
        kb.source_file_id = str(new_wf.id)
        kb.confidence_score = 0.6 # reset confidence because it needs approval again

    db.commit()
    db.refresh(new_wf)
    return _to_response(new_wf, current_user.display_name or current_user.username)


@router.delete("/{workflow_id}", status_code=204)
def delete_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a workflow. Owner or admin can delete."""
    wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
    if wf.user_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this workflow")

    # Also remove linked knowledge entry
    db.query(KnowledgeEntry).filter(
        KnowledgeEntry.source == "workflow",
        KnowledgeEntry.source_file_id == str(wf.id)
    ).delete()

    db.delete(wf)
    db.commit()
    return None


@router.post("/{workflow_id}/mark-used")
def mark_workflow_used(
    workflow_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Mark a workflow as used in the field, incrementing its counter."""
    wf = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    wf.used_count = (wf.used_count or 0) + 1
    db.commit()
    return {"message": "Workflow marked as used", "used_count": wf.used_count}

# ─── Helper ──────────────────────────────────────────────────────────────────

def _to_response(w: Workflow, author_name: str = None) -> WorkflowResponse:
    return WorkflowResponse(
        id=w.id,
        user_id=w.user_id,
        title=w.title,
        description=w.description,
        steps=w.steps or [],
        category=w.category,
        department=w.department,
        area=w.area,
        ai_sop_draft=w.ai_sop_draft,
        ai_safety_notes=w.ai_safety_notes,
        ai_optimization=w.ai_optimization,
        ai_estimated_time=w.ai_estimated_time,
        tags=w.tags,
        version=w.version or 1,
        is_approved=w.is_approved or 0,
        used_count=w.used_count or 0,
        created_at=w.created_at.isoformat() if w.created_at else "",
        author_name=author_name,
    )
