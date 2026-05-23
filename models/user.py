from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from db import Base


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "app"}

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), nullable=False, unique=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.now)
