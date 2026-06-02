"""
Notification Service — Create and manage in-app notifications.
"""
import logging
from sqlalchemy.orm import Session
from models.notification import Notification

logger = logging.getLogger(__name__)


def create_notification(
    db: Session,
    user_id: int,
    notif_type: str,
    title: str,
    message: str = None,
    link: str = None,
):
    """Create an in-app notification for a user."""
    try:
        notif = Notification(
            user_id=user_id,
            type=notif_type,
            title=title,
            message=message,
            link=link,
        )
        db.add(notif)
        # Caller is responsible for db.commit()
        return notif
    except Exception as e:
        logger.error(f"Failed to create notification: {e}")
        return None


def create_notification_for_admins(db: Session, notif_type: str, title: str, message: str = None, link: str = None):
    """Create notifications for all admin users."""
    from models.user import User, RoleEnum
    admins = db.query(User).filter(User.role == RoleEnum.admin).all()
    for admin in admins:
        create_notification(db, admin.id, notif_type, title, message, link)
