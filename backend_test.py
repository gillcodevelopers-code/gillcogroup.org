#!/usr/bin/env python3
"""
Backend API Test Suite for Gillco Group CMS
Tests all endpoints as per review request
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/.env')

BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://realty-cms-hub-1.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

print(f"🧪 Testing Gillco CMS Backend APIs")
print(f"📍 Base URL: {API_BASE}")
print("=" * 80)

# Store original values for restoration
original_tagline = None
original_construction_percent = None
created_enquiry_id = None

def test_result(test_name, passed, details=""):
    """Print test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"\n{status} | {test_name}")
    if details:
        print(f"   {details}")
    return passed

# Test 1: GET /api/settings
print("\n" + "=" * 80)
print("TEST 1: GET /api/settings")
print("=" * 80)
try:
    response = requests.get(f"{API_BASE}/settings", timeout=10)
    data = response.json()
    
    passed = (
        response.status_code == 200 and
        data.get('brandName') == 'Gillco Group' and
        'phone' in data and
        'whatsapp' in data and
        'email' in data and
        'address' in data and
        'stats' in data and
        'popup' in data and
        'hero' in data and
        '_id' not in data  # Verify no MongoDB _id leak
    )
    
    if passed:
        original_tagline = data.get('tagline')
        test_result("GET /api/settings", True, 
                   f"brandName: {data.get('brandName')}, tagline: {data.get('tagline')}")
    else:
        test_result("GET /api/settings", False, 
                   f"Status: {response.status_code}, Missing fields or incorrect data")
        print(f"   Response: {json.dumps(data, indent=2)[:500]}")
except Exception as e:
    test_result("GET /api/settings", False, f"Exception: {str(e)}")

# Test 2: PUT /api/settings with updated tagline
print("\n" + "=" * 80)
print("TEST 2: PUT /api/settings (update tagline)")
print("=" * 80)
try:
    update_data = {"tagline": "Updated tagline test"}
    response = requests.put(f"{API_BASE}/settings", json=update_data, timeout=10)
    data = response.json()
    
    passed = (
        response.status_code == 200 and
        data.get('tagline') == "Updated tagline test" and
        '_id' not in data
    )
    
    test_result("PUT /api/settings", passed, 
               f"Updated tagline: {data.get('tagline')}")
    
    # Verify persistence with GET
    response2 = requests.get(f"{API_BASE}/settings", timeout=10)
    data2 = response2.json()
    persistence_passed = data2.get('tagline') == "Updated tagline test"
    test_result("PUT /api/settings - persistence check", persistence_passed,
               f"GET after PUT returned tagline: {data2.get('tagline')}")
    
except Exception as e:
    test_result("PUT /api/settings", False, f"Exception: {str(e)}")

# Test 3: GET /api/projects - verify 8 seeded projects
print("\n" + "=" * 80)
print("TEST 3: GET /api/projects (verify 8 projects)")
print("=" * 80)
try:
    response = requests.get(f"{API_BASE}/projects", timeout=10)
    data = response.json()
    
    expected_ids = ['meraqui', 'parkhills', 'industrial-park', 'villas', 'floors', 'towers', 'heights', 'palms']
    project_ids = [p.get('id') for p in data]
    
    all_present = all(pid in project_ids for pid in expected_ids)
    no_mongo_id = all('_id' not in p for p in data)
    
    passed = (
        response.status_code == 200 and
        len(data) == 8 and
        all_present and
        no_mongo_id
    )
    
    # Verify required fields in first project
    if data:
        first = data[0]
        has_fields = all(k in first for k in ['id', 'name', 'status', 'category', 'location', 
                                               'reraNumber', 'reraStatus', 'reraUpdatedAt', 
                                               'unitMix', 'priceRange', 'heroImage', 
                                               'milestones', 'amenities'])
        passed = passed and has_fields
    
    test_result("GET /api/projects", passed, 
               f"Found {len(data)} projects, IDs: {', '.join(project_ids[:4])}...")
    
    if not all_present:
        missing = [pid for pid in expected_ids if pid not in project_ids]
        print(f"   ⚠️  Missing project IDs: {missing}")
        
except Exception as e:
    test_result("GET /api/projects", False, f"Exception: {str(e)}")

