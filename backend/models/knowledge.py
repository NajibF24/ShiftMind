from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from pgvector.sqlalchemy import Vector
from db import Base

class KnowledgeEntry(Base):
    __tablename__ = "knowledge_entries"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    content = Column(Text, nullable=False)
    department = Column(String, index=True, nullable=True)
    category = Column(String, index=True, nullable=True)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # nullable for seeded/synced entries
    confidence_score = Column(Float, default=1.0)
    
    # Status: "active" (visible in search), "draft" (pending review), "archived"
    status = Column(String, default="active", index=True)
    
    # Source tracking
    source = Column(String, default="manual", index=True)  # "manual", "company", "onedrive"
    source_file_id = Column(String, nullable=True)           # OneDrive file ID
    source_file_name = Column(String, nullable=True)         # Original filename
    source_url = Column(String, nullable=True)               # Link to file in OneDrive
    last_synced_at = Column(DateTime(timezone=True), nullable=True)
    chunk_index = Column(Integer, nullable=True)             # Chunk N of document
    
    # Vector embedding using pgvector (adjust dimension to match your model, 1536 for OpenAI)
    embedding = Column(Vector(1536))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
