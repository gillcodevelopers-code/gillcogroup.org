#!/usr/bin/env python3
"""
Backend API Testing for Gillco Group CMS - Phase 2 Lead Automation Features
Tests new endpoints: enquiries with email notifications, cron escalation, notifications status/test, settings persistence, project awards
"""

import requests
import json
import time
from datetime import datetime

# Read base URL from .env
def get_base_url():
    try:
        with open('/app/.env', 'r') as f:
            for line in f:
                if line.startswith('NEXT_PUBLIC_BASE_URL='):
                    return line.split('=', 1)[1].strip() + '/api'
    except:
        pass
    return 'http://localhost:3000/api'

BASE_URL = get_base_url()
print(f"🔗 Testing against: {BASE_URL}\n")

# Test counters
passed = 0
failed = 0
test_data_cleanup = []

def test(name, fn):
    global passed, failed
    try:
        print(f"▶ {name}")
        fn()
        print(f"  ✅ PASS\n")
        passed += 1
    except AssertionError as e:
        print(f"  ❌ FAIL: {e}\n")
        failed += 1
    except Exception as e:
        print(f"  ❌ ERROR: {e}\n")
        failed += 1

def assert_eq(actual, expected, msg=""):
    if actual != expected:
        raise AssertionError(f"{msg} Expected {expected}, got {actual}")

def assert_in(item, container, msg=""):
    if item not in container:
        raise AssertionError(f"{msg} Expected {item} in {container}")

def assert_true(condition, msg=""):
    if not condition:
        raise AssertionError(msg or "Expected True")

def assert_false(condition, msg=""):
    if condition:
        raise AssertionError(msg or "Expected False")

# ==================== TEST 1: POST /api/enquiries with email notification ====================
def test_enquiry_creation_success():
    """POST /api/enquiries with valid data should return 200 fast with id, no _id"""
    payload = {
        "name": "Rajesh Kumar",
        "phone": "9876543210",
        "email": "rajesh.kumar@example.com",
        "projectName": "Gillco Meraqui",
        "consent": True,
        "message": "Interested in 3 BHK unit"
    }
    start = time.time()
    r = requests.post(f"{BASE_URL}/enquiries", json=payload, timeout=10)
    elapsed = time.time() - start
    
    assert_eq(r.status_code, 200, "Status code should be 200")
    data = r.json()
    assert_true('id' in data, "Response should contain 'id'")
    assert_false('_id' in data, "Response should NOT contain MongoDB '_id'")
    assert_eq(data['name'], payload['name'], "Name should match")
    assert_eq(data['phone'], payload['phone'], "Phone should match")
    assert_eq(data['email'], payload['email'], "Email should match")
    assert_eq(data['projectName'], payload['projectName'], "Project name should match")
    assert_eq(data['consent'], True, "Consent should be True")
    assert_true(elapsed < 3.0, f"Response should be fast (took {elapsed:.2f}s)")
    
    # Store for cleanup
    test_data_cleanup.append(('enquiry', data['id']))
    print(f"    Created enquiry ID: {data['id']} in {elapsed:.2f}s")

def test_enquiry_missing_phone():
    """POST /api/enquiries without phone should return 400"""
    payload = {
        "name": "Test User",
        "email": "test@example.com",
        "projectName": "Gillco Parkhills",
        "consent": True
    }
    r = requests.post(f"{BASE_URL}/enquiries", json=payload, timeout=10)
    assert_eq(r.status_code, 400, "Status code should be 400 for missing phone")
    data = r.json()
    assert_true('error' in data, "Response should contain error message")
    print(f"    Error message: {data.get('error')}")

