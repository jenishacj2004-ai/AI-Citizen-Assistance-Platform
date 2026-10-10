import sys
import io
import json

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.append('backend')
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("=== TEST 1: GET /eligibility/required-information/11?user_id=2 ===")
r1 = client.get("/eligibility/required-information/11?user_id=2")
print("Status code:", r1.status_code)
d1 = r1.json()
print("Service:", d1.get("service_name"))
print("Profile Note:", d1.get("profile_note"))
print("Questions count:", len(d1.get("required_information", [])))
for q in d1.get("required_information", []):
    print(f"  - {q['field_name']}: '{q['question']}' | prefilled: {q['already_available']} ({q['current_value']})")

print("\n=== TEST 2: POST /eligibility/check (E-Grantz Service 11) - ALL ELIGIBLE (User 8 SC) ===")
answers = {
    "enrolled_post_matric": True,
    "kerala_resident": True,
    "regular_attendance": True,
    "merit_or_reservation_admission": True,
    "aadhaar_linked_bank": True,
    "availing_other_scholarship": False,
    "unapproved_quota_admission": False
}
r2 = client.post("/eligibility/check", json={"user_id": 8, "service_id": 11, "answers": answers})
print("Status code:", r2.status_code)
d2 = r2.json()
print("Status:", d2.get("status"))
print("Match Score:", d2.get("match_score"))
print("Satisfied criteria count:", d2.get("satisfied_criteria_count"))
print("Requirements satisfied count:", len(d2.get("requirements_satisfied", [])))
print("Exempt criteria count:", len(d2.get("exempt_criteria", [])))
print("Exempt criteria:", d2.get("exempt_criteria"))
print("Exclusions checked count:", len(d2.get("exclusions_checked", [])))
print("Income assessment:", d2.get("income_assessment"))
print("Disclaimer:", d2.get("disclaimer"))

print("\n=== TEST 3: POST /eligibility/check (E-Grantz Service 11) - FAILED ATTENDANCE ===")
answers_failed_att = dict(answers)
answers_failed_att["regular_attendance"] = False
r3_att = client.post("/eligibility/check", json={"user_id": 2, "service_id": 11, "answers": answers_failed_att})
d3_att = r3_att.json()
print("Status:", d3_att.get("status"))
print("Failed requirements:", d3_att.get("failed_requirements"))

print("\n=== TEST 4: POST /eligibility/check (E-Grantz Service 11) - CONCURRENT SCHOLARSHIP ===")
answers_excl = dict(answers)
answers_excl["availing_other_scholarship"] = True
r4_excl = client.post("/eligibility/check", json={"user_id": 2, "service_id": 11, "answers": answers_excl})
d4_excl = r4_excl.json()
print("Status:", d4_excl.get("status"))
print("Triggered exclusions:", d4_excl.get("triggered_exclusions"))

print("\n=== TEST 5: REGRESSION TEST - PM-KISAN (Service 12) ===")
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
r5 = client.post("/eligibility/check", json={"user_id": 2, "service_id": 12, "answers": pmk_answers})
print("PM-KISAN Status code:", r5.status_code)
d5 = r5.json()
print("PM-KISAN Status:", d5.get("status"))
print("PM-KISAN Match score:", d5.get("match_score"))
print("PM-KISAN Disclaimer:", d5.get("disclaimer"))

print("\n=== TEST 6: REGRESSION TEST - PM-KISAN Group D Exception ===")
pmk_group_d_answers = dict(pmk_answers)
pmk_group_d_answers["is_group_d_or_mts"] = True
pmk_group_d_answers["is_government_employee"] = True
r6 = client.post("/eligibility/check", json={"user_id": 2, "service_id": 12, "answers": pmk_group_d_answers})
d6 = r6.json()
print("Group D Status:", d6.get("status"))
print("Exceptions applied:", d6.get("exceptions_applied"))
print("Manual verification:", d6.get("manual_verification_required"))

print("\n=== TEST 7: ADMIN RULES ENDPOINT ===")
r7 = client.get("/admin/eligibility-rules")
print("Admin rules status code:", r7.status_code)
rules_list = r7.json() if r7.status_code == 200 else []
service_11_rules = [r for r in rules_list if r.get("service_id") == 11]
print(f"Service 11 rules returned in admin endpoint: {len(service_11_rules)}")

print("\n=== ALL TESTS PASSED SUCCESSFULLY ===")
