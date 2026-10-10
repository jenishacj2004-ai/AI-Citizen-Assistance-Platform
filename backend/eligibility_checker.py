from datetime import date
from typing import Any, Dict, Optional, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import models
from database import get_db
from egrantz_income_helper import evaluate_egrantz_income


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
    if value.lower() in ("true", "yes", "1"):
        return True

    if value.lower() in ("false", "no", "0"):
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
# OFFICIAL SCHEME METADATA MAPPINGS & DISCLAIMERS
# ============================================================

PMKISAN_DISCLAIMER = (
    "Preliminary eligibility guidance: This result is based on the information provided and the "
    "eligibility rules configured in this application. It is not an official approval or guarantee "
    "of benefits. Final eligibility is determined by the competent authorities after verification "
    "under the applicable PM-KISAN guidelines and official records."
)

EGRANTZ_DISCLAIMER = (
    "Preliminary eligibility guidance: This assessment is based on the information provided and the "
    "scheme-specific rules configured in this application. It is not an official scholarship approval or "
    "guarantee of benefits. Final eligibility and assistance are determined by the competent department "
    "under the applicable scheme guidelines."
)

DEFAULT_DISCLAIMER = (
    "Preliminary eligibility guidance: This assessment is based on the information provided and the "
    "eligibility rules configured in this application. It is not an official approval or guarantee of benefits. "
    "Final eligibility is determined by the competent authority."
)

OFFICIAL_DISCLAIMER = PMKISAN_DISCLAIMER


def get_service_disclaimer(service_id: int) -> str:
    if service_id == 11:
        return EGRANTZ_DISCLAIMER
    elif service_id == 12:
        return PMKISAN_DISCLAIMER
    return DEFAULT_DISCLAIMER


PMKISAN_FIELD_METADATA = {
    "landholder": {
        "title": "Cultivable Agricultural Landholding",
        "satisfied_text": "Eligible cultivable agricultural landholding requirement satisfied.",
        "failed_text": "Applicant does not own cultivable agricultural land in official State/UT land records.",
        "action_needed": "PM-KISAN requires the applicant farmer family to own cultivable land in official land records (Bhulekh / ROR). Verify your land ownership records.",
        "is_correctable": False,
    },
    "aadhaar_verified": {
        "title": "Aadhaar Verification & Bank Linkage",
        "satisfied_text": "Aadhaar verification and bank linkage requirement satisfied.",
        "failed_text": "Aadhaar verification or bank account DBT linkage is incomplete.",
        "action_needed": "Ensure your Aadhaar is verified and linked to your DBT-enabled bank account.",
        "is_correctable": True,
    },
    "ekyc_verified": {
        "title": "Mandatory eKYC Verification",
        "satisfied_text": "Mandatory eKYC verification requirement satisfied.",
        "failed_text": "Mandatory eKYC verification is incomplete.",
        "action_needed": "Mandatory eKYC is incomplete. Complete eKYC through the official PM-KISAN portal (pmkisan.gov.in) before proceeding.",
        "is_correctable": True,
    },
    "income_tax_payer": {
        "title": "Income-Tax Exclusion",
        "clear_text": "Income-tax exclusion: No applicable exclusion reported.",
        "triggered_text": "Income-tax exclusion triggered: Persons or family members who paid income tax in the last assessment year are excluded.",
        "action_needed": "Statutory exclusion: Individuals or family members who paid income tax in the previous assessment year are not eligible under PM-KISAN guidelines.",
    },
    "institutional_landholder": {
        "title": "Institutional Landholding Exclusion",
        "clear_text": "Institutional landholding exclusion: No applicable exclusion reported.",
        "triggered_text": "Institutional landholding exclusion triggered: Land held by institutions, trusts, or organizations is excluded.",
        "action_needed": "Institutional landholders are excluded from receiving PM-KISAN benefits.",
    },
    "constitutional_post_holder": {
        "title": "Constitutional Post Exclusion",
        "clear_text": "Constitutional-post exclusion: No applicable exclusion reported.",
        "triggered_text": "Constitutional-post exclusion triggered: Former and present holders of constitutional posts are excluded.",
        "action_needed": "Former and present holders of constitutional posts are excluded under statutory scheme guidelines.",
    },
    "public_representative": {
        "title": "Public Representative Exclusion",
        "clear_text": "Public-representative exclusion: No applicable exclusion reported.",
        "triggered_text": "Public-representative exclusion triggered: Former and present Ministers, MPs, MLAs, MLCs, Mayors, and District Panchayat Chairpersons are excluded.",
        "action_needed": "Specified elected public representatives are excluded under statutory PM-KISAN rules.",
    },
    "government_employee_non_group_d": {
        "title": "Government Employment Exclusion",
        "clear_text": "Government-employment exclusion: No applicable exclusion reported.",
        "triggered_text": "Government-employment exclusion triggered: Serving or retired Govt/PSU/Local Body employees are excluded (excluding Class IV / Group D / MTS).",
        "action_needed": "Serving or retired government employees are excluded. Note: Class IV / Group D / MTS staff are exempt upon nodal officer verification.",
    },
    "pensioner_monthly_10000_above_non_group_d": {
        "title": "Pension Exclusion",
        "clear_text": "Pension exclusion: No applicable exclusion reported.",
        "triggered_text": "Pension exclusion triggered: Retired pensioners with monthly pension of ₹10,000 or more are excluded (excluding Class IV / Group D / MTS).",
        "action_needed": "Pensioners drawing ₹10,000 or more per month are excluded. Pensioners drawing under ₹10,000/month or Group D/MTS pensioners are eligible.",
    },
    "registered_professional": {
        "title": "Registered Professional Exclusion",
        "clear_text": "Registered-professional exclusion: No applicable exclusion reported.",
        "triggered_text": "Registered-professional exclusion triggered: Practicing Doctors, Engineers, Lawyers, Chartered Accountants, and Architects are excluded.",
        "action_needed": "Professionals registered with recognized professional bodies and undertaking active practice are excluded under Section 2.",
    },
}

