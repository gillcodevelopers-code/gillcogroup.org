#!/usr/bin/env python3
"""
Backend API Testing for Gillco Group CMS - POST /api/admin/restore endpoint
Tests the restore functionality with authentication, validation, round-trip restore, and regression checks.
"""

import requests
import json
import time
import copy
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
ADMIN_PASSWORD = 'gillco2025'
print(f"🔗 Testing against: {BASE_URL}\n")

# Test counters
passed = 0
failed = 0

# Store original backup for restoration
ORIGINAL_BACKUP = None

def test(name, fn):
    global passed, failed
    try:
        print(f"▶ {name}")
        fn()
        print(f"  ✅ PASS\n")
        passed += 1
        return True
    except AssertionError as e:
        print(f"  ❌ FAIL: {e}\n")
        failed += 1
        return False
    except Exception as e:
        print(f"  ❌ ERROR: {e}\n")
        failed += 1
        return False

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

def assert_not_in(item, container, msg=""):
    if item in container:
        raise AssertionError(f"{msg} Did not expect {item} in {container}")

# ==================== STEP 1: GET /api/admin/backup with header ====================
def test_get_backup_and_save_original():
    """GET /api/admin/backup with correct password should return full backup JSON"""
    global ORIGINAL_BACKUP
    
    headers = {'x-admin-password': ADMIN_PASSWORD}
    r = requests.get(f"{BASE_URL}/admin/backup", headers=headers, timeout=30)
    
    assert_eq(r.status_code, 200, "Status code should be 200")
    
    # Check Content-Disposition header
    content_disp = r.headers.get('Content-Disposition', '')
    assert_true('attachment' in content_disp, "Should have attachment in Content-Disposition")
    assert_true('gillco-backup-' in content_disp, "Filename should contain 'gillco-backup-'")
    
    # Check Cache-Control header
    cache_control = r.headers.get('Cache-Control', '')
    assert_true('no-store' in cache_control, "Should have 'no-store' in Cache-Control")
    
    # Parse JSON
    data = r.json()
    
    # Validate structure
    assert_eq(data.get('app'), 'gillco-group', "app should be 'gillco-group'")
    assert_true('version' in data, "Should have version field")
    assert_true('createdAt' in data, "Should have createdAt field")
    assert_true('database' in data, "Should have database field")
    assert_true('counts' in data, "Should have counts field")
    assert_true('collections' in data, "Should have collections field")
    
    # Validate collections
    collections = data['collections']
    assert_true('projects' in collections, "Should have projects collection")
    assert_true('settings' in collections, "Should have settings collection")
    assert_true('enquiries' in collections, "Should have enquiries collection")
    
    # Validate counts match array lengths
    counts = data['counts']
    for coll_name, docs in collections.items():
        assert_eq(counts.get(coll_name), len(docs), f"Count for {coll_name} should match array length")
    
    # Check no _id in any document
    for coll_name, docs in collections.items():
        for doc in docs:
            assert_false('_id' in doc, f"Document in {coll_name} should not have _id field")
    
    # Save to memory and disk
    ORIGINAL_BACKUP = copy.deepcopy(data)
    with open('/tmp/orig_backup.json', 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"    Backup saved with {len(collections)} collections")
    print(f"    Counts: {counts}")
    print(f"    Saved to /tmp/orig_backup.json")

# ==================== STEP 2: Authentication Tests ====================
def test_restore_without_header():
    """POST /api/admin/restore without header should return 401"""
    payload = {"app": "gillco-group", "collections": {}}
    r = requests.post(f"{BASE_URL}/admin/restore", json=payload, timeout=30)
    
    assert_eq(r.status_code, 401, "Status code should be 401 without header")
    data = r.json()
    assert_true('error' in data, "Response should contain error")
    print(f"    Error: {data.get('error')}")

def test_restore_wrong_password():
    """POST /api/admin/restore with wrong password should return 401"""
    headers = {'x-admin-password': 'wrongpassword123'}
    payload = {"app": "gillco-group", "collections": {}}
    r = requests.post(f"{BASE_URL}/admin/restore", json=payload, headers=headers, timeout=30)
    
    assert_eq(r.status_code, 401, "Status code should be 401 with wrong password")
    data = r.json()
    assert_true('error' in data, "Response should contain error")
    print(f"    Error: {data.get('error')}")

