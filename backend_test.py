#!/usr/bin/env python3
"""
Backend API Test Suite for Gillco Group CMS - Phase 2
Tests NEW endpoints: Media Upload, Change History, Undo + Regression
"""

import requests
import json
import os
import io
from PIL import Image
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/.env')

BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://realty-cms-hub-1.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

print(f"🧪 Testing Gillco CMS Backend APIs - Phase 2 (Media Upload + History + Undo)")
print(f"📍 Base URL: {API_BASE}")
print("=" * 80)

# Test counters
tests_passed = 0
tests_failed = 0
test_results = []

def test_result(test_name, passed, details=""):
    """Print and track test result"""
    global tests_passed, tests_failed
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{status} | {test_name}")
    if details:
        print(f"   {details}")
    
    if passed:
        tests_passed += 1
    else:
        tests_failed += 1
    
    test_results.append({
        "name": test_name,
        "passed": passed,
        "details": details
    })
    return passed

# ============================================================================
# SECTION 1: MEDIA UPLOAD TESTS
# ============================================================================
print("\n" + "=" * 80)
print("SECTION 1: MEDIA UPLOAD TESTS")
print("=" * 80)

# Test 1.1: POST /api/upload with valid PNG file
print("\n" + "=" * 80)
print("TEST 1.1: POST /api/upload (valid PNG file)")
print("=" * 80)
uploaded_url = None
uploaded_filename = None
try:
    # Create a small 100x100 red pixel PNG in memory
    img = Image.new('RGB', (100, 100), color='red')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='PNG')
    img_bytes.seek(0)
    
    files = {'file': ('test_image.png', img_bytes, 'image/png')}
    response = requests.post(f"{API_BASE}/upload", files=files, timeout=15)
    data = response.json()
    
    passed = (
        response.status_code == 200 and
        'url' in data and
        'filename' in data and
        'size' in data and
        'mime' in data and
        data['url'].startswith('/uploads/') and
        data['url'].endswith('.png') and
        data['filename'] == 'test_image.png' and
        data['size'] > 0
    )
    
    if passed:
        uploaded_url = data['url']
        uploaded_filename = data['filename']
        test_result("POST /api/upload (valid PNG)", True, 
                   f"Uploaded: {uploaded_filename}, URL: {uploaded_url}, Size: {data['size']} bytes, MIME: {data['mime']}")
    else:
        test_result("POST /api/upload (valid PNG)", False, 
                   f"Status: {response.status_code}, Response: {json.dumps(data)}")
        
except Exception as e:
    test_result("POST /api/upload (valid PNG)", False, f"Exception: {str(e)}")

# Test 1.2: Verify uploaded file is publicly accessible
print("\n" + "=" * 80)
print("TEST 1.2: Verify uploaded file is publicly accessible")
print("=" * 80)
if uploaded_url:
    try:
        file_url = f"{BASE_URL}{uploaded_url}"
        response = requests.get(file_url, timeout=10)
        
        passed = (
            response.status_code == 200 and
            len(response.content) > 0 and
            response.headers.get('content-type', '').startswith('image/')
        )
        
        test_result("GET uploaded file URL", passed, 
                   f"URL: {file_url}, Status: {response.status_code}, Size: {len(response.content)} bytes")
        
    except Exception as e:
        test_result("GET uploaded file URL", False, f"Exception: {str(e)}")
else:
    test_result("GET uploaded file URL", False, "No uploaded URL to test")

# Test 1.3: Verify file exists on filesystem
print("\n" + "=" * 80)
print("TEST 1.3: Verify file saved to /app/public/uploads/")
print("=" * 80)
if uploaded_url:
    try:
        # Extract filename from URL
        filename = uploaded_url.split('/')[-1]
        filepath = f"/app/public/uploads/{filename}"
        
        file_exists = os.path.exists(filepath)
        
        if file_exists:
            file_size = os.path.getsize(filepath)
            test_result("File saved to filesystem", True, 
                       f"File exists at {filepath}, Size: {file_size} bytes")
        else:
            test_result("File saved to filesystem", False, 
                       f"File not found at {filepath}")
        
    except Exception as e:
        test_result("File saved to filesystem", False, f"Exception: {str(e)}")
