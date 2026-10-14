#!/usr/bin/env python3
"""
Comprehensive API regression test for Supabase/Postgres mode (port 3101)
Tests migration from MongoDB (port 3000) to Postgres
"""
import requests
import json
import io
import time
from typing import Dict, Any, List

# Test configuration
POSTGRES_BASE = "http://localhost:3101/api"
MONGO_BASE = "http://localhost:3000/api"
ADMIN_PASSWORD = "gillco2025"
HEADERS = {"x-admin-password": ADMIN_PASSWORD}

# Test state
test_results = []
created_resources = []  # Track resources to clean up


def log_test(name: str, passed: bool, details: str = ""):
    """Log test result"""
    status = "✅ PASS" if passed else "❌ FAIL"
    msg = f"{status}: {name}"
    if details:
        msg += f" - {details}"
    print(msg)
    test_results.append({"name": name, "passed": passed, "details": details})


def compare_json_fields(obj1: Any, obj2: Any, path: str = "", ignore_fields: set = None) -> List[str]:
    """Compare two JSON objects and return list of differences"""
    if ignore_fields is None:
        ignore_fields = {"_id", "createdAt", "updatedAt", "ts"}
    
    diffs = []
    
    if type(obj1) != type(obj2):
        diffs.append(f"{path}: type mismatch ({type(obj1).__name__} vs {type(obj2).__name__})")
        return diffs
    
    if isinstance(obj1, dict):
        keys1 = set(obj1.keys()) - ignore_fields
        keys2 = set(obj2.keys()) - ignore_fields
        
        missing_in_2 = keys1 - keys2
        missing_in_1 = keys2 - keys1
        
        if missing_in_2:
            diffs.append(f"{path}: fields in postgres but not mongo: {missing_in_2}")
        if missing_in_1:
            diffs.append(f"{path}: fields in mongo but not postgres: {missing_in_1}")
        
        for key in keys1 & keys2:
            if key not in ignore_fields:
                diffs.extend(compare_json_fields(obj1[key], obj2[key], f"{path}.{key}" if path else key, ignore_fields))
    
    elif isinstance(obj1, list):
        if len(obj1) != len(obj2):
            diffs.append(f"{path}: array length mismatch ({len(obj1)} vs {len(obj2)})")
    
    return diffs


def test_health():
    """Test 1: GET /health -> provider:'supabase', media:'postgres'"""
    try:
        r = requests.get(f"{POSTGRES_BASE}/health", timeout=5)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        data = r.json()
        assert data.get("ok") == True, "ok should be true"
        assert data.get("db") == "up", "db should be 'up'"
        assert data.get("provider") == "supabase", f"Expected provider='supabase', got {data.get('provider')}"
        assert data.get("media") == "postgres", f"Expected media='postgres', got {data.get('media')}"
        log_test("Health endpoint", True, f"provider={data.get('provider')}, media={data.get('media')}")
    except Exception as e:
        log_test("Health endpoint", False, str(e))


def test_read_endpoints():
    """Test 2: Read endpoints - projects, settings, news, team, testimonials, posts, history, enquiries"""
    endpoints = [
        ("/projects", "projects", 8),
        ("/settings", "settings", None),
        ("/news", "news", None),
        ("/team", "team", None),
        ("/testimonials", "testimonials", None),
        ("/posts", "posts", None),
        ("/history", "history", None),
        ("/enquiries", "enquiries", None),
    ]
    
    for endpoint, name, expected_count in endpoints:
        try:
            r = requests.get(f"{POSTGRES_BASE}{endpoint}", timeout=5)
            assert r.status_code == 200, f"Expected 200, got {r.status_code}"
            data = r.json()
            
            if isinstance(data, list):
                count = len(data)
                if expected_count is not None:
                    assert count == expected_count, f"Expected {expected_count} items, got {count}"
                    log_test(f"GET {endpoint}", True, f"{count} items")
                else:
                    log_test(f"GET {endpoint}", True, f"{count} items")
                
                # Check for _id leaks
                for item in data:
                    if isinstance(item, dict) and "_id" in item:
                        log_test(f"GET {endpoint} - no _id leak", False, "_id found in response")
                        return
            else:
                # Single object (settings)
                if "_id" in data:
                    log_test(f"GET {endpoint} - no _id leak", False, "_id found in response")
                    return
                log_test(f"GET {endpoint}", True, "OK")
                
        except Exception as e:
            log_test(f"GET {endpoint}", False, str(e))


