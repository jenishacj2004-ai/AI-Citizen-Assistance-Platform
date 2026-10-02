from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas

from database import get_db


router = APIRouter(
    prefix="/admin/eligibility-rules",
    tags=["Admin - Eligibility Rules"]
)


def check_admin(user_id: int, db: Session):
    user = db.query(models.User).filter(
        models.User.user_id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if user.role != "Admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return user


# ---------------------------------------------------------
# GET ALL ELIGIBILITY RULES
# ---------------------------------------------------------

@router.get("")
def get_eligibility_rules(
    user_id: int,
    db: Session = Depends(get_db)
):

    check_admin(user_id, db)

    rules = (
        db.query(models.ServiceEligibilityRule)
        .order_by(models.ServiceEligibilityRule.rule_id)
        .all()
    )

    result = []

    for rule in rules:

        service = (
            db.query(models.GovernmentService)
            .filter(
                models.GovernmentService.service_id
                == rule.service_id
            )
            .first()
        )

        result.append({
            "rule_id": rule.rule_id,
            "service_id": rule.service_id,
            "service_name": (
                service.service_name
                if service
                else None
            ),
            "rule_type": rule.rule_type,
            "field_name": rule.field_name,
            "operator": rule.operator,
            "rule_value": rule.rule_value,
            "logical_group": rule.logical_group,
            "description": rule.description
        })

    return result


# ---------------------------------------------------------
# CREATE ELIGIBILITY RULE
# ---------------------------------------------------------

@router.post("")
def create_eligibility_rule(
    rule: schemas.EligibilityRuleCreate,
    user_id: int,
    db: Session = Depends(get_db)
):

    check_admin(user_id, db)

    # Check service exists
    service = (
        db.query(models.GovernmentService)
        .filter(
            models.GovernmentService.service_id
            == rule.service_id
        )
        .first()
    )

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Government service not found"
        )

    new_rule = models.ServiceEligibilityRule(
        service_id=rule.service_id,
        rule_type=rule.rule_type,
        field_name=rule.field_name,
        operator=rule.operator,
        rule_value=rule.rule_value,
        logical_group=rule.logical_group,
        description=rule.description
    )

    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)

    return {
        "message": "Eligibility rule created successfully",
        "rule_id": new_rule.rule_id
    }


# ---------------------------------------------------------
# UPDATE ELIGIBILITY RULE
# ---------------------------------------------------------

@router.put("/{rule_id}")
def update_eligibility_rule(
    rule_id: int,
    rule: schemas.EligibilityRuleUpdate,
    user_id: int,
    db: Session = Depends(get_db)
):

    check_admin(user_id, db)

    existing_rule = (
        db.query(models.ServiceEligibilityRule)
        .filter(
            models.ServiceEligibilityRule.rule_id
            == rule_id
        )
        .first()
    )

    if not existing_rule:
        raise HTTPException(
            status_code=404,
            detail="Eligibility rule not found"
        )

    existing_rule.rule_type = rule.rule_type
    existing_rule.field_name = rule.field_name
    existing_rule.operator = rule.operator
    existing_rule.rule_value = rule.rule_value
    existing_rule.logical_group = rule.logical_group
    existing_rule.description = rule.description

    db.commit()
    db.refresh(existing_rule)

    return {
        "message": "Eligibility rule updated successfully"
    }


# ---------------------------------------------------------
# DELETE ELIGIBILITY RULE
# ---------------------------------------------------------

@router.delete("/{rule_id}")
def delete_eligibility_rule(
    rule_id: int,
    user_id: int,
    db: Session = Depends(get_db)
):

    check_admin(user_id, db)

    existing_rule = (
        db.query(models.ServiceEligibilityRule)
        .filter(
            models.ServiceEligibilityRule.rule_id
            == rule_id
        )
        .first()
    )

    if not existing_rule:
        raise HTTPException(
            status_code=404,
            detail="Eligibility rule not found"
        )

    db.delete(existing_rule)
    db.commit()

    return {
        "message": "Eligibility rule deleted successfully"
    }