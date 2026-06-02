from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.sql import func
from db import Base

class DailyChecklist(Base):
    __tablename__ = "daily_checklists"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    items = Column(JSON, nullable=False)  # [{"item": "check valve", "status": "OK/FAIL", "notes": ""}]
    ai_analysis = Column(Text, nullable=True) # AI warning if FAIL
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ChecklistTemplate(Base):
    """Reusable checklist templates — operators load template instead of creating from scratch."""
    __tablename__ = "checklist_templates"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    items = Column(JSON, nullable=False)  # [{"item": "Check valve X"}, {"item": "Check temperature"}]
    department = Column(String, index=True, nullable=True)
    area = Column(String, index=True, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
