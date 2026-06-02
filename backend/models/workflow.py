from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from db import Base


class Workflow(Base):
    """Smart Workflow Recorder — user records step-by-step how they do things.
    AI converts raw steps into structured SOP-quality documentation.
    Example: "Cara saya setting Rolling Mill untuk H-Beam 200x200"
    """
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # Workflow identity
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)     # Brief description of what this workflow achieves
    
    # Raw steps from user (JSON array of step objects)
    # [{"step": 1, "action": "Buka valve X", "notes": "hati-hati panas", "duration": "5 menit"}]
    steps = Column(JSON, nullable=False)
    
    # Context
    category = Column(String, index=True, nullable=True)    # "Machine Setup", "Troubleshooting", "Maintenance"
    department = Column(String, index=True, nullable=True)
    area = Column(String, index=True, nullable=True)
    
    # AI-generated outputs
    ai_sop_draft = Column(Text, nullable=True)        # AI-converted formal SOP document
    ai_safety_notes = Column(Text, nullable=True)      # AI-detected safety considerations
    ai_optimization = Column(Text, nullable=True)      # AI suggestions to improve the workflow
    ai_estimated_time = Column(String, nullable=True)   # AI-estimated total duration
    
    # Tags and searchability
    tags = Column(JSON, nullable=True)
    embedding = Column(Vector(1536))
    
    # Metadata
    version = Column(Integer, default=1)
    parent_id = Column(Integer, ForeignKey("workflows.id"), nullable=True) # ID of previous version
    is_latest = Column(Integer, default=1) # 1 = latest, 0 = old version
    is_approved = Column(Integer, default=0)    # 0 = draft, 1 = reviewed/approved by admin
    used_count = Column(Integer, default=0)      # How many times others referenced this
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
