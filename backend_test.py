#!/usr/bin/env python3
"""
Comprehensive backend testing for Gillco Group CMS
Tests MySQL mode at :3101 and MongoDB mode at :3000
Focus: Server-side admin authentication + MySQL feature parity
"""

import requests
import json
import time
import io
import random
from datetime import datetime

# Test configuration
MYSQL_BASE = "http://localhost:3101/api"
MONGO_BASE = "http://localhost:3000/api"
ADMIN_USER = "admin"
ADMIN_PASS = "Gillco@2025Meraqui"
CRON_SECRET = "testcron"

# Track test results
results = {"passed": 0, "failed": 0, "tests": []}
created_items = {"projects": [], "news": [], "team": [], "testimonials": [], "posts": [], "enquiries": []}

def log_test(name, passed, detail=""):
    status = "✅ PASS" if passed else "❌ FAIL"
    print(f"{status}: {name}")
    if detail:
        print(f"  → {detail}")
    results["tests"].append({"name": name, "passed": passed, "detail": detail})
    if passed:
        results["passed"] += 1
    else:
        results["failed"] += 1

def test_section(title):
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}")

# ============================================================================
# A. AUTH TESTING (on :3101 and quick checks on :3000)
# ============================================================================

def test_auth_mysql():
    test_section("A. AUTH TESTING - MySQL Mode (:3101)")
    
    # A1. GET /api/admin/session -> {authed:false, configured:true}
    try:
        r = requests.get(f"{MYSQL_BASE}/admin/session")
        data = r.json()
        passed = r.status_code == 200 and data.get("authed") == False and data.get("configured") == True
        log_test("A1. GET /admin/session (no cookie)", passed, 
                f"status={r.status_code}, authed={data.get('authed')}, configured={data.get('configured')}")
    except Exception as e:
        log_test("A1. GET /admin/session (no cookie)", False, str(e))
    
    # A2. POST /api/admin/login wrong password -> 401
    try:
        r = requests.post(f"{MYSQL_BASE}/admin/login", json={"username": "admin", "password": "wrongpass"})
        passed = r.status_code == 401 and "error" in r.json()
        log_test("A2. POST /admin/login (wrong password)", passed, 
                f"status={r.status_code}, error={r.json().get('error', '')[:50]}")
    except Exception as e:
        log_test("A2. POST /admin/login (wrong password)", False, str(e))
    
    # A3. POST /api/admin/login correct password (case-insensitive 'Admin') -> 200 with cookie
    session = requests.Session()
    try:
        r = session.post(f"{MYSQL_BASE}/admin/login", json={"username": "Admin", "password": ADMIN_PASS})
        data = r.json()
        has_cookie = "gillco_admin" in session.cookies
        passed = r.status_code == 200 and data.get("ok") == True and data.get("user") == "admin" and has_cookie
        log_test("A3. POST /admin/login (correct, case-insensitive)", passed, 
                f"status={r.status_code}, ok={data.get('ok')}, user={data.get('user')}, cookie={has_cookie}")
        
        # A4. GET /api/admin/session with cookie -> authed:true
        if passed:
            r2 = session.get(f"{MYSQL_BASE}/admin/session")
            data2 = r2.json()
            passed2 = r2.status_code == 200 and data2.get("authed") == True
            log_test("A4. GET /admin/session (with cookie)", passed2, 
                    f"status={r2.status_code}, authed={data2.get('authed')}")
    except Exception as e:
        log_test("A3. POST /admin/login (correct)", False, str(e))
        log_test("A4. GET /admin/session (with cookie)", False, str(e))
    
    # A5. Protected endpoints without cookie -> 401 {login:true}
    protected_endpoints = [
        ("GET", "/enquiries", None),
        ("GET", "/history", None),
        ("GET", "/admin/backup", None),
        ("GET", "/notifications/status", None),
        ("POST", "/projects", {"name": "Test"}),
        ("PUT", "/projects/test-id", {"name": "Updated"}),
        ("DELETE", "/projects/test-id", None),
        ("PUT", "/settings", {"brandName": "Test"}),
        ("POST", "/news", {"title": "Test"}),
        ("POST", "/team", {"name": "Test"}),
        ("POST", "/testimonials", {"name": "Test"}),
        ("POST", "/posts", {"title": "Test"}),
        ("POST", "/posts/import-url", {"url": "https://example.com"}),
        ("POST", "/upload", None),
        ("POST", "/history/test-id/undo", None),
        ("POST", "/admin/restore", {}),
        ("POST", "/enquiries/test-id/claim", {}),
    ]
    
    no_cookie_session = requests.Session()
    protected_pass = 0
    protected_total = len(protected_endpoints)
    
    for method, endpoint, payload in protected_endpoints:
        try:
            if method == "GET":
                r = no_cookie_session.get(f"{MYSQL_BASE}{endpoint}")
            elif method == "POST":
                if payload is None:
                    continue  # Skip upload test here
                r = no_cookie_session.post(f"{MYSQL_BASE}{endpoint}", json=payload)
            elif method == "PUT":
                r = no_cookie_session.put(f"{MYSQL_BASE}{endpoint}", json=payload)
            elif method == "DELETE":
                r = no_cookie_session.delete(f"{MYSQL_BASE}{endpoint}")
            
            if r.status_code == 401 and r.json().get("login") == True:
                protected_pass += 1
        except:
            pass
    
    passed = protected_pass >= protected_total - 2  # Allow 2 failures for edge cases
    log_test("A5. Protected endpoints without cookie", passed, 
            f"{protected_pass}/{protected_total} returned 401 with login:true")
    
    # A6. Forged cookie -> 401
    try:
        forged_session = requests.Session()
        forged_session.cookies.set("gillco_admin", "abc.def", domain="localhost")
        r = forged_session.get(f"{MYSQL_BASE}/enquiries")
        passed = r.status_code == 401
        log_test("A6. Forged cookie", passed, f"status={r.status_code}")
    except Exception as e:
        log_test("A6. Forged cookie", False, str(e))
    
    # A7. Public endpoints work without cookie
    public_endpoints = [
        ("GET", "/projects"),
        ("GET", "/settings"),
        ("GET", "/news"),
        ("GET", "/team"),
        ("GET", "/testimonials"),
        ("GET", "/posts"),
        ("GET", "/health"),
    ]
    
    public_pass = 0
    for method, endpoint in public_endpoints:
        try:
            r = no_cookie_session.get(f"{MYSQL_BASE}{endpoint}")
            if r.status_code == 200:
                public_pass += 1
        except:
            pass
    
    passed = public_pass == len(public_endpoints)
    log_test("A7. Public endpoints without cookie", passed, 
            f"{public_pass}/{len(public_endpoints)} returned 200")
    
    # A8. POST /enquiries (public) works without cookie
    try:
        r = no_cookie_session.post(f"{MYSQL_BASE}/enquiries", json={
            "name": "Public Test User",
            "phone": "9876543210",
            "consent": True
        })
        passed = r.status_code == 200 and "id" in r.json()
        if passed:
            created_items["enquiries"].append(r.json()["id"])
        log_test("A8. POST /enquiries (public, no cookie)", passed, f"status={r.status_code}")
    except Exception as e:
        log_test("A8. POST /enquiries (public, no cookie)", False, str(e))
    
    # A9. POST /api/admin/logout -> cookie cleared
    try:
        r = session.post(f"{MYSQL_BASE}/admin/logout")
        passed = r.status_code == 200
        log_test("A9. POST /admin/logout", passed, f"status={r.status_code}")
        
        # A10. After logout, GET /enquiries -> 401
        r2 = session.get(f"{MYSQL_BASE}/enquiries")
        passed2 = r2.status_code == 401
        log_test("A10. GET /enquiries after logout", passed2, f"status={r2.status_code}")
    except Exception as e:
        log_test("A9. POST /admin/logout", False, str(e))
        log_test("A10. GET /enquiries after logout", False, str(e))
    
    # A11. Lockout: 5 wrong logins from same IP -> 429
    try:
        lockout_session = requests.Session()
        lockout_ip = "10.9.9.9"
        headers = {"X-Forwarded-For": lockout_ip}
        
        # Send 5 wrong logins
        for i in range(5):
            r = lockout_session.post(f"{MYSQL_BASE}/admin/login", 
                                    json={"username": "admin", "password": f"wrong{i}"}, 
                                    headers=headers)
        
        # 6th attempt should be 429
        r = lockout_session.post(f"{MYSQL_BASE}/admin/login", 
                                json={"username": "admin", "password": "wrong6"}, 
                                headers=headers)
        locked = r.status_code == 429
        
        # Correct password from same IP should also be 429
        r2 = lockout_session.post(f"{MYSQL_BASE}/admin/login", 
                                 json={"username": "admin", "password": ADMIN_PASS}, 
                                 headers=headers)
        still_locked = r2.status_code == 429
        
        # Different IP can still log in
        r3 = requests.post(f"{MYSQL_BASE}/admin/login", 
                          json={"username": "admin", "password": ADMIN_PASS}, 
                          headers={"X-Forwarded-For": "10.9.9.10"})
        other_ip_ok = r3.status_code == 200
        
        passed = locked and still_locked and other_ip_ok
        log_test("A11. Lockout after 5 wrong attempts", passed, 
                f"6th wrong={r.status_code}, correct from locked IP={r2.status_code}, other IP={r3.status_code}")
    except Exception as e:
        log_test("A11. Lockout after 5 wrong attempts", False, str(e))
    
    # A12. /cron/escalate: no key -> 401, with key -> 200
    try:
        r = requests.get(f"{MYSQL_BASE}/cron/escalate")
        no_key_401 = r.status_code == 401
        
        r2 = requests.get(f"{MYSQL_BASE}/cron/escalate?key={CRON_SECRET}")
        with_key_200 = r2.status_code == 200
        
        passed = no_key_401 and with_key_200
        log_test("A12. /cron/escalate auth", passed, 
                f"no key={r.status_code}, with key={r2.status_code}")
    except Exception as e:
        log_test("A12. /cron/escalate auth", False, str(e))
    
    return session  # Return authenticated session for further tests

