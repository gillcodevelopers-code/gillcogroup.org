#!/usr/bin/env python3
"""
Comprehensive CRUD Test Suite for Gillco Group CMS
Tests all NEW CRUD endpoints as per review request
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/.env')

BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://realty-cms-hub-1.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"

print(f"🧪 Testing Gillco CMS CRUD Endpoints")
print(f"📍 Base URL: {API_BASE}")
print("=" * 80)

# Store IDs for cleanup
created_project_id = None
created_team_id = None
created_news_id = None
original_settings_social = None

test_results = []

def test_result(test_num, test_name, passed, status_code=None, reason=""):
    """Record and print test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    result = {
        "test": test_num,
        "name": test_name,
        "passed": passed,
        "status_code": status_code,
        "reason": reason
    }
    test_results.append(result)
    
    print(f"\n{status} | Test {test_num}: {test_name}")
    if status_code:
        print(f"   Status Code: {status_code}")
    if reason:
        print(f"   {reason}")
    return passed

# ==================== NEW CRUD ENDPOINTS ====================

# Test 1: POST /api/projects (create new project)
print("\n" + "=" * 80)
print("TEST 1: POST /api/projects - Create new project")
print("=" * 80)
try:
    project_data = {
        "name": "QA Test Project",
        "slug": "qa-test-proj",
        "status": "upcoming",
        "category": "residential",
        "location": "QA City",
        "reraNumber": "QA-RERA-001",
        "reraStatus": "Pending",
        "reraUpdatedAt": "2025-01-15",
        "constructionPercent": 0,
        "unitMix": "2 BHK",
        "priceRange": "On Request",
        "acres": 5,
        "towers": 2,
        "units": 100,
        "heroImage": "https://via.placeholder.com/800",
        "summary": "QA created project",
        "amenities": ["Pool"],
        "milestones": [{"date": "2025-01-01", "title": "Kickoff", "done": False}],
        "gallery": [],
        "brochureUrl": ""
    }
    
    response = requests.post(f"{API_BASE}/projects", json=project_data, timeout=10)
    data = response.json()
    
    passed = (
        response.status_code == 200 and
        'id' in data and
        'createdAt' in data and
        data.get('name') == "QA Test Project" and
        data.get('slug') == "qa-test-proj" and
        data.get('status') == "upcoming" and
        data.get('category') == "residential" and
        data.get('location') == "QA City" and
        data.get('reraNumber') == "QA-RERA-001" and
        data.get('constructionPercent') == 0 and
        data.get('units') == 100 and
        '_id' not in data
    )
    
    if passed:
        created_project_id = data.get('id')
        test_result(1, "POST /api/projects", True, response.status_code, 
                   f"Created project ID: {created_project_id}, name: {data.get('name')}")
    else:
        test_result(1, "POST /api/projects", False, response.status_code, 
                   f"Missing fields or incorrect data. Response: {json.dumps(data, indent=2)[:300]}")
        
except Exception as e:
    test_result(1, "POST /api/projects", False, None, f"Exception: {str(e)}")

# Test 2: GET /api/projects - Verify QA Test Project appears in list
print("\n" + "=" * 80)
print("TEST 2: GET /api/projects - Verify QA Test Project in list")
print("=" * 80)
try:
    response = requests.get(f"{API_BASE}/projects", timeout=10)
    data = response.json()
    
    project_found = False
    if created_project_id:
        project_found = any(p.get('id') == created_project_id for p in data)
    
    passed = (
        response.status_code == 200 and
        isinstance(data, list) and
        project_found
    )
    
    test_result(2, "GET /api/projects (verify QA project)", passed, response.status_code,
               f"Found {len(data)} projects, QA Test Project present: {project_found}")
    
except Exception as e:
    test_result(2, "GET /api/projects", False, None, f"Exception: {str(e)}")

# Test 3: GET /api/projects/{id} - Get QA project by ID
print("\n" + "=" * 80)
print("TEST 3: GET /api/projects/{id} - Get QA project by ID")
print("=" * 80)
try:
    if created_project_id:
        response = requests.get(f"{API_BASE}/projects/{created_project_id}", timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get('id') == created_project_id and
            data.get('name') == "QA Test Project" and
            data.get('location') == "QA City" and
            '_id' not in data
        )
        
        test_result(3, f"GET /api/projects/{created_project_id}", passed, response.status_code,
                   f"Retrieved project: {data.get('name')}, location: {data.get('location')}")
    else:
        test_result(3, "GET /api/projects/{id}", False, None, "No project ID from Test 1")
        
