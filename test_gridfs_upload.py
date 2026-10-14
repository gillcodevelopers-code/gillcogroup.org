#!/usr/bin/env python3
"""
GridFS Upload Storage Testing for Gillco Group CMS
Tests MongoDB GridFS file upload, retrieval, range requests, and backup exclusion
"""

import requests
import io
import os
from uuid import uuid4

# Read base URL from .env
def get_base_url():
    try:
        with open('/app/.env', 'r') as f:
            for line in f:
                if line.startswith('NEXT_PUBLIC_BASE_URL='):
                    return line.split('=', 1)[1].strip()
    except:
        pass
    return 'http://localhost:3000'

BASE_URL = get_base_url()
API_URL = BASE_URL + '/api'
print(f"🔗 Testing against: {API_URL}\n")

# Test counters
passed = 0
failed = 0

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

def assert_true(condition, msg=""):
    if not condition:
        raise AssertionError(msg or "Expected True")

def assert_in(item, container, msg=""):
    if item not in container:
        raise AssertionError(f"{msg} Expected '{item}' in '{container}'")

# Create a small PNG file (1x1 red pixel)
PNG_BYTES = bytes([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # 1x1 dimensions
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,  # IDAT chunk
    0x54, 0x08, 0xD7, 0x63, 0xF8, 0xCF, 0xC0, 0x00,
    0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xDD, 0x8D,
    0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,  # IEND chunk
    0x44, 0xAE, 0x42, 0x60, 0x82
])

# Store uploaded file info for later tests
uploaded_png = {}
uploaded_pdf = {}

# ==================== TEST 1: Upload PNG file ====================
def test_upload_png():
    """POST /api/upload with PNG file should return 200 with url starting with /api/media/ and ending with .png"""
    files = {'file': ('test.png', io.BytesIO(PNG_BYTES), 'image/png')}
    r = requests.post(f"{API_URL}/upload", files=files, timeout=10)
    
    assert_eq(r.status_code, 200, "Status code should be 200")
    data = r.json()
    
    assert_true('url' in data, "Response should contain 'url'")
    assert_true(data['url'].startswith('/api/media/'), f"URL should start with '/api/media/', got {data['url']}")
    assert_true(data['url'].endswith('.png'), f"URL should end with '.png', got {data['url']}")
    assert_eq(data['size'], len(PNG_BYTES), f"Size should match uploaded bytes")
    assert_eq(data['mime'], 'image/png', "MIME type should be image/png")
    assert_eq(data['filename'], 'test.png', "Filename should match")
    
    # Store for later tests
    uploaded_png['url'] = data['url']
    uploaded_png['size'] = data['size']
    uploaded_png['bytes'] = PNG_BYTES
    
    print(f"    Uploaded PNG: {data['url']}, size: {data['size']} bytes")

# ==================== TEST 2: Retrieve PNG file ====================
def test_retrieve_png():
    """GET uploaded PNG should return 200 with correct Content-Type, Cache-Control immutable, and identical bytes"""
    if not uploaded_png.get('url'):
        raise AssertionError("PNG not uploaded yet, run test_upload_png first")
    
    url = BASE_URL + uploaded_png['url']
    r = requests.get(url, timeout=10)
    
    assert_eq(r.status_code, 200, "Status code should be 200")
    assert_eq(r.headers.get('Content-Type'), 'image/png', "Content-Type should be image/png")
    
    cache_control = r.headers.get('Cache-Control', '')
    assert_in('immutable', cache_control, f"Cache-Control should contain 'immutable', got '{cache_control}'")
    
    # Verify bytes are identical
    retrieved_bytes = r.content
    assert_eq(len(retrieved_bytes), len(uploaded_png['bytes']), "Retrieved size should match uploaded size")
    assert_eq(retrieved_bytes, uploaded_png['bytes'], "Retrieved bytes should be identical to uploaded bytes")
    
    print(f"    Retrieved PNG: {len(retrieved_bytes)} bytes, Cache-Control: {cache_control}")