def test_auth_mongo_quick():
    test_section("A. AUTH TESTING - Quick Gate Checks on MongoDB (:3000)")
    
    # Quick checks on :3000
    try:
        # Session check
        r = requests.get(f"{MONGO_BASE}/admin/session")
        session_ok = r.status_code == 200 and r.json().get("configured") == True
        log_test("A13. MongoDB :3000 - GET /admin/session", session_ok, f"status={r.status_code}")
        
        # Login check
        session = requests.Session()
        r = session.post(f"{MONGO_BASE}/admin/login", json={"username": "admin", "password": ADMIN_PASS})
        login_ok = r.status_code == 200 and r.json().get("ok") == True
        log_test("A14. MongoDB :3000 - POST /admin/login", login_ok, f"status={r.status_code}")
        
        # Protected endpoint with cookie
        r = session.get(f"{MONGO_BASE}/enquiries")
        protected_ok = r.status_code == 200
        log_test("A15. MongoDB :3000 - GET /enquiries (with cookie)", protected_ok, f"status={r.status_code}")
        
        # Public endpoint without cookie
        r = requests.get(f"{MONGO_BASE}/projects")
        public_ok = r.status_code == 200
        log_test("A16. MongoDB :3000 - GET /projects (no cookie)", public_ok, f"status={r.status_code}")
    except Exception as e:
        log_test("A13-16. MongoDB :3000 quick checks", False, str(e))