except Exception as e:
    test_result(3, "GET /api/projects/{id}", False, None, f"Exception: {str(e)}")

# Test 4: PUT /api/projects/{id} - Update constructionPercent
print("\n" + "=" * 80)
print("TEST 4: PUT /api/projects/{id} - Update constructionPercent to 25")
print("=" * 80)
try:
    if created_project_id:
        update_data = {"constructionPercent": 25}
        response = requests.put(f"{API_BASE}/projects/{created_project_id}", 
                               json=update_data, timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get('constructionPercent') == 25 and
            data.get('id') == created_project_id and
            '_id' not in data
        )
        
        test_result(4, f"PUT /api/projects/{created_project_id}", passed, response.status_code,
                   f"Updated constructionPercent: {data.get('constructionPercent')}")
        
        # Verify persistence
        response2 = requests.get(f"{API_BASE}/projects/{created_project_id}", timeout=10)
        data2 = response2.json()
        persistence_passed = data2.get('constructionPercent') == 25
        
        if persistence_passed:
            print(f"   ✅ Persistence verified: constructionPercent = {data2.get('constructionPercent')}")
        else:
            print(f"   ❌ Persistence failed: constructionPercent = {data2.get('constructionPercent')}")
    else:
        test_result(4, "PUT /api/projects/{id}", False, None, "No project ID from Test 1")
        
except Exception as e:
    test_result(4, "PUT /api/projects/{id}", False, None, f"Exception: {str(e)}")

# Test 5: DELETE /api/projects/{id} - Delete QA project
print("\n" + "=" * 80)
print("TEST 5: DELETE /api/projects/{id} - Delete QA project")
print("=" * 80)
try:
    if created_project_id:
        response = requests.delete(f"{API_BASE}/projects/{created_project_id}", timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get('ok') == True
        )
        
        test_result(5, f"DELETE /api/projects/{created_project_id}", passed, response.status_code,
                   f"Delete response: {data}")
        
        # Verify deletion - GET should return 404
        response2 = requests.get(f"{API_BASE}/projects/{created_project_id}", timeout=10)
        deletion_verified = response2.status_code == 404
        
        if deletion_verified:
            print(f"   ✅ Deletion verified: GET returns 404")
        else:
            print(f"   ❌ Deletion not verified: GET returns {response2.status_code}")
            
        # Clear the ID since it's deleted
        created_project_id = None
    else:
        test_result(5, "DELETE /api/projects/{id}", False, None, "No project ID from Test 1")
        
except Exception as e:
    test_result(5, "DELETE /api/projects/{id}", False, None, f"Exception: {str(e)}")

# Test 6: POST /api/team - Create new team member
print("\n" + "=" * 80)
print("TEST 6: POST /api/team - Create new team member")
print("=" * 80)
try:
    team_data = {
        "name": "QA Member",
        "role": "Test Role",
        "bio": "QA bio",
        "photo": "https://via.placeholder.com/200",
        "linkedin": "#"
    }
    
    response = requests.post(f"{API_BASE}/team", json=team_data, timeout=10)
    data = response.json()
    
    passed = (
        response.status_code == 200 and
        'id' in data and
        data.get('name') == "QA Member" and
        data.get('role') == "Test Role" and
        data.get('bio') == "QA bio" and
        '_id' not in data
    )
    
    if passed:
        created_team_id = data.get('id')
        test_result(6, "POST /api/team", True, response.status_code,
                   f"Created team member ID: {created_team_id}, name: {data.get('name')}")
    else:
        test_result(6, "POST /api/team", False, response.status_code,
                   f"Missing fields or incorrect data. Response: {json.dumps(data, indent=2)[:300]}")
        
except Exception as e:
    test_result(6, "POST /api/team", False, None, f"Exception: {str(e)}")

