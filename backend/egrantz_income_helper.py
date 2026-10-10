"""
Kerala E-Grantz 3.0 Income Eligibility Evaluation Helper

Official Scheme Reference & Configured Rules:
- Scheme: Post-Matric Educational Assistance / Scholarship under Kerala E-Grantz 3.0 (egrantz.kerala.gov.in).
- SC / ST Categories:
    Under official Scheduled Castes Development Department and Scheduled Tribes Development Department guidelines,
    SC and ST students have NO annual family income ceiling for post-matric educational assistance / fee concessions.
    The income criterion is evaluated as CATEGORY EXEMPT (Not Applicable).
- OEC Category:
    Under Backward Classes Development Department (BCDD), Kerala (G.O.(Ms) No. 10/2014/BCDD and related orders),
    students belonging to Other Eligible Communities (OEC) and eligible equivalent communities have an
    annual family income ceiling of up to ₹6,00,000.
- OBC & General (EBC) Categories:
    Post-matric fee concessions for Other Backward Classes (OBC) and General / Economically Backward Communities (EBC)
    are subject to an annual family income ceiling not exceeding ₹1,00,000.
- Missing / Unsupported Category or Income:
    If category or income is missing, or if category is unsupported (e.g. 'Other'),
    the evaluation returns an unresolved outcome (INFORMATION REQUIRED / MANUAL VERIFICATION REQUIRED)
    rather than automatically passing or inventing an income ceiling.

Note:
These criteria are configured specifically for the applicable Post-Matric Scholarship Scheme.
Criteria may differ across other specific departmental notifications or pre-matric assistance schemes.
"""

from typing import Optional, Any, Dict

# Configurable category-specific annual income ceilings (in INR)
EGRANTZ_INCOME_CEILINGS: Dict[str, Optional[float]] = {
    "SC": None,       # Category exempt - no income ceiling
    "ST": None,       # Category exempt - no income ceiling
    "OEC": 600000.0,  # ₹6,00,000 per annum
    "OBC": 100000.0,  # ₹1,00,000 per annum
    "GENERAL": 100000.0, # ₹1,00,000 per annum
}

# Normalization map for community categories
CATEGORY_CANONICAL_MAP: Dict[str, str] = {
    "SC": "SC",
    "SCHEDULED CASTE": "SC",
    "SCHEDULED CASTES": "SC",
    "ST": "ST",
    "SCHEDULED TRIBE": "ST",
    "SCHEDULED TRIBES": "ST",
    "OEC": "OEC",
    "OTHER ELIGIBLE COMMUNITIES": "OEC",
    "OTHER ELIGIBLE COMMUNITY": "OEC",
    "OBC": "OBC",
    "OTHER BACKWARD CLASSES": "OBC",
    "OTHER BACKWARD CLASS": "OBC",
    "OTHER BACKWARD COMMUNITY": "OBC",
    "OTHER BACKWARD COMMUNITIES": "OBC",
    "GENERAL": "General",
    "GEN": "General",
    "EBC": "General",
    "ECONOMICALLY BACKWARD": "General",
    "ECONOMICALLY BACKWARD CLASS": "General",
    "FORWARD COMMUNITY": "General",
    "FC": "General",
}


def normalize_category(category: Optional[str]) -> Optional[str]:
    """
    Normalizes category string to canonical form ('SC', 'ST', 'OEC', 'OBC', 'General'),
    or returns trimmed string if non-standard, or None if missing.
    """
    if category is None:
        return None
    cleaned = str(category).strip()
    if not cleaned:
        return None
    return CATEGORY_CANONICAL_MAP.get(cleaned.upper(), cleaned)


