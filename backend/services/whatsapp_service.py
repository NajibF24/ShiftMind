"""
WhatsApp Notification Service — Integrates with Baileys for sending alerts.
Supports both WebSocket (socket.io) and HTTP REST fallback.
"""
import os
import json
import logging
from typing import Optional

import httpx
import socketio

logger = logging.getLogger(__name__)

WHATSAPP_API_URL = os.getenv("WHATSAPP_API_URL", "http://whatsapp:3000")
WHATSAPP_ENABLED = os.getenv("WHATSAPP_ENABLED", "false").lower() == "true"
NOTIFICATION_RECIPIENTS = os.getenv("NOTIFICATION_RECIPIENTS", "").split(",") if os.getenv("NOTIFICATION_RECIPIENTS") else []

sio = socketio.AsyncClient()
_connected = False

def load_config_from_db(db):
    """Load configuration from SystemSettings table and override globals."""
    global WHATSAPP_ENABLED, NOTIFICATION_RECIPIENTS
    
    from models.settings import SystemSettings
    
    enabled_setting = db.query(SystemSettings).filter(SystemSettings.key == "whatsapp_enabled").first()
    if enabled_setting:
        WHATSAPP_ENABLED = enabled_setting.value.lower() == "true"
        
    recipients_setting = db.query(SystemSettings).filter(SystemSettings.key == "whatsapp_recipients").first()
    if recipients_setting and recipients_setting.value:
        NOTIFICATION_RECIPIENTS = [r.strip() for r in recipients_setting.value.split(",") if r.strip()]
    elif recipients_setting:
        NOTIFICATION_RECIPIENTS = []

async def connect_whatsapp():
    """Connect to Baileys WebSocket server."""
    global _connected
    if not WHATSAPP_ENABLED:
        logger.info("WhatsApp notifications disabled (WHATSAPP_ENABLED=false)")
        return
    try:
        await sio.connect(WHATSAPP_API_URL)
        _connected = True
        logger.info("Connected to WhatsApp Baileys server")
    except Exception as e:
        _connected = False
        logger.warning(f"Failed to connect to WhatsApp WebSocket (will use HTTP fallback): {e}")

async def send_whatsapp_message(to: str, message: str) -> bool:
    """Send a WhatsApp message via Baileys. Tries WebSocket first, then HTTP fallback."""
    if not WHATSAPP_ENABLED:
        logger.debug(f"WhatsApp disabled, would send to {to}: {message[:80]}...")
        return True

    # Try WebSocket first
    if _connected:
        try:
            await sio.emit("message", {"to": to, "body": message})
            logger.info(f"WhatsApp WS message sent to {to}")
            return True
        except Exception as e:
            logger.warning(f"WebSocket send failed, trying HTTP: {e}")

    # HTTP REST fallback
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{WHATSAPP_API_URL}/api/send",
                json={"to": to, "message": message},
                headers={"Content-Type": "application/json"},
            )
            if resp.status_code < 300:
                logger.info(f"WhatsApp HTTP message sent to {to}")
                return True
            else:
                logger.error(f"WhatsApp HTTP send failed ({resp.status_code}): {resp.text}")
                return False
    except Exception as e:
        logger.error(f"WhatsApp HTTP fallback failed: {e}")
        return False

async def broadcast_notification(event_type: str, payload: dict):
    """Send notification to all recipients when key events happen."""
    message_templates = {
        "checklist_fail": "🚨 CHECKLIST ALERT: {title} - Item FAIL terdeteksi oleh {author}. Silakan cek sistem.",
        "approval_pending": "📋 Approval Request baru: '{title}' dari {author} menunggu review Anda.",
        "approval_action": "📋 Approval '{title}' telah di-{action} oleh {admin}.",
        "contract_ready": "📄 Review kontrak '{title}' selesai. AI assessment tersedia di sistem.",
        "knowledge_updated": "📚 Knowledge Base diperbarui: '{title}' telah ditambahkan.",
    }

    template = message_templates.get(event_type)
    if not template:
        logger.warning(f"Unknown notification event type: {event_type}")
        return

    try:
        message = template.format(**payload)
    except KeyError as e:
        logger.error(f"Missing placeholder {e} in notification payload for {event_type}")
        message = f"Notifikasi sistem: {event_type} — {json.dumps(payload, default=str)}"

    sent_count = 0
    for recipient in NOTIFICATION_RECIPIENTS:
        recipient = recipient.strip()
        if recipient:
            success = await send_whatsapp_message(recipient, message)
            if success:
                sent_count += 1

    logger.info(f"Broadcast '{event_type}': sent to {sent_count}/{len(NOTIFICATION_RECIPIENTS)} recipients")

def get_whatsapp_config(db=None) -> dict:
    """Check WhatsApp configuration status."""
    if db:
        load_config_from_db(db)
        
    connected = False
    qr = None
    try:
        import httpx
        resp = httpx.get(f"{WHATSAPP_API_URL}/api/status", timeout=2.0)
        if resp.status_code == 200:
            data = resp.json()
            connected = data.get("connected", False)
            qr = data.get("qr", None)
    except Exception as e:
        logger.warning(f"Failed to check WhatsApp server status: {e}")
        
    return {
        "enabled": WHATSAPP_ENABLED,
        "api_url": WHATSAPP_API_URL,
        "recipients_configured": len([r for r in NOTIFICATION_RECIPIENTS if r.strip()]),
        "recipients": NOTIFICATION_RECIPIENTS,
        "connected": connected,
        "qr": qr,
    }