# Test 7: GET /api/team - Verify QA Member present
print("\n" + "=" * 80)
print("TEST 7: GET /api/team - Verify QA Member present")
print("=" * 80)
try:
    response = requests.get(f"{API_BASE}/team", timeout=10)
    data = response.json()
    
    member_found = False
    if created_team_id:
        member_found = any(t.get('id') == created_team_id for t in data)
    
    passed = (
        response.status_code == 200 and
        isinstance(data, list) and
        member_found
    )
    
    test_result(7, "GET /api/team (verify QA member)", passed, response.status_code,
               f"Found {len(data)} team members, QA Member present: {member_found}")
    
except Exception as e:
    test_result(7, "GET /api/team", False, None, f"Exception: {str(e)}")

# Test 8: PUT /api/team/{id} - Update role
print("\n" + "=" * 80)
print("TEST 8: PUT /api/team/{id} - Update role to 'Updated Role'")
print("=" * 80)
try:
    if created_team_id:
        update_data = {"role": "Updated Role"}
        response = requests.put(f"{API_BASE}/team/{created_team_id}", 
                               json=update_data, timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get('role') == "Updated Role" and
            data.get('id') == created_team_id and
            '_id' not in data
        )
        
        test_result(8, f"PUT /api/team/{created_team_id}", passed, response.status_code,
                   f"Updated role: {data.get('role')}")
    else:
        test_result(8, "PUT /api/team/{id}", False, None, "No team ID from Test 6")
        
except Exception as e:
    test_result(8, "PUT /api/team/{id}", False, None, f"Exception: {str(e)}")

# Test 9: DELETE /api/team/{id} - Delete QA team member
print("\n" + "=" * 80)
print("TEST 9: DELETE /api/team/{id} - Delete QA team member")
print("=" * 80)
try:
    if created_team_id:
        response = requests.delete(f"{API_BASE}/team/{created_team_id}", timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get('ok') == True
        )
        
        test_result(9, f"DELETE /api/team/{created_team_id}", passed, response.status_code,
                   f"Delete response: {data}")
        
        # Verify deletion - GET should not contain the member
        response2 = requests.get(f"{API_BASE}/team", timeout=10)
        data2 = response2.json()
        deletion_verified = not any(t.get('id') == created_team_id for t in data2)
        
        if deletion_verified:
            print(f"   ✅ Deletion verified: Member not in GET /api/team")
        else:
            print(f"   ❌ Deletion not verified: Member still in list")
            
        # Clear the ID since it's deleted
        created_team_id = None
    else:
        test_result(9, "DELETE /api/team/{id}", False, None, "No team ID from Test 6")
        
except Exception as e:
    test_result(9, "DELETE /api/team/{id}", False, None, f"Exception: {str(e)}")

# Test 10: POST /api/news - Create new news item
print("\n" + "=" * 80)
print("TEST 10: POST /api/news - Create new news item")
print("=" * 80)
try:
    news_data = {
        "date": "2025-06-01",
        "title": "QA News",
        "category": "Test"
    }
    
    response = requests.post(f"{API_BASE}/news", json=news_data, timeout=10)
    data = response.json()
    
    passed = (
        response.status_code == 200 and
        'id' in data and
        data.get('title') == "QA News" and
        data.get('date') == "2025-06-01" and
        data.get('category') == "Test" and
        '_id' not in data
    )
    
    if passed:
        created_news_id = data.get('id')
        test_result(10, "POST /api/news", True, response.status_code,
                   f"Created news ID: {created_news_id}, title: {data.get('title')}")
    else:
        test_result(10, "POST /api/news", False, response.status_code,
                   f"Missing fields or incorrect data. Response: {json.dumps(data, indent=2)[:300]}")
        
except Exception as e:
    test_result(10, "POST /api/news", False, None, f"Exception: {str(e)}")

# Test 11: PUT /api/news/{id} - Update title
print("\n" + "=" * 80)
print("TEST 11: PUT /api/news/{id} - Update title to 'QA News Updated'")
print("=" * 80)
try:
    if created_news_id:
        update_data = {"title": "QA News Updated"}
        response = requests.put(f"{API_BASE}/news/{created_news_id}", 
                               json=update_data, timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get('title') == "QA News Updated" and
            data.get('id') == created_news_id and
            '_id' not in data
        )
        
        test_result(11, f"PUT /api/news/{created_news_id}", passed, response.status_code,
                   f"Updated title: {data.get('title')}")
    else:
        test_result(11, "PUT /api/news/{id}", False, None, "No news ID from Test 10")
        