# ==================== STEP 3: Validation Tests ====================
def test_restore_invalid_json():
    """POST /api/admin/restore with invalid JSON should return 400"""
    headers = {'x-admin-password': ADMIN_PASSWORD, 'Content-Type': 'application/json'}
    # Send invalid JSON string
    r = requests.post(f"{BASE_URL}/admin/restore", data='not json', headers=headers, timeout=30)
    
    assert_eq(r.status_code, 400, "Status code should be 400 for invalid JSON")
    data = r.json()
    assert_true('error' in data, "Response should contain error")
    assert_true('not valid JSON' in data['error'] or 'JSON' in data['error'], "Error should mention JSON")
    print(f"    Error: {data.get('error')}")

def test_restore_wrong_app():
    """POST /api/admin/restore with wrong app name should return 400"""
    headers = {'x-admin-password': ADMIN_PASSWORD}
    payload = {"app": "other-app", "collections": {}}
    r = requests.post(f"{BASE_URL}/admin/restore", json=payload, headers=headers, timeout=30)
    
    assert_eq(r.status_code, 400, "Status code should be 400 for wrong app")
    data = r.json()
    assert_true('error' in data, "Response should contain error")
    assert_true('not a Gillco backup' in data['error'] or 'backup' in data['error'], "Error should mention backup")
    print(f"    Error: {data.get('error')}")

def test_restore_missing_required_collections():
    """POST /api/admin/restore with missing projects/settings should return 400"""
    headers = {'x-admin-password': ADMIN_PASSWORD}
    payload = {"app": "gillco-group", "collections": {"news": []}}
    r = requests.post(f"{BASE_URL}/admin/restore", json=payload, headers=headers, timeout=30)
    
    assert_eq(r.status_code, 400, "Status code should be 400 for missing required collections")
    data = r.json()
    assert_true('error' in data, "Response should contain error")
    assert_true('projects' in data['error'] or 'settings' in data['error'] or 'missing' in data['error'], 
                "Error should mention missing projects/settings")
    print(f"    Error: {data.get('error')}")

# ==================== STEP 4: Round Trip Restore ====================
def test_round_trip_restore():
    """Modify backup, restore, verify changes, then restore original"""
    global ORIGINAL_BACKUP
    
    if not ORIGINAL_BACKUP:
        raise AssertionError("ORIGINAL_BACKUP not available - previous test failed")
    
    # Create a modified copy
    modified_backup = copy.deepcopy(ORIGINAL_BACKUP)
    
    # Modify: Change first project name to 'RESTORE TEST'
    if len(modified_backup['collections']['projects']) > 0:
        modified_backup['collections']['projects'][0]['name'] = 'RESTORE TEST'
        print(f"    Modified project[0].name to 'RESTORE TEST'")
    
    # Modify: Remove one testimonial if exists
    original_testimonial_count = len(modified_backup['collections'].get('testimonials', []))
    if original_testimonial_count > 0:
        removed_testimonial = modified_backup['collections']['testimonials'].pop()
        print(f"    Removed one testimonial (was {original_testimonial_count}, now {len(modified_backup['collections']['testimonials'])})")
    
    # Update counts to match
    for coll_name, docs in modified_backup['collections'].items():
        modified_backup['counts'][coll_name] = len(docs)
    
    # POST modified backup
    headers = {'x-admin-password': ADMIN_PASSWORD}
    r = requests.post(f"{BASE_URL}/admin/restore", json=modified_backup, headers=headers, timeout=30)
    
    assert_eq(r.status_code, 200, "Restore should return 200")
    data = r.json()
    assert_eq(data.get('ok'), True, "Response should have ok:true")
    assert_true('restored' in data, "Response should have restored field")
    
    # Verify restored counts match array lengths
    restored = data['restored']
    for coll_name, count in restored.items():
        expected_count = len(modified_backup['collections'].get(coll_name, []))
        assert_eq(count, expected_count, f"Restored count for {coll_name} should match")
    
    print(f"    Restored counts: {restored}")
    
    # Wait a moment for database to settle
    time.sleep(1)
    
    # Verify changes: GET /api/projects should show 'RESTORE TEST'
    r = requests.get(f"{BASE_URL}/projects", timeout=10)
    assert_eq(r.status_code, 200, "GET projects should return 200")
    projects = r.json()
    
    # Find the modified project
    restore_test_project = None
    for p in projects:
        if p.get('name') == 'RESTORE TEST':
            restore_test_project = p
            break
    
    assert_true(restore_test_project is not None, "Should find project with name 'RESTORE TEST'")
    print(f"    ✓ Verified: Found project 'RESTORE TEST'")
    
    # Verify no _id in responses
    for p in projects:
        assert_false('_id' in p, "Project should not have _id field")
    
    # Verify testimonial count decreased
    r = requests.get(f"{BASE_URL}/testimonials", timeout=10)
    if r.status_code == 200:
        testimonials = r.json()
        current_count = len(testimonials)
        if original_testimonial_count > 0:
            assert_eq(current_count, original_testimonial_count - 1, 
                     f"Testimonial count should be {original_testimonial_count - 1}")
            print(f"    ✓ Verified: Testimonial count decreased from {original_testimonial_count} to {current_count}")

