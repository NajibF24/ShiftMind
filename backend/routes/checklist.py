from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from db import get_db
from models.user import User, RoleEnum
from models.checklist import DailyChecklist
from services.auth import get_current_user, require_role
from services.ai_service import get_chat_completion
from services.whatsapp_service import broadcast_notification

router = APIRouter()

class ChecklistItem(BaseModel):
    item: str
    status: str # "OK", "FAIL", "N/A"
    notes: Optional[str] = None

class ChecklistCreate(BaseModel):
    title: str
    items: List[ChecklistItem]

@router.post("", status_code=201)
def create_checklist(
    data: ChecklistCreate,
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
    return checklist

@router.get("")
def list_checklists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(DailyChecklist).order_by(DailyChecklist.created_at.desc()).all()