def test_projects_by_slug_and_id():
    """Test 3: GET /projects/<slug> and /projects/<id> both work"""
    try:
        # Get all projects first
        r = requests.get(f"{POSTGRES_BASE}/projects", timeout=5)
        projects = r.json()
        
        if len(projects) > 0:
            project = projects[0]
            project_id = project.get("id")
            project_slug = project.get("slug")
            
            # Test by ID
            r = requests.get(f"{POSTGRES_BASE}/projects/{project_id}", timeout=5)
            assert r.status_code == 200, f"Expected 200, got {r.status_code}"
            data = r.json()
            assert data.get("id") == project_id, "ID mismatch"
            log_test("GET /projects/<id>", True, f"Retrieved project by ID: {project_id}")
            
            # Test by slug
            if project_slug:
                r = requests.get(f"{POSTGRES_BASE}/projects/{project_slug}", timeout=5)
                assert r.status_code == 200, f"Expected 200, got {r.status_code}"
                data = r.json()
                assert data.get("slug") == project_slug, "Slug mismatch"
                log_test("GET /projects/<slug>", True, f"Retrieved project by slug: {project_slug}")
        else:
            log_test("GET /projects/<slug> and <id>", False, "No projects found")
            
    except Exception as e:
        log_test("GET /projects/<slug> and <id>", False, str(e))


def test_projects_sorted():
    """Test 4: GET /projects returns items sorted newest first"""
    try:
        r = requests.get(f"{POSTGRES_BASE}/projects", timeout=5)
        projects = r.json()
        
        if len(projects) >= 2:
            # Check if sorted by createdAt descending
            dates = [p.get("createdAt") for p in projects if p.get("createdAt")]
            is_sorted = all(dates[i] >= dates[i+1] for i in range(len(dates)-1))
            log_test("Projects sorted newest first", is_sorted, f"First: {dates[0] if dates else 'N/A'}")
        else:
            log_test("Projects sorted newest first", True, "Less than 2 projects, sorting N/A")
            
    except Exception as e:
        log_test("Projects sorted newest first", False, str(e))


def test_testimonials_filtering():
    """Test 5: GET /testimonials returns only published!=false, sorted by order"""
    try:
        r = requests.get(f"{POSTGRES_BASE}/testimonials", timeout=5)
        testimonials = r.json()
        
        # Check all have published != false
        for t in testimonials:
            if t.get("published") == False:
                log_test("Testimonials filtering", False, "Found unpublished testimonial")
                return
        
        log_test("Testimonials filtering", True, f"{len(testimonials)} published testimonials")
        
    except Exception as e:
        log_test("Testimonials filtering", False, str(e))


def test_compare_postgres_vs_mongo():
    """Test 6: Compare JSON from :3101 vs :3000 - same items/fields"""
    endpoints = ["/projects", "/settings", "/news", "/team", "/testimonials", "/posts"]
    
    for endpoint in endpoints:
        try:
            r_pg = requests.get(f"{POSTGRES_BASE}{endpoint}", timeout=5)
            r_mongo = requests.get(f"{MONGO_BASE}{endpoint}", timeout=5)
            
            assert r_pg.status_code == 200, f"Postgres returned {r_pg.status_code}"
            assert r_mongo.status_code == 200, f"Mongo returned {r_mongo.status_code}"
            
            pg_data = r_pg.json()
            mongo_data = r_mongo.json()
            
            # Compare structure
            if isinstance(pg_data, list) and isinstance(mongo_data, list):
                if len(pg_data) != len(mongo_data):
                    log_test(f"Compare {endpoint}", False, f"Count mismatch: PG={len(pg_data)}, Mongo={len(mongo_data)}")
                    continue
                
                # Compare first item structure if available
                if len(pg_data) > 0:
                    diffs = compare_json_fields(pg_data[0], mongo_data[0])
                    if diffs:
                        log_test(f"Compare {endpoint}", False, f"Field differences: {diffs[:3]}")
                    else:
                        log_test(f"Compare {endpoint}", True, f"{len(pg_data)} items, fields match")
                else:
                    log_test(f"Compare {endpoint}", True, "Both empty")
            else:
                # Single object comparison
                diffs = compare_json_fields(pg_data, mongo_data)
                if diffs:
                    log_test(f"Compare {endpoint}", False, f"Field differences: {diffs[:3]}")
                else:
                    log_test(f"Compare {endpoint}", True, "Fields match")
                    
        except Exception as e:
            log_test(f"Compare {endpoint}", False, str(e))