except Exception as e:
    test_result(11, "PUT /api/news/{id}", False, None, f"Exception: {str(e)}")

# Test 12: GET /api/news - Verify sorted by date desc and QA news present
print("\n" + "=" * 80)
print("TEST 12: GET /api/news - Verify sorted by date desc and QA news present")
print("=" * 80)
try:
    response = requests.get(f"{API_BASE}/news", timeout=10)
    data = response.json()
    
    # Check if sorted by date descending
    dates = [n.get('date') for n in data if 'date' in n]
    is_sorted = dates == sorted(dates, reverse=True)
    
    news_found = False
    if created_news_id:
        news_found = any(n.get('id') == created_news_id for n in data)
    
    passed = (
        response.status_code == 200 and
        isinstance(data, list) and
        is_sorted and
        news_found
    )
    
    test_result(12, "GET /api/news (sorted + QA news)", passed, response.status_code,
               f"Found {len(data)} news items, sorted: {is_sorted}, QA news present: {news_found}")
    
except Exception as e:
    test_result(12, "GET /api/news", False, None, f"Exception: {str(e)}")

# Test 13: DELETE /api/news/{id} - Delete QA news
print("\n" + "=" * 80)
print("TEST 13: DELETE /api/news/{id} - Delete QA news")
print("=" * 80)
try:
    if created_news_id:
        response = requests.delete(f"{API_BASE}/news/{created_news_id}", timeout=10)
        data = response.json()
        
        passed = (
            response.status_code == 200 and
            data.get('ok') == True
        )
        
        test_result(13, f"DELETE /api/news/{created_news_id}", passed, response.status_code,
                   f"Delete response: {data}")
        
        # Verify deletion - GET should not contain the news
        response2 = requests.get(f"{API_BASE}/news", timeout=10)
        data2 = response2.json()
        deletion_verified = not any(n.get('id') == created_news_id for n in data2)
        
        if deletion_verified:
            print(f"   ✅ Deletion verified: News not in GET /api/news")
        else:
            print(f"   ❌ Deletion not verified: News still in list")
            
        # Clear the ID since it's deleted
        created_news_id = None
    else:
        test_result(13, "DELETE /api/news/{id}", False, None, "No news ID from Test 10")
        
except Exception as e:
    test_result(13, "DELETE /api/news/{id}", False, None, f"Exception: {str(e)}")

# ==================== REGRESSION TESTS ====================

# Test 14: GET /api/settings - Verify brandName and 10 hero slides
print("\n" + "=" * 80)
print("TEST 14: REGRESSION - GET /api/settings (brandName + 10 hero slides)")
print("=" * 80)
try:
    response = requests.get(f"{API_BASE}/settings", timeout=10)
    data = response.json()
    
    hero_slides_count = len(data.get('hero', {}).get('slides', []))
    
    passed = (
        response.status_code == 200 and
        data.get('brandName') == 'Gillco Group' and
        hero_slides_count == 10 and
        '_id' not in data
    )
    
    if passed:
        original_settings_social = data.get('social', {})
        test_result(14, "GET /api/settings (regression)", True, response.status_code,
                   f"brandName: {data.get('brandName')}, hero slides: {hero_slides_count}")
    else:
        test_result(14, "GET /api/settings (regression)", False, response.status_code,
                   f"brandName: {data.get('brandName')}, hero slides: {hero_slides_count} (expected 10)")
        
except Exception as e:
    test_result(14, "GET /api/settings", False, None, f"Exception: {str(e)}")

