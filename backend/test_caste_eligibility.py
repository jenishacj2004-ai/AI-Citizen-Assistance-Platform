import sys
import io
import json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.append('backend')

from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
import models

client = TestClient(app)

print("=" * 70)
print("TESTING CASTE CERTIFICATE (SERVICE 2) EVALUATION & REGRESSION CHECKS")
print("=" * 70)

# TEST 1: GET /eligibility/required-information/2?user_id=8 (Rahul Joseph)
print("\n--- TEST 1: GET /eligibility/required-information/2?user_id=8 ---")
r1 = client.get("/eligibility/required-information/2?user_id=8")
assert r1.status_code == 200, f"Expected 200, got {r1.status_code}"
d1 = r1.json()
print("Service Name:", d1.get("service_name"))
print("Profile Note:", d1.get("profile_note"))
questions = d1.get("required_information", [])
print(f"Total questions count: {len(questions)}")
for q in questions:
    print(f"  - [{q['rule_type']}] {q['field_name']}: '{q['question']}'")
    print(f"    Help text: {q['help_text']}")
assert len(questions) == 5, f"Expected 5 questions, got {len(questions)}"
print("✓ TEST 1 PASSED: Required-information endpoint returns all 5 questions with official guidance.")

# TEST 2: POST /eligibility/check - ALL ELIGIBLE
print("\n--- TEST 2: POST /eligibility/check - ALL REQUIREMENTS SATISFIED ---")
eligible_answers = {
    "caste_details_declared": True,
    "supporting_caste_evidence": True,
    "kerala_residence_and_id_proof": True,
    "converted_without_gazette_notification": False,
    "competent_authority_verification": True
}
r2 = client.post("/eligibility/check", json={"user_id": 8, "service_id": 2, "answers": eligible_answers})
assert r2.status_code == 200
d2 = r2.json()
print(f"Status: {d2.get('status')}")
print(f"Match Score: {d2.get('match_score')}%")
print(f"Satisfied Criteria: {d2.get('satisfied_criteria_count')} / {d2.get('total_criteria_count')}")
print(f"Requirements Satisfied count: {len(d2.get('requirements_satisfied', []))}")
print(f"Exclusions Checked count: {len(d2.get('exclusions_checked', []))}")
assert d2.get("status") == "ELIGIBLE"
assert d2.get("match_score") == 100
assert len(d2.get("requirements_satisfied", [])) == 4
assert len(d2.get("exclusions_checked", [])) == 1
print("✓ TEST 2 PASSED: Eligible applicant returns ELIGIBLE with 100% score.")

# TEST 3: POST /eligibility/check - MISSING CASTE EVIDENCE
print("\n--- TEST 3: POST /eligibility/check - MISSING SUPPORTING CASTE EVIDENCE ---")
failed_evidence_answers = dict(eligible_answers)
failed_evidence_answers["supporting_caste_evidence"] = False
r3 = client.post("/eligibility/check", json={"user_id": 8, "service_id": 2, "answers": failed_evidence_answers})
assert r3.status_code == 200
d3 = r3.json()
print(f"Status: {d3.get('status')}")
print(f"Failed Requirements: {d3.get('failed_requirements')}")
assert d3.get("status") == "NOT ELIGIBLE"
failed_fields = [f["field_name"] for f in d3.get("failed_requirements", [])]
assert "supporting_caste_evidence" in failed_fields
print("✓ TEST 3 PASSED: Missing caste evidence fails correctly.")

# TEST 4: POST /eligibility/check - CONVERSION EXCLUSION TRIGGERED
print("\n--- TEST 4: POST /eligibility/check - CONVERTED WITHOUT GAZETTE NOTIFICATION ---")
conversion_excluded_answers = dict(eligible_answers)
conversion_excluded_answers["converted_without_gazette_notification"] = True
r4 = client.post("/eligibility/check", json={"user_id": 8, "service_id": 2, "answers": conversion_excluded_answers})
assert r4.status_code == 200
d4 = r4.json()
print(f"Status: {d4.get('status')}")
print(f"Triggered Exclusions: {d4.get('triggered_exclusions')}")
assert d4.get("status") == "NOT ELIGIBLE"
assert len(d4.get("triggered_exclusions", [])) == 1
assert d4["triggered_exclusions"][0]["field_name"] == "converted_without_gazette_notification"
print("✓ TEST 4 PASSED: Conversion exclusion triggered properly.")

