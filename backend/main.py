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
import uuid
from pathlib import Path

from database import engine, get_db, SessionLocal
from ocr_service import extract_document_data
from verification_service import verify_document
from fastapi import UploadFile, File, Form

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
def upload_document(
    user_id: int = Form(...),
    service_id: int = Form(...),
    document_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    # Create unique filename
    unique_filename = (
        f"{user_id}_{uuid.uuid4().hex}_{file.filename}"
    )

    file_path = UPLOAD_DIR / unique_filename

    # Check user
    user = db.query(models.User).filter(
        models.User.user_id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Continue with your existing code...
    # Check service
    service = db.query(models.GovernmentService).filter(
        models.GovernmentService.service_id == service_id
    ).first()

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Government service not found"
        )

    # Create temporary file path
    file_path = UPLOAD_DIR / file.filename

    try:

        # Save uploaded file temporarily
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Set OCR status
        document = models.Document(
            user_id=user_id,
            service_id=service_id,
            document_name=document_name,
            file_path=str(file_path),
            ocr_status="Processing",
            verification_status="Pending"
        )

        db.add(document)
        db.commit()
        db.refresh(document)

        # -------------------------
        # OCR PROCESSING
        # -------------------------

        ocr_result = extract_document_data(
            str(file_path)
        )

        if not ocr_result["success"]:

            document.ocr_status = "Failed"
            document.verification_status = "Rejected"
            document.verification_reason = (
                "OCR processing failed: "
                + ocr_result["error"]
            )

            db.commit()

            return {
                "success": False,
                "document_id": document.document_id,
                "ocr_status": "Failed",
                "verification_status": "Rejected",
                "message": "OCR processing failed",
                "error": ocr_result["error"]
            }

        # -------------------------
        # SAVE OCR DATA
        # -------------------------

        document.extracted_text = (
            ocr_result["extracted_text"]
        )

        document.extracted_name = (
            ocr_result["extracted_name"]
        )

        document.extracted_dob = (
            ocr_result["extracted_dob"]
        )

        document.extracted_address = (
            ocr_result["extracted_address"]
        )

        document.ocr_status = "Completed"

        # -------------------------
        # DOCUMENT VERIFICATION
        # -------------------------

        verification_result = verify_document(
        user=user,
        extracted_name=ocr_result["extracted_name"],
        extracted_dob=ocr_result["extracted_dob"],
        extracted_address=ocr_result["extracted_address"]
        )

        document.verification_status = (
        verification_result["status"]
        )

        document.verification_reason = (
        verification_result["reason"]
        )

        db.commit()
        db.refresh(document)

        # -------------------------
        # TEMPORARY FILE DELETION
        # -------------------------

        try:
            os.remove(file_path)

            # File is no longer permanently stored
            file_path = Column(
                String(500), 
                nullable=True
            )

            db.commit()

        except Exception:
            pass

        return {
            "success": True,

            "document_id": document.document_id,

            "document_name": document.document_name,

            "ocr_status": document.ocr_status,

            "extracted_text": document.extracted_text,

            "extracted_name": document.extracted_name,

            "extracted_dob": document.extracted_dob,

            "extracted_address": document.extracted_address,

            "verification_status": (
            document.verification_status
             ),

            "verification_reason": (
            document.verification_reason
            ),

             "message": (
            "Document uploaded, OCR completed, "
             "and verification completed."
            )
         }

    except Exception as e:

        db.rollback()

        # Remove temporary file if it exists
        if file_path.exists():

            try:
                os.remove(file_path)
            except Exception:
                pass

        raise HTTPException(
            status_code=500,
            detail=f"Document processing failed: {str(e)}"
        )

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

            "service_name": (
            service.service_name
            if service
            else ""
            ),

        "document_name": document.document_name,

        "ocr_status": document.ocr_status,

        "extracted_text": document.extracted_text,

        "extracted_name": document.extracted_name,

        "extracted_dob": document.extracted_dob,

        "extracted_address": document.extracted_address,

        "verification_status": (
            document.verification_status
         ),

        "verification_reason": (
            document.verification_reason
        ),

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
def manually_verify_document(
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
@app.put("/documents/{document_id}/replace")
def replace_document(
    document_id: int,
    user_id: int = Form(...),
    document_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    # -------------------------
    # FIND DOCUMENT
    # -------------------------

    document = db.query(models.Document).filter(
        models.Document.document_id == document_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    # -------------------------
    # CHECK OWNERSHIP
    # -------------------------

    if document.user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to replace this document"
        )

    # -------------------------
    # CHECK USER
    # -------------------------

    user = db.query(models.User).filter(
        models.User.user_id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # -------------------------
    # TEMPORARY FILE
    # -------------------------

    file_path = UPLOAD_DIR / file.filename

    try:

        # Save new file temporarily
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # -------------------------
        # RESET DOCUMENT
        # -------------------------

        document.document_name = document_name
        document.file_path = str(file_path)

        document.ocr_status = "Processing"
        document.verification_status = "Pending"
        document.verification_reason = None

        document.extracted_text = None
        document.extracted_name = None
        document.extracted_dob = None
        document.extracted_address = None

        db.commit()
        db.refresh(document)

        # -------------------------
        # OCR
        # -------------------------

        ocr_result = extract_document_data(
            str(file_path)
        )

        if not ocr_result["success"]:

            document.ocr_status = "Failed"
            document.verification_status = "Rejected"

            document.verification_reason = (
                "OCR processing failed: "
                + ocr_result["error"]
            )

            db.commit()
            db.refresh(document)

            return {
                "success": False,
                "document_id": document.document_id,
                "ocr_status": "Failed",
                "verification_status": "Rejected",
                "verification_reason": document.verification_reason
            }

        # -------------------------
        # SAVE OCR DATA
        # -------------------------

        document.extracted_text = (
            ocr_result["extracted_text"]
        )

        document.extracted_name = (
            ocr_result["extracted_name"]
        )

        document.extracted_dob = (
            ocr_result["extracted_dob"]
        )

        document.extracted_address = (
            ocr_result["extracted_address"]
        )

        document.ocr_status = "Completed"

        # -------------------------
        # VERIFY
        # -------------------------

        verification_result = verify_document(
            user=user,
            extracted_name=ocr_result["extracted_name"],
            extracted_dob=ocr_result["extracted_dob"],
            extracted_address=ocr_result["extracted_address"]
        )

        document.verification_status = (
            verification_result["status"]
        )

        document.verification_reason = (
            verification_result["reason"]
        )

        db.commit()
        db.refresh(document)

        # -------------------------
        # DELETE TEMPORARY FILE
        # -------------------------


        # -------------------------
        # RESPONSE
        # -------------------------

        return {
            "success": True,
            "message": "Document replaced and verified successfully",

            "document_id": document.document_id,
            "document_name": document.document_name,

            "ocr_status": document.ocr_status,

            "extracted_name": document.extracted_name,
            "extracted_dob": document.extracted_dob,
            "extracted_address": document.extracted_address,

            "verification_status": (
                document.verification_status
            ),

            "verification_reason": (
                document.verification_reason
            )
        }

    except Exception as e:

        db.rollback()

        if file_path.exists():

            try:
                os.remove(file_path)
            except Exception:
                pass

        raise HTTPException(
            status_code=500,
            detail=f"Document replacement failed: {str(e)}"
        )
@app.delete("/documents/{document_id}")
def delete_document(
    document_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):

    # Find document
    document = db.query(models.Document).filter(
        models.Document.document_id == document_id
    ).first()

    if not document:
        raise HTTPException(
            status_code=404,
            detail="Document not found"
        )

    # Check ownership
    if document.user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="You are not allowed to delete this document"
        )

    # Delete physical file if it still exists
    if document.file_path:

        file_path = Path(document.file_path)

        if file_path.exists():

            try:
                os.remove(file_path)
            except Exception:
                pass

    # Delete database record
    db.delete(document)
    db.commit()

    return {
        "success": True,
        "message": "Document deleted successfully",
        "document_id": document_id
    }