def test_enquiry_no_crash_without_resend():
    """Verify server logs show no crash when RESEND_API_KEY is not set"""
    # Check supervisor logs for nextjs
    import subprocess
    try:
        result = subprocess.run(
            ['tail', '-n', '50', '/var/log/supervisor/nextjs.out.log'],
            capture_output=True,
            text=True,
            timeout=5
        )
        logs = result.stdout
        
        # Look for crash indicators
        crash_indicators = ['ECONNREFUSED', 'Cannot read property', 'TypeError', 'ReferenceError', 'crashed']
        has_crash = any(indicator in logs for indicator in crash_indicators)
        
        assert_false(has_crash, "Server logs should not show crashes related to email")
        print(f"    Server logs clean - no crashes detected")
    except Exception as e:
        print(f"    Warning: Could not check logs - {e}")

# ==================== TEST 2: GET /api/cron/escalate ====================
def test_cron_escalate_without_email():
    """GET /api/cron/escalate should return 200 with skipped message when email not configured"""
    r = requests.get(f"{BASE_URL}/cron/escalate", timeout=10)
    assert_eq(r.status_code, 200, "Status code should be 200")
    data = r.json()
    assert_true(data.get('ok'), "Response should have ok:true")
    assert_eq(data.get('skipped'), 'email not configured', "Should skip with 'email not configured' message")
    print(f"    Response: {json.dumps(data, indent=2)}")

def test_cron_escalate_no_auto_escalation():
    """After inserting enquiry, confirm no enquiry got escalated:true by auto sweep"""
    # Create a test enquiry
    payload = {
        "name": "Priya Sharma",
        "phone": "9123456789",
        "email": "priya.sharma@example.com",
        "projectName": "Gillco Industrial Park",
        "consent": True
    }
    r = requests.post(f"{BASE_URL}/enquiries", json=payload, timeout=10)
    assert_eq(r.status_code, 200, "Enquiry creation should succeed")
    enquiry_id = r.json()['id']
    test_data_cleanup.append(('enquiry', enquiry_id))
    
    # Wait a moment
    time.sleep(1)
    
    # Run escalation cron
    r = requests.get(f"{BASE_URL}/cron/escalate", timeout=10)
    assert_eq(r.status_code, 200, "Cron should return 200")
    
    # Fetch all enquiries and verify none have escalatedBy='auto'
    r = requests.get(f"{BASE_URL}/enquiries", timeout=10)
    assert_eq(r.status_code, 200, "GET enquiries should succeed")
    enquiries = r.json()
    
    auto_escalated = [e for e in enquiries if e.get('escalatedBy') == 'auto']
    assert_eq(len(auto_escalated), 0, "No enquiries should be auto-escalated when email not configured")
    print(f"    Verified: No auto-escalated enquiries found (total enquiries: {len(enquiries)})")

# ==================== TEST 3: GET /api/notifications/status ====================
def test_notifications_status():
    """GET /api/notifications/status should show emailConfigured:false and leadRecipients array"""
    r = requests.get(f"{BASE_URL}/notifications/status", timeout=10)
    assert_eq(r.status_code, 200, "Status code should be 200")
    data = r.json()
    
    assert_false(data.get('emailConfigured'), "emailConfigured should be false (no RESEND_API_KEY)")
    assert_true('leadRecipients' in data, "Response should contain leadRecipients")
    assert_true(isinstance(data['leadRecipients'], list), "leadRecipients should be an array")
    print(f"    emailConfigured: {data.get('emailConfigured')}")
    print(f"    leadRecipients: {data.get('leadRecipients')}")

