"""
Comprehensive Verification Test Suite for E-Grantz Profile-Based Income Eligibility (Service ID 11)
and Platform Regressions (PM-KISAN Service ID 12 and API Routes).
"""

import sys
import io
import json
from datetime import date
from typing import Optional, Any

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.append('backend')

from fastapi.testclient import TestClient
from main import app
from database import SessionLocal, get_db
import models
from eligibility_checker import evaluate_rules, evaluate_egrantz_income

client = TestClient(app)

class MockUser:
    """Mock User fixture that behaves like models.User for in-memory tests."""
    def __init__(self, user_id, full_name, category, annual_income, dob=date(2002, 5, 15), occupation="Student", state="Kerala", district="Ernakulam", gender="Male"):
        self.user_id = user_id
        self.full_name = full_name
        self.gender = gender
        self.category = category
        self.annual_income = annual_income
        self.dob = dob
        self.occupation = occupation
        self.state = state
        self.district = district
        self.role = "Citizen"


def run_tests():
    db = SessionLocal()
    temp_user_ids = []

    try:
        print("=" * 70)
        print("RUNNING E-GRANTZ PROFILE-BASED INCOME ELIGIBILITY VERIFICATION SUITE")
        print("=" * 70)

        # Standard non-income answers for E-Grantz Service 11
        standard_egrantz_answers = {
            "enrolled_post_matric": True,
            "kerala_resident": True,
            "regular_attendance": True,
            "merit_or_reservation_admission": True,
            "aadhaar_linked_bank": True,
            "availing_other_scholarship": False,
            "unapproved_quota_admission": False,
        }

        # Helper to create temporary user in real DB
        def create_temp_db_user(full_name, category, annual_income):
            u = models.User(
                full_name=full_name,
                email=f"{full_name.lower().replace(' ', '_')}_{len(temp_user_ids)}@test.local",
                password="testpassword",
                phone="9876543210",
                gender="Male",
                dob=date(2001, 1, 1),
                category=category,
                state="Kerala",
                district="Ernakulam",
                occupation="Student",
                annual_income=annual_income,
                role="Citizen"
            )
            db.add(u)
            db.commit()
            db.refresh(u)
            temp_user_ids.append(u.user_id)
            return u

        # Temporary real DB users for OBC tests
        u_obc_90k = create_temp_db_user("Temp OBC 90k", "OBC", 90000.0)
        u_obc_150k = create_temp_db_user("Temp OBC 150k", "OBC", 150000.0)

        # Mock fixtures for OEC and edge cases
        mock_registry = {
            901: MockUser(901, "Test OEC 500k", "OEC", 500000.0),
            902: MockUser(902, "Test OEC 700k", "OEC", 700000.0),
            903: MockUser(903, "Test Missing Income", "OBC", None),
            904: MockUser(904, "Test Missing Category", None, 50000.0),
            905: MockUser(905, "Test Unsupported Cat", "OtherCategory", 50000.0),
        }

        # Setup dependency override for mock users while keeping real DB for everything else
        def override_get_db():
            test_db = SessionLocal()
            class InterceptingSession:
                def __init__(self, s):
                    self._s = s
                def query(self, model, *args, **kwargs):
                    q = self._s.query(model, *args, **kwargs)
                    if model == models.User:
                        orig_filter = q.filter
                        def custom_filter(*f_args, **f_kwargs):
                            filtered = orig_filter(*f_args, **f_kwargs)
                            orig_first = filtered.first
                            def custom_first():
                                # Inspect if user_id filter matches our mock registry
                                for clause in f_args:
                                    if hasattr(clause, 'right') and hasattr(clause.right, 'value'):
                                        uid = clause.right.value
                                        if uid in mock_registry:
                                            return mock_registry[uid]
                                return orig_first()
                            filtered.first = custom_first
                            return filtered
                        q.filter = custom_filter
                    return q
                def close(self):
                    self._s.close()
                def __getattr__(self, name):
                    return getattr(self._s, name)
            session_wrapper = InterceptingSession(test_db)
            try:
                yield session_wrapper
            finally:
                session_wrapper.close()

        app.dependency_overrides[get_db] = override_get_db

        # =============================================================
        # TEST 1: SC category with income ₹85,000 (User ID 8 / Rahul Joseph)
        # Apply verified exemption; no income question should appear.
        # =============================================================
        print("\n--- TEST 1: SC category with income ₹85,000 (User 8 - Rahul Joseph) ---")
        r1_req = client.get("/eligibility/required-information/11?user_id=8")
        assert r1_req.status_code == 200, f"Expected 200, got {r1_req.status_code}"
        d1_req = r1_req.json()
        
        # Verify no income_limit_verified in required_information questions
        req_fields = [q["field_name"] for q in d1_req.get("required_information", [])]
        print(f"Citizen-facing required questions count: {len(req_fields)}")
        print(f"Questions: {req_fields}")
        assert "income_limit_verified" not in req_fields, "FAIL: income_limit_verified found in required_information questions!"
        print("✓ Verified: income_limit_verified is EXCLUDED from citizen questionnaire.")
        
        # Verify income_assessment summary is present
        inc_summary = d1_req.get("income_assessment")
        assert inc_summary is not None, "FAIL: income_assessment summary missing from response"
        print(f"Income Assessment Summary: {inc_summary}")
        assert inc_summary.get("assessment_status") == "NOT APPLICABLE — category exempt"
        print("✓ Verified: Income assessment reports 'NOT APPLICABLE — category exempt'.")

        # Evaluate eligibility check for User 8
        r1_check = client.post("/eligibility/check", json={
            "user_id": 8,
            "service_id": 11,
            "answers": standard_egrantz_answers
        })
        assert r1_check.status_code == 200
        d1_check = r1_check.json()
        print(f"Eligibility Check Status: {d1_check.get('status')}")
        print(f"Match Score: {d1_check.get('match_score')}%")
        print(f"Satisfied criteria count: {d1_check.get('satisfied_criteria_count')} / {d1_check.get('total_criteria_count')}")
        print(f"Exempt Criteria: {d1_check.get('exempt_criteria')}")
        assert d1_check.get("status") == "ELIGIBLE", f"Expected ELIGIBLE, got {d1_check.get('status')}"
        assert d1_check.get("match_score") == 100, f"Expected 100 match score, got {d1_check.get('match_score')}"
        assert len(d1_check.get("exempt_criteria", [])) == 1, "Expected 1 exempt criterion"
        assert d1_check["exempt_criteria"][0]["status"] == "NOT APPLICABLE — category exempt"
        print("✓ TEST 1 PASSED: SC student with ₹85,000 is verified category exempt and ELIGIBLE.")

        # =============================================================
        # TEST 2: OEC with income ₹5,00,000 (Compare against ₹6,00,000 ceiling -> PASS)
        # =============================================================
        print("\n--- TEST 2: OEC with income ₹5,00,000 ---")
        r2 = client.post("/eligibility/check", json={
            "user_id": 901,
            "service_id": 11,
            "answers": standard_egrantz_answers
        })
        d2 = r2.json()
        print(f"Status: {d2.get('status')}, Match score: {d2.get('match_score')}%")
        assert d2.get("status") == "ELIGIBLE"
        assert d2.get("match_score") == 100
        sat_fields = [r["field_name"] for r in d2.get("requirements_satisfied", [])]
        assert "income_limit_verified" in sat_fields
        inc_req = next(r for r in d2["requirements_satisfied"] if r["field_name"] == "income_limit_verified")
        print(f"Income satisfied description: {inc_req['description']}")
        print("✓ TEST 2 PASSED: OEC with ₹5,00,000 passes against ₹6,00,000 ceiling.")

        # =============================================================
        # TEST 3: OEC with income ₹7,00,000 (Compare against ₹6,00,000 ceiling -> FAIL)
        # =============================================================
        print("\n--- TEST 3: OEC with income ₹7,00,000 ---")
        r3 = client.post("/eligibility/check", json={
            "user_id": 902,
            "service_id": 11,
            "answers": standard_egrantz_answers
        })
        d3 = r3.json()
        print(f"Status: {d3.get('status')}")
        failed_fields = [r["field_name"] for r in d3.get("failed_requirements", [])]
        print(f"Failed requirements: {failed_fields}")
        assert d3.get("status") == "NOT ELIGIBLE"
        assert "income_limit_verified" in failed_fields
        inc_fail = next(r for r in d3["failed_requirements"] if r["field_name"] == "income_limit_verified")
        print(f"Failure reason: {inc_fail['reason']}")
        print("✓ TEST 3 PASSED: OEC with ₹7,00,000 fails against ₹6,00,000 ceiling.")

        # =============================================================
        # TEST 4: OBC with income ₹90,000 (Compare against ₹1,00,000 ceiling -> PASS)
        # =============================================================
        print(f"\n--- TEST 4: OBC with income ₹90,000 (User {u_obc_90k.user_id}) ---")
        r4 = client.post("/eligibility/check", json={
            "user_id": u_obc_90k.user_id,
            "service_id": 11,
            "answers": standard_egrantz_answers
        })
        d4 = r4.json()
        print(f"Status: {d4.get('status')}, Match score: {d4.get('match_score')}%")
        assert d4.get("status") == "ELIGIBLE"
        assert d4.get("match_score") == 100
        sat_fields = [r["field_name"] for r in d4.get("requirements_satisfied", [])]
        assert "income_limit_verified" in sat_fields
        print("✓ TEST 4 PASSED: OBC with ₹90,000 passes against ₹1,00,000 ceiling.")

        # =============================================================
        # TEST 5: OBC with income ₹1,50,000 (Compare against ₹1,00,000 ceiling -> FAIL)
        # =============================================================
        print(f"\n--- TEST 5: OBC with income ₹1,50,000 (User {u_obc_150k.user_id}) ---")
        r5 = client.post("/eligibility/check", json={
            "user_id": u_obc_150k.user_id,
            "service_id": 11,
            "answers": standard_egrantz_answers
        })
        d5 = r5.json()
        print(f"Status: {d5.get('status')}")
        failed_fields = [r["field_name"] for r in d5.get("failed_requirements", [])]
        print(f"Failed requirements: {failed_fields}")
        assert d5.get("status") == "NOT ELIGIBLE"
        assert "income_limit_verified" in failed_fields
        print("✓ TEST 5 PASSED: OBC with ₹1,50,000 fails against ₹1,00,000 ceiling.")

        # =============================================================
        # TEST 6: Missing category or income -> INFORMATION REQUIRED / unresolved
        # =============================================================
        print("\n--- TEST 6: Missing category or income ---")
        # 6a. Missing income
        r6a = client.post("/eligibility/check", json={
            "user_id": 903,
            "service_id": 11,
            "answers": standard_egrantz_answers
        })
        d6a = r6a.json()
        print(f"Missing income status: {d6a.get('status')}")
        assert d6a.get("status") == "INFORMATION REQUIRED"
        missing_fields = [r["field_name"] for r in d6a.get("missing_information", [])]
        assert "income_limit_verified" in missing_fields

        # 6b. Missing category
        r6b = client.post("/eligibility/check", json={
            "user_id": 904,
            "service_id": 11,
            "answers": standard_egrantz_answers
        })
        d6b = r6b.json()
        print(f"Missing category status: {d6b.get('status')}")
        assert d6b.get("status") == "INFORMATION REQUIRED"
        missing_fields = [r["field_name"] for r in d6b.get("missing_information", [])]
        assert "income_limit_verified" in missing_fields

        # 6c. Unsupported category
        r6c = client.post("/eligibility/check", json={
            "user_id": 905,
            "service_id": 11,
            "answers": standard_egrantz_answers
        })
        d6c = r6c.json()
        print(f"Unsupported category status: {d6c.get('status')}, manual verification: {d6c.get('manual_verification_required')}")
        assert d6c.get("status") == "INFORMATION REQUIRED"
        assert d6c.get("manual_verification_required") is True
        print("✓ TEST 6 PASSED: Missing data and unsupported category return unresolved/manual-verification outcomes.")

        # =============================================================
        # TEST 7: Submit forged income_limit_verified: true for income above ceiling
        # Must NOT pass!
        # =============================================================
        print("\n--- TEST 7: Forged income_limit_verified: true for income above ceiling ---")
        forged_true_answers = dict(standard_egrantz_answers)
        forged_true_answers["income_limit_verified"] = True
        r7 = client.post("/eligibility/check", json={
            "user_id": u_obc_150k.user_id,
            "service_id": 11,
            "answers": forged_true_answers
        })
        d7 = r7.json()
        print(f"Status with forged true answer: {d7.get('status')}")
        failed_fields = [r["field_name"] for r in d7.get("failed_requirements", [])]
        assert d7.get("status") == "NOT ELIGIBLE", f"Expected NOT ELIGIBLE, got {d7.get('status')}"
        assert "income_limit_verified" in failed_fields
        print("✓ TEST 7 PASSED: Forged income_limit_verified: true was rejected; server computed failure based on profile income.")

        # =============================================================
        # TEST 8: Submit forged income_limit_verified: false for profile that meets rule
        # Client answer must NOT override server calculation!
        # =============================================================
        print("\n--- TEST 8: Forged income_limit_verified: false for profile meeting rule ---")
        forged_false_answers = dict(standard_egrantz_answers)
        forged_false_answers["income_limit_verified"] = False
        r8 = client.post("/eligibility/check", json={
            "user_id": u_obc_90k.user_id,
            "service_id": 11,
            "answers": forged_false_answers
        })
        d8 = r8.json()
        print(f"Status with forged false answer: {d8.get('status')}")
        assert d8.get("status") == "ELIGIBLE", f"Expected ELIGIBLE, got {d8.get('status')}"
        sat_fields = [r["field_name"] for r in d8.get("requirements_satisfied", [])]
        assert "income_limit_verified" in sat_fields
        print("✓ TEST 8 PASSED: Forged income_limit_verified: false did NOT override server calculation.")

        # =============================================================
        # TEST 9: Confirm PM-KISAN (service_id = 12) remains unchanged
        # =============================================================
        print("\n--- TEST 9: Regression test PM-KISAN (Service 12) ---")
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
        r9 = client.post("/eligibility/check", json={
            "user_id": 8,
            "service_id": 12,
            "answers": pmk_answers
        })
        assert r9.status_code == 200
        d9 = r9.json()
        print(f"PM-KISAN Status: {d9.get('status')}, Match score: {d9.get('match_score')}%")
        assert d9.get("status") == "ELIGIBLE"
        assert d9.get("match_score") == 100

        # PM-KISAN Group D exception check
        pmk_group_d = dict(pmk_answers)
        pmk_group_d["is_group_d_or_mts"] = True
        pmk_group_d["is_government_employee"] = True
        r9_grp = client.post("/eligibility/check", json={
            "user_id": 8,
            "service_id": 12,
            "answers": pmk_group_d
        })
        d9_grp = r9_grp.json()
        print(f"PM-KISAN Group D Exception: status={d9_grp.get('status')}, manual_verification={d9_grp.get('manual_verification_required')}")
        assert d9_grp.get("status") == "ELIGIBLE"
        assert d9_grp.get("manual_verification_required") is True
        print("✓ TEST 9 PASSED: PM-KISAN functionality and exceptions remain completely intact.")

        # =============================================================
        # TEST 10: Confirm all existing API routes still work
        # =============================================================
        print("\n--- TEST 10: Existing API Routes ---")
        routes_to_test = [
            ("GET", "/government-services"),
            ("GET", "/government-services/11"),
            ("GET", "/government-services/12"),
            ("GET", "/eligibility/required-information/11?user_id=8"),
            ("GET", "/eligibility/required-information/12?user_id=8"),
            ("GET", "/admin/eligibility-rules?user_id=13"),
        ]
        for method, endpoint in routes_to_test:
            resp = client.get(endpoint)
            print(f"  {method} {endpoint} -> Status {resp.status_code}")
            assert resp.status_code == 200, f"Route {endpoint} failed with {resp.status_code}"
        print("✓ TEST 10 PASSED: All existing API routes operational.")

        print("\n" + "=" * 70)
        print("ALL 10 TESTS PASSED SUCCESSFULLY!")
        print("=" * 70)

    finally:
        # Clear dependency overrides
        app.dependency_overrides.clear()

        # Clean up temporary DB users
        if temp_user_ids:
            print(f"\nCleaning up {len(temp_user_ids)} temporary DB test users...")
            for uid in temp_user_ids:
                user_obj = db.query(models.User).filter(models.User.user_id == uid).first()
                if user_obj:
                    db.delete(user_obj)
            db.commit()
            print("Temporary test users cleaned up successfully.")
        db.close()

if __name__ == "__main__":
    run_tests()