else:
    test_result("File saved to filesystem", False, "No uploaded URL to verify")

# Test 1.4: POST /api/upload with no file field (expect 400)
print("\n" + "=" * 80)
print("TEST 1.4: POST /api/upload (no file field - expect 400)")
print("=" * 80)
try:
    # Send empty form data
    response = requests.post(f"{API_BASE}/upload", data={}, timeout=10)
    data = response.json()
    
    passed = (
        response.status_code == 400 and
        'error' in data and
        'no file' in data['error'].lower()
    )
    
    test_result("POST /api/upload (no file)", passed, 
               f"Status: {response.status_code}, Error: {data.get('error', 'N/A')}")
    
except Exception as e:
    test_result("POST /api/upload (no file)", False, f"Exception: {str(e)}")

# ============================================================================
# SECTION 2: CHANGE HISTORY TESTS
# ============================================================================
print("\n" + "=" * 80)
print("SECTION 2: CHANGE HISTORY TESTS")
print("=" * 80)

# Test 2.1: GET /api/history (should return array)
print("\n" + "=" * 80)
print("TEST 2.1: GET /api/history")
print("=" * 80)
initial_history_count = 0
try:
    response = requests.get(f"{API_BASE}/history", timeout=10)
    data = response.json()
    
    passed = (
        response.status_code == 200 and
        isinstance(data, list)
    )
    
    # Verify structure of entries if any exist
    if passed and len(data) > 0:
        first_entry = data[0]
        has_required_fields = all(k in first_entry for k in ['id', 'ts', 'entity', 'entityId', 'action', 'label', 'undone'])
        no_mongo_id = '_id' not in first_entry and '_seedVersion' not in first_entry
        passed = passed and has_required_fields and no_mongo_id
        
        initial_history_count = len(data)
        test_result("GET /api/history", True, 
                   f"Found {len(data)} history entries. First entry: entity={first_entry.get('entity')}, action={first_entry.get('action')}, label={first_entry.get('label', 'N/A')[:50]}")
    else:
        test_result("GET /api/history", passed, 
                   f"Status: {response.status_code}, Entries: {len(data)}")
    
except Exception as e:
    test_result("GET /api/history", False, f"Exception: {str(e)}")

# ============================================================================
# SECTION 3: AUTO-HISTORY LOGGING TESTS
# ============================================================================
print("\n" + "=" * 80)
print("SECTION 3: AUTO-HISTORY LOGGING TESTS")
print("=" * 80)

# Store original values for cleanup
original_tagline = None
created_project_id = None
created_team_id = None
created_news_id = None

# Test 3.1: PUT /api/settings and verify history entry
print("\n" + "=" * 80)
print("TEST 3.1: PUT /api/settings + verify history entry")
print("=" * 80)
try:
    # Get original tagline
    response = requests.get(f"{API_BASE}/settings", timeout=10)
    original_settings = response.json()
    original_tagline = original_settings.get('tagline')
    
    # Update tagline
    test_tagline = "HISTORY TEST TAGLINE"
    response = requests.put(f"{API_BASE}/settings", json={"tagline": test_tagline}, timeout=10)
    
    passed = response.status_code == 200
    
    # Check history for this update
    response_history = requests.get(f"{API_BASE}/history", timeout=10)
    history = response_history.json()
    
    # Find the settings update entry
    settings_entry = None
    for entry in history:
        if (entry.get('entity') == 'settings' and 
            entry.get('action') == 'update' and
            'site settings' in entry.get('label', '').lower()):
            settings_entry = entry
            break
    
    if settings_entry:
        has_before_after = 'before' in settings_entry and 'after' in settings_entry
        passed = passed and has_before_after
        test_result("PUT /api/settings + history", True, 
                   f"Settings updated. History entry found: id={settings_entry['id']}, label={settings_entry['label']}, has before/after: {has_before_after}")
    else:
        test_result("PUT /api/settings + history", False, 
                   f"Settings updated but no history entry found for entity='settings', action='update'")
    