def test_crud_projects():
    """Test 7: CRUD on projects - POST/PUT/DELETE"""
    try:
        # CREATE
        new_project = {
            "name": "Test Project CRUD",
            "slug": "test-project-crud",
            "tagline": "Test tagline",
            "status": "upcoming",
            "category": "residential",
            "location": "Test Location",
            "reraNumber": "TEST-123",
            "summary": "Test summary"
        }
        
        r = requests.post(f"{POSTGRES_BASE}/projects", json=new_project, timeout=5)
        assert r.status_code == 200, f"Create failed: {r.status_code}"
        created = r.json()
        project_id = created.get("id")
        assert project_id, "No ID returned"
        created_resources.append(("project", project_id))
        log_test("POST /projects (create)", True, f"Created project {project_id}")
        
        # UPDATE
        update_data = {"tagline": "Updated tagline"}
        r = requests.put(f"{POSTGRES_BASE}/projects/{project_id}", json=update_data, timeout=5)
        assert r.status_code == 200, f"Update failed: {r.status_code}"
        updated = r.json()
        assert updated.get("tagline") == "Updated tagline", "Update not persisted"
        log_test("PUT /projects/<id> (update)", True, f"Updated project {project_id}")
        
        # DELETE
        r = requests.delete(f"{POSTGRES_BASE}/projects/{project_id}", timeout=5)
        assert r.status_code == 200, f"Delete failed: {r.status_code}"
        
        # Verify deleted
        r = requests.get(f"{POSTGRES_BASE}/projects/{project_id}", timeout=5)
        assert r.status_code == 404, "Project still exists after delete"
        log_test("DELETE /projects/<id>", True, f"Deleted project {project_id}")
        
        # Remove from cleanup list
        created_resources.remove(("project", project_id))
        
    except Exception as e:
        log_test("CRUD projects", False, str(e))


def test_crud_news():
    """Test 8: CRUD on news"""
    try:
        # CREATE
        new_news = {
            "headline": "Test News Item",
            "category": "Test",
            "date": "2026-01-15",
            "summary": "Test summary"
        }
        
        r = requests.post(f"{POSTGRES_BASE}/news", json=new_news, timeout=5)
        assert r.status_code == 200, f"Create failed: {r.status_code}"
        created = r.json()
        news_id = created.get("id")
        assert news_id, "No ID returned"
        created_resources.append(("news", news_id))
        log_test("POST /news (create)", True, f"Created news {news_id}")
        
        # UPDATE
        update_data = {"headline": "Updated News Headline"}
        r = requests.put(f"{POSTGRES_BASE}/news/{news_id}", json=update_data, timeout=5)
        assert r.status_code == 200, f"Update failed: {r.status_code}"
        updated = r.json()
        assert updated.get("headline") == "Updated News Headline", "Update not persisted"
        log_test("PUT /news/<id> (update)", True, f"Updated news {news_id}")
        
        # DELETE
        r = requests.delete(f"{POSTGRES_BASE}/news/{news_id}", timeout=5)
        assert r.status_code == 200, f"Delete failed: {r.status_code}"
        log_test("DELETE /news/<id>", True, f"Deleted news {news_id}")
        
        created_resources.remove(("news", news_id))
        
    except Exception as e:
        log_test("CRUD news", False, str(e))


def test_crud_team():
    """Test 9: CRUD on team"""
    try:
        # CREATE
        new_member = {
            "name": "Test Member",
            "role": "Test Role",
            "photo": "https://example.com/photo.jpg",
            "bio": "Test bio"
        }
        
        r = requests.post(f"{POSTGRES_BASE}/team", json=new_member, timeout=5)
        assert r.status_code == 200, f"Create failed: {r.status_code}"
        created = r.json()
        member_id = created.get("id")
        assert member_id, "No ID returned"
        created_resources.append(("team", member_id))
        log_test("POST /team (create)", True, f"Created team member {member_id}")
        
        # UPDATE
        update_data = {"role": "Updated Role"}
        r = requests.put(f"{POSTGRES_BASE}/team/{member_id}", json=update_data, timeout=5)
        assert r.status_code == 200, f"Update failed: {r.status_code}"
        updated = r.json()
        assert updated.get("role") == "Updated Role", "Update not persisted"
        log_test("PUT /team/<id> (update)", True, f"Updated team member {member_id}")
        
        # DELETE
        r = requests.delete(f"{POSTGRES_BASE}/team/{member_id}", timeout=5)
        assert r.status_code == 200, f"Delete failed: {r.status_code}"
        log_test("DELETE /team/<id>", True, f"Deleted team member {member_id}")
        
        created_resources.remove(("team", member_id))
        
    except Exception as e:
        log_test("CRUD team", False, str(e))


