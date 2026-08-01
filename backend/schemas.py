from pydantic import BaseModel, EmailStr
from datetime import date
from decimal import Decimal
from typing import Optional


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