except Exception as e:
    test_result("PUT /api/settings + history", False, f"Exception: {str(e)}")

# Test 3.2: POST /api/projects and verify history entry
print("\n" + "=" * 80)
print("TEST 3.2: POST /api/projects + verify history entry")
print("=" * 80)
try:
    project_data = {
        "name": "QA Test Project",
        "slug": "qa-test-project",
        "status": "upcoming",
        "category": "residential",
        "location": "Test Location",
        "reraNumber": "TEST-RERA-001",
        "reraStatus": "Test Status",
        "unitMix": "2 BHK",
        "priceRange": "₹50L - ₹1Cr",
        "heroImage": "",
        "gallery": [],
        "summary": "Test project for QA",
        "amenities": ["Test Amenity"],
        "milestones": []
    }
    
    response = requests.post(f"{API_BASE}/projects", json=project_data, timeout=10)
    data = response.json()
    
    passed = response.status_code == 200 and 'id' in data
    
    if passed:
        created_project_id = data['id']
        
        # Check history
        response_history = requests.get(f"{API_BASE}/history", timeout=10)
        history = response_history.json()
        
        project_entry = None
        for entry in history:
            if (entry.get('entity') == 'projects' and 
                entry.get('action') == 'create' and
                entry.get('entityId') == created_project_id):
                project_entry = entry
                break
        
        if project_entry:
            test_result("POST /api/projects + history", True, 
                       f"Project created: {created_project_id}. History entry found: label={project_entry['label']}")
        else:
            test_result("POST /api/projects + history", False, 
                       f"Project created but no history entry found")
    else:
        test_result("POST /api/projects + history", False, 
                   f"Status: {response.status_code}")
    
except Exception as e:
    test_result("POST /api/projects + history", False, f"Exception: {str(e)}")

# Test 3.3: PUT /api/projects/:id and verify history entry
print("\n" + "=" * 80)
print("TEST 3.3: PUT /api/projects/:id + verify history entry")
print("=" * 80)
if created_project_id:
    try:
        update_data = {"constructionPercent": 25}
        response = requests.put(f"{API_BASE}/projects/{created_project_id}", json=update_data, timeout=10)
        
        passed = response.status_code == 200
        
        # Check history
        response_history = requests.get(f"{API_BASE}/history", timeout=10)
        history = response_history.json()
        
        update_entry = None
        for entry in history:
            if (entry.get('entity') == 'projects' and 
                entry.get('action') == 'update' and
                entry.get('entityId') == created_project_id):
                update_entry = entry
                break
        
        if update_entry:
            test_result("PUT /api/projects/:id + history", True, 
                       f"Project updated. History entry found: label={update_entry['label']}")
        else:
            test_result("PUT /api/projects/:id + history", False, 
                       f"Project updated but no history entry found")
        
    except Exception as e:
        test_result("PUT /api/projects/:id + history", False, f"Exception: {str(e)}")
else:
    test_result("PUT /api/projects/:id + history", False, "No project ID to test")

# Test 3.4: POST /api/team and verify history entry
print("\n" + "=" * 80)
print("TEST 3.4: POST /api/team + verify history entry")
print("=" * 80)
try:
    team_data = {
        "name": "QA Test Member",
        "role": "QA Engineer",
        "bio": "Test bio",
        "photo": "",
        "linkedin": "#"
    }
    
    response = requests.post(f"{API_BASE}/team", json=team_data, timeout=10)
    data = response.json()
    
    passed = response.status_code == 200 and 'id' in data
    
    if passed:
        created_team_id = data['id']
        
        # Check history
        response_history = requests.get(f"{API_BASE}/history", timeout=10)
        history = response_history.json()
        
        team_entry = None
        for entry in history:
            if (entry.get('entity') == 'team' and 
                entry.get('action') == 'create' and
                entry.get('entityId') == created_team_id):
                team_entry = entry
                break
        
        if team_entry:
            test_result("POST /api/team + history", True, 
                       f"Team member created: {created_team_id}. History entry found: label={team_entry['label']}")
        else:
            test_result("POST /api/team + history", False, 
                       f"Team member created but no history entry found")
    else:
        test_result("POST /api/team + history", False, 
                   f"Status: {response.status_code}")
    