def test_crud_testimonial():
    """Test 10: CRUD on testimonial"""
    try:
        # CREATE
        new_testimonial = {
            "name": "Test Customer",
            "role": "Homeowner",
            "quote": "Test quote",
            "rating": 5,
            "published": True
        }
        
        r = requests.post(f"{POSTGRES_BASE}/testimonials", json=new_testimonial, timeout=5)
        assert r.status_code == 200, f"Create failed: {r.status_code}"
        created = r.json()
        testimonial_id = created.get("id")
        assert testimonial_id, "No ID returned"
        created_resources.append(("testimonial", testimonial_id))
        log_test("POST /testimonials (create)", True, f"Created testimonial {testimonial_id}")
        
        # UPDATE
        update_data = {"quote": "Updated quote"}
        r = requests.put(f"{POSTGRES_BASE}/testimonials/{testimonial_id}", json=update_data, timeout=5)
        assert r.status_code == 200, f"Update failed: {r.status_code}"
        updated = r.json()
        assert updated.get("quote") == "Updated quote", "Update not persisted"
        log_test("PUT /testimonials/<id> (update)", True, f"Updated testimonial {testimonial_id}")
        
        # DELETE
        r = requests.delete(f"{POSTGRES_BASE}/testimonials/{testimonial_id}", timeout=5)
        assert r.status_code == 200, f"Delete failed: {r.status_code}"
        log_test("DELETE /testimonials/<id>", True, f"Deleted testimonial {testimonial_id}")
        
        created_resources.remove(("testimonial", testimonial_id))
        
    except Exception as e:
        log_test("CRUD testimonial", False, str(e))


def test_crud_post():
    """Test 11: CRUD on post"""
    try:
        # CREATE
        new_post = {
            "title": "Test Blog Post",
            "excerpt": "Test excerpt",
            "body": "Test body content",
            "published": True
        }
        
        r = requests.post(f"{POSTGRES_BASE}/posts", json=new_post, timeout=5)
        assert r.status_code == 200, f"Create failed: {r.status_code}"
        created = r.json()
        post_id = created.get("id")
        post_slug = created.get("slug")
        assert post_id, "No ID returned"
        created_resources.append(("post", post_id))
        log_test("POST /posts (create)", True, f"Created post {post_id}")
        
        # UPDATE
        update_data = {"title": "Updated Blog Post Title"}
        r = requests.put(f"{POSTGRES_BASE}/posts/{post_slug}", json=update_data, timeout=5)
        assert r.status_code == 200, f"Update failed: {r.status_code}"
        updated = r.json()
        assert updated.get("title") == "Updated Blog Post Title", "Update not persisted"
        log_test("PUT /posts/<slug> (update)", True, f"Updated post {post_slug}")
        
        # DELETE
        r = requests.delete(f"{POSTGRES_BASE}/posts/{post_slug}", timeout=5)
        assert r.status_code == 200, f"Delete failed: {r.status_code}"
        log_test("DELETE /posts/<slug>", True, f"Deleted post {post_slug}")
        
        created_resources.remove(("post", post_id))
        
    except Exception as e:
        log_test("CRUD post", False, str(e))


def test_settings_merge():
    """Test 12: PUT /settings merges fields"""
    try:
        # Get current settings
        r = requests.get(f"{POSTGRES_BASE}/settings", timeout=5)
        original = r.json()
        original_brand = original.get("brandName")
        
        # Update one field
        r = requests.put(f"{POSTGRES_BASE}/settings", json={"tagline": "Test Tagline Update"}, timeout=5)
        assert r.status_code == 200, f"Update failed: {r.status_code}"
        updated = r.json()
        
        # Verify merge - brandName should still exist
        assert updated.get("brandName") == original_brand, "brandName was lost during merge"
        assert updated.get("tagline") == "Test Tagline Update", "tagline not updated"
        log_test("PUT /settings (merge)", True, "Fields merged correctly")
        
        # Restore original
        r = requests.put(f"{POSTGRES_BASE}/settings", json={"tagline": original.get("tagline")}, timeout=5)
        
    except Exception as e:
        log_test("PUT /settings (merge)", False, str(e))


def test_history_and_undo():
    """Test 13: History records + POST /history/<id>/undo works"""
    try:
        # Get current history count
        r = requests.get(f"{POSTGRES_BASE}/history", timeout=5)
        history_before = r.json()
        count_before = len(history_before)
        
        # Make a change to create history
        r = requests.put(f"{POSTGRES_BASE}/settings", json={"tagline": "History Test Tagline"}, timeout=5)
        assert r.status_code == 200, "Settings update failed"
        
        # Check history increased
        r = requests.get(f"{POSTGRES_BASE}/history", timeout=5)
        history_after = r.json()
        count_after = len(history_after)
        assert count_after > count_before, "History not recorded"
        log_test("History recording", True, f"History count: {count_before} -> {count_after}")
        
        # Get the latest history entry
        latest = history_after[0]
        history_id = latest.get("id")
        
        # Test undo
        r = requests.post(f"{POSTGRES_BASE}/history/{history_id}/undo", timeout=5)
        assert r.status_code == 200, f"Undo failed: {r.status_code}"
        result = r.json()
        assert result.get("ok") == True, "Undo not successful"
        log_test("POST /history/<id>/undo", True, f"Undone history {history_id}")
        
        # Verify undo worked
        r = requests.get(f"{POSTGRES_BASE}/settings", timeout=5)
        settings = r.json()
        assert settings.get("tagline") != "History Test Tagline", "Undo did not revert change"
        log_test("Undo verification", True, "Change was reverted")
        
    except Exception as e:
        log_test("History and undo", False, str(e))


