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