except Exception as e:
    test_result("POST /api/team + history", False, f"Exception: {str(e)}")

# Test 3.5: POST /api/news and verify history entry
print("\n" + "=" * 80)
print("TEST 3.5: POST /api/news + verify history entry")
print("=" * 80)
try:
    news_data = {
        "date": "2025-06-15",
        "title": "QA Test News Item",
        "category": "Test"
    }
    
    response = requests.post(f"{API_BASE}/news", json=news_data, timeout=10)
    data = response.json()
    
    passed = response.status_code == 200 and 'id' in data
    
    if passed:
        created_news_id = data['id']
        
        # Check history
        response_history = requests.get(f"{API_BASE}/history", timeout=10)
        history = response_history.json()
        
        news_entry = None
        for entry in history:
            if (entry.get('entity') == 'news' and 
                entry.get('action') == 'create' and
                entry.get('entityId') == created_news_id):
                news_entry = entry
                break
        
        if news_entry:
            test_result("POST /api/news + history", True, 
                       f"News created: {created_news_id}. History entry found: label={news_entry['label']}")
        else:
            test_result("POST /api/news + history", False, 
                       f"News created but no history entry found")
    else:
        test_result("POST /api/news + history", False, 
                   f"Status: {response.status_code}")
    
except Exception as e:
    test_result("POST /api/news + history", False, f"Exception: {str(e)}")

# ============================================================================
# SECTION 4: UNDO FUNCTIONALITY TESTS
# ============================================================================
print("\n" + "=" * 80)
print("SECTION 4: UNDO FUNCTIONALITY TESTS")
print("=" * 80)

# Test 4.1: Undo settings update (restore original tagline)
print("\n" + "=" * 80)
print("TEST 4.1: POST /api/history/:id/undo (settings update)")
print("=" * 80)
try:
    # Find the settings update history entry
    response_history = requests.get(f"{API_BASE}/history", timeout=10)
    history = response_history.json()
    
    settings_entry = None
    for entry in history:
        if (entry.get('entity') == 'settings' and 
            entry.get('action') == 'update' and
            entry.get('undone') == False):
            settings_entry = entry
            break
    
    if settings_entry:
        history_id = settings_entry['id']
        
        # Perform undo
        response = requests.post(f"{API_BASE}/history/{history_id}/undo", timeout=10)
        data = response.json()
        
        passed = response.status_code == 200 and data.get('ok') == True
        
        if passed:
            # Verify settings were restored
            response_settings = requests.get(f"{API_BASE}/settings", timeout=10)
            current_settings = response_settings.json()
            current_tagline = current_settings.get('tagline')
            
            # Check if tagline was restored to original
            restored = current_tagline == original_tagline
            
            # Verify history entry is marked as undone
            response_history2 = requests.get(f"{API_BASE}/history", timeout=10)
            history2 = response_history2.json()
            
            undone_entry = None
            for entry in history2:
                if entry.get('id') == history_id:
                    undone_entry = entry
                    break
            
            is_marked_undone = undone_entry and undone_entry.get('undone') == True
            
            test_result("Undo settings update", restored and is_marked_undone, 
                       f"Undo successful. Tagline restored: {restored} (current: {current_tagline}, original: {original_tagline}), Marked undone: {is_marked_undone}")
        else:
            test_result("Undo settings update", False, 
                       f"Status: {response.status_code}, Response: {json.dumps(data)}")
    else:
        test_result("Undo settings update", False, "No settings update history entry found to undo")
    
except Exception as e:
    test_result("Undo settings update", False, f"Exception: {str(e)}")

