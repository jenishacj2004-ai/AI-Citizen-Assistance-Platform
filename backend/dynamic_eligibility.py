from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
from datetime import date

import models
from database import get_db
from egrantz_income_helper import evaluate_egrantz_income

router = APIRouter(
    prefix="/eligibility",
    tags=["Dynamic Eligibility"]
)


def calculate_age(dob):
    if not dob:
        return None
    today = date.today()
    age = today.year - dob.year
    if (today.month, today.day) < (dob.month, dob.day):
        age -= 1
    return age


# Mapping of well-known official PM-KISAN & e-governance field names to understandable citizen questions
KNOWN_FIELD_QUESTIONS = {
    "landholder": {
        "question": "Do you or your family own cultivable agricultural land?",
        "help_text": "The applicant farmer family must hold cultivable land in State/UT land records (Bhulekh / ROR).",
        "input_type": "boolean",
    },
    "aadhaar_verified": {
        "question": "Is your Aadhaar verified and linked with your bank account?",
        "help_text": "Aadhaar verification is mandatory for Direct Benefit Transfer (DBT) under PM-KISAN.",
        "input_type": "boolean",
    },
    "ekyc_verified": {
        "question": "Have you completed mandatory eKYC verification?",
        "help_text": "eKYC is mandatory via OTP, biometric, or facial recognition on the official PM-KISAN portal.",
        "input_type": "boolean",
    },
    "income_tax_payer": {
        "question": "Did you or any member of your family pay income tax in the last assessment year?",
        "help_text": "Persons who paid income tax in the last assessment year fall under the official exclusion category.",
        "input_type": "boolean",
    },
    "institutional_landholder": {
        "question": "Is the cultivable land held by an institution, trust, or organization?",
        "help_text": "All institutional landholders are excluded from receiving PM-KISAN benefits.",
        "input_type": "boolean",
    },
    "constitutional_post_holder": {
        "question": "Are you or any family member a former or present holder of a constitutional post?",
        "help_text": "Former and present holders of constitutional posts (e.g., President, Governor, High/Supreme Court Judges) are excluded.",
        "input_type": "boolean",
    },
    "public_representative": {
        "question": "Are you or any family member a former or present Minister, MP, MLA, MLC, Mayor, or District Panchayat Chairperson?",
        "help_text": "Former and present public representatives holding these specified offices are excluded.",
        "input_type": "boolean",
    },
    "government_employee_non_group_d": {
        "question": "Are you or any family member a serving or retired government/PSU/local body employee (excluding Class IV / Group D / MTS)?",
        "help_text": "Official Exception: Multi-Tasking Staff (MTS), Class IV, and Group D employees are ELIGIBLE and exempt from this exclusion.",
        "input_type": "boolean",
    },
    "government_employee": {
        "question": "Are you or any family member a serving or retired government/PSU/local body employee (excluding Class IV / Group D / MTS)?",
        "help_text": "Official Exception: Multi-Tasking Staff (MTS), Class IV, and Group D employees are ELIGIBLE and exempt from this exclusion.",
        "input_type": "boolean",
    },
    "pensioner_monthly_10000_above_non_group_d": {
        "question": "Are you or any family member a retired pensioner with a monthly pension of ₹10,000 or more (excluding Class IV / Group D / MTS)?",
        "help_text": "Official Exception: Pensioners receiving under ₹10,000/month, and all Class IV / Group D / MTS pensioners are ELIGIBLE and exempt.",
        "input_type": "boolean",
    },
    "pensioner_above_10000": {
        "question": "Are you or any family member a retired pensioner with a monthly pension of ₹10,000 or more (excluding Class IV / Group D / MTS)?",
        "help_text": "Official Exception: Pensioners receiving under ₹10,000/month, and all Class IV / Group D / MTS pensioners are ELIGIBLE and exempt.",
        "input_type": "boolean",
    },
    "registered_professional": {
        "question": "Are you a Doctor, Engineer, Lawyer, Chartered Accountant, or Architect registered with a professional body and undertaking practice?",
        "help_text": "Registered professionals carrying out practice are covered under the official exclusion category.",
        "input_type": "boolean",
    },
    # E-Grantz 3.0 Scholarship (Kerala) Fields
    "kerala_resident": {
        "question": "Are you a permanent resident (domicile) of Kerala?",
        "help_text": "E-Grantz scholarships are provided by the Government of Kerala for students residing in Kerala.",
        "input_type": "boolean",
    },
    "enrolled_post_matric": {
        "question": "Are you enrolled in an approved Post-Matric course (Higher Secondary / Diploma / Degree / PG / Professional) in a recognized institution?",
        "help_text": "The course and institution must be approved by the relevant University, Board, or Government department for E-Grantz assistance.",
        "input_type": "boolean",
    },
    "regular_attendance": {
        "question": "Do you maintain a minimum of 75% monthly attendance in your enrolled course?",
        "help_text": "As per E-Grantz 3.0 norms, students must maintain at least 75% attendance certified by the head of the institution.",
        "input_type": "boolean",
    },
    "merit_or_reservation_admission": {
        "question": "Was your admission secured under merit quota or recognized government reservation quota?",
        "help_text": "Students admitted under approved merit or reservation quotas are eligible for fee concession and assistance.",
        "input_type": "boolean",
    },
    "aadhaar_linked_bank": {
        "question": "Do you have an active bank account in your name seeded and linked with Aadhaar?",
        "help_text": "Disbursement of scholarship and fee concession under E-Grantz is made via Direct Benefit Transfer (DBT) to the student's Aadhaar-linked bank account.",
        "input_type": "boolean",
    },
    "income_limit_verified": {
        "question": "Is your annual family income within the ceiling applicable to your category (SC/ST: No limit; OEC: up to ₹6 Lakh; OBC/General: up to ₹1 Lakh)?",
        "help_text": "SC/ST students have no income limit. OEC has a ₹6,00,000 ceiling. OBC and General/EBC students must have an annual family income not exceeding ₹1,00,000.",
        "input_type": "boolean",
    },
    "availing_other_scholarship": {
        "question": "Are you currently availing any other government scholarship or financial stipend for the same course?",
        "help_text": "Students cannot simultaneously receive financial assistance from another government scholarship scheme for the same academic program.",
        "input_type": "boolean",
    },
    "unapproved_quota_admission": {
        "question": "Was your admission through an unapproved management / NRI quota seat without government merit allotment?",
        "help_text": "Admissions in unapproved management seats without merit allotment are excluded from government fee concessions.",
        "input_type": "boolean",
    },
    # Caste Certificate (Kerala e-District - Service ID 2) Fields
    "caste_details_declared": {
        "question": "Do you belong to and declare a recognized caste/community specified under Kerala Government or Presidential Orders?",
        "help_text": "Applicants must claim and declare a recognized caste/community (e.g., Scheduled Caste, Scheduled Tribe, or other notified state caste) eligible for certificate issuance.",
        "input_type": "boolean",
    },
    "supporting_caste_evidence": {
        "question": "Do you possess supporting documentary proof of your caste (such as SSLC / school records with caste entry or caste certificate of parents/siblings)?",
        "help_text": "Attested copy of school leaving certificate/SSLC showing caste, or a caste certificate of father/mother/blood relative is mandatory on Kerala e-District.",
        "input_type": "boolean",
    },
    "kerala_residence_and_id_proof": {
        "question": "Do you have valid proof of identity and local residence in Kerala (such as Ration Card, Aadhaar, or Voter ID)?",
        "help_text": "Proof of identity and residence within the jurisdiction of the concerned Village Office is required on Kerala e-District.",
        "input_type": "boolean",
    },
    "converted_without_gazette_notification": {
        "question": "Did you or your family undergo religious conversion without an official Kerala Gazette notification or conversion certificate?",
        "help_text": "Statutory Exclusion: If religious conversion took place, an official Kerala Gazette notification and conversion certificate are legally required.",
        "input_type": "boolean",
    },
    "competent_authority_verification": {
        "question": "Do you consent and agree to mandatory local enquiry and field verification by the competent revenue authority (Village Officer / Tahsildar)?",
        "help_text": "Caste Certificates are issued only after verification and enquiry clearance by the competent revenue authority (Village Officer / Tahsildar).",
        "input_type": "boolean",
    },
}


