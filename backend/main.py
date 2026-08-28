from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
from datetime import date
from sqlalchemy import or_
from gemini_service import generate_recommendation

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
@app.get("/eligible-services/{user_id}")
def get_eligible_services(
    user_id: int,
    db: Session = Depends(get_db)
):
    # Fetch user
    user = db.query(models.User).filter(
        models.User.user_id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Calculate age
    today = date.today()

    age = today.year - user.dob.year

    if (today.month, today.day) < (user.dob.month, user.dob.day):
        age -= 1

    # Find all services matching profile
    services = db.query(
        models.GovernmentService
    ).filter(

        or_(
            models.GovernmentService.state == user.state,
            models.GovernmentService.state == "All"
        ),

        or_(
            models.GovernmentService.occupation == user.occupation,
            models.GovernmentService.occupation == "Any"
        ),

        models.GovernmentService.income_limit >= user.annual_income,

        models.GovernmentService.age_min <= age,

        models.GovernmentService.age_max >= age

    ).all()

    service_data = []

    for service in services:
        service_data.append({
            "service_name": service.service_name,
            "service_type": service.service_type,
            "department": service.department,
            "description": service.description,
            "eligibility": service.eligibility,
            "required_documents": service.required_documents,
            "application_link": service.application_link
        })

    print("ELIGIBLE SERVICES:")
    for service in service_data:
        print(service["service_name"])

    return {
        "user_id": user.user_id,
        "user_state": user.state,
        "user_occupation": user.occupation,
        "user_income": float(user.annual_income),
        "user_category": user.category,
        "user_age": age,
        "count": len(service_data),
        "services": service_data
    }



@app.post("/recommend-services")
def recommend_services(
    data: schemas.RecommendationRequest,
    db: Session = Depends(get_db)
):
    # Fetch logged-in user
    user = db.query(models.User).filter(
        models.User.user_id == data.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Calculate age
    today = date.today()

    age = today.year - user.dob.year

    if (today.month, today.day) < (user.dob.month, user.dob.day):
        age -= 1

    # Get services applicable to the user's profile.
    # No service type is selected by the citizen.
    services = db.query(
        models.GovernmentService
    ).filter(

        or_(
            models.GovernmentService.state == user.state,
            models.GovernmentService.state == "All"
        ),

        or_(
            models.GovernmentService.occupation == user.occupation,
            models.GovernmentService.occupation == "Any"
        ),

        models.GovernmentService.income_limit >= user.annual_income,

        models.GovernmentService.age_min <= age,

        models.GovernmentService.age_max >= age

    ).all()

    print("SERVICES SENT TO AI:")

    for service in services:
        print(service.service_name)

    # Prepare citizen profile
    user_profile = {
        "age": age,
        "gender": user.gender,
        "occupation": user.occupation,
        "annual_income": float(user.annual_income),
        "category": user.category,
        "state": user.state,
        "district": user.district
    }

    # Prepare service information
    service_data = []

    for service in services:
        service_data.append({
            "service_name": service.service_name,
            "service_type": service.service_type,
            "department": service.department,
            "description": service.description,
            "eligibility": service.eligibility,
            "required_documents": service.required_documents,
            "application_link": service.application_link
        })

    # Call Gemini
    ai_response = generate_recommendation(
        user_profile,
        service_data,
        data.query
    )

    return {
        "status": "success",
        "user_id": user.user_id,
        "query": data.query,
        "count": len(service_data),
        "recommendations": ai_response
    }

@app.get("/government-services")
def get_government_services(
    db: Session = Depends(get_db)
):
    services = db.query(
        models.GovernmentService
    ).all()

    service_data = []

    for service in services:
        service_data.append({
            "service_id": service.service_id,
            "service_name": service.service_name,
            "department": service.department,
            "description": service.description,
            "eligibility": service.eligibility,
            "required_documents": service.required_documents,
            "application_link": service.application_link,
            "service_type": service.service_type,
            "age_min": service.age_min,
            "age_max": service.age_max,
            "income_limit": float(service.income_limit),
            "occupation": service.occupation,
            "state": service.state,
            "category": service.category
        })

    return {
        "count": len(service_data),
        "services": service_data
    }