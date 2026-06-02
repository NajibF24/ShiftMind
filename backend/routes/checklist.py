from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from db import get_db
from models.user import User, RoleEnum
from models.checklist import DailyChecklist, ChecklistTemplate
from services.auth import get_current_user, require_role
from services.ai_service import get_chat_completion
from services.whatsapp_service import broadcast_notification
from services.notification_service import create_notification

import asyncio
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# ─── Schemas ─────────────────────────────────────────────────────────────────

class ChecklistItem(BaseModel):
    item: str
    status: str  # "OK", "FAIL", "N/A"
    notes: Optional[str] = None

class ChecklistCreate(BaseModel):
    title: str
    items: List[ChecklistItem]
    template_id: Optional[int] = None  # Optional: load items from template

class TemplateCreate(BaseModel):
    title: str
    items: List[dict]  # [{"item": "Check valve X"}, {"item": "Check temperature"}]
    department: Optional[str] = None
    area: Optional[str] = None


# ─── Checklist Endpoints ─────────────────────────────────────────────────────

@router.post("", status_code=201)
def create_checklist(
    data: ChecklistCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    items_list = [item.dict() for item in data.items]

    # AI analyzes checklist anomalies
    fails = [i["item"] for i in items_list if i["status"] == "FAIL"]
    ai_analysis = None
    if fails:
        messages = [
            {"role": "system", "content": "Anda asisten safety/maintenance di pabrik baja GYS. Analisis temuan FAIL berikut dan berikan rekomendasi aksi cepat."},
            {"role": "user", "content": f"Checklist: {data.title}\nTemuan FAIL:\n" + "\n".join(fails)}
        ]
        try:
            ai_analysis = get_chat_completion(messages)
        except Exception:
            ai_analysis = "AI analysis unavailable."

    checklist = DailyChecklist(
        user_id=current_user.id,
        title=data.title,
        items=items_list,
        ai_analysis=ai_analysis
    )
    db.add(checklist)
    db.commit()
    db.refresh(checklist)

    # 🔴 CRITICAL FIX: Send WhatsApp notification when FAIL items detected
    if fails:
        author_name = current_user.display_name or current_user.username
        background_tasks.add_task(
            _send_fail_notifications,
            db_session_factory=None,  # We pass data, not session
            title=data.title,
            author=author_name,
            fails=fails,
            user_id=current_user.id,
        )

    return checklist


async def _send_fail_notifications(db_session_factory, title: str, author: str, fails: list, user_id: int):
    """Background task to send WhatsApp + in-app notifications for FAIL items."""
    try:
        await broadcast_notification("checklist_fail", {
            "title": title,
            "author": author,
        })
        logger.info(f"WhatsApp notification sent for checklist FAIL: {title}")
    except Exception as e:
        logger.error(f"Failed to send WhatsApp notification: {e}")

    # Also create in-app notifications for admins
    try:
        from db import SessionLocal
        from models.user import User as UserModel
        db = SessionLocal()
        try:
            admins = db.query(UserModel).filter(UserModel.role == RoleEnum.admin).all()
            for admin in admins:
                create_notification(
                    db=db,
                    user_id=admin.id,
                    notif_type="checklist_fail",
                    title=f"🚨 Checklist FAIL: {title}",
                    message=f"{author} melaporkan {len(fails)} item FAIL: {', '.join(fails[:3])}{'...' if len(fails) > 3 else ''}",
                    link="/checklists"
                )
            db.commit()
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Failed to create in-app notifications: {e}")


@router.get("")
def list_checklists(
    page: int = 1,
    per_page: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    offset = (page - 1) * per_page
    total = db.query(DailyChecklist).count()
    items = db.query(DailyChecklist).order_by(
        DailyChecklist.created_at.desc()
    ).offset(offset).limit(per_page).all()
    return {"items": items, "total": total, "page": page, "per_page": per_page}


@router.delete("/{checklist_id}", status_code=204)
def delete_checklist(
    checklist_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    checklist = db.query(DailyChecklist).filter(DailyChecklist.id == checklist_id).first()
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    # Owner or admin can delete
    if checklist.user_id != current_user.id and current_user.role.value != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this checklist")
    db.delete(checklist)
    db.commit()
    return None


# ─── Template Endpoints ──────────────────────────────────────────────────────

@router.post("/templates", status_code=201)
def create_template(
    data: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    template = ChecklistTemplate(
        title=data.title,
        items=data.items,
        department=data.department,
        area=data.area,
        created_by=current_user.id,
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.get("/templates")
def list_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(ChecklistTemplate).order_by(ChecklistTemplate.created_at.desc()).all()


@router.delete("/templates/{template_id}", status_code=204)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin]))
):
    template = db.query(ChecklistTemplate).filter(ChecklistTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(template)
    db.commit()
    return None
