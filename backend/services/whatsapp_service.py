"""
WhatsApp Notification Service — Integrates with Baileys for sending alerts.
Endpoints: Webhook handler for receiving messages, Send endpoint for triggering notifications.
"""
import os
import json
import logging
from typing import Optional

import httpx
import socketio

logger = logging.getLogger(__name__)

WHATSAPP_API_URL = os.getenv("WHATSAPP_API_URL", "http://localhost:3000")
WHATSAPP_ENABLED = os.getenv("WHATSAPP_ENABLED", "false").lower() == "true"
NOTIFICATION_RECIPIENTS = os.getenv("NOTIFICATION_RECIPIENTS", "").split(",") if os.getenv("NOTIFICATION_RECIPIENTS") else []

sio = socketio.AsyncClient()

async def connect_whatsapp():
    """Connect to Baileys WebSocket server."""
    if WHATSAPP_ENABLED:
        try:
            await sio.connect(WHATSAPP_API_URL)
            logger.info("Connected to WhatsApp Baileys server")
        except Exception as e:
            logger.error(f"Failed to connect to WhatsApp: {e}")

async def send_whatsapp_message(to: str, message: str) -> bool:
    """Send a WhatsApp message via Baileys API."""
    if not WHATSAPP_ENABLED:
        logger.debug(f"WhatsApp disabled, would send to {to}: {message[:50]}...")
        return True
        
    try:
        await sio.emit("message", {"to": to, "body": message})
        return True
    except Exception as e:
        logger.error(f"Failed to send WhatsApp message: {e}")
        return False

async def broadcast_notification(event_type: str, payload: dict):
    """Send notification to all recipients when key events happen."""
    message_templates = {
        "checklist_fail": "🚨 CHECKLIST ALERT: {title} - Item FAIL terdeteksi oleh {author}. Silakan cek sistem.",
        "approval_pending": "📋 Approval Request baru: '{title}' menunggu review Anda.",
        "contract_ready": "📄 Review kontrak '{title}' selesai. AI assessment tersedia di sistem.",
        "knowledge_updated": "📚 Knowledge Base diperbarui: '{title}' telah ditambahkan.",
    }
    
    template = message_templates.get(event_type, "Notifikasi sistem: {payload}".format(payload=str(payload)))
    for recipient in NOTIFICATION_RECIPIENTS:
        if recipient.strip():
            await send_whatsapp_message(recipient.strip(), template.format(**payload))

def get_whatsapp_config() -> dict:
    """Check WhatsApp configuration status."""
    return {
        "enabled": WHATSAPP_ENABLED,
        "api_url": WHATSAPP_API_URL,
        "recipients_configured": len(NOTIFICATION_RECIPIENTS),
    }