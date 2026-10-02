from datetime import date
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import models
from database import get_db


router = APIRouter(
    prefix="/eligibility",
    tags=["Eligibility Checker"]
)


# ============================================================
# REQUEST SCHEMA
# ============================================================

class EligibilityCheckRequest(BaseModel):
    user_id: int
    service_id: int

    answers: Dict[str, Any] = Field(
        default_factory=dict
    )


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def calculate_age(dob):
    """
    Calculate current age from date of birth.
    """

    if not dob:
        return None

    today = date.today()

    age = today.year - dob.year

    if (today.month, today.day) < (dob.month, dob.day):
        age -= 1

    return age


def convert_value(value):
    """
    Convert string values from database rules into
    appropriate Python values.

    Examples:
        "true"  -> True
        "false" -> False
        "100000" -> 100000
        "18" -> 18
        otherwise remains string
    """

    if value is None:
        return None

    if isinstance(value, bool):
        return value

    if isinstance(value, (int, float)):
        return value

    value = str(value).strip()

    # Boolean
    if value.lower() == "true":
        return True

    if value.lower() == "false":
        return False

    # Integer
    try:
        return int(value)
    except ValueError:
        pass

    # Float
    try:
        return float(value)
    except ValueError:
        pass

    return value


def normalize_value(value):
    """
    Normalize values before comparison.
    """

    value = convert_value(value)

    if isinstance(value, str):
        return value.strip().lower()

    return value


def compare_values(actual, operator, expected):
    """
    Compare actual value with expected value.

    Supported operators:
        ==
        !=
        >
        >=
        <
        <=
    """

    actual = normalize_value(actual)
    expected = normalize_value(expected)

    try:

        if operator == "==":
            return actual == expected

        elif operator == "!=":
            return actual != expected

        elif operator == ">":
            return actual > expected

        elif operator == ">=":
            return actual >= expected

        elif operator == "<":
            return actual < expected

        elif operator == "<=":
            return actual <= expected

        else:
            raise ValueError(
                f"Unsupported operator: {operator}"
            )

    except TypeError:
        return False


# ============================================================
# GET USER PROFILE
# ============================================================

def get_user_profile(user):
    """
    Convert the database user object into a dictionary.

    These are the normal profile fields available
    during eligibility checking.
    """

    return {
        "user_id": user.user_id,
        "full_name": user.full_name,
        "gender": user.gender,
        "dob": user.dob,
        "category": user.category,
        "state": user.state,
        "district": user.district,
        "occupation": user.occupation,
        "annual_income": user.annual_income,
        "age": calculate_age(user.dob),
    }


# ============================================================
# ELIGIBILITY CHECK
# ============================================================