EGRANTZ_FIELD_METADATA = {
    "enrolled_post_matric": {
        "title": "Post-Matric Course Enrollment",
        "satisfied_text": "Enrolled in an approved Post-Matric / Higher Education course in a recognized institution.",
        "failed_text": "Applicant is not enrolled in an approved post-matric course in a recognized institution.",
        "action_needed": "E-Grantz scholarship is exclusively available for students enrolled in approved post-matric / higher education courses in Kerala.",
        "is_correctable": False,
    },
    "kerala_resident": {
        "title": "Kerala Domicile / Residence",
        "satisfied_text": "Kerala state residence / domicile requirement satisfied.",
        "failed_text": "Applicant is not a permanent resident of Kerala.",
        "action_needed": "E-Grantz 3.0 requires the applicant to be a permanent resident of Kerala State.",
        "is_correctable": False,
    },
    "regular_attendance": {
        "title": "Minimum 75% Attendance",
        "satisfied_text": "Satisfies minimum 75% regular attendance requirement certified by the institution head.",
        "failed_text": "Applicant does not satisfy the mandatory minimum 75% monthly attendance requirement.",
        "action_needed": "A minimum of 75% regular attendance certified monthly by the head of the institution is mandatory for scholarship disbursement.",
        "is_correctable": True,
    },
    "merit_or_reservation_admission": {
        "title": "Merit / Reservation Admission Quota",
        "satisfied_text": "Admitted under government merit quota or approved communal reservation quota.",
        "failed_text": "Admission was not secured under government merit or approved reservation quota.",
        "action_needed": "Admission must be secured through merit quota or approved reservation quota. Management / NRI quota seats without merit allotment are ineligible.",
        "is_correctable": False,
    },
    "aadhaar_linked_bank": {
        "title": "Aadhaar Seeding & Bank Linkage for DBT",
        "satisfied_text": "Active savings bank account seeded with Aadhaar for Direct Benefit Transfer (DBT).",
        "failed_text": "Active savings bank account is not linked/seeded with Aadhaar for DBT.",
        "action_needed": "Link and seed your active bank account with Aadhaar at your bank branch/portal to enable scholarship DBT disbursements.",
        "is_correctable": True,
    },
    "income_limit_verified": {
        "title": "Category Income Ceiling Compliance",
        "satisfied_text": "Income criterion satisfied based on your profile.",
        "failed_text": "Annual family income exceeds the prescribed category ceiling under official E-Grantz guidelines.",
        "action_needed": "Income ceiling requirements: SC/ST = No income ceiling (exempt); OEC = up to ₹6 Lakh; OBC/General/EBC = up to ₹1 Lakh per annum.",
        "exempt_text": "No income ceiling applies to this category under configured scheme rules (category exempt).",
        "is_correctable": False,
    },
    "availing_other_scholarship": {
        "title": "Concurrent Scholarship Exclusion",
        "clear_text": "Concurrent scholarship exclusion: No other concurrent government scholarship or stipend reported.",
        "triggered_text": "Concurrent scholarship exclusion triggered: Applicant is already availing another government scholarship or stipend for the same course.",
        "action_needed": "Students cannot draw financial assistance or stipend from multiple government schemes simultaneously for the same course.",
    },
    "unapproved_quota_admission": {
        "title": "Unapproved Quota Admission Exclusion",
        "clear_text": "Unapproved quota exclusion: Admission is under approved merit or reservation quota.",
        "triggered_text": "Unapproved quota exclusion triggered: Students admitted under unapproved management or discretionary quota seats are excluded.",
        "action_needed": "Admission secured through unapproved management or discretionary quota seats is excluded under official E-Grantz rules.",
    },
}

CASTE_CERTIFICATE_FIELD_METADATA = {
    "caste_details_declared": {
        "title": "Recognized Caste Declaration",
        "satisfied_text": "Applicant has declared a recognized caste/community under official Kerala Government or Presidential Orders.",
        "failed_text": "Applicant has not declared a recognized caste/community eligible for Caste Certificate.",
        "action_needed": "You must belong to and declare a recognized caste/community specified in official Kerala Government or Presidential Orders.",
        "is_correctable": False,
    },
    "supporting_caste_evidence": {
        "title": "Supporting Documentary Caste Proof",
        "satisfied_text": "Documentary proof of caste (SSLC / school records with caste entry or caste certificate of parents/blood relatives) is provided.",
        "failed_text": "Documentary proof of caste is not provided.",
        "action_needed": "Provide an attested copy of school records (SSLC book) showing caste entry or a caste certificate of parents/blood relatives.",
        "is_correctable": True,
    },
    "kerala_residence_and_id_proof": {
        "title": "Kerala Residence & Identity Proof",
        "satisfied_text": "Valid proof of identity and local residence in Kerala (Ration card / Aadhaar / Voter ID) is provided.",
        "failed_text": "Valid proof of identity and local residence in Kerala is missing.",
        "action_needed": "Provide valid proof of identity and residence within the concerned village jurisdiction (Ration card, Aadhaar, or Voter ID).",
        "is_correctable": True,
    },
    "converted_without_gazette_notification": {
        "title": "Conversion Documentation Exclusion",
        "clear_text": "Conversion exclusion: No uncertified or undocumented religious conversion reported.",
        "triggered_text": "Conversion exclusion triggered: Applicant underwent religious conversion without official Kerala Gazette notification or conversion certificate.",
        "action_needed": "In case of religious conversion, publish the change in the Kerala Government Gazette and obtain an official conversion certificate before applying.",
    },
    "competent_authority_verification": {
        "title": "Revenue Authority Verification Clearance",
        "satisfied_text": "Application is subject to mandatory enquiry and verification clearance by the competent revenue authority (Village Officer / Tahsildar).",
        "failed_text": "Enquiry and verification clearance by the competent revenue authority is not established.",
        "action_needed": "Application requires verification and local enquiry clearance by the Village Officer / Tahsildar before final certificate issuance.",
        "is_correctable": True,
    },
}

