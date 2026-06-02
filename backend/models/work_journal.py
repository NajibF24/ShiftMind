from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from db import Base


class WorkJournal(Base):
    """Personal work journal — captures tacit knowledge from daily tasks.
    Things that can't be Googled: specific machine adjustments, workarounds,
    tribal knowledge that lives only in employees' heads.
    """
    __tablename__ = "work_journals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    # What did you do?
    title = Column(String, nullable=False)
    content = Column(Text, nullable=False)  # Free-form description of work done
    
    # AI-extracted metadata
    category = Column(String, index=True, nullable=True)      # AI auto-categorized: "EAF Operation", "Quality Control", etc.
    tags = Column(JSON, nullable=True)                          # AI-extracted tags: ["electrode", "temperature", "scrap"]
    difficulty = Column(String, nullable=True)                  # AI-assessed: "routine", "troubleshooting", "critical"
    
    # Context
    department = Column(String, index=True, nullable=True)
    area = Column(String, index=True, nullable=True)            # "EAF", "Rolling Mill", "QC Lab"
    
    # AI analysis
    ai_summary = Column(Text, nullable=True)                    # AI-compressed version
    ai_lessons_learned = Column(Text, nullable=True)            # AI-extracted lessons
    ai_related_sops = Column(Text, nullable=True)               # AI-linked related SOPs from knowledge base
    
    # Vector for semantic search  
    embedding = Column(Vector(1536))
    
    # Engagement
    is_public = Column(Integer, default=1)  # 1 = visible to team, 0 = private
    helpful_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