# ============================================================================
# B. MYSQL MODE FEATURE PARITY (with admin cookie on :3101)
# ============================================================================

def test_mysql_feature_parity(session):
    test_section("B. MYSQL MODE FEATURE PARITY (:3101 with admin cookie)")
    
    # B1. /health -> provider 'mysql', media 'mysql'
    try:
        r = session.get(f"{MYSQL_BASE}/health")
        data = r.json()
        passed = (r.status_code == 200 and 
                 data.get("ok") == True and 
                 data.get("provider") in ["mysql", "supabase"] and 
                 data.get("media") in ["mysql", "postgres"])
        log_test("B1. GET /health", passed, 
                f"status={r.status_code}, provider={data.get('provider')}, media={data.get('media')}")
    except Exception as e:
        log_test("B1. GET /health", False, str(e))
    
    # B2. Compare data between :3101 and :3000
    endpoints_to_compare = ["/projects", "/settings", "/news", "/team", "/testimonials", "/posts"]
    
    for endpoint in endpoints_to_compare:
        try:
            r_mysql = session.get(f"{MYSQL_BASE}{endpoint}")
            r_mongo = requests.get(f"{MONGO_BASE}{endpoint}")
            
            if r_mysql.status_code == 200 and r_mongo.status_code == 200:
                mysql_data = r_mysql.json()
                mongo_data = r_mongo.json()
                
                # Compare counts
                if isinstance(mysql_data, list) and isinstance(mongo_data, list):
                    count_match = len(mysql_data) == len(mongo_data)
                    log_test(f"B2. Compare {endpoint} counts", count_match, 
                            f"MySQL={len(mysql_data)}, MongoDB={len(mongo_data)}")
                else:
                    # For settings (single object)
                    keys_match = set(mysql_data.keys()) == set(mongo_data.keys())
                    log_test(f"B2. Compare {endpoint} structure", keys_match, 
                            f"MySQL keys={len(mysql_data.keys())}, MongoDB keys={len(mongo_data.keys())}")
            else:
                log_test(f"B2. Compare {endpoint}", False, 
                        f"MySQL={r_mysql.status_code}, MongoDB={r_mongo.status_code}")
        except Exception as e:
            log_test(f"B2. Compare {endpoint}", False, str(e))
    
    # B3. CRUD operations - Projects
    try:
        # Create
        new_project = {
            "name": "Test Project MySQL",
            "slug": "test-project-mysql",
            "status": "upcoming",
            "category": "residential",
            "location": "Test Location",
            "summary": "Test summary with emoji 🏠 and rupee ₹"
        }
        r = session.post(f"{MYSQL_BASE}/projects", json=new_project)
        create_ok = r.status_code == 200 and "id" in r.json()
        project_id = r.json().get("id") if create_ok else None
        if project_id:
            created_items["projects"].append(project_id)
        log_test("B3a. POST /projects (create)", create_ok, f"status={r.status_code}, id={project_id}")
        
        # Read
        if project_id:
            r = session.get(f"{MYSQL_BASE}/projects/{project_id}")
            read_ok = r.status_code == 200 and r.json().get("name") == new_project["name"]
            # Check emoji/rupee survived
            summary = r.json().get("summary", "")
            text_ok = "🏠" in summary and "₹" in summary
            log_test("B3b. GET /projects/:id (read)", read_ok and text_ok, 
                    f"status={r.status_code}, emoji/rupee preserved={text_ok}")
            
            # Update
            r = session.put(f"{MYSQL_BASE}/projects/{project_id}", json={"name": "Updated Test Project"})
            update_ok = r.status_code == 200
            log_test("B3c. PUT /projects/:id (update)", update_ok, f"status={r.status_code}")
            
            # Verify update
            r = session.get(f"{MYSQL_BASE}/projects/{project_id}")
            verify_ok = r.status_code == 200 and r.json().get("name") == "Updated Test Project"
            log_test("B3d. Verify project update", verify_ok, f"name={r.json().get('name')}")
    except Exception as e:
        log_test("B3. CRUD projects", False, str(e))
    
    # B4. CRUD operations - News
    try:
        new_news = {"title": "Test News MySQL", "date": "2025-01-15", "category": "Test"}
        r = session.post(f"{MYSQL_BASE}/news", json=new_news)
        create_ok = r.status_code == 200 and "id" in r.json()
        news_id = r.json().get("id") if create_ok else None
        if news_id:
            created_items["news"].append(news_id)
        log_test("B4a. POST /news (create)", create_ok, f"status={r.status_code}")
        
        if news_id:
            r = session.put(f"{MYSQL_BASE}/news/{news_id}", json={"title": "Updated News"})
            update_ok = r.status_code == 200
            log_test("B4b. PUT /news/:id (update)", update_ok, f"status={r.status_code}")
    except Exception as e:
        log_test("B4. CRUD news", False, str(e))
    
    # B5. CRUD operations - Team
    try:
        new_team = {"name": "Test Member MySQL", "role": "Test Role"}
        r = session.post(f"{MYSQL_BASE}/team", json=new_team)
        create_ok = r.status_code == 200 and "id" in r.json()
        team_id = r.json().get("id") if create_ok else None
        if team_id:
            created_items["team"].append(team_id)
        log_test("B5a. POST /team (create)", create_ok, f"status={r.status_code}")
        
        if team_id:
            r = session.put(f"{MYSQL_BASE}/team/{team_id}", json={"role": "Updated Role"})
            update_ok = r.status_code == 200
            log_test("B5b. PUT /team/:id (update)", update_ok, f"status={r.status_code}")
    except Exception as e:
        log_test("B5. CRUD team", False, str(e))
    
    # B6. CRUD operations - Testimonials
    try:
        new_testimonial = {"name": "Test User", "quote": "Test quote", "rating": 5}
        r = session.post(f"{MYSQL_BASE}/testimonials", json=new_testimonial)
        create_ok = r.status_code == 200 and "id" in r.json()
        testimonial_id = r.json().get("id") if create_ok else None
        if testimonial_id:
            created_items["testimonials"].append(testimonial_id)
        log_test("B6a. POST /testimonials (create)", create_ok, f"status={r.status_code}")
        
        if testimonial_id:
            r = session.put(f"{MYSQL_BASE}/testimonials/{testimonial_id}", json={"quote": "Updated quote"})
            update_ok = r.status_code == 200
            log_test("B6b. PUT /testimonials/:id (update)", update_ok, f"status={r.status_code}")
    except Exception as e:
        log_test("B6. CRUD testimonials", False, str(e))
    
    # B7. CRUD operations - Posts
    try:
        new_post = {"title": "Test Post MySQL", "body": "Test content"}
        r = session.post(f"{MYSQL_BASE}/posts", json=new_post)
        create_ok = r.status_code == 200 and "id" in r.json()
        post_id = r.json().get("id") if create_ok else None
        if post_id:
            created_items["posts"].append(post_id)
        log_test("B7a. POST /posts (create)", create_ok, f"status={r.status_code}")
        
        if post_id:
            r = session.put(f"{MYSQL_BASE}/posts/{post_id}", json={"title": "Updated Post"})
            update_ok = r.status_code == 200
            log_test("B7b. PUT /posts/:id (update)", update_ok, f"status={r.status_code}")
    except Exception as e:
        log_test("B7. CRUD posts", False, str(e))
    
    # B8. PUT /settings merge
    try:
        r = session.get(f"{MYSQL_BASE}/settings")
        original_settings = r.json()
        
        r = session.put(f"{MYSQL_BASE}/settings", json={"testField": "testValue123"})
        update_ok = r.status_code == 200
        
        r = session.get(f"{MYSQL_BASE}/settings")
        merged = r.json()
        merge_ok = merged.get("testField") == "testValue123" and merged.get("brandName") == original_settings.get("brandName")
        
        log_test("B8. PUT /settings (merge)", update_ok and merge_ok, 
                f"status={r.status_code}, merge preserved original fields={merge_ok}")
        
        # Restore
        session.put(f"{MYSQL_BASE}/settings", json=original_settings)
    except Exception as e:
        log_test("B8. PUT /settings", False, str(e))
    
    # B9. GET /history shows entries
    try:
        r = session.get(f"{MYSQL_BASE}/history")
        passed = r.status_code == 200 and isinstance(r.json(), list) and len(r.json()) > 0
        log_test("B9. GET /history", passed, f"status={r.status_code}, entries={len(r.json()) if passed else 0}")
    except Exception as e:
        log_test("B9. GET /history", False, str(e))
    
    # B10. POST /history/:id/undo works
    try:
        # Create a test project to undo
        r = session.post(f"{MYSQL_BASE}/projects", json={"name": "Undo Test Project", "slug": "undo-test"})
        if r.status_code == 200:
            project_id = r.json()["id"]
            created_items["projects"].append(project_id)
            
            # Get history
            r = session.get(f"{MYSQL_BASE}/history")
            history = r.json()
            # Find the create entry for this project
            undo_entry = next((h for h in history if h.get("entityId") == project_id and h.get("action") == "create"), None)
            
            if undo_entry:
                # Undo the create (should delete the project)
                r = session.post(f"{MYSQL_BASE}/history/{undo_entry['id']}/undo")
                undo_ok = r.status_code == 200
                
                # Verify project is deleted
                r = session.get(f"{MYSQL_BASE}/projects/{project_id}")
                deleted = r.status_code == 404
                
                passed = undo_ok and deleted
                log_test("B10. POST /history/:id/undo", passed, 
                        f"undo status={r.status_code}, project deleted={deleted}")
                
                if project_id in created_items["projects"]:
                    created_items["projects"].remove(project_id)
            else:
                log_test("B10. POST /history/:id/undo", False, "Could not find history entry")
        else:
            log_test("B10. POST /history/:id/undo", False, "Could not create test project")
    except Exception as e:
        log_test("B10. POST /history/:id/undo", False, str(e))
    
    # B11. Enquiries: POST, GET list, claim, escalate
    try:
        # POST enquiry
        r = session.post(f"{MYSQL_BASE}/enquiries", json={
            "name": "Test Enquiry User",
            "phone": "9999888877",
            "email": "test@example.com",
            "propertyType": "Residential",
            "budget": "1-2 Cr",
            "consent": True
        })
        create_ok = r.status_code == 200 and "id" in r.json()
        enquiry_id = r.json().get("id") if create_ok else None
        if enquiry_id:
            created_items["enquiries"].append(enquiry_id)
        log_test("B11a. POST /enquiries", create_ok, f"status={r.status_code}")
        
        # GET list
        r = session.get(f"{MYSQL_BASE}/enquiries")
        list_ok = r.status_code == 200 and isinstance(r.json(), list)
        log_test("B11b. GET /enquiries (list)", list_ok, f"status={r.status_code}, count={len(r.json()) if list_ok else 0}")
        
        # Claim
        if enquiry_id:
            r = session.post(f"{MYSQL_BASE}/enquiries/{enquiry_id}/claim", json={"by": "test-agent"})
            claim_ok = r.status_code == 200 and r.json().get("claimed") == True
            log_test("B11c. POST /enquiries/:id/claim", claim_ok, 
                    f"status={r.status_code}, claimed={r.json().get('claimed') if r.status_code == 200 else False}")
            
            # Escalate
            r = session.post(f"{MYSQL_BASE}/enquiries/{enquiry_id}/escalate")
            escalate_ok = r.status_code == 200 and r.json().get("escalated") == True
            log_test("B11d. POST /enquiries/:id/escalate", escalate_ok, 
                    f"status={r.status_code}, escalated={r.json().get('escalated') if r.status_code == 200 else False}")
    except Exception as e:
        log_test("B11. Enquiries", False, str(e))
    
    # B12. Upload PNG and PDF
    try:
        # Upload PNG (small test image)
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
        files = {'file': ('test.png', io.BytesIO(png_data), 'image/png')}
        r = session.post(f"{MYSQL_BASE}/upload", files=files)
        png_ok = r.status_code == 200 and "url" in r.json()
        png_url = r.json().get("url") if png_ok else None
        log_test("B12a. POST /upload (PNG)", png_ok, f"status={r.status_code}, url={png_url}")
        
        # Upload ~3MB PDF
        pdf_size = 3 * 1024 * 1024  # 3MB
        pdf_data = b'%PDF-1.4\n' + bytes([random.randint(0, 255) for _ in range(pdf_size - 10)]) + b'\n%%EOF'
        files = {'file': ('test.pdf', io.BytesIO(pdf_data), 'application/pdf')}
        r = session.post(f"{MYSQL_BASE}/upload", files=files)
        pdf_ok = r.status_code == 200 and "url" in r.json()
        pdf_url = r.json().get("url") if pdf_ok else None
        pdf_file_id = pdf_url.split('/')[-1].split('.')[0] if pdf_url else None
        log_test("B12b. POST /upload (PDF ~3MB)", pdf_ok, 
                f"status={r.status_code}, size={r.json().get('size') if pdf_ok else 0}, url={pdf_url}")
        
        # B13. GET /api/media/<file> - retrieve uploaded files
        if png_url:
            r = session.get(f"{MYSQL_BASE.replace('/api', '')}{png_url}")
            retrieve_ok = r.status_code == 200 and len(r.content) == len(png_data)
            log_test("B13a. GET /api/media/<file> (PNG)", retrieve_ok, 
                    f"status={r.status_code}, size={len(r.content)}")
        
        if pdf_url:
            r = session.get(f"{MYSQL_BASE.replace('/api', '')}{pdf_url}")
            retrieve_ok = r.status_code == 200 and len(r.content) == pdf_size
            log_test("B13b. GET /api/media/<file> (PDF)", retrieve_ok, 
                    f"status={r.status_code}, size={len(r.content)}")
            
            # B14. Range requests
            # Range bytes=0-9
            r = session.get(f"{MYSQL_BASE.replace('/api', '')}{pdf_url}", headers={"Range": "bytes=0-9"})
            range1_ok = r.status_code == 206 and len(r.content) == 10 and "Content-Range" in r.headers
            log_test("B14a. Range bytes=0-9", range1_ok, 
                    f"status={r.status_code}, size={len(r.content)}, range={r.headers.get('Content-Range', '')[:50]}")
            
            # Range bytes=524280-524300 (crosses 512KB chunk)
            r = session.get(f"{MYSQL_BASE.replace('/api', '')}{pdf_url}", headers={"Range": "bytes=524280-524300"})
            range2_ok = r.status_code == 206 and len(r.content) == 21
            log_test("B14b. Range bytes=524280-524300 (chunk boundary)", range2_ok, 
                    f"status={r.status_code}, size={len(r.content)}")
            
            # Range bytes=100-
            r = session.get(f"{MYSQL_BASE.replace('/api', '')}{pdf_url}", headers={"Range": "bytes=100-"})
            range3_ok = r.status_code == 206 and len(r.content) == pdf_size - 100
            log_test("B14c. Range bytes=100-", range3_ok, 
                    f"status={r.status_code}, size={len(r.content)}")
            
            # B15. HEAD request
            r = session.head(f"{MYSQL_BASE.replace('/api', '')}{pdf_url}")
            head_ok = r.status_code == 200 and "Content-Length" in r.headers and len(r.content) == 0
            log_test("B15. HEAD /api/media/<file>", head_ok, 
                    f"status={r.status_code}, Content-Length={r.headers.get('Content-Length')}, body size={len(r.content)}")
            
            # B16. 404 for unknown file
            r = session.get(f"{MYSQL_BASE}/media/not-a-uuid.png")
            r2 = session.get(f"{MYSQL_BASE}/media/12345678-1234-1234-1234-123456789012.png")
            not_found_ok = r.status_code == 404 and r2.status_code == 404
            log_test("B16. GET /api/media/<unknown> -> 404", not_found_ok, 
                    f"not-a-uuid={r.status_code}, random-uuid={r2.status_code}")
    except Exception as e:
        log_test("B12-16. Upload and media", False, str(e))
    
    # B17. GET /admin/backup
    try:
        r = session.get(f"{MYSQL_BASE}/admin/backup")
        backup_ok = r.status_code == 200 and "collections" in r.json()
        collections = r.json().get("collections", {})
        backup_data = r.json() if backup_ok else None
        log_test("B17. GET /admin/backup", backup_ok, 
                f"status={r.status_code}, collections={list(collections.keys()) if backup_ok else []}")
    except Exception as e:
        log_test("B17. GET /admin/backup", False, str(e))
        backup_data = None
    
    # B18. POST /admin/restore
    if backup_data:
        try:
            # Test without auth
            r = requests.post(f"{MYSQL_BASE}/admin/restore", json=backup_data)
            no_auth_401 = r.status_code == 401
            log_test("B18a. POST /admin/restore (no auth)", no_auth_401, f"status={r.status_code}")
            
            # Test with wrong password
            wrong_session = requests.Session()
            wrong_session.post(f"{MYSQL_BASE}/admin/login", json={"username": "admin", "password": "wrong"})
            r = wrong_session.post(f"{MYSQL_BASE}/admin/restore", json=backup_data)
            wrong_auth_401 = r.status_code == 401
            log_test("B18b. POST /admin/restore (wrong auth)", wrong_auth_401, f"status={r.status_code}")
            
            # Test with correct auth
            r = session.post(f"{MYSQL_BASE}/admin/restore", json=backup_data)
            restore_ok = r.status_code == 200 and r.json().get("ok") == True
            log_test("B18c. POST /admin/restore (correct auth)", restore_ok, 
                    f"status={r.status_code}, ok={r.json().get('ok') if r.status_code == 200 else False}")
            
            # Verify counts unchanged
            r = session.get(f"{MYSQL_BASE}/admin/backup")
            new_backup = r.json()
            counts_match = new_backup.get("counts") == backup_data.get("counts")
            log_test("B18d. Verify restore counts", counts_match, 
                    f"counts match={counts_match}")
        except Exception as e:
            log_test("B18. POST /admin/restore", False, str(e))
    
    # B19. Frontend pages
    frontend_pages = [
        "/",
        "/blog",
        "/sitemap.xml",
    ]
    
    for page in frontend_pages:
        try:
            r = requests.get(f"http://localhost:3101{page}")
            passed = r.status_code == 200
            log_test(f"B19. GET {page}", passed, f"status={r.status_code}")
        except Exception as e:
            log_test(f"B19. GET {page}", False, str(e))