# Test 4: GET /api/projects/meraqui
print("\n" + "=" * 80)
print("TEST 4: GET /api/projects/meraqui")
print("=" * 80)
try:
    response = requests.get(f"{API_BASE}/projects/meraqui", timeout=10)
    data = response.json()
    
    passed = (
        response.status_code == 200 and
        data.get('id') == 'meraqui' and
        data.get('name') == 'Gillco Meraqui' and
        data.get('status') == 'upcoming' and
        data.get('units') == 444 and
        data.get('acres') == 12 and
        data.get('location') == 'Sector 126, Mohali, Punjab' and
        '_id' not in data
    )
    
    if passed:
        original_construction_percent = data.get('constructionPercent')
        test_result("GET /api/projects/meraqui", True, 
                   f"Meraqui: {data.get('units')} units, {data.get('acres')} acres, {data.get('location')}")
    else:
        test_result("GET /api/projects/meraqui", False, 
                   f"Status: {response.status_code}, Data mismatch")
        print(f"   Response: {json.dumps(data, indent=2)[:500]}")
        
except Exception as e:
    test_result("GET /api/projects/meraqui", False, f"Exception: {str(e)}")

# Test 5: PUT /api/projects/meraqui (update constructionPercent)
print("\n" + "=" * 80)
print("TEST 5: PUT /api/projects/meraqui (update constructionPercent)")
print("=" * 80)
try:
    update_data = {"constructionPercent": 15}
    response = requests.put(f"{API_BASE}/projects/meraqui", json=update_data, timeout=10)
    data = response.json()
    
    passed = (
        response.status_code == 200 and
        data.get('constructionPercent') == 15 and
        '_id' not in data
    )
    
    test_result("PUT /api/projects/meraqui", passed, 
               f"Updated constructionPercent: {data.get('constructionPercent')}")
    
    # Verify persistence
    response2 = requests.get(f"{API_BASE}/projects/meraqui", timeout=10)
    data2 = response2.json()
    persistence_passed = data2.get('constructionPercent') == 15
    test_result("PUT /api/projects/meraqui - persistence", persistence_passed,
               f"GET after PUT returned: {data2.get('constructionPercent')}")
    
except Exception as e:
    test_result("PUT /api/projects/meraqui", False, f"Exception: {str(e)}")

# Test 6: POST /api/enquiries with valid data
print("\n" + "=" * 80)
print("TEST 6: POST /api/enquiries (valid data)")
print("=" * 80)
try:
    enquiry_data = {
        "name": "Test User",
        "phone": "9999999999",
        "email": "t@t.com",
        "projectId": "meraqui",
        "message": "Interested",
        "consent": True,
        "type": "api-test",
        "utm": {"utm_source": "test"}
    }
    response = requests.post(f"{API_BASE}/enquiries", json=enquiry_data, timeout=10)
    data = response.json()
    
    passed = (
        response.status_code == 200 and
        'id' in data and
        'createdAt' in data and
        data.get('name') == "Test User" and
        data.get('phone') == "9999999999" and
        '_id' not in data
    )
    
    if passed:
        created_enquiry_id = data.get('id')
        test_result("POST /api/enquiries (valid)", True, 
                   f"Created enquiry ID: {created_enquiry_id}, name: {data.get('name')}")
    else:
        test_result("POST /api/enquiries (valid)", False, 
                   f"Status: {response.status_code}, Missing fields")
        print(f"   Response: {json.dumps(data, indent=2)}")
        
except Exception as e:
    test_result("POST /api/enquiries (valid)", False, f"Exception: {str(e)}")

# Test 7: POST /api/enquiries with missing name/phone (should return 400)
print("\n" + "=" * 80)
print("TEST 7: POST /api/enquiries (missing name/phone - expect 400)")
print("=" * 80)
try:
    invalid_data = {"email": "test@test.com", "message": "No name or phone"}
    response = requests.post(f"{API_BASE}/enquiries", json=invalid_data, timeout=10)
    
    passed = response.status_code == 400
    
    test_result("POST /api/enquiries (invalid)", passed, 
               f"Status: {response.status_code} (expected 400)")
    
except Exception as e:
    test_result("POST /api/enquiries (invalid)", False, f"Exception: {str(e)}")

# Test 8: GET /api/enquiries (verify created enquiry)
print("\n" + "=" * 80)
print("TEST 8: GET /api/enquiries")
print("=" * 80)
try:
    response = requests.get(f"{API_BASE}/enquiries", timeout=10)
    data = response.json()
    
    enquiry_found = False
    if created_enquiry_id:
        enquiry_found = any(e.get('id') == created_enquiry_id for e in data)
    
    no_mongo_id = all('_id' not in e for e in data)
    
    passed = (
        response.status_code == 200 and
        isinstance(data, list) and
        enquiry_found and
        no_mongo_id
    )
    
    test_result("GET /api/enquiries", passed, 
               f"Found {len(data)} enquiries, created enquiry present: {enquiry_found}")
    
except Exception as e:
    test_result("GET /api/enquiries", False, f"Exception: {str(e)}")