def derive_question(field_name: str, description: Optional[str], rule_type: str) -> Dict[str, Any]:
    norm_field = field_name.strip().lower()
    if norm_field in KNOWN_FIELD_QUESTIONS:
        info = KNOWN_FIELD_QUESTIONS[norm_field]
        return {
            "question": info["question"],
            "help_text": info["help_text"],
            "input_type": info["input_type"]
        }

    # If description is provided and formatted
    if description and description.strip():
        desc = description.strip()
        if desc.endswith("?"):
            q_text = desc
        elif rule_type.upper() == "EXCLUSION":
            q_text = f"Does the applicant fall under: {desc}?"
        else:
            q_text = f"Does the applicant satisfy: {desc}?"
        return {
            "question": q_text,
            "help_text": desc,
            "input_type": "boolean"
        }

    # Fallback based on field name
    friendly_name = field_name.replace("_", " ").title()
    if rule_type.upper() == "EXCLUSION":
        q_text = f"Are you subject to the {friendly_name} exclusion?"
    else:
        q_text = f"Do you satisfy the requirement for {friendly_name}?"

    return {
        "question": q_text,
        "help_text": None,
        "input_type": "boolean"
    }


@router.get("/required-information/{service_id}")
def get_required_information(
    service_id: int,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    service = db.query(models.GovernmentService).filter(
        models.GovernmentService.service_id == service_id
    ).first()

    if not service:
        raise HTTPException(
            status_code=404,
            detail="Service not found"
        )

    rules = db.query(models.ServiceEligibilityRule).filter(
        models.ServiceEligibilityRule.service_id == service_id
    ).order_by(models.ServiceEligibilityRule.rule_id).all()

    # If user_id provided, extract available profile data and document status
    profile_data = {}
    if user_id:
        user = db.query(models.User).filter(models.User.user_id == user_id).first()
        if user:
            profile_data = {
                "user_id": user.user_id,
                "full_name": user.full_name,
                "gender": user.gender,
                "dob": str(user.dob) if user.dob else None,
                "age": calculate_age(user.dob),
                "category": user.category,
                "state": user.state,
                "district": user.district,
                "occupation": user.occupation,
                "annual_income": float(user.annual_income) if user.annual_income is not None else None,
            }

            # Check if user has verified Aadhaar document
            aadhaar_doc = db.query(models.Document).filter(
                models.Document.user_id == user_id,
                models.Document.verification_status == "Verified"
            ).first()
            if aadhaar_doc and "aadhaar" in (aadhaar_doc.document_name or "").lower():
                profile_data["aadhaar_verified"] = True

    required_information = []

    for rule in rules:
        norm_field = rule.field_name.strip().lower()

        # For Kerala E-Grantz (Service 11), income eligibility is computed server-side
        # from profile data (category & annual_income). Exclude the redundant citizen question.
        if service_id == 11 and norm_field == "income_limit_verified":
            continue

        meta = derive_question(rule.field_name, rule.description, rule.rule_type)

        # Check if already available from citizen profile
        already_available = False
        current_value = None
        source = None

        if norm_field in profile_data and profile_data[norm_field] is not None:
            already_available = True
            current_value = profile_data[norm_field]
            source = "citizen_profile"
        elif norm_field in ("aadhaar_verified", "aadhaar_linked_bank") and profile_data.get("aadhaar_verified") is True:
            already_available = True
            current_value = True
            source = "verified_documents"
        elif norm_field == "kerala_resident" and profile_data.get("state") and profile_data.get("state").strip().lower() == "kerala":
            already_available = True
            current_value = True
            source = "citizen_profile"

        options = [
            {"label": "Yes", "value": True},
            {"label": "No", "value": False}
        ] if meta["input_type"] == "boolean" else None

        required_information.append({
            "rule_id": rule.rule_id,
            "field_name": rule.field_name,
            "question": meta["question"],
            "description": rule.description,
            "rule_type": rule.rule_type,
            "operator": rule.operator,
            "expected_value": rule.rule_value,
            "logical_group": rule.logical_group,
            "input_type": meta["input_type"],
            "options": options,
            "help_text": meta["help_text"],
            "already_available": already_available,
            "current_value": current_value,
            "source": source
        })

    # Generate data-driven scheme-aware profile context note
    user_occ = profile_data.get("occupation") if profile_data else None
    user_cat = profile_data.get("category") if profile_data else None
    user_inc = profile_data.get("annual_income") if profile_data else None

    income_assessment = None
    if service_id == 11:
        # Calculate income eligibility server-side from profile data
        income_eval = evaluate_egrantz_income(user_cat, user_inc)
        income_assessment = {
            "category": income_eval.get("category") or user_cat,
            "annual_income": income_eval.get("annual_income"),
            "applicable_ceiling": income_eval.get("applicable_ceiling"),
            "assessment_status": income_eval.get("assessment_status"),
            "explanation": income_eval.get("explanation"),
        }

        cat_str = user_cat or "Not specified"
        inc_str = f"₹{user_inc:,.2f}" if user_inc is not None else "Not specified"
        profile_note = (
            f"Your profile lists your category as {cat_str} with an annual income of {inc_str}. "
            f"Under Kerala E-Grantz 3.0 guidelines, SC/ST students have no income ceiling for post-matric assistance (category exempt), "
            f"OEC students have an income ceiling up to ₹6,00,000, and OBC/General students have a ₹1,00,000 annual income ceiling. "
            f"The assessment also evaluates approved course enrollment, 75% monthly attendance, merit/reservation admission, and Aadhaar-linked DBT bank account."
        )
    elif service_id == 12:
        # PM-KISAN Context
        if user_occ:
            profile_note = (
                f"Your profile lists your occupation as {user_occ}. This information alone does not establish "
                f"{service.service_name} eligibility. The assessment also considers landholding, mandatory "
                f"verification, and applicable exclusion conditions."
            )
        else:
            profile_note = (
                f"Preliminary assessment for {service.service_name} considers cultivable landholding, mandatory "
                f"verification, and applicable exclusion conditions."
            )
    elif service_id == 2:
        # Caste Certificate (Kerala e-District) Context
        cat_str = user_cat or "Not specified"
        profile_note = (
            f"Your profile lists your category as {cat_str}. Profile category alone does not establish eligibility or automatically "
            f"grant a Caste Certificate. Under Kerala e-District rules, you must declare your specific recognized caste, provide "
            f"documentary caste evidence (e.g., school/parent records), furnish valid Kerala residence proof, and obtain verification "
            f"clearance from the competent revenue authority."
        )
    else:
        if user_occ:
            profile_note = (
                f"Your profile lists your occupation as {user_occ}. This information alone does not establish "
                f"{service.service_name} eligibility. The assessment also considers configured criteria and applicable conditions."
            )
        else:
            profile_note = (
                f"Preliminary assessment for {service.service_name} considers configured scheme criteria and applicable exclusion conditions."
            )

    response_data = {
        "service_id": service.service_id,
        "service_name": service.service_name,
        "eligibility_mode": service.eligibility_mode,
        "profile_note": profile_note,
        "required_information": required_information,
        "profile_summary": profile_data if profile_data else None
    }

    if service_id == 11:
        response_data["income_assessment"] = income_assessment

    return response_data