// Admin login checked on the SERVER.
// Credentials come only from environment variables: ADMIN_USERNAME + ADMIN_PASSWORD.
// After login the browser gets a signed, httpOnly session cookie (12 h). Every admin API checks it.
import crypto from 'crypto';

export const ADMIN_COOKIE = 'gillco_admin';
const SESSION_HOURS = 12;
const MAX_FAILS = 5;
const LOCK_MINUTES = 15;

function env(...names) {
  for (const n of names) {
    const v = process.env[n];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim().replace(/^["']|["']$/g, '');
  }
  return '';
}

// Also accepts common misspellings so a typo in hPanel doesn't lock you out
export function adminCreds() {
  return {
    user: env('ADMIN_USERNAME', 'ADMIN_UDERNAME', 'ADMIN_USER'),
    pass: env('ADMIN_PASSWORD', 'ADMIN_PSSWORD', 'ADMIN_PASS'),
  };
}
export function adminConfigured() {
  const c = adminCreds();
  return Boolean(c.user && c.pass);
}

// Signing key: SESSION_SECRET if set, mixed with the credentials so changing the password logs everyone out
function signingKey() {
  const c = adminCreds();
  return crypto.createHash('sha256').update(`${env('SESSION_SECRET')}|${c.user}|${c.pass}|gillco-admin-session-v1`).digest();
}
function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}
const b64u = (buf) => Buffer.from(buf).toString('base64url');

export function checkCredentials(username, password) {
  const c = adminCreds();
  if (!c.user || !c.pass) return false;
  // evaluate both to keep timing constant
  const u = safeEqual(String(username || '').trim().toLowerCase(), c.user.toLowerCase());
  const p = safeEqual(String(password || ''), c.pass);
  return u && p;
}

export function issueToken(user) {
  const payload = b64u(JSON.stringify({ u: user, exp: Date.now() + SESSION_HOURS * 3600 * 1000, n: crypto.randomBytes(8).toString('hex') }));
  const sig = b64u(crypto.createHmac('sha256', signingKey()).update(payload).digest());
  return `${payload}.${sig}`;
}

export function verifyToken(token) {
  if (!token || !adminConfigured()) return null;
  const [payload, sig] = String(token).split('.');
  if (!payload || !sig) return null;
  const expect = b64u(crypto.createHmac('sha256', signingKey()).update(payload).digest());
  if (expect.length !== sig.length || !crypto.timingSafeEqual(Buffer.from(expect), Buffer.from(sig))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (!data.exp || data.exp < Date.now()) return null;
    return data;
  } catch { return null; }
}

function readCookie(request, name) {
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > -1 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return '';
}

export function getAdminSession(request) {
  const auth = request.headers.get('authorization') || '';
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : '';
  return verifyToken(readCookie(request, ADMIN_COOKIE) || bearer);
}
export const isAdmin = (request) => Boolean(getAdminSession(request));

function isHttps(request) {
  const proto = (request.headers.get('x-forwarded-proto') || '').split(',')[0].trim();
  return proto === 'https' || request.url.startsWith('https://');
}
export function sessionCookie(request, token) {
  return `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_HOURS * 3600}${isHttps(request) ? '; Secure' : ''}`;
}
export function clearCookie(request) {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${isHttps(request) ? '; Secure' : ''}`;
}

// ---- brute-force protection: 5 wrong attempts -> 15 minute lock (per IP)
const G = globalThis.__gillcoLogin || (globalThis.__gillcoLogin = new Map());
export function clientIp(request) {
  return (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || request.headers.get('x-real-ip') || 'local';
}
export function loginLockedFor(ip) {
  const r = G.get(ip);
  if (!r || !r.until) return 0;
  const left = r.until - Date.now();
  if (left <= 0) { G.delete(ip); return 0; }
  return Math.ceil(left / 60000);
}
export function recordLoginFailure(ip) {
  const r = G.get(ip) || { fails: 0, until: 0 };
  r.fails += 1;
  if (r.fails >= MAX_FAILS) { r.until = Date.now() + LOCK_MINUTES * 60000; r.fails = 0; }
  G.set(ip, r);
  if (G.size > 5000) G.clear();
  return MAX_FAILS - r.fails;
}
export function recordLoginSuccess(ip) { G.delete(ip); }
