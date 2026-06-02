"""
WhatsApp routes — Handle incoming webhooks, status checks, and settings.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from db import get_db
from models.user import User, RoleEnum
from models.settings import SystemSettings
from services.auth import get_current_user, require_role
from services.whatsapp_service import send_whatsapp_message, get_whatsapp_config

router = APIRouter()

class WhatsAppSettingsUpdate(BaseModel):
    enabled: bool
    recipients: List[str]

@router.get("/status")
def get_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check WhatsApp integration status."""
    return get_whatsapp_config(db)

@router.post("/settings")
def update_settings(
    data: WhatsAppSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin]))
):
    """Update WhatsApp settings (admin only)."""
    # Update enabled status
    enabled_setting = db.query(SystemSettings).filter(SystemSettings.key == "whatsapp_enabled").first()
    if not enabled_setting:
        enabled_setting = SystemSettings(key="whatsapp_enabled", value=str(data.enabled).lower())
        db.add(enabled_setting)
    else:
        enabled_setting.value = str(data.enabled).lower()

    # Update recipients
    recipients_setting = db.query(SystemSettings).filter(SystemSettings.key == "whatsapp_recipients").first()
    recipients_str = ",".join([r.strip() for r in data.recipients if r.strip()])
    if not recipients_setting:
        recipients_setting = SystemSettings(key="whatsapp_recipients", value=recipients_str)
        db.add(recipients_setting)
    else:
        recipients_setting.value = recipients_str

    db.commit()
    
    # Reload config in whatsapp_service to reflect changes immediately
    from services.whatsapp_service import load_config_from_db, connect_whatsapp
    import asyncio
    
    load_config_from_db(db)
    
    # If it was just enabled, try to connect if not connected
    if data.enabled:
        asyncio.create_task(connect_whatsapp())
        
    return {"message": "WhatsApp settings updated successfully"}

@router.post("/send")
async def send_notification(
    to: str,
    message: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([RoleEnum.admin]))
):
    """Send a custom WhatsApp message (admin only)."""
    success = await send_whatsapp_message(to, message)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send WhatsApp message")
    return {"status": "sent", "to": to}