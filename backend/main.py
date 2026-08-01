from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware

import models
import schemas

from database import engine, get_db

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Create all database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-Powered Citizen Assistance Platform API",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "message": "Welcome to AI-Powered Citizen Assistance Platform for E-Governance"
    }

@app.post("/register")
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):

    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered."
        )

    new_user = models.User(
        full_name=user.full_name,
        email=user.email,
        password=pwd_context.hash(user.password),
        phone=user.phone,
        gender=user.gender,
        dob=user.dob,
        category=user.category,
        state=user.state,
        district=user.district,
        occupation=user.occupation,
        annual_income=user.annual_income
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully!",
        "user_id": new_user.user_id
    }

@app.post("/login")
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not pwd_context.verify(user.password, db_user.password):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return {
        "message": "Login successful",
        "user_id": db_user.user_id,
        "name": db_user.full_name
    }

@app.get("/profile/{user_id}")
def get_profile(user_id: int, db: Session = Depends(get_db)):

    user = db.query(models.User).filter(
        models.User.user_id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "user_id": user.user_id,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
        "gender": user.gender,
        "dob": user.dob,
        "category": user.category,
        "state": user.state,
        "district": user.district,
        "occupation": user.occupation,
        "annual_income": user.annual_income
    }

@app.put("/profile/{user_id}")
def update_profile(user_id: int, updated_user: schemas.UserUpdate, db: Session = Depends(get_db)):

    user = db.query(models.User).filter(
        models.User.user_id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    user.phone = updated_user.phone
    user.state = updated_user.state
    user.district = updated_user.district
    user.occupation = updated_user.occupation
    user.annual_income = updated_user.annual_income

    db.commit()
    db.refresh(user)

    return {
        "message": "Profile updated successfully"
    }