# Test 9: GET /api/news (verify 6 news items sorted by date desc)
print("\n" + "=" * 80)
print("TEST 9: GET /api/news")
print("=" * 80)
try:
    response = requests.get(f"{API_BASE}/news", timeout=10)
    data = response.json()
    
    # Check if sorted by date descending
    dates = [n.get('date') for n in data if 'date' in n]
    is_sorted = dates == sorted(dates, reverse=True)
    
    no_mongo_id = all('_id' not in n for n in data)
    
    passed = (
        response.status_code == 200 and
        len(data) == 6 and
        is_sorted and
        no_mongo_id
    )
    
    test_result("GET /api/news", passed, 
               f"Found {len(data)} news items, sorted by date desc: {is_sorted}")
    
    if data:
        print(f"   First news: {data[0].get('title', 'N/A')[:60]}...")
        
except Exception as e:
    test_result("GET /api/news", False, f"Exception: {str(e)}")

# Test 10: GET /api/team (verify 3 team members)
print("\n" + "=" * 80)
print("TEST 10: GET /api/team")
print("=" * 80)
try:
    response = requests.get(f"{API_BASE}/team", timeout=10)
    data = response.json()
    
    expected_names = ['Mr. Ranjit Singh Gill', 'Mrs. Paramjit Gill', 'Mr. Tejpreet Singh Gill']
    team_names = [t.get('name') for t in data]
    
    all_present = all(name in team_names for name in expected_names)
    no_mongo_id = all('_id' not in t for t in data)
    
    passed = (
        response.status_code == 200 and
        len(data) == 3 and
        all_present and
        no_mongo_id
    )
    
    test_result("GET /api/team", passed, 
               f"Found {len(data)} team members: {', '.join(team_names)}")
    
except Exception as e:
    test_result("GET /api/team", False, f"Exception: {str(e)}")

# Test 11: POST /api/admin/login (correct and incorrect password)
print("\n" + "=" * 80)
print("TEST 11: POST /api/admin/login")
print("=" * 80)
try:
    # Test with correct password
    response_correct = requests.post(f"{API_BASE}/admin/login", 
                                    json={"password": "gillco2025"}, timeout=10)
    data_correct = response_correct.json()
    
    correct_passed = (
        response_correct.status_code == 200 and
        data_correct.get('ok') == True
    )
    
    test_result("POST /api/admin/login (correct password)", correct_passed, 
               f"Status: {response_correct.status_code}, ok: {data_correct.get('ok')}")
    
    # Test with wrong password
    response_wrong = requests.post(f"{API_BASE}/admin/login", 
                                  json={"password": "wrongpassword"}, timeout=10)
    data_wrong = response_wrong.json()
    
    wrong_passed = (
        response_wrong.status_code == 401 and
        data_wrong.get('ok') == False
    )
    
    test_result("POST /api/admin/login (wrong password)", wrong_passed, 
               f"Status: {response_wrong.status_code}, ok: {data_wrong.get('ok')}")
    
except Exception as e:
    test_result("POST /api/admin/login", False, f"Exception: {str(e)}")

# Test 12: GET /api/nonexistent (should return 404)
print("\n" + "=" * 80)
print("TEST 12: GET /api/nonexistent (expect 404)")
print("=" * 80)
try:
    response = requests.get(f"{API_BASE}/nonexistent", timeout=10)
    
    passed = response.status_code == 404
    
    test_result("GET /api/nonexistent", passed, 
               f"Status: {response.status_code} (expected 404)")
    
except Exception as e:
    test_result("GET /api/nonexistent", False, f"Exception: {str(e)}")

# CLEANUP: Restore original values
print("\n" + "=" * 80)
print("CLEANUP: Restoring original values")
print("=" * 80)

# Restore tagline
if original_tagline:
    try:
        response = requests.put(f"{API_BASE}/settings", 
                              json={"tagline": original_tagline}, timeout=10)
        if response.status_code == 200:
            print(f"✅ Restored original tagline: {original_tagline}")
        else:
            print(f"⚠️  Failed to restore tagline: {response.status_code}")
    except Exception as e:
        print(f"⚠️  Exception restoring tagline: {str(e)}")

# Restore constructionPercent
if original_construction_percent is not None:
    try:
        response = requests.put(f"{API_BASE}/projects/meraqui", 
                              json={"constructionPercent": original_construction_percent}, 
                              timeout=10)
        if response.status_code == 200:
            print(f"✅ Restored original constructionPercent: {original_construction_percent}")
        else:
            print(f"⚠️  Failed to restore constructionPercent: {response.status_code}")
    except Exception as e:
        print(f"⚠️  Exception restoring constructionPercent: {str(e)}")

print("\n" + "=" * 80)
print("🏁 Backend API Testing Complete")
print("=" * 80)