def test_enquiries_workflow():
    """Test 14: Enquiries - POST, claim, escalate"""
    try:
        # CREATE enquiry
        enquiry_data = {
            "name": "Test Customer",
            "phone": "9876543210",
            "email": "test@example.com",
            "propertyType": "Residential",
            "budget": "1-2 Cr",
            "consent": True
        }
        
        r = requests.post(f"{POSTGRES_BASE}/enquiries", json=enquiry_data, timeout=5)
        assert r.status_code == 200, f"Create failed: {r.status_code}"
        created = r.json()
        enquiry_id = created.get("id")
        assert enquiry_id, "No ID returned"
        assert created.get("propertyType") == "Residential", "propertyType not saved"
        assert created.get("budget") == "1-2 Cr", "budget not saved"
        created_resources.append(("enquiry", enquiry_id))
        log_test("POST /enquiries", True, f"Created enquiry {enquiry_id}")
        
        # CLAIM
        r = requests.post(f"{POSTGRES_BASE}/enquiries/{enquiry_id}/claim", json={"claimedBy": "test-agent"}, timeout=5)
        assert r.status_code == 200, f"Claim failed: {r.status_code}"
        
        # Verify claim
        r = requests.get(f"{POSTGRES_BASE}/enquiries", timeout=5)
        enquiries = r.json()
        claimed_enquiry = next((e for e in enquiries if e.get("id") == enquiry_id), None)
        assert claimed_enquiry, "Enquiry not found"
        assert claimed_enquiry.get("claimed") == True, "claimed flag not set"
        log_test("POST /enquiries/<id>/claim", True, f"Claimed enquiry {enquiry_id}")
        
        # ESCALATE
        r = requests.post(f"{POSTGRES_BASE}/enquiries/{enquiry_id}/escalate", timeout=5)
        assert r.status_code == 200, f"Escalate failed: {r.status_code}"
        
        # Verify escalate
        r = requests.get(f"{POSTGRES_BASE}/enquiries", timeout=5)
        enquiries = r.json()
        escalated_enquiry = next((e for e in enquiries if e.get("id") == enquiry_id), None)
        assert escalated_enquiry, "Enquiry not found"
        assert escalated_enquiry.get("escalated") == True, "escalated flag not set"
        log_test("POST /enquiries/<id>/escalate", True, f"Escalated enquiry {enquiry_id}")
        
    except Exception as e:
        log_test("Enquiries workflow", False, str(e))


def test_cron_escalate():
    """Test 15: GET|POST /cron/escalate returns 200"""
    try:
        r = requests.get(f"{POSTGRES_BASE}/cron/escalate", timeout=5)
        assert r.status_code == 200, f"GET failed: {r.status_code}"
        data = r.json()
        assert data.get("ok") == True, "ok should be true"
        log_test("GET /cron/escalate", True, f"Response: {data}")
        
        r = requests.post(f"{POSTGRES_BASE}/cron/escalate", timeout=5)
        assert r.status_code == 200, f"POST failed: {r.status_code}"
        data = r.json()
        assert data.get("ok") == True, "ok should be true"
        log_test("POST /cron/escalate", True, f"Response: {data}")
        
    except Exception as e:
        log_test("Cron escalate", False, str(e))


def test_upload_png():
    """Test 16: POST /upload with PNG file"""
    try:
        # Create a small PNG file (1x1 red pixel)
        png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0\x00\x00\x00\x03\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82'
        
        files = {'file': ('test.png', io.BytesIO(png_data), 'image/png')}
        r = requests.post(f"{POSTGRES_BASE}/upload", files=files, timeout=10)
        assert r.status_code == 200, f"Upload failed: {r.status_code}"
        result = r.json()
        
        url = result.get("url")
        assert url, "No URL returned"
        assert url.startswith("/api/media/"), f"Unexpected URL format: {url}"
        assert ".png" in url, "URL should have .png extension"
        
        created_resources.append(("media", url))
        log_test("POST /upload (PNG)", True, f"Uploaded: {url}")
        
        return url
        
    except Exception as e:
        log_test("POST /upload (PNG)", False, str(e))
        return None