# ==================== TEST 3: Upload ~2MB PDF ====================
def test_upload_pdf():
    """Upload ~2MB PDF with random bytes, should return 200 with correct url and mime type"""
    # Generate ~2MB of random-ish bytes
    pdf_size = 2 * 1024 * 1024  # 2MB
    pdf_bytes = os.urandom(pdf_size)
    
    files = {'file': ('document.pdf', io.BytesIO(pdf_bytes), 'application/pdf')}
    r = requests.post(f"{API_URL}/upload", files=files, timeout=30)
    
    assert_eq(r.status_code, 200, "Status code should be 200")
    data = r.json()
    
    assert_true('url' in data, "Response should contain 'url'")
    assert_true(data['url'].startswith('/api/media/'), f"URL should start with '/api/media/', got {data['url']}")
    assert_true(data['url'].endswith('.pdf'), f"URL should end with '.pdf', got {data['url']}")
    assert_eq(data['size'], pdf_size, f"Size should match uploaded bytes")
    assert_eq(data['mime'], 'application/pdf', "MIME type should be application/pdf")
    
    # Store for later tests
    uploaded_pdf['url'] = data['url']
    uploaded_pdf['size'] = data['size']
    uploaded_pdf['bytes'] = pdf_bytes
    
    print(f"    Uploaded PDF: {data['url']}, size: {data['size']} bytes (~{data['size']/(1024*1024):.2f}MB)")

# ==================== TEST 4: Retrieve PDF file ====================
def test_retrieve_pdf():
    """GET uploaded PDF should return 200 with correct Content-Type and identical bytes"""
    if not uploaded_pdf.get('url'):
        raise AssertionError("PDF not uploaded yet, run test_upload_pdf first")
    
    url = BASE_URL + uploaded_pdf['url']
    r = requests.get(url, timeout=30)
    
    assert_eq(r.status_code, 200, "Status code should be 200")
    assert_eq(r.headers.get('Content-Type'), 'application/pdf', "Content-Type should be application/pdf")
    
    # Verify bytes are identical
    retrieved_bytes = r.content
    assert_eq(len(retrieved_bytes), len(uploaded_pdf['bytes']), "Retrieved size should match uploaded size")
    assert_eq(retrieved_bytes, uploaded_pdf['bytes'], "Retrieved bytes should be identical to uploaded bytes")
    
    print(f"    Retrieved PDF: {len(retrieved_bytes)} bytes, all bytes match")

# ==================== TEST 5: Range request bytes=0-9 ====================
def test_range_request_first_10_bytes():
    """GET with Range: bytes=0-9 should return 206 with Content-Range and 10 bytes matching original"""
    if not uploaded_pdf.get('url'):
        raise AssertionError("PDF not uploaded yet, run test_upload_pdf first")
    
    url = BASE_URL + uploaded_pdf['url']
    headers = {'Range': 'bytes=0-9'}
    r = requests.get(url, headers=headers, timeout=10)
    
    assert_eq(r.status_code, 206, "Status code should be 206 Partial Content")
    
    content_range = r.headers.get('Content-Range', '')
    expected_range = f"bytes 0-9/{uploaded_pdf['size']}"
    assert_eq(content_range, expected_range, f"Content-Range should be '{expected_range}'")
    
    # Verify body is exactly 10 bytes
    retrieved_bytes = r.content
    assert_eq(len(retrieved_bytes), 10, "Body should be exactly 10 bytes")
    
    # Verify bytes match original
    expected_bytes = uploaded_pdf['bytes'][0:10]
    assert_eq(retrieved_bytes, expected_bytes, "Retrieved bytes should match original bytes[0:10]")
    
    print(f"    Range 0-9: 206 response, Content-Range: {content_range}, 10 bytes match")

# ==================== TEST 6: Range request bytes=100- ====================
def test_range_request_from_100_to_end():
    """GET with Range: bytes=100- should return 206 with correct length"""
    if not uploaded_pdf.get('url'):
        raise AssertionError("PDF not uploaded yet, run test_upload_pdf first")
    
    url = BASE_URL + uploaded_pdf['url']
    headers = {'Range': 'bytes=100-'}
    r = requests.get(url, headers=headers, timeout=30)
    
    assert_eq(r.status_code, 206, "Status code should be 206 Partial Content")
    
    # Verify body length
    retrieved_bytes = r.content
    expected_length = uploaded_pdf['size'] - 100
    assert_eq(len(retrieved_bytes), expected_length, f"Body should be {expected_length} bytes (size - 100)")
    
    # Verify bytes match original
    expected_bytes = uploaded_pdf['bytes'][100:]
    assert_eq(retrieved_bytes, expected_bytes, "Retrieved bytes should match original bytes[100:]")
    
    content_range = r.headers.get('Content-Range', '')
    print(f"    Range 100-: 206 response, Content-Range: {content_range}, {len(retrieved_bytes)} bytes match")