def get_field_meta(field_name: str, rule_type: str, description: Optional[str] = None):
    norm = (field_name or "").strip().lower()
    if norm in PMKISAN_FIELD_METADATA:
        return PMKISAN_FIELD_METADATA[norm]
    if norm in EGRANTZ_FIELD_METADATA:
        return EGRANTZ_FIELD_METADATA[norm]
    if norm in CASTE_CERTIFICATE_FIELD_METADATA:
        return CASTE_CERTIFICATE_FIELD_METADATA[norm]
    
    friendly = (field_name or "").replace("_", " ").title()
    if (rule_type or "").upper() == "EXCLUSION":
        return {
            "title": f"{friendly} Exclusion",
            "clear_text": f"{friendly} exclusion: No applicable exclusion reported.",
            "triggered_text": f"{friendly} exclusion triggered: {description or 'Exclusion condition matched.'}",
            "action_needed": f"Applicant is subject to the {friendly} statutory exclusion.",
            "is_correctable": False
        }
    else:
        return {
            "title": friendly,
            "satisfied_text": f"{description or friendly} requirement satisfied.",
            "failed_text": f"{description or friendly} requirement not satisfied.",
            "action_needed": f"Fulfill {friendly} requirement to establish eligibility.",
            "is_correctable": False
        }

def generate_profile_note(user, service):
    user_occ = (user.occupation or "").strip() if user else ""
    user_cat = (user.category or "").strip() if user else ""
    user_inc = user.annual_income if user else None
    service_id = service.service_id if service else 0

    if service_id == 11:
        cat_str = user_cat or "Not specified"
        inc_str = f"₹{float(user_inc):,.2f}" if user_inc is not None else "Not specified"
        return (
            f"Your profile lists your category as {cat_str} with an annual income of {inc_str}. "
            f"Under Kerala E-Grantz 3.0 guidelines, SC/ST students have no income ceiling for post-matric assistance (category exempt), "
            f"OEC students have an income ceiling up to ₹6,00,000, and OBC/General students have a ₹1,00,000 annual income ceiling. "
            f"The assessment also evaluates approved course enrollment, 75% monthly attendance, merit/reservation admission, and Aadhaar-linked DBT bank account."
        )
    elif service_id == 12:
        if user_occ:
            return (
                f"Your profile lists your occupation as {user_occ}. This information alone does not establish "
                f"{service.service_name} eligibility. The assessment also considers landholding, mandatory "
                f"verification, and applicable exclusion conditions."
            )
        return (
            f"Preliminary assessment for {service.service_name} considers cultivable landholding, mandatory "
            f"verification, and applicable exclusion conditions."
        )
    elif service_id == 2:
        cat_str = user_cat or "Not specified"
        return (
            f"Your profile lists your category as {cat_str}. Profile category alone does not establish eligibility or automatically "
            f"grant a Caste Certificate. Under Kerala e-District rules, you must declare your specific recognized caste, provide "
            f"documentary caste evidence (e.g., school/parent records), furnish valid Kerala residence proof, and obtain verification "
            f"clearance from the competent revenue authority."
        )
    else:
        if user_occ:
            return (
                f"Your profile lists your occupation as {user_occ}. This information alone does not establish "
                f"{service.service_name} eligibility. The assessment also considers configured criteria and applicable conditions."
            )
        return (
            f"Preliminary assessment for {service.service_name} considers configured scheme criteria and applicable exclusion conditions."
        )


# ============================================================
# EVALUATE RULES ENGINE
# ============================================================