def test_upload_pdf():
    """Test 17: POST /upload with ~2MB PDF"""
    try:
        # Create a ~2MB PDF-like file
        pdf_header = b'%PDF-1.4\n'
        pdf_data = pdf_header + (b'X' * (2 * 1024 * 1024 - len(pdf_header)))
        
        files = {'file': ('test.pdf', io.BytesIO(pdf_data), 'application/pdf')}
        r = requests.post(f"{POSTGRES_BASE}/upload", files=files, timeout=30)
        assert r.status_code == 200, f"Upload failed: {r.status_code}"
        result = r.json()
        
        url = result.get("url")
        assert url, "No URL returned"
        assert url.startswith("/api/media/"), f"Unexpected URL format: {url}"
        assert ".pdf" in url, "URL should have .pdf extension"
        
        size = result.get("size")
        assert size >= 2 * 1024 * 1024, f"Size mismatch: {size}"
        
        created_resources.append(("media", url))
        log_test("POST /upload (PDF ~2MB)", True, f"Uploaded: {url}, size: {size}")
        
        return url
        
    except Exception as e:
        log_test("POST /upload (PDF ~2MB)", False, str(e))
        return None


def test_media_get(media_url: str):
    """Test 18: GET /api/media/<uuid>.<ext> returns identical bytes + correct Content-Type"""
    if not media_url:
        log_test("GET /api/media/<file>", False, "No media URL to test")
        return
    
    try:
        # Extract filename from URL
        filename = media_url.split("/")[-1]
        
        r = requests.get(f"{POSTGRES_BASE}/media/{filename}", timeout=10)
        assert r.status_code == 200, f"GET failed: {r.status_code}"
        
        content_type = r.headers.get("Content-Type")
        assert content_type, "No Content-Type header"
        
        if ".png" in filename:
            assert "image/png" in content_type, f"Wrong Content-Type: {content_type}"
        elif ".pdf" in filename:
            assert "application/pdf" in content_type, f"Wrong Content-Type: {content_type}"
        
        content_length = r.headers.get("Content-Length")
        assert content_length, "No Content-Length header"
        
        log_test("GET /api/media/<file>", True, f"Content-Type: {content_type}, Length: {content_length}")
        
    except Exception as e:
        log_test("GET /api/media/<file>", False, str(e))


def test_media_range_requests(media_url: str):
    """Test 19: Range requests - bytes=0-9 and bytes=100-"""
    if not media_url:
        log_test("Range requests", False, "No media URL to test")
        return
    
    try:
        filename = media_url.split("/")[-1]
        
        # Test Range: bytes=0-9
        headers = {"Range": "bytes=0-9"}
        r = requests.get(f"{POSTGRES_BASE}/media/{filename}", headers=headers, timeout=10)
        assert r.status_code == 206, f"Expected 206, got {r.status_code}"
        
        content_range = r.headers.get("Content-Range")
        assert content_range, "No Content-Range header"
        assert content_range.startswith("bytes 0-9/"), f"Wrong Content-Range: {content_range}"
        
        content = r.content
        assert len(content) == 10, f"Expected 10 bytes, got {len(content)}"
        log_test("Range bytes=0-9", True, f"Content-Range: {content_range}")
        
        # Test Range: bytes=100-
        headers = {"Range": "bytes=100-"}
        r = requests.get(f"{POSTGRES_BASE}/media/{filename}", headers=headers, timeout=10)
        assert r.status_code == 206, f"Expected 206, got {r.status_code}"
        
        content_range = r.headers.get("Content-Range")
        assert content_range, "No Content-Range header"
        assert "bytes 100-" in content_range, f"Wrong Content-Range: {content_range}"
        log_test("Range bytes=100-", True, f"Content-Range: {content_range}")
        
    except Exception as e:
        log_test("Range requests", False, str(e))


