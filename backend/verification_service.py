import re
from difflib import SequenceMatcher


def normalize_text(text):
    if not text:
        return ""

    text = str(text).lower()

    # Remove punctuation
    text = re.sub(r"[^a-z0-9\s]", " ", text)

    # Remove extra spaces
    text = re.sub(r"\s+", " ", text)

    return text.strip()


def verify_name(profile_name, extracted_name):
    """
    Compare citizen's registered name
    with the name extracted using OCR.
    """

    if not profile_name or not extracted_name:
        return False

    profile = normalize_text(profile_name)
    extracted = normalize_text(extracted_name)

    # Exact match
    if profile == extracted:
        return True

    # Allow minor OCR spelling differences
    similarity = SequenceMatcher(
        None,
        profile,
        extracted
    ).ratio()

    return similarity >= 0.80


def verify_dob(profile_dob, extracted_dob):
    """
    Compare registered DOB with OCR DOB.
    """

    if not profile_dob or not extracted_dob:
        return False

    # SQLAlchemy Date -> YYYY-MM-DD
    profile_dob = str(profile_dob)

    try:
        year, month, day = profile_dob.split("-")
    except ValueError:
        return False

    extracted = extracted_dob.strip()

    possible_formats = [
        f"{day}/{month}/{year}",
        f"{day}-{month}-{year}",
        f"{day}.{month}.{year}",
    ]

    return extracted in possible_formats


def verify_address(
    profile_district,
    profile_state,
    extracted_address
):
    """
    Check whether the citizen's district and state
    appear in the OCR extracted address.
    """

    if not extracted_address:
        return False

    address = normalize_text(extracted_address)

    district = normalize_text(profile_district)
    state = normalize_text(profile_state)

    district_match = district in address if district else False
    state_match = state in address if state else False

    # Both should match
    return district_match and state_match


def verify_document(
    user,
    extracted_name,
    extracted_dob,
    extracted_address
):
    """
    Perform complete document verification.
    """

    name_match = verify_name(
        user.full_name,
        extracted_name
    )

    dob_match = verify_dob(
        user.dob,
        extracted_dob
    )

    address_match = verify_address(
        user.district,
        user.state,
        extracted_address
    )

    # Store individual results
    details = {
        "name": name_match,
        "dob": dob_match,
        "address": address_match
    }

    # Find failed fields
    failed_fields = [
        field
        for field, matched in details.items()
        if not matched
    ]

    # Everything matched
    if not failed_fields:

        return {
            "status": "Verified",
            "reason": (
                "Document information matches "
                "the citizen profile."
            ),
            "details": details
        }

    # Something didn't match
    return {
        "status": "Rejected",
        "reason": (
            "Document information does not match "
            "the citizen profile: "
            + ", ".join(failed_fields)
        ),
        "details": details
    }