def evaluate_egrantz_income(
    category: Optional[str],
    annual_income: Optional[Any]
) -> Dict[str, Any]:
    """
    Evaluate profile-based income eligibility for Kerala E-Grantz 3.0 Post-Matric Assistance.

    Returns a structured dictionary:
        - status: 'EXEMPT' | 'PASSED' | 'FAILED' | 'INFORMATION_REQUIRED' | 'MANUAL_VERIFICATION_REQUIRED'
        - is_eligible: True | False | None (None if unresolved)
        - is_exempt: bool (True only for SC/ST category exemption)
        - category: str (canonical category name or raw category)
        - annual_income: float | None
        - income_ceiling: float | None
        - applicable_ceiling: str | None
        - assessment_status: user-facing status label
        - criterion_status: 'NOT APPLICABLE — category exempt' | 'Satisfied' | 'Failed' | 'Information Required'
        - explanation: detailed explanation of the evaluation outcome
        - action_needed: corrective action if failed or information required
    """
    # 1. Validate community category
    if category is None or str(category).strip() == "":
        parsed_income = None
        if annual_income is not None and str(annual_income).strip() != "":
            try:
                parsed_income = float(annual_income)
            except (ValueError, TypeError):
                pass

        return {
            "status": "INFORMATION_REQUIRED",
            "is_eligible": None,
            "is_exempt": False,
            "category": None,
            "annual_income": parsed_income,
            "income_ceiling": None,
            "applicable_ceiling": None,
            "assessment_status": "INFORMATION REQUIRED",
            "criterion_status": "Information Required",
            "explanation": "Community category is missing from user profile. Category is required to determine applicable E-Grantz income ceiling or exemption.",
            "action_needed": "Update community category in your profile."
        }

    raw_cat = str(category).strip()
    canonical_cat = normalize_category(raw_cat)
    cat_upper = canonical_cat.upper() if canonical_cat else ""

    # Check for unsupported categories
    if cat_upper not in ("SC", "ST", "OEC", "OBC", "GENERAL"):
        parsed_income = None
        if annual_income is not None and str(annual_income).strip() != "":
            try:
                parsed_income = float(annual_income)
            except (ValueError, TypeError):
                pass

        return {
            "status": "MANUAL_VERIFICATION_REQUIRED",
            "is_eligible": None,
            "is_exempt": False,
            "category": raw_cat,
            "annual_income": parsed_income,
            "income_ceiling": None,
            "applicable_ceiling": None,
            "assessment_status": "MANUAL VERIFICATION REQUIRED",
            "criterion_status": "Manual Verification Required",
            "explanation": f"Community category '{raw_cat}' is not covered under standard configured E-Grantz automated ceilings (SC/ST/OEC/OBC/General). Manual verification by scholarship nodal officer is required.",
            "action_needed": "Manual verification of community category and income certificate by the institution or scholarship nodal officer is required."
        }

    # 2. Parse annual income
    parsed_income = None
    if annual_income is not None and str(annual_income).strip() != "":
        try:
            parsed_income = float(annual_income)
        except (ValueError, TypeError):
            parsed_income = None

    if parsed_income is None:
        applicable_ceiling = "No income ceiling (category exempt)" if cat_upper in ("SC", "ST") else (
            f"₹{EGRANTZ_INCOME_CEILINGS[cat_upper]:,.0f}" if cat_upper in EGRANTZ_INCOME_CEILINGS and EGRANTZ_INCOME_CEILINGS[cat_upper] else None
        )
        return {
            "status": "INFORMATION_REQUIRED",
            "is_eligible": None,
            "is_exempt": False,
            "category": canonical_cat,
            "annual_income": None,
            "income_ceiling": EGRANTZ_INCOME_CEILINGS.get(cat_upper),
            "applicable_ceiling": applicable_ceiling,
            "assessment_status": "INFORMATION REQUIRED",
            "criterion_status": "Information Required",
            "explanation": "Annual family income is missing from user profile. Income details are required to evaluate eligibility.",
            "action_needed": "Update annual family income in your profile."
        }

    # 3. SC / ST Category: Verified Exemption (No Income Ceiling)
    if cat_upper in ("SC", "ST"):
        return {
            "status": "EXEMPT",
            "is_eligible": True,
            "is_exempt": True,
            "category": canonical_cat,
            "annual_income": parsed_income,
            "income_ceiling": None,
            "applicable_ceiling": "No income ceiling (category exempt)",
            "assessment_status": "NOT APPLICABLE — category exempt",
            "criterion_status": "NOT APPLICABLE — category exempt",
            "explanation": f"No income ceiling applies to {canonical_cat} students under configured Kerala E-Grantz post-matric assistance rules (category exempt).",
            "action_needed": None
        }

    # 4. OEC / OBC / General Categories: Compare against configured ceiling
    ceiling = EGRANTZ_INCOME_CEILINGS.get(cat_upper)
    ceiling_display = f"₹{ceiling:,.0f}" if ceiling is not None else "Not specified"

    if parsed_income <= ceiling:
        return {
            "status": "PASSED",
            "is_eligible": True,
            "is_exempt": False,
            "category": canonical_cat,
            "annual_income": parsed_income,
            "income_ceiling": ceiling,
            "applicable_ceiling": ceiling_display,
            "assessment_status": "PASSED",
            "criterion_status": "Satisfied",
            "explanation": f"Annual family income of ₹{parsed_income:,.2f} is within the {ceiling_display} ceiling applicable to {canonical_cat} under configured post-matric guidelines.",
            "action_needed": None
        }
    else:
        return {
            "status": "FAILED",
            "is_eligible": False,
            "is_exempt": False,
            "category": canonical_cat,
            "annual_income": parsed_income,
            "income_ceiling": ceiling,
            "applicable_ceiling": ceiling_display,
            "assessment_status": "FAILED",
            "criterion_status": "Failed",
            "explanation": f"Annual family income of ₹{parsed_income:,.2f} exceeds the {ceiling_display} ceiling applicable to {canonical_cat} under configured scheme guidelines.",
            "action_needed": f"Annual family income exceeds the {ceiling_display} ceiling prescribed for {canonical_cat} post-matric assistance under configured rules."
        }