def evaluate_rules(user, service, rules, answers, db=None):
    applicant_data = get_user_profile(user)

    # Check verified documents in database if db is provided
    if db and user:
        aadhaar_doc = db.query(models.Document).filter(
            models.Document.user_id == user.user_id,
            models.Document.verification_status == "Verified"
        ).first()
        if aadhaar_doc and "aadhaar" in (aadhaar_doc.document_name or "").lower():
            applicant_data["aadhaar_verified"] = True
            applicant_data["aadhaar_linked_bank"] = True

    exceptions_applied = []
    manual_verification_required = False
    manual_verification_details = []

    # Process and overlay explicit answers (handling empty string or None as UNANSWERED)
    clean_answers = {}
    for field_name, value in (answers or {}).items():
        if value is not None and str(value).strip() != "":
            clean_answers[field_name] = convert_value(value)
            applicant_data[field_name] = clean_answers[field_name]

    # For Kerala E-Grantz (Service 11), compute income eligibility server-side from citizen profile data
    # Client-submitted answers must NEVER override or bypass the calculation.
    egrantz_income_eval = None
    if service.service_id == 11:
        user_cat = user.category if user else None
        user_inc = user.annual_income if user else None
        egrantz_income_eval = evaluate_egrantz_income(user_cat, user_inc)
        clean_answers.pop("income_limit_verified", None)
        applicant_data.pop("income_limit_verified", None)

    # Handle official PM-KISAN exceptions:
    # Exception 1: Multi-Tasking Staff / Class IV / Group D government employees & pensioners
    is_group_d = clean_answers.get("is_group_d_or_mts") or clean_answers.get("is_class_iv_or_group_d")
    govt_employee_raw = clean_answers.get("is_government_employee") or clean_answers.get("government_employee")
    
    if is_group_d is True:
        if "government_employee_non_group_d" not in clean_answers:
            applicant_data["government_employee_non_group_d"] = False
        if "pensioner_monthly_10000_above_non_group_d" not in clean_answers:
            applicant_data["pensioner_monthly_10000_above_non_group_d"] = False
        exceptions_applied.append(
            "Multi-Tasking Staff (MTS) / Class IV / Group D official exemption applied (exempt from government employee & pensioner exclusions)."
        )
        manual_verification_required = True
        manual_verification_details.append(
            "Physical verification of Class IV / Group D / MTS service book or pension payment order (PPO) by the nodal officer is required."
        )
    elif govt_employee_raw is True and "government_employee_non_group_d" not in clean_answers:
        applicant_data["government_employee_non_group_d"] = True

    # Exception 2: Pensioners receiving < 10,000 monthly pension
    monthly_pension = clean_answers.get("monthly_pension")
    if monthly_pension is not None and "pensioner_monthly_10000_above_non_group_d" not in clean_answers:
        try:
            pension_val = float(monthly_pension)
            if pension_val < 10000:
                applicant_data["pensioner_monthly_10000_above_non_group_d"] = False
                exceptions_applied.append(
                    f"Pension threshold exemption: Monthly pension of ₹{pension_val:,.2f} is below the ₹10,000 exclusion threshold."
                )
            elif is_group_d is not True:
                applicant_data["pensioner_monthly_10000_above_non_group_d"] = True
        except (ValueError, TypeError):
            pass

    # Separate into EXCLUSION rules and REQUIREMENT rules (grouped by logical_group)
    exclusion_rules = []
    requirement_groups = {}  # group_id -> list of rules

    for rule in rules:
        rtype = (rule.rule_type or "REQUIREMENT").strip().upper()
        if rtype == "EXCLUSION":
            exclusion_rules.append(rule)
        else:
            gid = rule.logical_group if rule.logical_group is not None else 1
            requirement_groups.setdefault(gid, []).append(rule)

    requirements_satisfied = []
    exclusions_checked = []
    failed_requirements = []
    triggered_exclusions = []
    missing_information = []

    # 1. Evaluate EXCLUSION rules
    # An exclusion MATCHES if applicant has condition == True (e.g. income_tax_payer == True).
    # If applicant has condition == False (e.g. answered No), exclusion is NOT triggered -> exclusions_checked.
    # If condition is unanswered / None -> missing_information.
    for rule in exclusion_rules:
        field_name = rule.field_name
        operator = rule.operator
        expected_value = rule.rule_value
        meta = get_field_meta(field_name, "EXCLUSION", rule.description)

        if field_name not in applicant_data or applicant_data.get(field_name) is None or str(applicant_data.get(field_name)).strip() == "":
            missing_information.append({
                "rule_id": rule.rule_id,
                "field_name": field_name,
                "title": meta.get("title", field_name),
                "rule_type": "EXCLUSION",
                "logical_group": rule.logical_group,
                "description": rule.description,
                "reason": "Exclusion condition question unanswered. Please select Yes or No.",
                "action_needed": "Please answer this question to complete the preliminary assessment."
            })
            continue

        actual_value = applicant_data.get(field_name)
        try:
            condition_result = compare_values(actual_value, operator, expected_value)
        except ValueError as err:
            triggered_exclusions.append({
                "rule_id": rule.rule_id,
                "field_name": field_name,
                "title": meta.get("title", field_name),
                "operator": operator,
                "expected_value": expected_value,
                "actual_value": actual_value,
                "rule_type": "EXCLUSION",
                "logical_group": rule.logical_group,
                "description": rule.description,
                "reason": str(err),
                "action_needed": meta.get("action_needed", "")
            })
            continue

        if condition_result is True:
            # Matched exclusion -> applicant is excluded!
            triggered_exclusions.append({
                "rule_id": rule.rule_id,
                "field_name": field_name,
                "title": meta.get("title", field_name),
                "operator": operator,
                "expected_value": expected_value,
                "actual_value": actual_value,
                "rule_type": "EXCLUSION",
                "logical_group": rule.logical_group,
                "description": rule.description,
                "reason": meta.get("triggered_text", f"Exclusion condition matched: {rule.description or field_name}"),
                "action_needed": meta.get("action_needed", "Statutory scheme exclusion applies.")
            })
        else:
            # Exclusion did not match -> passed exclusion check!
            exclusions_checked.append({
                "rule_id": rule.rule_id,
                "field_name": field_name,
                "title": meta.get("title", field_name),
                "operator": operator,
                "expected_value": expected_value,
                "actual_value": actual_value,
                "rule_type": "EXCLUSION",
                "logical_group": rule.logical_group,
                "description": meta.get("clear_text", f"{meta.get('title', field_name)}: No applicable exclusion reported."),
                "status_label": "No applicable exclusion reported"
            })

    # 2. Evaluate REQUIREMENT groups with AND/OR semantics
    requirement_groups_results = []
    
    if requirement_groups:
        for gid, grules in requirement_groups.items():
            g_passed = True
            g_missing = []
            g_failed = []
            g_passed_list = []
            g_exempt_list = []

            for rule in grules:
                field_name = rule.field_name
                operator = rule.operator
                expected_value = rule.rule_value
                meta = get_field_meta(field_name, "REQUIREMENT", rule.description)

                # Special handling for Kerala E-Grantz (Service 11) profile-computed income eligibility:
                if service.service_id == 11 and field_name == "income_limit_verified":
                    if egrantz_income_eval["status"] == "EXEMPT":
                        exempt_rule = {
                            "rule_id": rule.rule_id,
                            "field_name": field_name,
                            "title": meta.get("title", field_name),
                            "operator": operator,
                            "expected_value": expected_value,
                            "actual_value": applicant_data.get("annual_income"),
                            "rule_type": "REQUIREMENT",
                            "logical_group": gid,
                            "status": "NOT APPLICABLE — category exempt",
                            "criterion_status": "NOT APPLICABLE — category exempt",
                            "description": "No income ceiling applies to this category under configured scheme rules (category exempt).",
                            "detail": f"NOT APPLICABLE — category exempt ({egrantz_income_eval['explanation']})",
                            "is_exempt": True,
                        }
                        g_exempt_list.append(exempt_rule)
                        if "Category Income Exemption" not in "".join(exceptions_applied):
                            exceptions_applied.append(
                                f"Category Income Exemption: {egrantz_income_eval['explanation']}"
                            )
                    elif egrantz_income_eval["status"] == "PASSED":
                        sat_rule = {
                            "rule_id": rule.rule_id,
                            "field_name": field_name,
                            "title": meta.get("title", field_name),
                            "operator": operator,
                            "expected_value": expected_value,
                            "actual_value": applicant_data.get("annual_income"),
                            "rule_type": "REQUIREMENT",
                            "logical_group": gid,
                            "description": f"Income criterion satisfied based on your profile ({egrantz_income_eval['explanation']})",
                            "detail": f"Income criterion satisfied based on your profile ({egrantz_income_eval['explanation']})",
                        }
                        g_passed_list.append(sat_rule)
                    elif egrantz_income_eval["status"] == "FAILED":
                        g_passed = False
                        fail_rule = {
                            "rule_id": rule.rule_id,
                            "field_name": field_name,
                            "title": meta.get("title", field_name),
                            "operator": operator,
                            "expected_value": expected_value,
                            "actual_value": applicant_data.get("annual_income"),
                            "rule_type": "REQUIREMENT",
                            "logical_group": gid,
                            "description": rule.description,
                            "reason": egrantz_income_eval["explanation"],
                            "action_needed": egrantz_income_eval.get("action_needed", "Fulfill this requirement before applying."),
                            "is_correctable": False,
                        }
                        g_failed.append(fail_rule)
                    elif egrantz_income_eval["status"] == "MANUAL_VERIFICATION_REQUIRED":
                        g_passed = False
                        manual_verification_required = True
                        if egrantz_income_eval["explanation"] not in manual_verification_details:
                            manual_verification_details.append(egrantz_income_eval["explanation"])
                        miss_rule = {
                            "rule_id": rule.rule_id,
                            "field_name": field_name,
                            "title": meta.get("title", field_name),
                            "rule_type": "REQUIREMENT",
                            "logical_group": gid,
                            "description": rule.description,
                            "reason": egrantz_income_eval["explanation"],
                            "action_needed": egrantz_income_eval.get("action_needed", "Manual verification required."),
                        }
                        g_missing.append(miss_rule)
                    else:  # INFORMATION_REQUIRED (missing category or income)
                        g_passed = False
                        miss_rule = {
                            "rule_id": rule.rule_id,
                            "field_name": field_name,
                            "title": meta.get("title", field_name),
                            "rule_type": "REQUIREMENT",
                            "logical_group": gid,
                            "description": rule.description,
                            "reason": egrantz_income_eval["explanation"],
                            "action_needed": egrantz_income_eval.get("action_needed", "Update profile details to determine income eligibility."),
                        }
                        g_missing.append(miss_rule)
                    continue

                if field_name not in applicant_data or applicant_data.get(field_name) is None or str(applicant_data.get(field_name)).strip() == "":
                    g_passed = False
                    g_missing.append({
                        "rule_id": rule.rule_id,
                        "field_name": field_name,
                        "title": meta.get("title", field_name),
                        "rule_type": "REQUIREMENT",
                        "logical_group": gid,
                        "description": rule.description,
                        "reason": "Mandatory requirement unanswered. Please select Yes or No.",
                        "action_needed": "Please answer this question to complete the preliminary assessment."
                    })
                    continue

                actual_value = applicant_data.get(field_name)
                try:
                    condition_result = compare_values(actual_value, operator, expected_value)
                except ValueError as err:
                    g_passed = False
                    g_failed.append({
                        "rule_id": rule.rule_id,
                        "field_name": field_name,
                        "title": meta.get("title", field_name),
                        "operator": operator,
                        "expected_value": expected_value,
                        "actual_value": actual_value,
                        "rule_type": "REQUIREMENT",
                        "logical_group": gid,
                        "description": rule.description,
                        "reason": str(err),
                        "action_needed": meta.get("action_needed", ""),
                        "is_correctable": meta.get("is_correctable", False)
                    })
                    continue

                if condition_result is True:
                    g_passed_list.append({
                        "rule_id": rule.rule_id,
                        "field_name": field_name,
                        "title": meta.get("title", field_name),
                        "operator": operator,
                        "expected_value": expected_value,
                        "actual_value": actual_value,
                        "rule_type": "REQUIREMENT",
                        "logical_group": gid,
                        "description": meta.get("satisfied_text", rule.description or f"{field_name} satisfied."),
                        "detail": meta.get("satisfied_text", rule.description or f"{field_name} satisfied.")
                    })
                else:
                    g_passed = False
                    g_failed.append({
                        "rule_id": rule.rule_id,
                        "field_name": field_name,
                        "title": meta.get("title", field_name),
                        "operator": operator,
                        "expected_value": expected_value,
                        "actual_value": actual_value,
                        "rule_type": "REQUIREMENT",
                        "logical_group": gid,
                        "description": rule.description,
                        "reason": meta.get("failed_text", f"Requirement not satisfied: {rule.description or field_name}"),
                        "action_needed": meta.get("action_needed", "Fulfill this requirement before applying."),
                        "is_correctable": meta.get("is_correctable", False)
                    })

            requirement_groups_results.append({
                "group_id": gid,
                "passed": g_passed,
                "passed_rules": g_passed_list,
                "exempt_rules": g_exempt_list,
                "failed_rules": g_failed,
                "missing_rules": g_missing
            })

    # Consolidate requirement results across groups
    exempt_criteria = []
    any_group_passed = any(res["passed"] for res in requirement_groups_results) if requirement_groups_results else True

    if any_group_passed and requirement_groups_results:
        winning_group = next(res for res in requirement_groups_results if res["passed"])
        requirements_satisfied.extend(winning_group["passed_rules"])
        exempt_criteria.extend(winning_group.get("exempt_rules", []))
    elif requirement_groups_results:
        for res in requirement_groups_results:
            failed_requirements.extend(res["failed_rules"])
            for m in res["missing_rules"]:
                if m not in missing_information:
                    missing_information.append(m)
            requirements_satisfied.extend(res["passed_rules"])
            exempt_criteria.extend(res.get("exempt_rules", []))

    profile_note = generate_profile_note(user, service)
    service_disclaimer = get_service_disclaimer(service.service_id)
    total_rules_count = len(rules)
    satisfied_count = len(requirements_satisfied) + len(exclusions_checked) + len(exempt_criteria)
    match_score = round((satisfied_count / total_rules_count) * 100) if total_rules_count > 0 else 0

    # Build backward compatibility passed_rules and failed_rules
    passed_rules = list(requirements_satisfied) + list(exclusions_checked) + list(exempt_criteria)
    failed_rules = list(failed_requirements) + list(triggered_exclusions)

    # Status Determination:
    # 1. If any EXCLUSION matched or any REQUIREMENT failed: NOT ELIGIBLE
    if failed_requirements or triggered_exclusions:
        status = "NOT ELIGIBLE"
        preliminary_eligible = False
        
        # Check if ONLY correctable administrative steps failed
        only_correctable = (
            len(triggered_exclusions) == 0 and 
            len(failed_requirements) > 0 and 
            all(f.get("is_correctable") for f in failed_requirements)
        )

        if only_correctable:
            if service.service_id == 11:
                message = (
                    "Action Required: Mandatory requirements (such as 75% attendance certification or Aadhaar bank linkage) "
                    "are pending. Complete the required actions to establish eligibility."
                )
            elif service.service_id == 12:
                message = (
                    "Action Required: Mandatory verification (eKYC / Aadhaar) is incomplete. "
                    "Complete the pending verification through the official PM-KISAN portal to establish eligibility."
                )
            else:
                message = "Action Required: Mandatory verification steps are incomplete. Complete the required actions to establish eligibility."
        else:
            message = (
                "The applicant does not currently satisfy eligibility criteria or falls under an official scheme exclusion category."
            )

        next_steps = []
        for f in failed_requirements:
            if f.get("action_needed"):
                next_steps.append(f"{f['title']}: {f['action_needed']}")
        for ex in triggered_exclusions:
            if ex.get("action_needed"):
                next_steps.append(f"{ex['title']}: {ex['action_needed']}")
        if not next_steps:
            next_steps.append("Review the official scheme guidelines before submitting an application.")

        return {
            "user_id": user.user_id,
            "service_id": service.service_id,
            "service_name": service.service_name,
            "eligibility_mode": service.eligibility_mode,
            "applicant_type": service.applicant_type,
            "status": status,
            "preliminary_eligible": preliminary_eligible,
            "message": message,
            "profile_note": profile_note,
            "disclaimer": service_disclaimer,
            "match_score": match_score,
            "total_criteria_count": total_rules_count,
            "satisfied_criteria_count": satisfied_count,
            "requirements_satisfied": requirements_satisfied,
            "exclusions_checked": exclusions_checked,
            "exempt_criteria": exempt_criteria,
            "failed_requirements": failed_requirements,
            "triggered_exclusions": triggered_exclusions,
            "missing_information": missing_information,
            "next_steps": next_steps,
            "exceptions_applied": exceptions_applied,
            "manual_verification_required": manual_verification_required,
            "manual_verification_details": manual_verification_details,
            "failed_rules": failed_rules,
            "passed_rules": passed_rules,
            "income_assessment": egrantz_income_eval if service.service_id == 11 else None
        }

    # 2. If any mandatory information is missing: INFORMATION REQUIRED
    if missing_information:
        status = "INFORMATION REQUIRED"
        preliminary_eligible = False
        message = f"Additional information is required. Please answer all mandatory criteria questions to determine {service.service_name} eligibility."
        next_steps = [
            "Please answer all remaining questions in the assessment form above.",
            "Click 'Evaluate My Eligibility' once all questions are answered to view your complete assessment."
        ]

        return {
            "user_id": user.user_id,
            "service_id": service.service_id,
            "service_name": service.service_name,
            "eligibility_mode": service.eligibility_mode,
            "applicant_type": service.applicant_type,
            "status": status,
            "preliminary_eligible": preliminary_eligible,
            "message": message,
            "profile_note": profile_note,
            "disclaimer": service_disclaimer,
            "match_score": match_score,
            "total_criteria_count": total_rules_count,
            "satisfied_criteria_count": satisfied_count,
            "requirements_satisfied": requirements_satisfied,
            "exclusions_checked": exclusions_checked,
            "exempt_criteria": exempt_criteria,
            "failed_requirements": [],
            "triggered_exclusions": [],
            "missing_information": missing_information,
            "next_steps": next_steps,
            "exceptions_applied": exceptions_applied,
            "manual_verification_required": manual_verification_required,
            "manual_verification_details": manual_verification_details,
            "failed_rules": [],
            "passed_rules": passed_rules,
            "income_assessment": egrantz_income_eval if service.service_id == 11 else None
        }

    # 3. All requirements satisfied and no exclusions matched: ELIGIBLE!
    status = "ELIGIBLE"
    preliminary_eligible = True
    
    if service.service_id == 11:
        message = "You preliminarily satisfy all configured Kerala E-Grantz 3.0 scholarship eligibility requirements and reported no applicable exclusions."
        next_steps = [
            "Visit the official Kerala E-Grantz portal (egrantz.kerala.gov.in) to complete your One Time Registration (OTR) or student login.",
            "Submit the online application with required documents: Caste Certificate, Income Certificate (if applicable), SSLC/Matriculation Certificate, and Fee Receipt.",
            "Submit the printed copy of the submitted online application along with supporting documents to your educational institution head / scholarship nodal officer for institutional verification.",
            "Ensure your active bank account is seeded with Aadhaar in the National Payments Corporation of India (NPCI) mapper for Direct Benefit Transfer (DBT)."
        ]
    elif service.service_id == 12:
        message = "You preliminarily satisfy all configured PM-KISAN eligibility requirements and reported no applicable exclusions."
        next_steps = [
            "Proceed to the official PM-KISAN portal (pmkisan.gov.in) to complete your new farmer registration or check disbursement status.",
            "Keep your Land Ownership Records (Bhulekh / ROR / Khatauni), Aadhaar Card, and bank account passbook ready for nodal officer verification.",
            "Ensure your bank account is active and seeded with Aadhaar for Direct Benefit Transfer (DBT)."
        ]
    else:
        message = f"You preliminarily satisfy all configured {service.service_name} eligibility requirements and reported no applicable exclusions."
        next_steps = [
            "Proceed to the official government portal to submit your application.",
            "Keep all required supporting documents ready for verification."
        ]

    return {
        "user_id": user.user_id,
        "service_id": service.service_id,
        "service_name": service.service_name,
        "eligibility_mode": service.eligibility_mode,
        "applicant_type": service.applicant_type,
        "status": status,
        "preliminary_eligible": preliminary_eligible,
        "message": message,
        "profile_note": profile_note,
        "disclaimer": service_disclaimer,
        "match_score": 100,
        "total_criteria_count": total_rules_count,
        "satisfied_criteria_count": total_rules_count,
        "requirements_satisfied": requirements_satisfied,
        "exclusions_checked": exclusions_checked,
        "exempt_criteria": exempt_criteria,
        "failed_requirements": [],
        "triggered_exclusions": [],
        "missing_information": [],
        "next_steps": next_steps,
        "exceptions_applied": exceptions_applied,
        "manual_verification_required": manual_verification_required,
        "manual_verification_details": manual_verification_details,
        "failed_rules": [],
        "passed_rules": passed_rules,
        "income_assessment": egrantz_income_eval if service.service_id == 11 else None
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
    requirements_satisfied = []
    failed_requirements = []

    # Check age_min
    if service.age_min is not None and service.age_min > 0:
        if user_age is None:
            missing_information.append({
                "field_name": "dob",
                "title": "Date of Birth",
                "rule_type": "REQUIREMENT",
                "description": "Date of birth",
                "reason": "Date of birth is required to calculate age"
            })
        elif user_age < service.age_min:
            failed_requirements.append({
                "field_name": "age",
                "title": "Minimum Age",
                "operator": ">=",
                "expected_value": service.age_min,
                "actual_value": user_age,
                "rule_type": "REQUIREMENT",
                "reason": f"Age must be at least {service.age_min} years (Current: {user_age})"
            })
        else:
            requirements_satisfied.append({
                "field_name": "age",
                "title": "Minimum Age",
                "operator": ">=",
                "expected_value": service.age_min,
                "actual_value": user_age,
                "rule_type": "REQUIREMENT",
                "description": f"Age is at least {service.age_min} years."
            })

    # Check age_max
    if service.age_max is not None and service.age_max < 120:
        if user_age is None:
            missing_information.append({
                "field_name": "dob",
                "title": "Date of Birth",
                "rule_type": "REQUIREMENT",
                "description": "Date of birth",
                "reason": "Date of birth is required to calculate age"
            })
        elif user_age > service.age_max:
            failed_requirements.append({
                "field_name": "age",
                "title": "Maximum Age",
                "operator": "<=",
                "expected_value": service.age_max,
                "actual_value": user_age,
                "rule_type": "REQUIREMENT",
                "reason": f"Age must be at most {service.age_max} years (Current: {user_age})"
            })
        else:
            requirements_satisfied.append({
                "field_name": "age",
                "title": "Maximum Age",
                "operator": "<=",
                "expected_value": service.age_max,
                "actual_value": user_age,
                "rule_type": "REQUIREMENT",
                "description": f"Age is at most {service.age_max} years."
            })

    # Check income_limit
    if service.income_limit is not None and service.income_limit < 99999999:
        if user_income is None:
            missing_information.append({
                "field_name": "annual_income",
                "title": "Annual Income",
                "rule_type": "REQUIREMENT",
                "description": "Annual income",
                "reason": "Annual income is required"
            })
        elif float(user_income) > float(service.income_limit):
            failed_requirements.append({
                "field_name": "annual_income",
                "title": "Income Limit",
                "operator": "<=",
                "expected_value": float(service.income_limit),
                "actual_value": float(user_income),
                "rule_type": "REQUIREMENT",
                "reason": f"Annual income (₹{float(user_income):,.2f}) exceeds limit of ₹{float(service.income_limit):,.2f}"
            })
        else:
            requirements_satisfied.append({
                "field_name": "annual_income",
                "title": "Income Limit",
                "operator": "<=",
                "expected_value": float(service.income_limit),
                "actual_value": float(user_income),
                "rule_type": "REQUIREMENT",
                "description": f"Annual income is within ₹{float(service.income_limit):,.2f} limit."
            })

    # Check state
    if service.state and service.state.strip().lower() not in ["all", "any", ""]:
        if not user_state:
            missing_information.append({
                "field_name": "state",
                "title": "State of Residence",
                "rule_type": "REQUIREMENT",
                "description": "State of residence",
                "reason": "State is required"
            })
        elif user_state.strip().lower() != service.state.strip().lower():
            failed_requirements.append({
                "field_name": "state",
                "title": "State of Residence",
                "operator": "==",
                "expected_value": service.state,
                "actual_value": user_state,
                "rule_type": "REQUIREMENT",
                "reason": f"Service is only available in {service.state} (Current: {user_state})"
            })
        else:
            requirements_satisfied.append({
                "field_name": "state",
                "title": "State of Residence",
                "operator": "==",
                "expected_value": service.state,
                "actual_value": user_state,
                "rule_type": "REQUIREMENT",
                "description": f"State matches {service.state}."
            })

    # Check occupation
    if service.occupation and service.occupation.strip().lower() not in ["all", "any", ""]:
        if not user_occupation:
            missing_information.append({
                "field_name": "occupation",
                "title": "Occupation",
                "rule_type": "REQUIREMENT",
                "description": "Occupation",
                "reason": "Occupation is required"
            })
        elif user_occupation.strip().lower() != service.occupation.strip().lower():
            failed_requirements.append({
                "field_name": "occupation",
                "title": "Occupation",
                "operator": "==",
                "expected_value": service.occupation,
                "actual_value": user_occupation,
                "rule_type": "REQUIREMENT",
                "reason": f"Service is only for {service.occupation} (Current: {user_occupation})"
            })
        else:
            requirements_satisfied.append({
                "field_name": "occupation",
                "title": "Occupation",
                "operator": "==",
                "expected_value": service.occupation,
                "actual_value": user_occupation,
                "rule_type": "REQUIREMENT",
                "description": f"Occupation matches {service.occupation}."
            })

    profile_note = generate_profile_note(user, service)
    service_disclaimer = get_service_disclaimer(service.service_id)
    passed_rules = list(requirements_satisfied)
    failed_rules = list(failed_requirements)

    if missing_information:
        return {
            "user_id": user.user_id,
            "service_id": service.service_id,
            "service_name": service.service_name,
            "eligibility_mode": service.eligibility_mode,
            "applicant_type": service.applicant_type,
            "status": "INFORMATION REQUIRED",
            "preliminary_eligible": False,
            "message": "Additional profile information is required to determine eligibility.",
            "profile_note": profile_note,
            "disclaimer": service_disclaimer,
            "requirements_satisfied": requirements_satisfied,
            "exclusions_checked": [],
            "failed_requirements": failed_requirements,
            "triggered_exclusions": [],
            "missing_information": missing_information,
            "next_steps": ["Update missing profile details to determine eligibility."],
            "failed_rules": failed_rules,
            "passed_rules": passed_rules
        }

    if failed_requirements:
        return {
            "user_id": user.user_id,
            "service_id": service.service_id,
            "service_name": service.service_name,
            "eligibility_mode": service.eligibility_mode,
            "applicant_type": service.applicant_type,
            "status": "NOT ELIGIBLE",
            "preliminary_eligible": False,
            "message": "The applicant does not satisfy all configured eligibility conditions.",
            "profile_note": profile_note,
            "disclaimer": service_disclaimer,
            "requirements_satisfied": requirements_satisfied,
            "exclusions_checked": [],
            "failed_requirements": failed_requirements,
            "triggered_exclusions": [],
            "missing_information": [],
            "next_steps": ["Review scheme profile criteria."],
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
        "preliminary_eligible": True,
        "message": "The applicant satisfies all configured eligibility conditions.",
        "profile_note": profile_note,
        "disclaimer": service_disclaimer,
        "requirements_satisfied": requirements_satisfied,
        "exclusions_checked": [],
        "failed_requirements": [],
        "triggered_exclusions": [],
        "missing_information": [],
        "next_steps": ["Proceed to the official government portal to submit application."],
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
            return evaluate_rules(user, service, rules, request.answers, db=db)
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

    return evaluate_rules(user, service, rules, request.answers, db=db)