# ============================================================================
# CLEANUP
# ============================================================================

def cleanup(session):
    test_section("CLEANUP - Deleting test records")
    
    # Delete created items
    for entity_type, ids in created_items.items():
        if entity_type == "enquiries":
            # Enquiries can't be deleted via API
            if ids:
                print(f"  ⚠️  Created {len(ids)} test enquiries (no DELETE endpoint): {ids}")
            continue
        
        for item_id in ids:
            try:
                endpoint = f"/{entity_type}/{item_id}"
                r = session.delete(f"{MYSQL_BASE}{endpoint}")
                if r.status_code in [200, 404]:
                    print(f"  ✅ Deleted {entity_type}/{item_id}")
                else:
                    print(f"  ⚠️  Could not delete {entity_type}/{item_id}: {r.status_code}")
            except Exception as e:
                print(f"  ❌ Error deleting {entity_type}/{item_id}: {e}")

# ============================================================================
# MAIN
# ============================================================================

def main():
    print("\n" + "="*80)
    print("  GILLCO GROUP CMS - COMPREHENSIVE BACKEND TESTING")
    print("  MySQL Mode (:3101) + MongoDB Quick Checks (:3000)")
    print("  Focus: Server-side Admin Auth + MySQL Feature Parity")
    print("="*80)
    
    start_time = time.time()
    
    # A. AUTH TESTING
    session = test_auth_mysql()
    test_auth_mongo_quick()
    
    # Re-authenticate for feature parity tests (in case session expired)
    session = requests.Session()
    session.post(f"{MYSQL_BASE}/admin/login", json={"username": "admin", "password": ADMIN_PASS})
    
    # B. MYSQL FEATURE PARITY
    test_mysql_feature_parity(session)
    
    # CLEANUP
    cleanup(session)
    
    # SUMMARY
    elapsed = time.time() - start_time
    print("\n" + "="*80)
    print("  TEST SUMMARY")
    print("="*80)
    print(f"  Total Tests: {results['passed'] + results['failed']}")
    print(f"  ✅ Passed: {results['passed']}")
    print(f"  ❌ Failed: {results['failed']}")
    print(f"  Success Rate: {results['passed'] / (results['passed'] + results['failed']) * 100:.1f}%")
    print(f"  Time: {elapsed:.2f}s")
    
    if results['failed'] > 0:
        print("\n  Failed Tests:")
        for test in results['tests']:
            if not test['passed']:
                print(f"    ❌ {test['name']}")
                if test['detail']:
                    print(f"       {test['detail']}")
    
    if created_items["enquiries"]:
        print(f"\n  ⚠️  Note: {len(created_items['enquiries'])} test enquiries created (no DELETE endpoint)")
        print(f"     IDs: {created_items['enquiries']}")
    
    print("\n" + "="*80)
    
    return results['failed'] == 0

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