# Test 4.2: Attempt to undo the same entry again (expect 400)
print("\n" + "=" * 80)
print("TEST 4.2: POST /api/history/:id/undo (already undone - expect 400)")
print("=" * 80)
try:
    # Find an undone entry
    response_history = requests.get(f"{API_BASE}/history", timeout=10)
    history = response_history.json()
    
    undone_entry = None
    for entry in history:
        if entry.get('undone') == True:
            undone_entry = entry
            break
    
    if undone_entry:
        history_id = undone_entry['id']
        
        response = requests.post(f"{API_BASE}/history/{history_id}/undo", timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 400 and
            'error' in data and
            'already undone' in data['error'].lower()
        )
        
        test_result("Undo already undone entry", passed, 
                   f"Status: {response.status_code}, Error: {data.get('error', 'N/A')}")
    else:
        test_result("Undo already undone entry", False, "No undone entry found to test")
    
except Exception as e:
    test_result("Undo already undone entry", False, f"Exception: {str(e)}")

# Test 4.3: Undo nonexistent history entry (expect 404)
print("\n" + "=" * 80)
print("TEST 4.3: POST /api/history/nonexistent-id/undo (expect 404)")
print("=" * 80)
try:
    response = requests.post(f"{API_BASE}/history/nonexistent-id-12345/undo", timeout=10)
    data = response.json()
    
    passed = (
        response.status_code == 404 and
        'error' in data
    )
    
    test_result("Undo nonexistent entry", passed, 
               f"Status: {response.status_code}, Error: {data.get('error', 'N/A')}")
    
except Exception as e:
    test_result("Undo nonexistent entry", False, f"Exception: {str(e)}")

# Test 4.4: Undo CREATE (delete the created project)
print("\n" + "=" * 80)
print("TEST 4.4: Undo CREATE (delete created project)")
print("=" * 80)
if created_project_id:
    try:
        # Find the project create history entry
        response_history = requests.get(f"{API_BASE}/history", timeout=10)
        history = response_history.json()
        
        create_entry = None
        for entry in history:
            if (entry.get('entity') == 'projects' and 
                entry.get('action') == 'create' and
                entry.get('entityId') == created_project_id and
                entry.get('undone') == False):
                create_entry = entry
                break
        
        if create_entry:
            history_id = create_entry['id']
            
            # Perform undo
            response = requests.post(f"{API_BASE}/history/{history_id}/undo", timeout=10)
            data = response.json()
            
            passed = response.status_code == 200 and data.get('ok') == True
            
            if passed:
                # Verify project was deleted
                response_project = requests.get(f"{API_BASE}/projects/{created_project_id}", timeout=10)
                project_deleted = response_project.status_code == 404
                
                test_result("Undo CREATE (delete project)", project_deleted, 
                           f"Undo successful. Project deleted: {project_deleted}")
            else:
                test_result("Undo CREATE (delete project)", False, 
                           f"Status: {response.status_code}, Response: {json.dumps(data)}")
        else:
            test_result("Undo CREATE (delete project)", False, "No project create history entry found")
        
    except Exception as e:
        test_result("Undo CREATE (delete project)", False, f"Exception: {str(e)}")
else:
    test_result("Undo CREATE (delete project)", False, "No project ID to test")

