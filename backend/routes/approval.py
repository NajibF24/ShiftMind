from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from db import get_db
from models.user import User, RoleEnum
from models.approval import ApprovalRequest
from services.auth import get_current_user, require_role
from services.ai_service import get_chat_completion
from services.document_parser import parse_document

router = APIRouter()

class ApprovalCreate(BaseModel):
    title: str
    details: str
    request_type: str # "contract", "purchase", "workflow"

@router.post("", status_code=201)
def create_approval_request(
    data: ApprovalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # AI assesses risk/compliance
    messages = [
        {"role": "system", "content": "Anda asisten legal dan kepatuhan PT GYS. Analisis request approval ini, tentukan risiko (Low/Medium/High) dan berikan catatan kepatuhan singkat."},
        {"role": "user", "content": f"Tipe: {data.request_type}\nJudul: {data.title}\nDetail: {data.details}"}
    ]
    ai_assessment = None
    try:
        ai_assessment = get_chat_completion(messages)
    except Exception:
        ai_assessment = "AI assessment unavailable."

    req = ApprovalRequest(
        requester_id=current_user.id,
        title=data.title,
        details=data.details,
        request_type=data.request_type,
        ai_assessment=ai_assessment
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req

@router.post("/review-contract")
async def review_contract(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    content = await file.read()
    text = parse_document(content, file.filename)
    if not text:
        raise HTTPException(status_code=400, detail="Gagal membaca dokumen kontrak.")
    
    messages = [
        {"role": "system", "content": "Anda ahli hukum korporasi GYS. Review kontrak berikut: cari klausul berisiko, kewajiban GYS, dan berikan kesimpulan akhir."},
        {"role": "user", "content": f"Isi Kontrak:\n{text[:8000]}"} # limit to avoid token context
    ]
    try:
        ai_review = get_chat_completion(messages)
    except Exception as e:
        ai_review = f"Gagal melakukan review otomatis: {str(e)}"
        
    return {"filename": file.filename, "ai_review": ai_review}

@router.get("")
def list_approvals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(ApprovalRequest).order_by(ApprovalRequest.created_at.desc()).all()

@router.post("/{request_id}/action")
def action_approval(
    request_id: int,
    action: str, # "approved", "rejected"
    comments: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin]))
):
    req = db.query(ApprovalRequest).filter(ApprovalRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request tidak ditemukan")
    if action not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Aksi tidak valid")
    
    req.status = action
    req.comments = comments
    db.commit()
    db.refresh(req)
    return req
