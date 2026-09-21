from datetime import date
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone: str
    gender: str
    dob: date
    category: str
    state: str
    district: str
    occupation: Optional[str] = None
    annual_income: Decimal


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    phone: str
    state: str
    district: str
    occupation: Optional[str] = None
    annual_income: Decimal


class RecommendationRequest(BaseModel):
    user_id: int
    query: str

class DocumentResponse(BaseModel):
    document_id: int
    user_id: int
    service_id: int
    document_name: str
    file_path: str
    verification_status: str

    class Config:
        from_attributes = True    

class LoginResponse(BaseModel):
    user_id: int
    full_name: str
    email: EmailStr
    role: str     

class AdminServiceCreate(BaseModel):
    service_name: str
    department: str
    description: str
    eligibility: str
    required_documents: str
    application_link: str
    category: str
    service_type: str
    age_min: int = 0
    age_max: int = 120
    income_limit: Decimal
    occupation: str
    state: str


class AdminServiceUpdate(BaseModel):
    service_name: str
    department: str
    description: str
    eligibility: str
    required_documents: str
    application_link: str
    category: str
    service_type: str
    age_min: int = 0
    age_max: int = 120
    income_limit: Decimal
    occupation: str
    state: str


class AdminServiceStatus(BaseModel):
    status: str

class AdminNotificationCreate(BaseModel):
    title: str
    message: str
    notification_type: str = "General Announcement"
    
