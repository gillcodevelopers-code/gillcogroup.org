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
  const email = env('ADMIN_EMAIL').toLowerCase();
  const user = env('ADMIN_USERNAME', 'ADMIN_UDERNAME', 'ADMIN_USER') || email;
  return { user, email, pass: env('ADMIN_PASSWORD', 'ADMIN_PSSWORD', 'ADMIN_PASS') };
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

// ---- Password set via "Forgot password" (stored hashed in the database, collection admin_auth)
// It overrides ADMIN_PASSWORD only while ADMIN_PASSWORD in hPanel stays unchanged - editing the env var always wins.
const AUTH = globalThis.__gillcoAuthState || (globalThis.__gillcoAuthState = { loadedAt: 0, doc: null });
const envFingerprint = () => crypto.createHash('sha256').update(`gillco-env|${adminCreds().pass}`).digest('hex').slice(0, 32);
const scrypt = (pw, salt) => crypto.scryptSync(String(pw), Buffer.from(salt, 'hex'), 64).toString('hex');

export async function loadAuthState(db, { fresh = false } = {}) {
  if (!db) return AUTH.doc;
  if (fresh || Date.now() - AUTH.loadedAt > 15000) {
    AUTH.doc = await db.collection('admin_auth').findOne({ id: 'password' }).catch(() => AUTH.doc);
    AUTH.loadedAt = Date.now();
  }
  return AUTH.doc;
}
function activeStored() {
  const d = AUTH.doc;
  return d && d.hash && d.salt && d.envFp === envFingerprint() ? d : null;
}
export function authVersion() { return activeStored()?.version || 0; }

export async function setStoredPassword(db, newPassword) {
  const salt = crypto.randomBytes(16).toString('hex');
  const version = (activeStored()?.version || 0) + 1 + Math.floor(Math.random() * 1000);
  const doc = { id: 'password', salt, hash: scrypt(newPassword, salt), envFp: envFingerprint(), version, updatedAt: new Date().toISOString() };
  await db.collection('admin_auth').updateOne({ id: 'password' }, { $set: doc }, { upsert: true });
  AUTH.doc = doc; AUTH.loadedAt = Date.now();
}

const sha = (v) => crypto.createHash('sha256').update(String(v)).digest('hex');
export async function createResetToken(db) {
  const token = crypto.randomBytes(32).toString('base64url');
  await db.collection('admin_auth').updateOne({ id: 'reset' }, { $set: { id: 'reset', hash: sha(token), exp: Date.now() + 30 * 60000, used: false, createdAt: new Date().toISOString() } }, { upsert: true });
  return token;
}
export async function checkResetToken(db, token) {
  if (!token || String(token).length < 20) return false;
  const r = await db.collection('admin_auth').findOne({ id: 'reset' });
  return Boolean(r && !r.used && r.exp > Date.now() && safeEqual(r.hash, sha(token)));
}
export async function consumeResetToken(db, token) {
  if (!(await checkResetToken(db, token))) return false;
  // atomic: only one request can use the token
  const res = await db.collection('admin_auth').updateOne({ id: 'reset', used: false, hash: sha(token) }, { $set: { used: true, usedAt: new Date().toISOString() } });
  return res.modifiedCount === 1;
}

export function checkCredentials(username, password) {
  const c = adminCreds();
  if (!c.user || !c.pass) return false;
  const stored = activeStored();
  // Log in with the username OR the admin email (ADMIN_EMAIL). Evaluate all to keep timing constant.
  const given = String(username || '').trim().toLowerCase();
  const byUser = safeEqual(given, c.user.toLowerCase());
  const byEmail = c.email ? safeEqual(given, c.email) : false;
  const p = stored ? safeEqual(scrypt(password || '', stored.salt), stored.hash) : safeEqual(String(password || ''), c.pass);
  return (byUser || byEmail) && p;
}

export function issueToken(user) {
  const payload = b64u(JSON.stringify({ u: user, v: authVersion(), exp: Date.now() + SESSION_HOURS * 3600 * 1000, n: crypto.randomBytes(8).toString('hex') }));
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
    if ((data.v || 0) !== authVersion()) return null; // password was reset -> old sessions end
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