def test_settings_notifications_update():
    """PUT /api/settings with notifications config should update leadRecipients"""
    # First, get current settings to restore later
    r = requests.get(f"{BASE_URL}/settings", timeout=10)
    assert_eq(r.status_code, 200, "GET settings should succeed")
    original_settings = r.json()
    
    # Update settings with notifications config
    updated_settings = {**original_settings}
    updated_settings['notifications'] = {
        'emailEnabled': True,
        'leadEmails': 'a@x.com, b@y.com'
    }
    
    r = requests.put(f"{BASE_URL}/settings", json=updated_settings, timeout=10)
    assert_eq(r.status_code, 200, "PUT settings should succeed")
    
    # Check notifications status
    r = requests.get(f"{BASE_URL}/notifications/status", timeout=10)
    assert_eq(r.status_code, 200, "GET notifications/status should succeed")
    data = r.json()
    
    recipients = data.get('leadRecipients', [])
    assert_in('a@x.com', recipients, "leadRecipients should contain a@x.com")
    assert_in('b@y.com', recipients, "leadRecipients should contain b@y.com")
    print(f"    Updated leadRecipients: {recipients}")
    
    # Restore original settings
    r = requests.put(f"{BASE_URL}/settings", json=original_settings, timeout=10)
    assert_eq(r.status_code, 200, "Restore settings should succeed")
    print(f"    Restored original settings")

# ==================== TEST 4: POST /api/notifications/test ====================
def test_notifications_test_without_resend():
    """POST /api/notifications/test should return 400 with error message when RESEND_API_KEY not set"""
    r = requests.post(f"{BASE_URL}/notifications/test", json={}, timeout=10)
    assert_eq(r.status_code, 400, "Status code should be 400")
    data = r.json()
    assert_true('error' in data, "Response should contain error message")
    assert_true('RESEND_API_KEY' in data['error'] or 'not set up' in data['error'], 
                "Error should mention RESEND_API_KEY or email not set up")
    print(f"    Error message: {data.get('error')}")

# ==================== TEST 5: PUT /api/settings with ga4Id and leadOverflow.managerEmail ====================
def test_settings_ga4_and_manager_email():
    """PUT /api/settings with ga4Id and leadOverflow.managerEmail should persist"""
    # Get current settings
    r = requests.get(f"{BASE_URL}/settings", timeout=10)
    assert_eq(r.status_code, 200, "GET settings should succeed")
    original_settings = r.json()
    
    # Update with ga4Id and managerEmail
    updated_settings = {**original_settings}
    updated_settings['ga4Id'] = 'G-TEST1234'
    if 'leadOverflow' not in updated_settings:
        updated_settings['leadOverflow'] = {}
    updated_settings['leadOverflow']['managerEmail'] = 'manager@gillcogroup.org'
    
    r = requests.put(f"{BASE_URL}/settings", json=updated_settings, timeout=10)
    assert_eq(r.status_code, 200, "PUT settings should succeed")
    
    # Verify persistence
    r = requests.get(f"{BASE_URL}/settings", timeout=10)
    assert_eq(r.status_code, 200, "GET settings should succeed")
    data = r.json()
    
    assert_eq(data.get('ga4Id'), 'G-TEST1234', "ga4Id should be persisted")
    assert_eq(data.get('leadOverflow', {}).get('managerEmail'), 'manager@gillcogroup.org', 
              "leadOverflow.managerEmail should be persisted")
    print(f"    ga4Id: {data.get('ga4Id')}")
    print(f"    leadOverflow.managerEmail: {data.get('leadOverflow', {}).get('managerEmail')}")
    
    # Restore original settings
    r = requests.put(f"{BASE_URL}/settings", json=original_settings, timeout=10)
    assert_eq(r.status_code, 200, "Restore settings should succeed")
    print(f"    Restored original settings")