# Test 4.5: DELETE then UNDO (restore deleted team member)
print("\n" + "=" * 80)
print("TEST 4.5: DELETE team member then UNDO (restore)")
print("=" * 80)
if created_team_id:
    try:
        # First, delete the team member
        response_delete = requests.delete(f"{API_BASE}/team/{created_team_id}", timeout=10)
        delete_passed = response_delete.status_code == 200
        
        if delete_passed:
            # Verify deletion
            response_team = requests.get(f"{API_BASE}/team", timeout=10)
            team_list = response_team.json()
            deleted = not any(t.get('id') == created_team_id for t in team_list)
            
            if deleted:
                # Find the delete history entry
                response_history = requests.get(f"{API_BASE}/history", timeout=10)
                history = response_history.json()
                
                delete_entry = None
                for entry in history:
                    if (entry.get('entity') == 'team' and 
                        entry.get('action') == 'delete' and
                        entry.get('entityId') == created_team_id and
                        entry.get('undone') == False):
                        delete_entry = entry
                        break
                
                if delete_entry:
                    history_id = delete_entry['id']
                    
                    # Perform undo (restore)
                    response_undo = requests.post(f"{API_BASE}/history/{history_id}/undo", timeout=10)
                    undo_data = response_undo.json()
                    
                    undo_passed = response_undo.status_code == 200 and undo_data.get('ok') == True
                    
                    if undo_passed:
                        # Verify team member was restored
                        response_team2 = requests.get(f"{API_BASE}/team", timeout=10)
                        team_list2 = response_team2.json()
                        restored = any(t.get('id') == created_team_id and t.get('name') == 'QA Test Member' for t in team_list2)
                        
                        test_result("DELETE then UNDO (restore team)", restored, 
                                   f"Team member deleted then restored: {restored}")
                    else:
                        test_result("DELETE then UNDO (restore team)", False, 
                                   f"Undo failed. Status: {response_undo.status_code}")
                else:
                    test_result("DELETE then UNDO (restore team)", False, "No delete history entry found")
            else:
                test_result("DELETE then UNDO (restore team)", False, "Team member not deleted")
        else:
            test_result("DELETE then UNDO (restore team)", False, 
                       f"Delete failed. Status: {response_delete.status_code}")
        
    except Exception as e:
        test_result("DELETE then UNDO (restore team)", False, f"Exception: {str(e)}")
else:
    test_result("DELETE then UNDO (restore team)", False, "No team ID to test")

# ============================================================================
# SECTION 5: REGRESSION TESTS
# ============================================================================
print("\n" + "=" * 80)
print("SECTION 5: REGRESSION TESTS (verify existing endpoints still work)")
print("=" * 80)

# Test 5.1: GET /api/settings
print("\n" + "=" * 80)
print("TEST 5.1: GET /api/settings (regression)")
print("=" * 80)
try:
    response = requests.get(f"{API_BASE}/settings", timeout=10)
    data = response.json()
    
    passed = (
        response.status_code == 200 and
        data.get('brandName') == 'Gillco Group' and
        data.get('phone') == '+91 90417 95879' and
        data.get('email') == 'support@gillcogroup.org'
    )
    
    test_result("GET /api/settings (regression)", passed, 
               f"brandName: {data.get('brandName')}, phone: {data.get('phone')}, email: {data.get('email')}")
    
except Exception as e:
    test_result("GET /api/settings (regression)", False, f"Exception: {str(e)}")

# Test 5.2: GET /api/projects (verify 8 seeded projects)
print("\n" + "=" * 80)
print("TEST 5.2: GET /api/projects (regression - 8 projects)")
print("=" * 80)
try:
    response = requests.get(f"{API_BASE}/projects", timeout=10)
    data = response.json()
    
    # Count only seeded projects (not QA test projects)
    seeded_ids = ['meraqui', 'parkhills', 'industrial-park', 'villas', 'floors', 'towers', 'heights', 'palms']
    seeded_projects = [p for p in data if p.get('id') in seeded_ids]
    
    passed = (
        response.status_code == 200 and
        len(seeded_projects) == 8
    )
    
    test_result("GET /api/projects (regression)", passed, 
               f"Found {len(seeded_projects)} seeded projects (total: {len(data)})")
    
except Exception as e:
    test_result("GET /api/projects (regression)", False, f"Exception: {str(e)}")

# Test 5.3: GET /api/news
print("\n" + "=" * 80)
print("TEST 5.3: GET /api/news (regression)")
print("=" * 80)
try:
    response = requests.get(f"{API_BASE}/news", timeout=10)
    data = response.json()
    
    passed = (
        response.status_code == 200 and
        isinstance(data, list) and
        len(data) >= 6  # At least 6 seeded items
    )
    
    test_result("GET /api/news (regression)", passed, 
               f"Found {len(data)} news items")
    
except Exception as e:
    test_result("GET /api/news (regression)", False, f"Exception: {str(e)}")