# ==================== TEST 7: HEAD request ====================
def test_head_request():
    """HEAD request should return 200 with Content-Length"""
    if not uploaded_png.get('url'):
        raise AssertionError("PNG not uploaded yet, run test_upload_png first")
    
    url = BASE_URL + uploaded_png['url']
    r = requests.head(url, timeout=10)
    
    assert_eq(r.status_code, 200, "Status code should be 200")
    
    content_length = r.headers.get('Content-Length')
    assert_true(content_length is not None, "Content-Length header should be present")
    assert_eq(int(content_length), uploaded_png['size'], f"Content-Length should match file size")
    
    # Verify no body
    assert_eq(len(r.content), 0, "HEAD response should have no body")
    
    print(f"    HEAD request: 200, Content-Length: {content_length}")

# ==================== TEST 8: 404 for invalid UUID ====================
def test_404_invalid_uuid():
    """GET /api/media/not-a-uuid.png should return 404"""
    url = f"{BASE_URL}/api/media/not-a-uuid.png"
    r = requests.get(url, timeout=10)
    
    assert_eq(r.status_code, 404, "Status code should be 404 for invalid UUID")
    
    print(f"    Invalid UUID: 404 as expected")

# ==================== TEST 9: 404 for non-existent UUID ====================
def test_404_nonexistent_uuid():
    """GET /api/media/<random-uuid>.png should return 404"""
    random_uuid = str(uuid4())
    url = f"{BASE_URL}/api/media/{random_uuid}.png"
    r = requests.get(url, timeout=10)
    
    assert_eq(r.status_code, 404, "Status code should be 404 for non-existent UUID")
    
    print(f"    Non-existent UUID {random_uuid}: 404 as expected")

# ==================== TEST 10: 400 for non-multipart request ====================
def test_400_non_multipart():
    """POST /api/upload with non-multipart should return 400"""
    r = requests.post(f"{API_URL}/upload", json={'file': 'test'}, timeout=10)
    
    assert_eq(r.status_code, 400, "Status code should be 400 for non-multipart")
    data = r.json()
    assert_true('error' in data, "Response should contain error message")
    
    print(f"    Non-multipart request: 400, error: {data.get('error')}")

# ==================== TEST 11: 400 for multipart without file ====================
def test_400_multipart_no_file():
    """POST /api/upload multipart without file field should return 400"""
    files = {'notfile': ('test.txt', io.BytesIO(b'test'), 'text/plain')}
    r = requests.post(f"{API_URL}/upload", files=files, timeout=10)
    
    assert_eq(r.status_code, 400, "Status code should be 400 for missing file field")
    data = r.json()
    assert_true('error' in data, "Response should contain error message")
    
    print(f"    Multipart without file: 400, error: {data.get('error')}")

# ==================== TEST 12: Backup excludes media collections ====================
def test_backup_excludes_media():
    """GET /api/admin/backup should NOT include 'media.files' or 'media.chunks' in collections"""
    headers = {'x-admin-password': 'gillco2025'}
    r = requests.get(f"{API_URL}/admin/backup", headers=headers, timeout=30)
    
    assert_eq(r.status_code, 200, "Status code should be 200")
    
    data = r.json()
    assert_true('collections' in data, "Response should contain 'collections'")
    
    collection_names = list(data['collections'].keys())
    
    # Check that media.files and media.chunks are NOT in the collections
    assert_true('media.files' not in collection_names, 
                f"'media.files' should NOT be in backup collections, found: {collection_names}")
    assert_true('media.chunks' not in collection_names, 
                f"'media.chunks' should NOT be in backup collections, found: {collection_names}")
    
    print(f"    Backup collections: {collection_names}")
    print(f"    ✓ 'media.files' and 'media.chunks' correctly excluded")

