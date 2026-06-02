from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from db import get_db
from models.user import User, RoleEnum
from models.approval import ApprovalRequest
from services.auth import get_current_user, require_role
from services.ai_service import get_chat_completion
from services.document_parser import parse_document
from services.whatsapp_service import broadcast_notification
from services.notification_service import create_notification, create_notification_for_admins

import logging
logger = logging.getLogger(__name__)

router = APIRouter()

class ApprovalCreate(BaseModel):
    title: str
    details: str
    request_type: str # "contract", "purchase", "workflow"

class ActionBody(BaseModel):
    action: str  # "approved", "rejected"
    comments: Optional[str] = None

class CommentCreate(BaseModel):
    content: str

@router.post("", status_code=201)
def create_approval_request(
    data: ApprovalCreate,
    background_tasks: BackgroundTasks,
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
        ai_assessment=ai_assessment,
        comments=[],  # Initialize empty comments thread
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    # 🔴 FIX: Send WhatsApp + in-app notification to admins
    author_name = current_user.display_name or current_user.username
    background_tasks.add_task(
        _notify_approval_created, data.title, author_name
    )
    # In-app notification for admins
    create_notification_for_admins(
        db=db,
        notif_type="approval_pending",
        title=f"📋 Approval Request: {data.title}",
        message=f"{author_name} mengajukan {data.request_type}: {data.title}",
        link="/approvals"
    )
    db.commit()

    return req


async def _notify_approval_created(title: str, author: str):
    """Background: send WhatsApp notification for new approval."""
    try:
        await broadcast_notification("approval_pending", {"title": title, "author": author})
    except Exception as e:
        logger.error(f"WA notification failed for approval: {e}")


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
        {"role": "user", "content": f"Isi Kontrak:\n{text[:8000]}"}  # limit to avoid token context
    ]
    try:
        ai_review = get_chat_completion(messages)
    except Exception as e:
        ai_review = f"Gagal melakukan review otomatis: {str(e)}"

    return {"filename": file.filename, "ai_review": ai_review}

@router.get("")
def list_approvals(
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    offset = (page - 1) * per_page
    total = db.query(ApprovalRequest).count()
    items = db.query(ApprovalRequest).order_by(
        ApprovalRequest.created_at.desc()
    ).offset(offset).limit(per_page).all()
    return {"items": items, "total": total, "page": page, "per_page": per_page}

@router.post("/{request_id}/action")
def action_approval(
    request_id: int,
    body: ActionBody,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin]))
):
    req = db.query(ApprovalRequest).filter(ApprovalRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request tidak ditemukan")
    if body.action not in ["approved", "rejected"]:
        raise HTTPException(status_code=400, detail="Aksi tidak valid")

    req.status = body.action
    req.approved_by_id = current_user.id
    req.approved_at = datetime.now(timezone.utc)

    # Add action comment to thread
    if body.comments:
        thread = req.comments or []
        thread.append({
            "user_id": current_user.id,
            "username": current_user.display_name or current_user.username,
            "content": body.comments,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        req.comments = thread

    # 🔴 FIX: Notify requester about approval result
    admin_name = current_user.display_name or current_user.username
    status_emoji = "✅" if body.action == "approved" else "❌"
    create_notification(
        db=db,
        user_id=req.requester_id,
        notif_type=f"approval_{body.action}",
        title=f"{status_emoji} Request {body.action.title()}: {req.title}",
        message=f"{admin_name} telah {body.action} request Anda.{(' Catatan: ' + body.comments) if body.comments else ''}",
        link="/approvals"
    )

    db.commit()
    db.refresh(req)

    # WA notification to requester (async)
    background_tasks.add_task(
        _notify_approval_action, req.title, body.action, admin_name
    )

    return req


async def _notify_approval_action(title: str, action: str, admin_name: str):
    """Background: send WhatsApp notification for approval action."""
    try:
        emoji = "✅" if action == "approved" else "❌"
        await broadcast_notification("approval_action", {
            "title": title,
            "action": f"{emoji} {action.upper()}",
            "admin": admin_name,
        })
    except Exception as e:
        logger.error(f"WA notification failed for approval action: {e}")


# ─── Comment Thread ──────────────────────────────────────────────────────────

@router.post("/{request_id}/comments")
def add_comment(
    request_id: int,
    body: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add a comment to the approval discussion thread."""
    req = db.query(ApprovalRequest).filter(ApprovalRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request tidak ditemukan")

    thread = list(req.comments or [])
    thread.append({
        "user_id": current_user.id,
        "username": current_user.display_name or current_user.username,
        "content": body.content,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    req.comments = thread
    db.commit()
    db.refresh(req)
    return {"comments": req.comments}


@router.get("/{request_id}/comments")
def get_comments(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = db.query(ApprovalRequest).filter(ApprovalRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request tidak ditemukan")
    return {"comments": req.comments or []}