# ==================== TEST 6: PUT /api/projects/:id with awards ====================
def test_project_awards():
    """PUT /api/projects/:id with awards array should persist and be retrievable"""
    # Get existing projects
    r = requests.get(f"{BASE_URL}/projects", timeout=10)
    assert_eq(r.status_code, 200, "GET projects should succeed")
    projects = r.json()
    assert_true(len(projects) > 0, "Should have at least one project")
    
    # Pick first project
    project = projects[0]
    project_id = project['id']
    original_project = {**project}
    
    # Add awards
    updated_project = {**project}
    updated_project['awards'] = [
        {
            'id': 'a1',
            'title': 'Best Project',
            'by': 'CREDAI',
            'year': '2025',
            'logo': ''
        }
    ]
    
    r = requests.put(f"{BASE_URL}/projects/{project_id}", json=updated_project, timeout=10)
    assert_eq(r.status_code, 200, "PUT project should succeed")
    
    # Verify awards in GET
    r = requests.get(f"{BASE_URL}/projects/{project_id}", timeout=10)
    assert_eq(r.status_code, 200, "GET project should succeed")
    data = r.json()
    
    assert_true('awards' in data, "Project should have awards field")
    assert_eq(len(data['awards']), 1, "Should have 1 award")
    assert_eq(data['awards'][0]['id'], 'a1', "Award id should match")
    assert_eq(data['awards'][0]['title'], 'Best Project', "Award title should match")
    assert_eq(data['awards'][0]['by'], 'CREDAI', "Award by should match")
    assert_eq(data['awards'][0]['year'], '2025', "Award year should match")
    print(f"    Project {project_id} awards: {data['awards']}")
    
    # Restore original project (remove awards)
    r = requests.put(f"{BASE_URL}/projects/{project_id}", json=original_project, timeout=10)
    assert_eq(r.status_code, 200, "Restore project should succeed")
    print(f"    Restored original project without awards")

# ==================== TEST 7: Regression Tests ====================
def test_regression_get_projects():
    """GET /api/projects should still work"""
    r = requests.get(f"{BASE_URL}/projects", timeout=10)
    assert_eq(r.status_code, 200, "GET projects should return 200")
    data = r.json()
    assert_true(isinstance(data, list), "Response should be an array")
    assert_true(len(data) >= 8, "Should have at least 8 seeded projects")
    print(f"    Found {len(data)} projects")

def test_regression_get_settings():
    """GET /api/settings should still work"""
    r = requests.get(f"{BASE_URL}/settings", timeout=10)
    assert_eq(r.status_code, 200, "GET settings should return 200")
    data = r.json()
    assert_eq(data.get('brandName'), 'Gillco Group', "Brand name should be Gillco Group")
    assert_true('phone' in data, "Settings should have phone")
    assert_true('email' in data, "Settings should have email")
    print(f"    Settings: brandName={data.get('brandName')}, phone={data.get('phone')}")

def test_regression_get_testimonials():
    """GET /api/testimonials should still work"""
    r = requests.get(f"{BASE_URL}/testimonials", timeout=10)
    assert_eq(r.status_code, 200, "GET testimonials should return 200")
    data = r.json()
    assert_true(isinstance(data, list), "Response should be an array")
    print(f"    Found {len(data)} testimonials")

def test_regression_enquiry_claim():
    """POST /api/enquiries/:id/claim should still work"""
    # Create a test enquiry first
    payload = {
        "name": "Amit Verma",
        "phone": "9988776655",
        "email": "amit.verma@example.com",
        "projectName": "Gillco Towers",
        "consent": True
    }
    r = requests.post(f"{BASE_URL}/enquiries", json=payload, timeout=10)
    assert_eq(r.status_code, 200, "Enquiry creation should succeed")
    enquiry_id = r.json()['id']
    test_data_cleanup.append(('enquiry', enquiry_id))
    
    # Claim the enquiry
    r = requests.post(f"{BASE_URL}/enquiries/{enquiry_id}/claim", json={"by": "test-agent"}, timeout=10)
    assert_eq(r.status_code, 200, "Claim should return 200")
    data = r.json()
    assert_eq(data.get('claimed'), True, "Enquiry should be marked as claimed")
    assert_eq(data.get('claimedBy'), 'test-agent', "claimedBy should match")
    assert_true('claimedAt' in data, "Should have claimedAt timestamp")
    print(f"    Claimed enquiry {enquiry_id} by test-agent")

