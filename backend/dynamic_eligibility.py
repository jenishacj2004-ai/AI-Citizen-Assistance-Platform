from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Dict, Any

import models
from database import get_db

router = APIRouter(
    prefix="/eligibility",
    tags=["Dynamic Eligibility"]
)

@router.get("/required-information/{service_id}")
def get_required_information(
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
            detail="Service not found"
        )

    rules = db.query(
        models.ServiceEligibilityRule
    ).filter(
        models.ServiceEligibilityRule.service_id == service_id
    ).all()

    required_information = []

    for rule in rules:
        required_information.append({
            "field_name": rule.field_name,
            "description": rule.description,
            "rule_type": rule.rule_type
        })

    return {
        "service_id": service.service_id,
        "service_name": service.service_name,
        "eligibility_mode": service.eligibility_mode,
        "required_information": required_information
    }