# TEST 5: POST /eligibility/check - UNANSWERED / MISSING MANDATORY QUESTIONS
print("\n--- TEST 5: POST /eligibility/check - UNANSWERED QUESTIONS ---")
r5 = client.post("/eligibility/check", json={"user_id": 8, "service_id": 2, "answers": {}})
assert r5.status_code == 200
d5 = r5.json()
print(f"Status: {d5.get('status')}")
print(f"Missing Information count: {len(d5.get('missing_information', []))}")
assert d5.get("status") == "INFORMATION REQUIRED"
assert len(d5.get("missing_information", [])) == 5
print("✓ TEST 5 PASSED: Unanswered questions return INFORMATION REQUIRED.")

# TEST 6: REGRESSION CHECK - E-GRANTZ (SERVICE 11)
print("\n--- TEST 6: REGRESSION CHECK - E-GRANTZ SCHOLARSHIP (SERVICE 11) ---")
egrantz_answers = {
    "enrolled_post_matric": True,
    "kerala_resident": True,
    "regular_attendance": True,
    "merit_or_reservation_admission": True,
    "aadhaar_linked_bank": True,
    "availing_other_scholarship": False,
    "unapproved_quota_admission": False,
}
r6 = client.post("/eligibility/check", json={"user_id": 8, "service_id": 11, "answers": egrantz_answers})
assert r6.status_code == 200
d6 = r6.json()
print(f"E-Grantz User 8 Status: {d6.get('status')} | Match score: {d6.get('match_score')}%")
print(f"Exempt Criteria: {d6.get('exempt_criteria')}")
assert d6.get("status") == "ELIGIBLE"
assert d6.get("match_score") == 100
assert len(d6.get("exempt_criteria", [])) == 1
print("✓ TEST 6 PASSED: E-Grantz profile income evaluation remains 100% operational.")

# TEST 7: REGRESSION CHECK - PM-KISAN (SERVICE 12)
print("\n--- TEST 7: REGRESSION CHECK - PM-KISAN (SERVICE 12) ---")
pmk_answers = {
    "landholder": True,
    "aadhaar_verified": True,
    "ekyc_verified": True,
    "income_tax_payer": False,
    "institutional_landholder": False,
    "constitutional_post_holder": False,
    "public_representative": False,
    "government_employee_non_group_d": False,
    "pensioner_monthly_10000_above_non_group_d": False,
    "registered_professional": False
}
r7 = client.post("/eligibility/check", json={"user_id": 8, "service_id": 12, "answers": pmk_answers})
assert r7.status_code == 200
d7 = r7.json()
print(f"PM-KISAN Status: {d7.get('status')} | Match score: {d7.get('match_score')}%")
assert d7.get("status") == "ELIGIBLE"
assert d7.get("match_score") == 100
print("✓ TEST 7 PASSED: PM-KISAN eligibility logic remains 100% operational.")

# TEST 8: VERIFY COMMUNITY CERTIFICATE (SERVICE 5) UNMODIFIED
print("\n--- TEST 8: VERIFY COMMUNITY CERTIFICATE (SERVICE 5) UNMODIFIED ---")
db = SessionLocal()
s5_rules = db.query(models.ServiceEligibilityRule).filter(models.ServiceEligibilityRule.service_id == 5).count()
print(f"Service 5 rules count in MySQL: {s5_rules}")
assert s5_rules == 0
db.close()
print("✓ TEST 8 PASSED: Community Certificate (Service 5) is completely distinct and untouched.")

print("\n" + "=" * 70)
print("ALL CASTE CERTIFICATE & REGRESSION TESTS PASSED SUCCESSFULLY!")
print("=" * 70)