# Test 5.4: GET /api/team
print("\n" + "=" * 80)
print("TEST 5.4: GET /api/team (regression)")
print("=" * 80)
try:
    response = requests.get(f"{API_BASE}/team", timeout=10)
    data = response.json()
    
    passed = (
        response.status_code == 200 and
        isinstance(data, list) and
        len(data) >= 3  # At least 3 seeded members
    )
    
    test_result("GET /api/team (regression)", passed, 
               f"Found {len(data)} team members")
    
except Exception as e:
    test_result("GET /api/team (regression)", False, f"Exception: {str(e)}")

# Test 5.5: POST /api/admin/login
print("\n" + "=" * 80)
print("TEST 5.5: POST /api/admin/login (regression)")
print("=" * 80)
try:
    response = requests.post(f"{API_BASE}/admin/login", json={"password": "gillco2025"}, timeout=10)
    data = response.json()
    
    passed = (
        response.status_code == 200 and
        data.get('ok') == True
    )
    
    test_result("POST /api/admin/login (regression)", passed, 
               f"Status: {response.status_code}, ok: {data.get('ok')}")
    
except Exception as e:
    test_result("POST /api/admin/login (regression)", False, f"Exception: {str(e)}")

# Test 5.6: POST /api/enquiries
print("\n" + "=" * 80)
print("TEST 5.6: POST /api/enquiries (regression)")
print("=" * 80)
try:
    enquiry_data = {
        "name": "Regression Test User",
        "phone": "8888888888",
        "email": "regression@test.com",
        "consent": True
    }
    response = requests.post(f"{API_BASE}/enquiries", json=enquiry_data, timeout=10)
    data = response.json()
    
    passed = (
        response.status_code == 200 and
        'id' in data
    )
    
    test_result("POST /api/enquiries (regression)", passed, 
               f"Status: {response.status_code}, Created ID: {data.get('id', 'N/A')}")
    
except Exception as e:
    test_result("POST /api/enquiries (regression)", False, f"Exception: {str(e)}")

# ============================================================================
# CLEANUP
# ============================================================================
print("\n" + "=" * 80)
print("CLEANUP: Removing QA test data")
print("=" * 80)

# Delete QA test news if it still exists
if created_news_id:
    try:
        response = requests.delete(f"{API_BASE}/news/{created_news_id}", timeout=10)
        if response.status_code == 200:
            print(f"✅ Deleted QA test news: {created_news_id}")
        else:
            print(f"⚠️  Failed to delete news (may already be deleted): {response.status_code}")
    except Exception as e:
        print(f"⚠️  Exception deleting news: {str(e)}")

# Delete QA test team member if it still exists
if created_team_id:
    try:
        response = requests.delete(f"{API_BASE}/team/{created_team_id}", timeout=10)
        if response.status_code == 200:
            print(f"✅ Deleted QA test team member: {created_team_id}")
        else:
            print(f"⚠️  Failed to delete team member (may already be deleted): {response.status_code}")
    except Exception as e:
        print(f"⚠️  Exception deleting team member: {str(e)}")

# Delete uploaded test image file
if uploaded_url:
    try:
        filename = uploaded_url.split('/')[-1]
        filepath = f"/app/public/uploads/{filename}"
        if os.path.exists(filepath):
            os.remove(filepath)
            print(f"✅ Deleted uploaded test file: {filepath}")
        else:
            print(f"⚠️  Test file not found: {filepath}")
    except Exception as e:
        print(f"⚠️  Exception deleting test file: {str(e)}")

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "=" * 80)
print("🏁 BACKEND API TESTING COMPLETE")
print("=" * 80)
print(f"\n✅ PASSED: {tests_passed}")
print(f"❌ FAILED: {tests_failed}")
print(f"📊 TOTAL: {tests_passed + tests_failed}")

if tests_failed > 0:
    print("\n❌ FAILED TESTS:")
    for result in test_results:
        if not result['passed']:
            print(f"   - {result['name']}")
            if result['details']:
                print(f"     {result['details']}")
else:
    print("\n🎉 ALL TESTS PASSED!")

print("\n" + "=" * 80)
