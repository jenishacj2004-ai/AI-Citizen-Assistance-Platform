from sqlalchemy import (
    Column,
    Integer,
    String,
    Date,
    Numeric,
    TIMESTAMP
)
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    # Primary Key
    user_id = Column(Integer, primary_key=True, index=True)

    # Basic Details
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    phone = Column(String(15), nullable=False)

    # Personal Details
    gender = Column(String(10))
    dob = Column(Date)
    category = Column(String(20))

    # Location Details
    state = Column(String(50), nullable=False)
    district = Column(String(50), nullable=False)

    # Employment Details
    occupation = Column(String(100), nullable=True)
    annual_income = Column(Numeric(12, 2), nullable=False)

    # Record Creation Time
    created_at = Column(TIMESTAMP, server_default=func.now())