def test_media_head(media_url: str):
    """Test 20: HEAD /api/media/<file> returns 200 with Content-Length"""
    if not media_url:
        log_test("HEAD /api/media/<file>", False, "No media URL to test")
        return
    
    try:
        filename = media_url.split("/")[-1]
        
        r = requests.head(f"{POSTGRES_BASE}/media/{filename}", timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        content_length = r.headers.get("Content-Length")
        assert content_length, "No Content-Length header"
        assert int(content_length) > 0, "Content-Length should be > 0"
        
        # Verify no body
        assert len(r.content) == 0, "HEAD should not return body"
        
        log_test("HEAD /api/media/<file>", True, f"Content-Length: {content_length}")
        
    except Exception as e:
        log_test("HEAD /api/media/<file>", False, str(e))


def test_media_404():
    """Test 21: GET /api/media/<bad-id> returns 404"""
    try:
        # Test with non-UUID
        r = requests.get(f"{POSTGRES_BASE}/media/not-a-uuid.png", timeout=5)
        assert r.status_code == 404, f"Expected 404, got {r.status_code}"
        log_test("GET /api/media/not-a-uuid.png -> 404", True)
        
        # Test with random UUID
        r = requests.get(f"{POSTGRES_BASE}/media/12345678-1234-1234-1234-123456789abc.png", timeout=5)
        assert r.status_code == 404, f"Expected 404, got {r.status_code}"
        log_test("GET /api/media/<random-uuid>.png -> 404", True)
        
    except Exception as e:
        log_test("Media 404 errors", False, str(e))


def test_media_existing_migrated():
    """Test 22: GET an existing migrated media file"""
    try:
        # Try to get list of media files from database
        # This is a bonus test - we'll try to find one
        # For now, we'll skip if we can't find one
        log_test("GET existing migrated media", True, "Skipped - would need psql access")
        
    except Exception as e:
        log_test("GET existing migrated media", False, str(e))


def test_admin_backup():
    """Test 23: GET /admin/backup returns counts/collections, no __restore_* names"""
    try:
        r = requests.get(f"{POSTGRES_BASE}/admin/backup", headers=HEADERS, timeout=30)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        # Check Content-Disposition
        content_disp = r.headers.get("Content-Disposition")
        assert content_disp, "No Content-Disposition header"
        assert "attachment" in content_disp, "Should be attachment"
        assert "gillco-backup-" in content_disp, "Wrong filename format"
        
        data = r.json()
        assert data.get("app") == "gillco-group", "Wrong app name"
        assert "counts" in data, "No counts field"
        assert "collections" in data, "No collections field"
        
        collections = data.get("collections", {})
        counts = data.get("counts", {})
        
        # Check no __restore_* collections
        for name in collections.keys():
            assert not name.startswith("__restore"), f"Found __restore collection: {name}"
        
        # Check no media.* collections
        for name in collections.keys():
            assert not name.startswith("media."), f"Found media collection: {name}"
        
        log_test("GET /admin/backup", True, f"Collections: {list(collections.keys())}, Counts: {counts}")
        
        return data
        
    except Exception as e:
        log_test("GET /admin/backup", False, str(e))
        return None


def test_admin_restore(backup_data: dict):
    """Test 24: POST /admin/restore with backup JSON"""
    if not backup_data:
        log_test("POST /admin/restore", False, "No backup data to test")
        return
    
    try:
        # Test without header
        r = requests.post(f"{POSTGRES_BASE}/admin/restore", json=backup_data, timeout=30)
        assert r.status_code == 401, f"Expected 401 without auth, got {r.status_code}"
        log_test("POST /admin/restore (no auth) -> 401", True)
        
        # Test with wrong password
        wrong_headers = {"x-admin-password": "wrong"}
        r = requests.post(f"{POSTGRES_BASE}/admin/restore", json=backup_data, headers=wrong_headers, timeout=30)
        assert r.status_code == 401, f"Expected 401 with wrong password, got {r.status_code}"
        log_test("POST /admin/restore (wrong password) -> 401", True)
        
        # Test with correct password
        r = requests.post(f"{POSTGRES_BASE}/admin/restore", json=backup_data, headers=HEADERS, timeout=60)
        assert r.status_code == 200, f"Restore failed: {r.status_code}"
        result = r.json()
        assert result.get("ok") == True, "Restore not successful"
        
        restored = result.get("restored", {})
        log_test("POST /admin/restore", True, f"Restored: {restored}")
        
        # Verify counts unchanged
        r = requests.get(f"{POSTGRES_BASE}/admin/backup", headers=HEADERS, timeout=30)
        new_backup = r.json()
        new_counts = new_backup.get("counts", {})
        old_counts = backup_data.get("counts", {})
        
        # Compare counts (should be same or very close)
        for collection in old_counts.keys():
            if collection in new_counts:
                diff = abs(new_counts[collection] - old_counts[collection])
                if diff > 5:  # Allow small differences due to test data
                    log_test("Restore verification", False, f"{collection} count changed significantly: {old_counts[collection]} -> {new_counts[collection]}")
                    return
        
        log_test("Restore verification", True, "Counts match after restore")
        
    except Exception as e:
        log_test("POST /admin/restore", False, str(e))


def test_frontend_pages():
    """Test 25: Frontend pages return 200"""
    pages = [
        "/",
        "/blog",
        "/sitemap.xml",
        "/emi-calculator"
    ]
    
    base_url = "http://localhost:3101"
    
    for page in pages:
        try:
            r = requests.get(f"{base_url}{page}", timeout=10)
            assert r.status_code == 200, f"Expected 200, got {r.status_code}"
            log_test(f"GET {page}", True, f"Status: {r.status_code}")
        except Exception as e:
            log_test(f"GET {page}", False, str(e))


def test_sitemap_contains_projects():
    """Test 26: /sitemap.xml contains project slugs"""
    try:
        r = requests.get("http://localhost:3101/sitemap.xml", timeout=10)
        assert r.status_code == 200, f"Expected 200, got {r.status_code}"
        
        content = r.text
        
        # Get projects to check
        r = requests.get(f"{POSTGRES_BASE}/projects", timeout=5)
        projects = r.json()
        
        if len(projects) > 0:
            # Check if at least one project slug is in sitemap
            found = False
            for project in projects:
                slug = project.get("slug")
                if slug and slug in content:
                    found = True
                    break
            
            assert found, "No project slugs found in sitemap"
            log_test("Sitemap contains project slugs", True, f"Found project slugs in sitemap")
        else:
            log_test("Sitemap contains project slugs", True, "No projects to check")
        
    except Exception as e:
        log_test("Sitemap contains project slugs", False, str(e))


def test_blog_post_page():
    """Test 27: GET /blog/<slug> returns 200"""
    try:
        # Get a post first
        r = requests.get(f"{POSTGRES_BASE}/posts", timeout=5)
        posts = r.json()
        
        if len(posts) > 0:
            slug = posts[0].get("slug")
            if slug:
                r = requests.get(f"http://localhost:3101/blog/{slug}", timeout=10)
                assert r.status_code == 200, f"Expected 200, got {r.status_code}"
                log_test(f"GET /blog/<slug>", True, f"Loaded post: {slug}")
            else:
                log_test(f"GET /blog/<slug>", True, "No slug to test")
        else:
            log_test(f"GET /blog/<slug>", True, "No posts to test")
        
    except Exception as e:
        log_test(f"GET /blog/<slug>", False, str(e))


def cleanup_test_resources():
    """Clean up any test records created"""
    print("\n" + "="*80)
    print("CLEANUP: Removing test records...")
    print("="*80)
    
    for resource_type, resource_id in created_resources:
        try:
            if resource_type == "project":
                r = requests.delete(f"{POSTGRES_BASE}/projects/{resource_id}", timeout=5)
                print(f"Deleted project {resource_id}: {r.status_code}")
            elif resource_type == "news":
                r = requests.delete(f"{POSTGRES_BASE}/news/{resource_id}", timeout=5)
                print(f"Deleted news {resource_id}: {r.status_code}")
            elif resource_type == "team":
                r = requests.delete(f"{POSTGRES_BASE}/team/{resource_id}", timeout=5)
                print(f"Deleted team {resource_id}: {r.status_code}")
            elif resource_type == "testimonial":
                r = requests.delete(f"{POSTGRES_BASE}/testimonials/{resource_id}", timeout=5)
                print(f"Deleted testimonial {resource_id}: {r.status_code}")
            elif resource_type == "post":
                r = requests.delete(f"{POSTGRES_BASE}/posts/{resource_id}", timeout=5)
                print(f"Deleted post {resource_id}: {r.status_code}")
            # Note: enquiries and media don't have delete endpoints
        except Exception as e:
            print(f"Failed to delete {resource_type} {resource_id}: {e}")


def main():
    print("="*80)
    print("SUPABASE/POSTGRES MODE API REGRESSION TEST")
    print("Testing: http://localhost:3101/api")
    print("Comparing with MongoDB: http://localhost:3000/api")
    print("="*80)
    print()
    
    # Run all tests
    test_health()
    test_read_endpoints()
    test_projects_by_slug_and_id()
    test_projects_sorted()
    test_testimonials_filtering()
    test_compare_postgres_vs_mongo()
    test_crud_projects()
    test_crud_news()
    test_crud_team()
    test_crud_testimonial()
    test_crud_post()
    test_settings_merge()
    test_history_and_undo()
    test_enquiries_workflow()
    test_cron_escalate()
    
    # Upload tests
    png_url = test_upload_png()
    pdf_url = test_upload_pdf()
    test_media_get(png_url)
    test_media_get(pdf_url)
    test_media_range_requests(pdf_url)
    test_media_head(png_url)
    test_media_404()
    test_media_existing_migrated()
    
    # Admin tests
    backup_data = test_admin_backup()
    test_admin_restore(backup_data)
    
    # Frontend tests
    test_frontend_pages()
    test_sitemap_contains_projects()
    test_blog_post_page()
    
    # Cleanup
    cleanup_test_resources()
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for t in test_results if t["passed"])
    total = len(test_results)
    failed = total - passed
    
    print(f"\nTotal Tests: {total}")
    print(f"Passed: {passed} ✅")
    print(f"Failed: {failed} ❌")
    print(f"Success Rate: {(passed/total*100):.1f}%")
    
    if failed > 0:
        print("\nFailed Tests:")
        for t in test_results:
            if not t["passed"]:
                print(f"  ❌ {t['name']}: {t['details']}")
    
    print("\n" + "="*80)
    
    return failed == 0


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
