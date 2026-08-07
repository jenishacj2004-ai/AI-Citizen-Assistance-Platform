from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    Numeric,
    TIMESTAMP
)
from sqlalchemy.sql import func
from database import Base
from sqlalchemy.sql import or_


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