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
        "annual_income": float(user.annual_income) if user.annual_income is not None else None,
        "age": calculate_age(user.dob),
    }


# ============================================================
# EVALUATE RULES ENGINE
# ============================================================

def evaluate_rules(user, service, rules, answers):
    applicant_data = get_user_profile(user)

    for field_name, value in (answers or {}).items():
        applicant_data[field_name] = value

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

        if field_name not in applicant_data:
            missing_information.append({
                "rule_id": rule.rule_id,
                "field_name": field_name,
                "description": rule.description,
                "reason": "Information not provided"
            })
            continue

        actual_value = applicant_data.get(field_name)

        if actual_value is None:
            missing_information.append({
                "rule_id": rule.rule_id,
                "field_name": field_name,
                "description": rule.description,
                "reason": "Information is missing"
            })
            continue

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
        else:
            failed_rules.append({
                "rule_id": rule.rule_id,
                "field_name": field_name,
                "rule_type": rule_type,
                "reason": "Unknown rule type"
            })

    if missing_information:
        return {
            "user_id": user.user_id,
            "service_id": service.service_id,
            "service_name": service.service_name,
            "eligibility_mode": service.eligibility_mode,
            "applicant_type": service.applicant_type,
            "status": "INFORMATION REQUIRED",
            "message": (
                "Additional information is required "
                "to determine eligibility."
            ),
            "missing_information": missing_information,
            "failed_rules": failed_rules,
            "passed_rules": passed_rules
        }

    if failed_rules:
        return {
            "user_id": user.user_id,
            "service_id": service.service_id,
            "service_name": service.service_name,
            "eligibility_mode": service.eligibility_mode,
            "applicant_type": service.applicant_type,
            "status": "NOT ELIGIBLE",
            "message": (
                "The applicant does not satisfy "
                "all eligibility conditions."
            ),
            "missing_information": [],
            "failed_rules": failed_rules,
            "passed_rules": passed_rules
        }

    return {
        "user_id": user.user_id,
        "service_id": service.service_id,
        "service_name": service.service_name,
        "eligibility_mode": service.eligibility_mode,
        "applicant_type": service.applicant_type,
        "status": "ELIGIBLE",
        "message": (
            "The applicant satisfies "
            "all configured eligibility conditions."
        ),
        "missing_information": [],
        "failed_rules": [],
        "passed_rules": passed_rules
    }


# ============================================================
# EVALUATE PROFILE-BASED SERVICE (NO RULES CONFIGURED)
# ============================================================