# ==================== STEP 5: Restore Original ====================
def test_restore_original():
    """Restore ORIGINAL backup and verify everything is back"""
    global ORIGINAL_BACKUP
    
    if not ORIGINAL_BACKUP:
        raise AssertionError("ORIGINAL_BACKUP not available")
    
    headers = {'x-admin-password': ADMIN_PASSWORD}
    r = requests.post(f"{BASE_URL}/admin/restore", json=ORIGINAL_BACKUP, headers=headers, timeout=30)
    
    assert_eq(r.status_code, 200, "Restore original should return 200")
    data = r.json()
    assert_eq(data.get('ok'), True, "Response should have ok:true")
    
    print(f"    Restored original backup")
    
    # Wait for database to settle
    time.sleep(1)
    
    # Verify project name is back to original
    r = requests.get(f"{BASE_URL}/projects", timeout=10)
    assert_eq(r.status_code, 200, "GET projects should return 200")
    projects = r.json()
    
    # Check first project name matches original
    if len(ORIGINAL_BACKUP['collections']['projects']) > 0:
        original_name = ORIGINAL_BACKUP['collections']['projects'][0]['name']
        current_first_project = projects[0] if len(projects) > 0 else None
        
        if current_first_project:
            # Find matching project by id
            original_id = ORIGINAL_BACKUP['collections']['projects'][0]['id']
            matching_project = None
            for p in projects:
                if p.get('id') == original_id:
                    matching_project = p
                    break
            
            if matching_project:
                assert_eq(matching_project['name'], original_name, 
                         f"Project name should be restored to '{original_name}'")
                print(f"    ✓ Verified: Project name restored to '{original_name}'")
    
    # Get fresh backup and verify counts match ORIGINAL
    r = requests.get(f"{BASE_URL}/admin/backup", headers=headers, timeout=30)
    assert_eq(r.status_code, 200, "GET backup should return 200")
    fresh_backup = r.json()
    
    # Verify counts match original
    for coll_name, count in ORIGINAL_BACKUP['counts'].items():
        fresh_count = fresh_backup['counts'].get(coll_name, 0)
        assert_eq(fresh_count, count, f"Count for {coll_name} should match original ({count})")
    
    print(f"    ✓ Verified: All collection counts match original")
    
    # Check for leftover __restore_* collections
    backup_collections = fresh_backup['collections'].keys()
    restore_collections = [c for c in backup_collections if c.startswith('__restore')]
    assert_eq(len(restore_collections), 0, "Should have no leftover __restore_* collections")
    print(f"    ✓ Verified: No leftover __restore_* collections")

# ==================== STEP 6: Regression Tests ====================
def test_regression_get_settings():
    """GET /api/settings should work after restore"""
    r = requests.get(f"{BASE_URL}/settings", timeout=10)
    assert_eq(r.status_code, 200, "GET settings should return 200")
    data = r.json()
    assert_eq(data.get('brandName'), 'Gillco Group', "Brand name should be Gillco Group")
    print(f"    Settings working: brandName={data.get('brandName')}")

