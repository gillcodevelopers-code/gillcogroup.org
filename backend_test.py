#!/usr/bin/env python3
"""
Regression test after dependency upgrades (next 15.5.18 -> 15.5.28, jspdf 4.2.1, axios 1.20.0, postcss 8.5.30)
Tests all main backend endpoints and frontend routes to ensure no breaking changes.
"""

import requests
import json
import io
from PIL import Image

# Base URLs
BASE_URL = "http://localhost:3000"
API_URL = f"{BASE_URL}/api"

# Admin password
ADMIN_PASSWORD = "gillco2025"

# Test results tracking
test_results = []
test_enquiry_id = None
uploaded_file_url = None

def log_test(test_name, passed, message=""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    result = f"{status}: {test_name}"
    if message:
        result += f" - {message}"
    print(result)
    test_results.append({"name": test_name, "passed": passed, "message": message})
    return passed

def test_health():
    """Test GET /api/health"""
    try:
        response = requests.get(f"{API_URL}/health", timeout=10)
        passed = response.status_code == 200 and response.json().get("ok") == True and response.json().get("db") == "up"
        log_test("GET /api/health", passed, f"Status: {response.status_code}, Response: {response.json()}")
        return passed
    except Exception as e:
        log_test("GET /api/health", False, f"Error: {str(e)}")
        return False

def test_projects():
    """Test GET /api/projects"""
    try:
        response = requests.get(f"{API_URL}/projects", timeout=10)
        passed = response.status_code == 200 and isinstance(response.json(), list) and len(response.json()) > 0
        log_test("GET /api/projects", passed, f"Status: {response.status_code}, Count: {len(response.json()) if passed else 0}")
        return response.json() if passed else []
    except Exception as e:
        log_test("GET /api/projects", False, f"Error: {str(e)}")
        return []

def test_project_by_slug(slug):
    """Test GET /api/projects/<slug>"""
    try:
        response = requests.get(f"{API_URL}/projects/{slug}", timeout=10)
        passed = response.status_code == 200 and response.json().get("slug") == slug
        log_test(f"GET /api/projects/{slug}", passed, f"Status: {response.status_code}, Name: {response.json().get('name', 'N/A') if passed else 'N/A'}")
        return passed
    except Exception as e:
        log_test(f"GET /api/projects/{slug}", False, f"Error: {str(e)}")
        return False

def test_settings():
    """Test GET /api/settings"""
    try:
        response = requests.get(f"{API_URL}/settings", timeout=10)
        passed = response.status_code == 200 and response.json().get("brandName") is not None
        log_test("GET /api/settings", passed, f"Status: {response.status_code}, Brand: {response.json().get('brandName', 'N/A') if passed else 'N/A'}")
        return passed
    except Exception as e:
        log_test("GET /api/settings", False, f"Error: {str(e)}")
        return False

def test_news():
    """Test GET /api/news"""
    try:
        response = requests.get(f"{API_URL}/news", timeout=10)
        passed = response.status_code == 200 and isinstance(response.json(), list)
        log_test("GET /api/news", passed, f"Status: {response.status_code}, Count: {len(response.json()) if passed else 0}")
        return passed
    except Exception as e:
        log_test("GET /api/news", False, f"Error: {str(e)}")
        return False

def test_testimonials():
    """Test GET /api/testimonials"""
    try:
        response = requests.get(f"{API_URL}/testimonials", timeout=10)
        passed = response.status_code == 200 and isinstance(response.json(), list)
        log_test("GET /api/testimonials", passed, f"Status: {response.status_code}, Count: {len(response.json()) if passed else 0}")
        return passed
    except Exception as e:
        log_test("GET /api/testimonials", False, f"Error: {str(e)}")
        return False

def test_posts():
    """Test GET /api/posts (if exists)"""
    try:
        response = requests.get(f"{API_URL}/posts", timeout=10)
        passed = response.status_code == 200 and isinstance(response.json(), list)
        log_test("GET /api/posts", passed, f"Status: {response.status_code}, Count: {len(response.json()) if passed else 0}")
        return passed
    except Exception as e:
        log_test("GET /api/posts", False, f"Error: {str(e)}")
        return False

def test_admin_login_success():
    """Test POST /api/admin/login with correct password"""
    try:
        response = requests.post(f"{API_URL}/admin/login", json={"password": ADMIN_PASSWORD}, timeout=10)
        passed = response.status_code == 200 and response.json().get("ok") == True
        log_test("POST /api/admin/login (correct password)", passed, f"Status: {response.status_code}, ok: {response.json().get('ok', False)}")
        return passed
    except Exception as e:
        log_test("POST /api/admin/login (correct password)", False, f"Error: {str(e)}")
        return False

def test_admin_login_fail():
    """Test POST /api/admin/login with wrong password"""
    try:
        response = requests.post(f"{API_URL}/admin/login", json={"password": "wrongpassword"}, timeout=10)
        passed = response.status_code == 401 and response.json().get("ok") == False
        log_test("POST /api/admin/login (wrong password)", passed, f"Status: {response.status_code}, ok: {response.json().get('ok', True)}")
        return passed
    except Exception as e:
        log_test("POST /api/admin/login (wrong password)", False, f"Error: {str(e)}")
        return False

def test_post_enquiry():
    """Test POST /api/enquiries"""
    global test_enquiry_id
    try:
        payload = {
            "name": "Regression Test",
            "phone": "9999999999",
            "propertyType": "Residential",
            "budget": "1-1.5 Cr",
            "consent": True
        }
        response = requests.post(f"{API_URL}/enquiries", json=payload, timeout=10)
        passed = response.status_code == 200 and response.json().get("id") is not None
        if passed:
            test_enquiry_id = response.json().get("id")
        log_test("POST /api/enquiries", passed, f"Status: {response.status_code}, ID: {test_enquiry_id if passed else 'N/A'}")
        return passed
    except Exception as e:
        log_test("POST /api/enquiries", False, f"Error: {str(e)}")
        return False

def test_get_enquiries():
    """Test GET /api/enquiries and verify posted enquiry"""
    try:
        response = requests.get(f"{API_URL}/enquiries", timeout=10)
        passed = response.status_code == 200 and isinstance(response.json(), list)
        if passed and test_enquiry_id:
            enquiries = response.json()
            found = any(e.get("id") == test_enquiry_id for e in enquiries)
            passed = found
            log_test("GET /api/enquiries (verify posted)", passed, f"Status: {response.status_code}, Found test enquiry: {found}")
        else:
            log_test("GET /api/enquiries", passed, f"Status: {response.status_code}, Count: {len(response.json()) if passed else 0}")
        return passed
    except Exception as e:
        log_test("GET /api/enquiries", False, f"Error: {str(e)}")
        return False

def test_upload_and_retrieve():
    """Test POST /api/upload and GET /api/media/<file>"""
    global uploaded_file_url
    try:
        # Create a small PNG image (10x10 red square)
        img = Image.new('RGB', (10, 10), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)
        
        # Upload
        files = {'file': ('test.png', img_bytes, 'image/png')}
        response = requests.post(f"{API_URL}/upload", files=files, timeout=10)
        upload_passed = response.status_code == 200 and response.json().get("url") is not None
        
        if upload_passed:
            uploaded_file_url = response.json().get("url")
            log_test("POST /api/upload", True, f"Status: {response.status_code}, URL: {uploaded_file_url}")
            
            # Retrieve the uploaded file
            file_url = f"{BASE_URL}{uploaded_file_url}" if uploaded_file_url.startswith("/api") else uploaded_file_url
            retrieve_response = requests.get(file_url, timeout=10)
            retrieve_passed = retrieve_response.status_code == 200 and len(retrieve_response.content) > 0
            log_test(f"GET {uploaded_file_url}", retrieve_passed, f"Status: {retrieve_response.status_code}, Size: {len(retrieve_response.content)} bytes")
            return upload_passed and retrieve_passed
        else:
            log_test("POST /api/upload", False, f"Status: {response.status_code}, Response: {response.text[:200]}")
            return False
    except Exception as e:
        log_test("POST /api/upload", False, f"Error: {str(e)}")
        return False

def test_admin_backup():
    """Test GET /api/admin/backup"""
    try:
        headers = {"x-admin-password": ADMIN_PASSWORD}
        response = requests.get(f"{API_URL}/admin/backup", headers=headers, timeout=30)
        passed = response.status_code == 200 and response.json().get("app") == "gillco-group"
        log_test("GET /api/admin/backup", passed, f"Status: {response.status_code}, Collections: {len(response.json().get('collections', {})) if passed else 0}")
        return passed
    except Exception as e:
        log_test("GET /api/admin/backup", False, f"Error: {str(e)}")
        return False

def test_cron_escalate():
    """Test GET /api/cron/escalate"""
    try:
        response = requests.get(f"{API_URL}/cron/escalate", timeout=10)
        passed = response.status_code == 200 and response.json().get("ok") == True
        log_test("GET /api/cron/escalate", passed, f"Status: {response.status_code}, Response: {response.json()}")
        return passed
    except Exception as e:
        log_test("GET /api/cron/escalate", False, f"Error: {str(e)}")
        return False

def test_notifications_status():
    """Test GET /api/notifications/status"""
    try:
        response = requests.get(f"{API_URL}/notifications/status", timeout=10)
        passed = response.status_code == 200 and "emailConfigured" in response.json()
        log_test("GET /api/notifications/status", passed, f"Status: {response.status_code}, Email configured: {response.json().get('emailConfigured', 'N/A')}")
        return passed
    except Exception as e:
        log_test("GET /api/notifications/status", False, f"Error: {str(e)}")
        return False

def test_delete_enquiry():
    """Test DELETE /api/enquiries/<id> if endpoint exists"""
    if not test_enquiry_id:
        log_test("DELETE /api/enquiries/<id>", False, "No test enquiry ID to delete")
        return False
    
    try:
        response = requests.delete(f"{API_URL}/enquiries/{test_enquiry_id}", timeout=10)
        if response.status_code == 404:
            log_test("DELETE /api/enquiries/<id>", False, "DELETE endpoint not implemented (404)")
            return False
        passed = response.status_code == 200
        log_test("DELETE /api/enquiries/<id>", passed, f"Status: {response.status_code}")
        return passed
    except Exception as e:
        log_test("DELETE /api/enquiries/<id>", False, f"Error: {str(e)}")
        return False

def test_frontend_routes():
    """Test frontend routes"""
    routes = [
        "/",
        "/blog",
        "/emi-calculator",
        "/sitemap.xml",
        "/robots.txt"
    ]
    
    all_passed = True
    for route in routes:
        try:
            response = requests.get(f"{BASE_URL}{route}", timeout=10)
            passed = response.status_code == 200
            log_test(f"GET {route}", passed, f"Status: {response.status_code}")
            all_passed = all_passed and passed
        except Exception as e:
            log_test(f"GET {route}", False, f"Error: {str(e)}")
            all_passed = False
    
    return all_passed

def main():
    """Run all regression tests"""
    print("=" * 80)
    print("REGRESSION TEST SUITE - Dependency Upgrades")
    print("next 15.5.18 -> 15.5.28, jspdf 4.2.1, axios 1.20.0, postcss 8.5.30")
    print("=" * 80)
    print()
    
    print("--- BACKEND API TESTS ---")
    test_health()
    projects = test_projects()
    if projects and len(projects) > 0:
        first_project_slug = projects[0].get("slug", projects[0].get("id"))
        test_project_by_slug(first_project_slug)
    test_settings()
    test_news()
    test_testimonials()
    test_posts()
    test_admin_login_success()
    test_admin_login_fail()
    test_post_enquiry()
    test_get_enquiries()
    test_upload_and_retrieve()
    test_admin_backup()
    test_cron_escalate()
    test_notifications_status()
    
    print()
    print("--- FRONTEND ROUTE TESTS ---")
    test_frontend_routes()
    
    print()
    print("--- CLEANUP ---")
    test_delete_enquiry()
    
    print()
    print("=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    passed_count = sum(1 for r in test_results if r["passed"])
    total_count = len(test_results)
    print(f"Total: {total_count} tests")
    print(f"Passed: {passed_count} tests")
    print(f"Failed: {total_count - passed_count} tests")
    print(f"Success Rate: {(passed_count/total_count*100):.1f}%")
    
    if passed_count == total_count:
        print()
        print("🎉 ALL TESTS PASSED - No regressions detected after dependency upgrades!")
    else:
        print()
        print("⚠️  SOME TESTS FAILED - Review failures above")
        print()
        print("Failed tests:")
        for r in test_results:
            if not r["passed"]:
                print(f"  - {r['name']}: {r['message']}")
    
    print("=" * 80)
    
    return passed_count == total_count

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