# ==================== TEST 13: Regression - /api/projects ====================
def test_regression_projects():
    """GET /api/projects should still work"""
    r = requests.get(f"{API_URL}/projects", timeout=10)
    assert_eq(r.status_code, 200, "GET /api/projects should return 200")
    data = r.json()
    assert_true(isinstance(data, list), "Response should be an array")
    print(f"    GET /api/projects: 200, {len(data)} projects")

# ==================== TEST 14: Regression - /api/settings ====================
def test_regression_settings():
    """GET /api/settings should still work"""
    r = requests.get(f"{API_URL}/settings", timeout=10)
    assert_eq(r.status_code, 200, "GET /api/settings should return 200")
    data = r.json()
    assert_true('brandName' in data, "Response should contain brandName")
    print(f"    GET /api/settings: 200, brandName: {data.get('brandName')}")

# ==================== TEST 15: Regression - /api/health ====================
def test_regression_health():
    """GET /api/health should still work"""
    r = requests.get(f"{API_URL}/health", timeout=10)
    assert_eq(r.status_code, 200, "GET /api/health should return 200")
    data = r.json()
    assert_true(data.get('ok'), "Response should have ok:true")
    print(f"    GET /api/health: 200, ok: {data.get('ok')}, db: {data.get('db')}")

# ==================== RUN ALL TESTS ====================
if __name__ == '__main__':
    print("=" * 80)
    print("GRIDFS UPLOAD STORAGE TESTING")
    print("=" * 80)
    print()
    
    # Test Group 1: PNG Upload and Retrieval
    print("📋 TEST GROUP 1: PNG Upload and Retrieval")
    print("-" * 80)
    test("T1: POST /api/upload with PNG file", test_upload_png)
    test("T2: GET uploaded PNG with correct headers and bytes", test_retrieve_png)
    
    # Test Group 2: PDF Upload and Retrieval
    print("📋 TEST GROUP 2: PDF Upload and Retrieval (~2MB)")
    print("-" * 80)
    test("T3: POST /api/upload with ~2MB PDF", test_upload_pdf)
    test("T4: GET uploaded PDF with identical bytes", test_retrieve_pdf)
    
    # Test Group 3: Range Requests
    print("📋 TEST GROUP 3: Range Requests")
    print("-" * 80)
    test("T5: GET with Range: bytes=0-9 returns 206 with 10 bytes", test_range_request_first_10_bytes)
    test("T6: GET with Range: bytes=100- returns 206 with correct length", test_range_request_from_100_to_end)
    
    # Test Group 4: HEAD Request
    print("📋 TEST GROUP 4: HEAD Request")
    print("-" * 80)
    test("T7: HEAD request returns 200 with Content-Length", test_head_request)
    
    # Test Group 5: Error Cases
    print("📋 TEST GROUP 5: Error Cases (404, 400)")
    print("-" * 80)
    test("T8: GET /api/media/not-a-uuid.png returns 404", test_404_invalid_uuid)
    test("T9: GET /api/media/<random-uuid>.png returns 404", test_404_nonexistent_uuid)
    test("T10: POST /api/upload non-multipart returns 400", test_400_non_multipart)
    test("T11: POST /api/upload multipart without file returns 400", test_400_multipart_no_file)
    
    # Test Group 6: Backup Exclusion
    print("📋 TEST GROUP 6: Backup Excludes Media Collections")
    print("-" * 80)
    test("T12: GET /api/admin/backup excludes media.files and media.chunks", test_backup_excludes_media)
    
    # Test Group 7: Regression
    print("📋 TEST GROUP 7: Regression Tests")
    print("-" * 80)
    test("T13: GET /api/projects still works", test_regression_projects)
    test("T14: GET /api/settings still works", test_regression_settings)
    test("T15: GET /api/health still works", test_regression_health)
    
    # Summary
    print("=" * 80)
    print(f"RESULTS: {passed} passed, {failed} failed")
    print("=" * 80)
    
    if failed == 0:
        print("✅ ALL TESTS PASSED")
    else:
        print(f"❌ {failed} TEST(S) FAILED")
    
    print()