def test_regression_get_projects():
    """GET /api/projects should work after restore"""
    r = requests.get(f"{BASE_URL}/projects", timeout=10)
    assert_eq(r.status_code, 200, "GET projects should return 200")
    data = r.json()
    assert_true(isinstance(data, list), "Response should be an array")
    assert_true(len(data) >= 8, "Should have at least 8 projects")
    print(f"    Projects working: {len(data)} projects found")

def test_regression_get_health():
    """GET /api/health should work after restore"""
    r = requests.get(f"{BASE_URL}/health", timeout=10)
    assert_eq(r.status_code, 200, "GET health should return 200")
    data = r.json()
    assert_eq(data.get('ok'), True, "Health check should return ok:true")
    assert_eq(data.get('db'), 'up', "Database should be up")
    print(f"    Health check working: db={data.get('db')}, dbMs={data.get('dbMs')}")

# ==================== CLEANUP: Always restore original even if tests fail ====================
def ensure_original_restored():
    """Ensure ORIGINAL backup is restored even if tests fail"""
    global ORIGINAL_BACKUP
    
    if not ORIGINAL_BACKUP:
        print("⚠️  WARNING: ORIGINAL_BACKUP not available, cannot restore")
        return
    
    try:
        headers = {'x-admin-password': ADMIN_PASSWORD}
        r = requests.post(f"{BASE_URL}/admin/restore", json=ORIGINAL_BACKUP, headers=headers, timeout=30)
        
        if r.status_code == 200:
            print("✅ ORIGINAL backup restored successfully")
        else:
            print(f"⚠️  WARNING: Failed to restore ORIGINAL backup (status {r.status_code})")
    except Exception as e:
        print(f"⚠️  WARNING: Exception while restoring ORIGINAL backup: {e}")

# ==================== RUN ALL TESTS ====================
if __name__ == '__main__':
    print("=" * 80)
    print("BACKEND API TESTING - POST /api/admin/restore")
    print("=" * 80)
    print()
    
    try:
        # Step 1: Get and save original backup
        print("📋 STEP 1: GET /api/admin/backup and save ORIGINAL")
        print("-" * 80)
        test("S1: GET /api/admin/backup with correct password", test_get_backup_and_save_original)
        
        # Step 2: Authentication tests
        print("📋 STEP 2: Authentication Tests")
        print("-" * 80)
        test("S2.1: POST /api/admin/restore without header returns 401", test_restore_without_header)
        test("S2.2: POST /api/admin/restore with wrong password returns 401", test_restore_wrong_password)
        
        # Step 3: Validation tests
        print("📋 STEP 3: Validation Tests")
        print("-" * 80)
        test("S3.1: POST /api/admin/restore with invalid JSON returns 400", test_restore_invalid_json)
        test("S3.2: POST /api/admin/restore with wrong app name returns 400", test_restore_wrong_app)
        test("S3.3: POST /api/admin/restore missing projects/settings returns 400", test_restore_missing_required_collections)
        
        # Step 4: Round trip restore
        print("📋 STEP 4: Round Trip Restore")
        print("-" * 80)
        test("S4: Modify backup, restore, verify changes", test_round_trip_restore)
        
        # Step 5: Restore original
        print("📋 STEP 5: Restore ORIGINAL Backup")
        print("-" * 80)
        test("S5: Restore ORIGINAL and verify counts match", test_restore_original)
        
        # Step 6: Regression tests
        print("📋 STEP 6: Regression Tests")
        print("-" * 80)
        test("S6.1: GET /api/settings works after restore", test_regression_get_settings)
        test("S6.2: GET /api/projects works after restore", test_regression_get_projects)
        test("S6.3: GET /api/health works after restore", test_regression_get_health)
        
    finally:
        # Always try to restore original backup
        print("\n" + "=" * 80)
        print("CLEANUP: Ensuring ORIGINAL backup is restored")
        print("=" * 80)
        ensure_original_restored()
    
    # Summary
    print("\n" + "=" * 80)
    print(f"RESULTS: {passed} passed, {failed} failed")
    print("=" * 80)
    
    if failed == 0:
        print("✅ ALL TESTS PASSED")
    else:
        print(f"❌ {failed} TEST(S) FAILED")
    
    print()
