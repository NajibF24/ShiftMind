"""
WhatsApp routes — Handle incoming webhooks and status checks.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db import get_db
from models.user import User
from services.auth import get_current_user
from services.whatsapp_service import send_whatsapp_message, get_whatsapp_config, broadcast_notification

router = APIRouter()

@router.get("/status")
def get_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Check WhatsApp integration status."""
    return get_whatsapp_config()

@router.post("/send")
async def send_notification(
    to: str,
    message: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Send a custom WhatsApp message (admin only in production)."""
    success = await send_whatsapp_message(to, message)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send WhatsApp message")
    return {"status": "sent", "to": to}