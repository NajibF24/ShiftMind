from sqlalchemy import Column, Integer, String, Enum, Boolean
import enum
from db import Base

class RoleEnum(str, enum.Enum):
    admin = "admin"
    user = "user"
    viewer = "viewer"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)   # nullable — LDAP users may not always have email
    hashed_password = Column(String, nullable=True)                   # nullable — LDAP users have no local password
    role = Column(Enum(RoleEnum), default=RoleEnum.viewer, nullable=False)
    is_ldap_user = Column(Boolean, default=False, nullable=False)     # True = authenticated via Active Directory
    display_name = Column(String, nullable=True)                       # Full name from LDAP cn attribute
