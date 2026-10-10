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
print("ADDING CASTE CERTIFICATE (SERVICE ID 2) RULES VIA ADMIN CRUD API")
print("=" * 70)

admin_user_id = 13  # System Administrator (Admin)

# 1. Verify Service 2
db = SessionLocal()
svc = db.query(models.GovernmentService).filter(models.GovernmentService.service_id == 2).first()
if not svc:
    print("ERROR: Service ID 2 not found!")
    sys.exit(1)
print(f"Target Service: ID {svc.service_id} | Name: '{svc.service_name}' | Category: '{svc.category}'")

# Check Community Certificate (Service 5) to verify separation
svc5 = db.query(models.GovernmentService).filter(models.GovernmentService.service_id == 5).first()
print(f"Distinct Service 5 (Untouched): ID {svc5.service_id} | Name: '{svc5.service_name}'")

# Rules to add for Caste Certificate
rules_to_add = [
    {
        "service_id": 2,
        "rule_type": "REQUIREMENT",
        "field_name": "caste_details_declared",
        "operator": "==",
        "rule_value": "true",
        "logical_group": 1,
        "description": "Applicant must declare and claim a recognized caste/community specified under Kerala Government or Presidential Orders.",
    },
    {
        "service_id": 2,
        "rule_type": "REQUIREMENT",
        "field_name": "supporting_caste_evidence",
        "operator": "==",
        "rule_value": "true",
        "logical_group": 1,
        "description": "Applicant must furnish documentary proof of caste (e.g. SSLC / school records with caste entry or caste certificate of parents / blood relatives).",
    },
    {
        "service_id": 2,
        "rule_type": "REQUIREMENT",
        "field_name": "kerala_residence_and_id_proof",
        "operator": "==",
        "rule_value": "true",
        "logical_group": 1,
        "description": "Applicant must provide valid proof of identity and local residence in Kerala (Ration card / Aadhaar / Voter ID).",
    },
    {
        "service_id": 2,
        "rule_type": "EXCLUSION",
        "field_name": "converted_without_gazette_notification",
        "operator": "==",
        "rule_value": "true",
        "logical_group": 1,
        "description": "Religious conversion without official Kerala Gazette notification or conversion certificate excludes the applicant from caste certificate issuance.",
    },
    {
        "service_id": 2,
        "rule_type": "REQUIREMENT",
        "field_name": "competent_authority_verification",
        "operator": "==",
        "rule_value": "true",
        "logical_group": 1,
        "description": "Application must undergo mandatory local enquiry and field verification clearance by the competent revenue authority (Village Officer / Tahsildar).",
    },
]

added_rules = []
for idx, rule_data in enumerate(rules_to_add, start=1):
    print(f"\nSubmitting Rule {idx}: {rule_data['field_name']} ({rule_data['rule_type']})...")
    resp = client.post(f"/admin/eligibility-rules?user_id={admin_user_id}", json=rule_data)
    print(f"HTTP Status: {resp.status_code}")
    if resp.status_code == 200:
        res_json = resp.json()
        print(f"✓ Added Successfully: Rule ID {res_json.get('rule_id')} | Message: {res_json.get('message')}")
        added_rules.append(res_json)
    elif resp.status_code == 400 and "already exists" in resp.text:
        print(f"ℹ Rule already exists: {resp.json().get('detail')}")
    else:
        print(f"❌ Failed to add rule: {resp.text}")

# 2. Verify retrieval through GET /admin/eligibility-rules
print("\n" + "=" * 70)
print("VERIFYING RULES RETRIEVAL FROM API & MYSQL")
print("=" * 70)
get_resp = client.get(f"/admin/eligibility-rules?user_id={admin_user_id}&service_id=2")
print(f"GET /admin/eligibility-rules status: {get_resp.status_code}")
rules_from_api = get_resp.json()
print(f"Total rules retrieved for Service 2: {len(rules_from_api)}")
for r in rules_from_api:
    print(f"  - Rule #{r['rule_id']} | Type: {r['rule_type']} | Condition: {r['field_name']} {r['operator']} {r['rule_value']} | Group: {r['logical_group']}")
    print(f"    Description: {r['description']}")

# 3. Direct MySQL query verification
print("\nDirect MySQL Verification:")
db_rules = db.query(models.ServiceEligibilityRule).filter(models.ServiceEligibilityRule.service_id == 2).all()
print(f"Direct DB rules count: {len(db_rules)}")
for r in db_rules:
    print(f"  - DB Rule #{r.rule_id}: {r.field_name} ({r.rule_type}) == '{r.rule_value}'")

# 4. Verify Service 5 remains untouched
svc5_rules = db.query(models.ServiceEligibilityRule).filter(models.ServiceEligibilityRule.service_id == 5).count()
print(f"\nVerification: Service 5 (Community Certificate) rules count = {svc5_rules} (Untouched)")

db.close()