def test_regression_enquiry_escalate():
    """POST /api/enquiries/:id/escalate should still work"""
    # Create a test enquiry first
    payload = {
        "name": "Neha Gupta",
        "phone": "9876512345",
        "email": "neha.gupta@example.com",
        "projectName": "Gillco Heights",
        "consent": True
    }
    r = requests.post(f"{BASE_URL}/enquiries", json=payload, timeout=10)
    assert_eq(r.status_code, 200, "Enquiry creation should succeed")
    enquiry_id = r.json()['id']
    test_data_cleanup.append(('enquiry', enquiry_id))
    
    # Escalate the enquiry
    r = requests.post(f"{BASE_URL}/enquiries/{enquiry_id}/escalate", json={}, timeout=10)
    assert_eq(r.status_code, 200, "Escalate should return 200")
    data = r.json()
    assert_eq(data.get('escalated'), True, "Enquiry should be marked as escalated")
    assert_true('escalatedAt' in data, "Should have escalatedAt timestamp")
    print(f"    Escalated enquiry {enquiry_id}")

# ==================== RUN ALL TESTS ====================
if __name__ == '__main__':
    print("=" * 80)
    print("BACKEND API TESTING - PHASE 2 LEAD AUTOMATION FEATURES")
    print("=" * 80)
    print()
    
    # Test 1: POST /api/enquiries
    print("📋 TEST GROUP 1: POST /api/enquiries with email notification")
    print("-" * 80)
    test("T1.1: POST /api/enquiries with valid data returns 200 fast with id, no _id", test_enquiry_creation_success)
    test("T1.2: POST /api/enquiries without phone returns 400", test_enquiry_missing_phone)
    test("T1.3: Server logs show no crash without RESEND_API_KEY", test_enquiry_no_crash_without_resend)
    
    # Test 2: GET /api/cron/escalate
    print("📋 TEST GROUP 2: GET /api/cron/escalate")
    print("-" * 80)
    test("T2.1: GET /api/cron/escalate returns 200 with skipped message", test_cron_escalate_without_email)
    test("T2.2: No enquiries auto-escalated when email not configured", test_cron_escalate_no_auto_escalation)
    
    # Test 3: GET /api/notifications/status
    print("📋 TEST GROUP 3: GET /api/notifications/status")
    print("-" * 80)
    test("T3.1: GET /api/notifications/status shows emailConfigured:false", test_notifications_status)
    test("T3.2: PUT /api/settings with notifications updates leadRecipients", test_settings_notifications_update)
    
    # Test 4: POST /api/notifications/test
    print("📋 TEST GROUP 4: POST /api/notifications/test")
    print("-" * 80)
    test("T4.1: POST /api/notifications/test returns 400 without RESEND_API_KEY", test_notifications_test_without_resend)
    
    # Test 5: PUT /api/settings with ga4Id and managerEmail
    print("📋 TEST GROUP 5: PUT /api/settings with ga4Id and leadOverflow.managerEmail")
    print("-" * 80)
    test("T5.1: PUT /api/settings with ga4Id and managerEmail persists", test_settings_ga4_and_manager_email)
    
    # Test 6: PUT /api/projects/:id with awards
    print("📋 TEST GROUP 6: PUT /api/projects/:id with awards")
    print("-" * 80)
    test("T6.1: PUT /api/projects/:id with awards array persists", test_project_awards)
    
    # Test 7: Regression tests
    print("📋 TEST GROUP 7: Regression Tests")
    print("-" * 80)
    test("T7.1: GET /api/projects still works", test_regression_get_projects)
    test("T7.2: GET /api/settings still works", test_regression_get_settings)
    test("T7.3: GET /api/testimonials still works", test_regression_get_testimonials)
    test("T7.4: POST /api/enquiries/:id/claim still works", test_regression_enquiry_claim)
    test("T7.5: POST /api/enquiries/:id/escalate still works", test_regression_enquiry_escalate)
    
    # Summary
    print("=" * 80)
    print(f"RESULTS: {passed} passed, {failed} failed")
    print("=" * 80)
    
    if failed == 0:
        print("✅ ALL TESTS PASSED")
    else:
        print(f"❌ {failed} TEST(S) FAILED")
    
    print()