# Test 15: PUT /api/settings - Update social.facebook and verify merge
print("\n" + "=" * 80)
print("TEST 15: REGRESSION - PUT /api/settings (merge social.facebook)")
print("=" * 80)
try:
    update_data = {"social": {"facebook": "https://facebook.com/qa"}}
    response = requests.put(f"{API_BASE}/settings", json=update_data, timeout=10)
    data = response.json()
    
    passed = (
        response.status_code == 200 and
        data.get('social', {}).get('facebook') == "https://facebook.com/qa" and
        '_id' not in data
    )
    
    test_result(15, "PUT /api/settings (social merge)", passed, response.status_code,
               f"Updated social.facebook: {data.get('social', {}).get('facebook')}")
    
    # Verify other social platforms still present
    response2 = requests.get(f"{API_BASE}/settings", timeout=10)
    data2 = response2.json()
    social = data2.get('social', {})
    
    other_platforms_present = all(k in social for k in ['instagram', 'linkedin', 'youtube', 'twitter'])
    
    if other_platforms_present:
        print(f"   ✅ Other social platforms preserved: {list(social.keys())}")
    else:
        print(f"   ⚠️  Some social platforms missing: {list(social.keys())}")
    
    # Restore original social
    if original_settings_social:
        requests.put(f"{API_BASE}/settings", 
                    json={"social": original_settings_social}, timeout=10)
        print(f"   ✅ Restored original social settings")
        
except Exception as e:
    test_result(15, "PUT /api/settings", False, None, f"Exception: {str(e)}")

# Test 16: POST /api/enquiries - Verify still works
print("\n" + "=" * 80)
print("TEST 16: REGRESSION - POST /api/enquiries")
print("=" * 80)
try:
    enquiry_data = {
        "name": "Regression Test User",
        "phone": "8888888888",
        "email": "regression@test.com",
        "message": "Regression test enquiry",
        "consent": True
    }
    
    response = requests.post(f"{API_BASE}/enquiries", json=enquiry_data, timeout=10)
    data = response.json()
    
    passed = (
        response.status_code == 200 and
        'id' in data and
        'createdAt' in data and
        data.get('name') == "Regression Test User" and
        data.get('phone') == "8888888888" and
        '_id' not in data
    )
    
    test_result(16, "POST /api/enquiries (regression)", passed, response.status_code,
               f"Created enquiry ID: {data.get('id')}, name: {data.get('name')}")
    
except Exception as e:
    test_result(16, "POST /api/enquiries", False, None, f"Exception: {str(e)}")

# Test 17: POST /api/admin/login - Verify still works
print("\n" + "=" * 80)
print("TEST 17: REGRESSION - POST /api/admin/login")
print("=" * 80)
try:
    response = requests.post(f"{API_BASE}/admin/login", 
                            json={"password": "<ADMIN_PASSWORD>"}, timeout=10)
    data = response.json()
    
    passed = (
        response.status_code == 200 and
        data.get('ok') == True
    )
    
    test_result(17, "POST /api/admin/login (regression)", passed, response.status_code,
               f"Login successful: {data.get('ok')}")
    
except Exception as e:
    test_result(17, "POST /api/admin/login", False, None, f"Exception: {str(e)}")

# ==================== CLEANUP ====================
print("\n" + "=" * 80)
print("CLEANUP: Removing any remaining test data")
print("=" * 80)

# Clean up any remaining test data
if created_project_id:
    try:
        requests.delete(f"{API_BASE}/projects/{created_project_id}", timeout=10)
        print(f"✅ Cleaned up project: {created_project_id}")
    except Exception:
        pass

if created_team_id:
    try:
        requests.delete(f"{API_BASE}/team/{created_team_id}", timeout=10)
        print(f"✅ Cleaned up team member: {created_team_id}")
    except Exception:
        pass

if created_news_id:
    try:
        requests.delete(f"{API_BASE}/news/{created_news_id}", timeout=10)
        print(f"✅ Cleaned up news: {created_news_id}")
    except Exception:
        pass

# ==================== SUMMARY ====================
print("\n" + "=" * 80)
print("📊 TEST SUMMARY")
print("=" * 80)

passed_count = sum(1 for r in test_results if r['passed'])
failed_count = len(test_results) - passed_count

print(f"\nTotal Tests: {len(test_results)}")
print(f"✅ Passed: {passed_count}")
print(f"❌ Failed: {failed_count}")

if failed_count > 0:
    print("\n❌ FAILED TESTS:")
    for r in test_results:
        if not r['passed']:
            print(f"   Test {r['test']}: {r['name']}")
            print(f"      Status: {r['status_code']}, Reason: {r['reason']}")

print("\n" + "=" * 80)
print("🏁 CRUD Testing Complete")
print("=" * 80)

# Exit with appropriate code
exit(0 if failed_count == 0 else 1)