def evaluate_profile_service(user, service):
    applicant_data = get_user_profile(user)
    user_age = applicant_data.get("age")
    user_income = applicant_data.get("annual_income")
    user_state = applicant_data.get("state")
    user_occupation = applicant_data.get("occupation")

    missing_information = []
    failed_rules = []
    passed_rules = []

    # Check age_min
    if service.age_min is not None and service.age_min > 0:
        if user_age is None:
            missing_information.append({
                "field_name": "dob",
                "description": "Date of birth",
                "reason": "Date of birth is required to calculate age"
            })
        elif user_age < service.age_min:
            failed_rules.append({
                "field_name": "age",
                "operator": ">=",
                "expected_value": service.age_min,
                "actual_value": user_age,
                "reason": f"Age must be at least {service.age_min}"
            })
        else:
            passed_rules.append({
                "field_name": "age",
                "operator": ">=",
                "expected_value": service.age_min,
                "actual_value": user_age
            })

    # Check age_max
    if service.age_max is not None and service.age_max < 120:
        if user_age is None:
            missing_information.append({
                "field_name": "dob",
                "description": "Date of birth",
                "reason": "Date of birth is required to calculate age"
            })
        elif user_age > service.age_max:
            failed_rules.append({
                "field_name": "age",
                "operator": "<=",
                "expected_value": service.age_max,
                "actual_value": user_age,
                "reason": f"Age must be at most {service.age_max}"
            })
        else:
            passed_rules.append({
                "field_name": "age",
                "operator": "<=",
                "expected_value": service.age_max,
                "actual_value": user_age
            })

    # Check income_limit
    if service.income_limit is not None and service.income_limit < 99999999:
        if user_income is None:
            missing_information.append({
                "field_name": "annual_income",
                "description": "Annual income",
                "reason": "Annual income is required"
            })
        elif float(user_income) > float(service.income_limit):
            failed_rules.append({
                "field_name": "annual_income",
                "operator": "<=",
                "expected_value": float(service.income_limit),
                "actual_value": float(user_income),
                "reason": f"Annual income exceeds limit of ₹{service.income_limit}"
            })
        else:
            passed_rules.append({
                "field_name": "annual_income",
                "operator": "<=",
                "expected_value": float(service.income_limit),
                "actual_value": float(user_income)
            })

    # Check state
    if service.state and service.state.strip().lower() not in ["all", "any", ""]:
        if not user_state:
            missing_information.append({
                "field_name": "state",
                "description": "State of residence",
                "reason": "State is required"
            })
        elif user_state.strip().lower() != service.state.strip().lower():
            failed_rules.append({
                "field_name": "state",
                "operator": "==",
                "expected_value": service.state,
                "actual_value": user_state,
                "reason": f"Service is only available in {service.state}"
            })
        else:
            passed_rules.append({
                "field_name": "state",
                "operator": "==",
                "expected_value": service.state,
                "actual_value": user_state
            })

    # Check occupation
    if service.occupation and service.occupation.strip().lower() not in ["all", "any", ""]:
        if not user_occupation:
            missing_information.append({
                "field_name": "occupation",
                "description": "Occupation",
                "reason": "Occupation is required"
            })
        elif user_occupation.strip().lower() != service.occupation.strip().lower():
            failed_rules.append({
                "field_name": "occupation",
                "operator": "==",
                "expected_value": service.occupation,
                "actual_value": user_occupation,
                "reason": f"Service is only for {service.occupation}"
            })
        else:
            passed_rules.append({
                "field_name": "occupation",
                "operator": "==",
                "expected_value": service.occupation,
                "actual_value": user_occupation
            })

    if missing_information:
        return {
            "user_id": user.user_id,
            "service_id": service.service_id,
            "service_name": service.service_name,
            "eligibility_mode": service.eligibility_mode,
            "applicant_type": service.applicant_type,
            "status": "INFORMATION REQUIRED",
            "message": (
                "Additional profile information is required "
                "to determine eligibility."
            ),
            "missing_information": missing_information,
            "failed_rules": failed_rules,
            "passed_rules": passed_rules
        }

    if failed_rules:
        return {
            "user_id": user.user_id,
            "service_id": service.service_id,
            "service_name": service.service_name,
            "eligibility_mode": service.eligibility_mode,
            "applicant_type": service.applicant_type,
            "status": "NOT ELIGIBLE",
            "message": (
                "The applicant does not satisfy "
                "all eligibility conditions."
            ),
            "missing_information": [],
            "failed_rules": failed_rules,
            "passed_rules": passed_rules
        }

    return {
        "user_id": user.user_id,
        "service_id": service.service_id,
        "service_name": service.service_name,
        "eligibility_mode": service.eligibility_mode,
        "applicant_type": service.applicant_type,
        "status": "ELIGIBLE",
        "message": (
            "The applicant satisfies "
            "all configured eligibility conditions."
        ),
        "missing_information": [],
        "failed_rules": [],
        "passed_rules": passed_rules
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
            "eligibility_mode": service.eligibility_mode,
            "applicant_type": service.applicant_type,
            "status": "NOT APPLICABLE",
            "message": "This government service is currently inactive.",
            "missing_information": [],
            "failed_rules": [],
            "passed_rules": []
        }

    # --------------------------------------------------------
    # 4. Check applicant_type (Case 1: Specific Applicant Services)
    # --------------------------------------------------------

    applicant_type = (service.applicant_type or "Self").strip()

    if applicant_type.lower() != "self":

        return {
            "user_id": user.user_id,
            "service_id": service.service_id,
            "service_name": service.service_name,
            "eligibility_mode": service.eligibility_mode,
            "applicant_type": service.applicant_type,
            "status": "APPLICANT SPECIFIC",
            "message": f"This service requires application by {service.applicant_type}.",
            "missing_information": [],
            "failed_rules": [],
            "passed_rules": []
        }

    # --------------------------------------------------------
    # 5. Check eligibility_mode
    # --------------------------------------------------------

    eligibility_mode = (service.eligibility_mode or "Rule Based").strip()

    # Case 2: Event-based services
    if eligibility_mode.lower() == "event based":

        return {
            "user_id": user.user_id,
            "service_id": service.service_id,
            "service_name": service.service_name,
            "eligibility_mode": service.eligibility_mode,
            "applicant_type": service.applicant_type,
            "status": "INFORMATION REQUIRED",
            "message": (
                "This service depends on a specific event. "
                "Additional information is required."
            ),
            "missing_information": [],
            "failed_rules": [],
            "passed_rules": []
        }

    # Case 3: Profile-based services
    if eligibility_mode.lower() == "profile based":

        rules = db.query(
            models.ServiceEligibilityRule
        ).filter(
            models.ServiceEligibilityRule.service_id == request.service_id
        ).order_by(
            models.ServiceEligibilityRule.rule_id
        ).all()

        if rules:
            return evaluate_rules(user, service, rules, request.answers)
        else:
            return evaluate_profile_service(user, service)

    # Case 4: Rule-based services (and fallback)
    rules = db.query(
        models.ServiceEligibilityRule
    ).filter(
        models.ServiceEligibilityRule.service_id == request.service_id
    ).order_by(
        models.ServiceEligibilityRule.rule_id
    ).all()

    if not rules:

        return {
            "user_id": user.user_id,
            "service_id": service.service_id,
            "service_name": service.service_name,
            "eligibility_mode": service.eligibility_mode,
            "applicant_type": service.applicant_type,
            "status": "UNCONFIGURED",
            "message": (
                "No eligibility rules have been configured "
                "for this service."
            ),
            "missing_information": [],
            "failed_rules": [],
            "passed_rules": []
        }

    return evaluate_rules(user, service, rules, request.answers)