from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    Numeric,
    TIMESTAMP,
    ForeignKey,
    DateTime
)

from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime

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

class GovernmentService(Base):
    __tablename__ = "government_services"

    service_id = Column(Integer, primary_key=True, index=True)

    service_name = Column(String(150), nullable=False)

    department = Column(String(100))

    description = Column(Text)

    eligibility = Column(Text)

    required_documents = Column(Text)

    application_link = Column(String(255))

    category = Column(String(100))

    service_type = Column(String(100))

    age_min = Column(Integer)

    age_max = Column(Integer)

    income_limit = Column(Numeric(12,2))

    occupation = Column(String(100))

    state = Column(String(100))

    created_at = Column(TIMESTAMP, server_default=func.now())    

class Document(Base):
    __tablename__ = "documents"

    document_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    service_id = Column(
        Integer,
        ForeignKey("government_services.service_id"),
        nullable=False
    )

    document_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    verification_status = Column(String(50), default="Pending")
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    service = relationship("GovernmentService")    