from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form
)

from sqlalchemy.orm import Session
from passlib.context import CryptContext
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from datetime import date, datetime
from sqlalchemy import or_

from gemini_service import generate_recommendation

import models
import schemas
import os
import shutil
from pathlib import Path

from database import engine, get_db, SessionLocal

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# Create all database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-Powered Citizen Assistance Platform API",
    version="1.0"
)

# Upload directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Serve uploaded files
app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads"
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

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

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

@app.get("/government-services/{service_id}")
def get_government_service(
    service_id: int,
    db: Session = Depends(get_db)
):
    service = db.query(
        models.GovernmentService
    ).filter(
        models.GovernmentService.service_id == service_id
    ).first()

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Government service not found"
        )

    return {
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
        "income_limit": float(service.income_limit)
        if service.income_limit is not None
        else None,
        "occupation": service.occupation,
        "state": service.state,
        "category": service.category
    }

@app.post("/documents/upload")
async def upload_document(
    user_id: int = Form(...),
    service_id: int = Form(...),
    document_name: str = Form(...),
    file: UploadFile = File(...)
):
    db = SessionLocal()

    try:
        # Check user
        user = db.query(models.User).filter(
            models.User.user_id == user_id
        ).first()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        # Check service
        service = db.query(models.GovernmentService).filter(
            models.GovernmentService.service_id == service_id
        ).first()

        if not service:
            raise HTTPException(
                status_code=404,
                detail="Government service not found"
            )

        # Allowed file types
        allowed_extensions = {
            ".pdf",
            ".jpg",
            ".jpeg",
            ".png"
        }

        extension = Path(file.filename).suffix.lower()

        if extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail="Only PDF, JPG, JPEG and PNG files are allowed"
            )

        # Generate unique file name
        filename = f"{user_id}_{service_id}_{document_name}{extension}"

        file_path = UPLOAD_DIR / filename

        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Save database record
        new_document = models.Document(
            user_id=user_id,
            service_id=service_id,
            document_name=document_name,
            file_path=str(file_path),
            verification_status="Pending"
        )

        db.add(new_document)
        db.commit()
        db.refresh(new_document)

        return {
            "status": "success",
            "message": "Document uploaded successfully",
            "document_id": new_document.document_id,
            "document_name": new_document.document_name,
            "verification_status": new_document.verification_status
        }

    finally:
        db.close()


@app.get("/documents/{user_id}")
def get_user_documents(user_id: int):
    db = SessionLocal()

    try:
        documents = db.query(models.Document).filter(
            models.Document.user_id == user_id
        ).all()

        result = []

        for document in documents:
            service = db.query(models.GovernmentService).filter(
                models.GovernmentService.service_id
                == document.service_id
            ).first()

            result.append({
                "document_id": document.document_id,
                "user_id": document.user_id,
                "service_id": document.service_id,
                "service_name": service.service_name if service else "",
                "document_name": document.document_name,
                "file_path": document.file_path,
                "verification_status": document.verification_status,
                "uploaded_at": document.uploaded_at
            })

        return {
            "status": "success",
            "count": len(result),
            "documents": result
        }

    finally:
        db.close()        

@app.put("/documents/{document_id}/verify")
def verify_document(
    document_id: int,
    verification_status: str
):
    db = SessionLocal()

    try:
        document = db.query(models.Document).filter(
            models.Document.document_id == document_id
        ).first()

        if not document:
            raise HTTPException(
                status_code=404,
                detail="Document not found"
            )

        allowed_status = {
            "Pending",
            "Verified",
            "Rejected"
        }

        if verification_status not in allowed_status:
            raise HTTPException(
                status_code=400,
                detail="Invalid verification status"
            )

        document.verification_status = verification_status

        db.commit()
        db.refresh(document)

        return {
            "status": "success",
            "message": "Document verification status updated",
            "document_id": document.document_id,
            "verification_status": document.verification_status
        }

    finally:
        db.close()        