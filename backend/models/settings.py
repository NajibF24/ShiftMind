from sqlalchemy import Column, String, DateTime, func
from db import Base

class SystemSettings(Base):
    __tablename__ = "system_settings"

    key = Column(String(100), primary_key=True, index=True)
    value = Column(String(1000), nullable=True)
    updated_at = Column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