@router.post("/check")
def check_eligibility(
    request: EligibilityCheckRequest,
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # 1. Find user
    # --------------------------------------------------------

    user = db.query(
        models.User
    ).filter(
        models.User.user_id == request.user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # --------------------------------------------------------
    # 2. Find service
    # --------------------------------------------------------

    service = db.query(
        models.GovernmentService
    ).filter(
        models.GovernmentService.service_id == request.service_id
    ).first()

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Government service not found"
        )

    # --------------------------------------------------------
    # 3. Check service status
    # --------------------------------------------------------

    if service.status != "Active":

        return {
            "user_id": user.user_id,
            "service_id": service.service_id,
            "service_name": service.service_name,
            "status": "NOT APPLICABLE",
            "message": "This government service is currently inactive.",
            "missing_information": [],
            "failed_rules": []
        }

    # --------------------------------------------------------
    # 4. Event-based services
    # --------------------------------------------------------

    if service.eligibility_mode == "Event Based":

        return {
            "user_id": user.user_id,
            "service_id": service.service_id,
            "service_name": service.service_name,
            "eligibility_mode": service.eligibility_mode,
            "status": "INFORMATION REQUIRED",
            "message": (
                "This service depends on a specific event. "
                "Additional information is required."
            ),
            "missing_information": [],
            "failed_rules": []
        }

    # --------------------------------------------------------
    # 5. Get eligibility rules
    # --------------------------------------------------------

    rules = db.query(
        models.ServiceEligibilityRule
    ).filter(
        models.ServiceEligibilityRule.service_id
        == request.service_id
    ).order_by(
        models.ServiceEligibilityRule.rule_id
    ).all()

    # --------------------------------------------------------
    # 6. If no rules exist
    # --------------------------------------------------------

    if not rules:

        return {
            "user_id": user.user_id,
            "service_id": service.service_id,
            "service_name": service.service_name,
            "eligibility_mode": service.eligibility_mode,
            "status": "INFORMATION REQUIRED",
            "message": (
                "No eligibility rules have been configured "
                "for this service."
            ),
            "missing_information": [],
            "failed_rules": []
        }

    # --------------------------------------------------------
    # 7. Create combined applicant data
    # --------------------------------------------------------

    applicant_data = get_user_profile(user)

    # Add service-specific answers
    for field_name, value in request.answers.items():
        applicant_data[field_name] = value

    # --------------------------------------------------------
    # 8. Check rules
    # --------------------------------------------------------

    missing_information = []
    failed_rules = []
    passed_rules = []

    for rule in rules:

        field_name = rule.field_name

        operator = rule.operator

        expected_value = rule.rule_value

        rule_type = (
            rule.rule_type.strip().upper()
            if rule.rule_type
            else "REQUIREMENT"
        )

        # ----------------------------------------------------
        # Get actual value
        # ----------------------------------------------------

        if field_name not in applicant_data:

            missing_information.append({
                "rule_id": rule.rule_id,
                "field_name": field_name,
                "description": rule.description,
                "reason": "Information not provided"
            })

            continue

        actual_value = applicant_data.get(
            field_name
        )

        # ----------------------------------------------------
        # Check NULL values
        # ----------------------------------------------------

        if actual_value is None:

            missing_information.append({
                "rule_id": rule.rule_id,
                "field_name": field_name,
                "description": rule.description,
                "reason": "Information is missing"
            })

            continue

        # ----------------------------------------------------
        # Evaluate condition
        # ----------------------------------------------------

        try:

            condition_result = compare_values(
                actual_value,
                operator,
                expected_value
            )

        except ValueError as error:

            failed_rules.append({
                "rule_id": rule.rule_id,
                "field_name": field_name,
                "operator": operator,
                "expected_value": expected_value,
                "actual_value": actual_value,
                "reason": str(error)
            })

            continue

        # ----------------------------------------------------
        # REQUIREMENT
        #
        # Requirement must be TRUE.
        # ----------------------------------------------------

        if rule_type == "REQUIREMENT":

            if condition_result:

                passed_rules.append({
                    "rule_id": rule.rule_id,
                    "field_name": field_name,
                    "operator": operator,
                    "expected_value": expected_value,
                    "actual_value": actual_value,
                    "rule_type": rule_type
                })

            else:

                failed_rules.append({
                    "rule_id": rule.rule_id,
                    "field_name": field_name,
                    "operator": operator,
                    "expected_value": expected_value,
                    "actual_value": actual_value,
                    "rule_type": rule_type,
                    "description": rule.description
                })

        # ----------------------------------------------------
        # EXCLUSION
        #
        # If exclusion condition becomes TRUE,
        # applicant is NOT ELIGIBLE.
        #
        # Example:
        #
        # income_tax_payer == true
        #
        # If applicant is an income-tax payer,
        # condition is TRUE -> NOT ELIGIBLE.
        # ----------------------------------------------------

        elif rule_type == "EXCLUSION":

            if condition_result:

                failed_rules.append({
                    "rule_id": rule.rule_id,
                    "field_name": field_name,
                    "operator": operator,
                    "expected_value": expected_value,
                    "actual_value": actual_value,
                    "rule_type": rule_type,
                    "description": rule.description,
                    "reason": "Exclusion condition matched"
                })

            else:

                passed_rules.append({
                    "rule_id": rule.rule_id,
                    "field_name": field_name,
                    "operator": operator,
                    "expected_value": expected_value,
                    "actual_value": actual_value,
                    "rule_type": rule_type
                })

        # ----------------------------------------------------
        # Unknown rule type
        # ----------------------------------------------------

        else:

            failed_rules.append({
                "rule_id": rule.rule_id,
                "field_name": field_name,
                "rule_type": rule_type,
                "reason": "Unknown rule type"
            })

    # ========================================================
    # 9. Determine final status
    # ========================================================

    # Missing information has highest priority.
    if missing_information:

        return {
            "user_id": user.user_id,
            "service_id": service.service_id,
            "service_name": service.service_name,
            "eligibility_mode": service.eligibility_mode,
            "status": "INFORMATION REQUIRED",
            "message": (
                "Additional information is required "
                "to determine eligibility."
            ),
            "missing_information": missing_information,
            "failed_rules": failed_rules,
            "passed_rules": passed_rules
        }

    # Any failed rule means not eligible.
    if failed_rules:

        return {
            "user_id": user.user_id,
            "service_id": service.service_id,
            "service_name": service.service_name,
            "eligibility_mode": service.eligibility_mode,
            "status": "NOT ELIGIBLE",
            "message": (
                "The applicant does not satisfy "
                "all eligibility conditions."
            ),
            "missing_information": [],
            "failed_rules": failed_rules,
            "passed_rules": passed_rules
        }

    # All rules passed.
    return {
        "user_id": user.user_id,
        "service_id": service.service_id,
        "service_name": service.service_name,
        "eligibility_mode": service.eligibility_mode,
        "status": "ELIGIBLE",
        "message": (
            "The applicant satisfies "
            "all configured eligibility conditions."
        ),
        "missing_information": [],
        "failed_rules": [],
        "passed_rules": passed_rules
    }