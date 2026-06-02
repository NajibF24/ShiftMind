from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from db import Base

class ApprovalRequest(Base):
    __tablename__ = "approval_requests"

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    details = Column(Text, nullable=False)
    request_type = Column(String, index=True, nullable=False) # "contract", "purchase", "workflow"
    status = Column(String, default="pending", index=True) # "pending", "approved", "rejected"
    ai_assessment = Column(Text, nullable=True) # AI risk assessment
    comments = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
