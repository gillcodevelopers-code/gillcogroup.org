// Single place that decides which database the site uses.
//   - Supabase / Postgres  when DATABASE_URL is set (or DB_PROVIDER=supabase)
//   - MongoDB              otherwise (MONGO_URL + DB_NAME)
// Uploaded files: Supabase Storage (SUPABASE_URL + SUPABASE_SECRET_KEY), else inside the database.
import { MongoClient, GridFSBucket } from 'mongodb';
import { Readable } from 'stream';
import { PgDocStore, SCHEMA_SQL } from './docstore';

const G = globalThis.__gillcoDb || (globalThis.__gillcoDb = {});

// Clean common copy-paste mistakes in env values (quotes, spaces, "NAME=" prefix)
export function cleanEnv(v) {
  return String(v || '').trim().replace(/^[A-Z_]+=/, '').replace(/^["']|["']$/g, '').trim();
}

export function dbProvider() {
  const p = cleanEnv(process.env.DB_PROVIDER).toLowerCase();
  if (p === 'mongo' || p === 'mongodb') return 'mongo';
  if (p === 'supabase' || p === 'postgres' || p === 'postgresql') return 'supabase';
  return cleanEnv(process.env.DATABASE_URL) ? 'supabase' : 'mongo';
}

// ---------------------------------------------------------------- Postgres / Supabase
function pgConfig() {
  const raw = cleanEnv(process.env.DATABASE_URL);
  if (!raw) throw new Error('DATABASE_URL is not set (Supabase -> Connect -> Session pooler connection string)');
  if (!/^postgres(ql)?:\/\//i.test(raw)) throw new Error('DATABASE_URL must start with postgresql:// (copy the Session pooler string from Supabase -> Connect)');
  if (raw.includes('[YOUR-PASSWORD]')) throw new Error('DATABASE_URL still contains [YOUR-PASSWORD] - replace it with your Supabase database password');
  const u = new URL(raw);
  const sslmode = (u.searchParams.get('sslmode') || '').toLowerCase();
  // We set TLS explicitly below; remove URL ssl params so they don't override it
  ['sslmode', 'ssl', 'sslrootcert', 'sslcert', 'sslkey'].forEach((k) => u.searchParams.delete(k));
  const local = ['localhost', '127.0.0.1', '::1'].includes(u.hostname) || u.hostname.startsWith('/') || u.searchParams.get('host')?.startsWith('/');
  const ssl = sslmode === 'disable' || local ? false : (process.env.PG_CA ? { ca: process.env.PG_CA, rejectUnauthorized: true } : { rejectUnauthorized: false });
  return {
    connectionString: u.toString(),
    ssl,
    max: Number(process.env.DB_POOL_MAX || 5),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
}

async function connectPg() {
  if (!G.pgPromise) {
    G.pgPromise = (async () => {
      const { Pool } = await import('pg');
      const pool = new Pool(pgConfig());
      pool.on('error', (err) => console.error('[db] idle client error', err?.message));
      await pool.query(SCHEMA_SQL);
      return new PgDocStore(pool);
    })().catch((err) => { G.pgPromise = null; throw err; });
  }
  return G.pgPromise;
}

// ---------------------------------------------------------------- MongoDB
async function connectMongo() {
  if (!G.mongoPromise) {
    const url = cleanEnv(process.env.MONGO_URL);
    const dbName = cleanEnv(process.env.DB_NAME);
    if (!url) throw new Error('No database configured: set DATABASE_URL (Supabase) or MONGO_URL + DB_NAME');
    if (!dbName) throw new Error('DB_NAME is not set in the hosting environment variables');
    if (/[./\\\s"$*<>:|?]/.test(dbName)) {
      throw new Error('DB_NAME must be only the database name (e.g. gillco) - not the cluster address or connection string');
    }
    G.mongoPromise = new MongoClient(url).connect()
      .then((client) => { const db = client.db(dbName); db.provider = 'mongo'; return db; })
      .catch((err) => { G.mongoPromise = null; throw err; });
  }
  return G.mongoPromise;
}

export async function getDb() {
  return dbProvider() === 'supabase' ? connectPg() : connectMongo();
}

// ---------------------------------------------------------------- media (uploaded files)
function supaStorage() {
  const url = cleanEnv(process.env.SUPABASE_URL).replace(/\/+$/, '');
  const key = cleanEnv(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) return null;
  const bucket = cleanEnv(process.env.STORAGE_BUCKET) || 'gillco-media';
  const headers = { apikey: key };
  if (key.startsWith('eyJ')) headers.Authorization = `Bearer ${key}`; // legacy service_role JWT
  return { url, bucket, headers };
}
export function mediaBackend(db) {
  if (db?.provider === 'supabase') return supaStorage() ? 'supabase-storage' : 'postgres';
  return 'gridfs';
}

async function ensureBucket(st) {
  if (G.bucketReady === st.bucket) return;
  const r = await fetch(`${st.url}/storage/v1/bucket`, {
    method: 'POST',
    headers: { ...st.headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: st.bucket, name: st.bucket, public: false }),
  });
  if (!r.ok) {
    const t = await r.text();
    if (!/already exists|duplicate|409/i.test(t) && r.status !== 409) throw new Error(`Supabase Storage bucket error (${r.status}): ${t.slice(0, 200)}`);
  }
  G.bucketReady = st.bucket;
}

export async function putMedia(db, { id, fname, mime, originalName, buffer }) {
  if (db.provider === 'supabase') {
    const st = supaStorage();
    if (st) {
      await ensureBucket(st);
      const r = await fetch(`${st.url}/storage/v1/object/${encodeURIComponent(st.bucket)}/${encodeURIComponent(fname)}`, {
        method: 'POST',
        headers: { ...st.headers, 'Content-Type': mime, 'x-upsert': 'true', 'Cache-Control': 'max-age=31536000' },
        body: buffer,
      });
      if (!r.ok) throw new Error(`Supabase Storage upload failed (${r.status}): ${(await r.text()).slice(0, 200)}`);
      await db.pool.query(
        `INSERT INTO app_media (id, filename, mime, original_name, size, storage) VALUES ($1,$2,$3,$4,$5,'supabase')
         ON CONFLICT (id) DO UPDATE SET filename=EXCLUDED.filename, mime=EXCLUDED.mime, original_name=EXCLUDED.original_name, size=EXCLUDED.size, storage='supabase', data=NULL`,
        [id, fname, mime, originalName, buffer.length]
      );
    } else {
      await db.pool.query(
        `INSERT INTO app_media (id, filename, mime, original_name, size, storage, data) VALUES ($1,$2,$3,$4,$5,'db',$6)
         ON CONFLICT (id) DO UPDATE SET filename=EXCLUDED.filename, mime=EXCLUDED.mime, original_name=EXCLUDED.original_name, size=EXCLUDED.size, storage='db', data=EXCLUDED.data`,
        [id, fname, mime, originalName, buffer.length, buffer]
      );
    }
    return;
  }
  const bucket = new GridFSBucket(db, { bucketName: 'media' });
  await new Promise((resolve, reject) => {
    const up = bucket.openUploadStreamWithId(id, fname, { metadata: { mime, originalName, size: buffer.length, uploadedAt: new Date().toISOString() } });
    up.once('finish', resolve).once('error', reject);
    up.end(buffer);
  });
}

export async function getMediaMeta(db, id) {
  if (db.provider === 'supabase') {
    const r = await db.pool.query('SELECT id, filename, mime, original_name, size, storage FROM app_media WHERE id = $1', [id]);
    const m = r.rows[0];
    return m ? { id: m.id, filename: m.filename, mime: m.mime, originalName: m.original_name, size: Number(m.size), storage: m.storage } : null;
  }
  const f = await db.collection('media.files').findOne({ _id: id });
  return f ? { id, filename: f.filename, mime: f.metadata?.mime, originalName: f.metadata?.originalName, size: f.length, storage: 'gridfs' } : null;
}

// Returns a web ReadableStream / Buffer for the byte range [start, end] (inclusive)
export async function openMedia(db, meta, start, end) {
  if (meta.storage === 'gridfs') {
    const bucket = new GridFSBucket(db, { bucketName: 'media' });
    return Readable.toWeb(bucket.openDownloadStream(meta.id, { start, end: end + 1 }));
  }
  if (meta.storage === 'supabase') {
    const st = supaStorage();
    if (!st) throw new Error('File is in Supabase Storage but SUPABASE_URL / SUPABASE_SECRET_KEY are not set');
    const r = await fetch(`${st.url}/storage/v1/object/authenticated/${encodeURIComponent(st.bucket)}/${encodeURIComponent(meta.filename)}`, {
      headers: { ...st.headers, Range: `bytes=${start}-${end}` },
      cache: 'no-store',
    });
    if (!r.ok) throw new Error(`Supabase Storage download failed (${r.status})`);
    // If storage ignored the Range header, slice it ourselves
    if (r.status === 200 && (start > 0 || end < meta.size - 1)) {
      const buf = Buffer.from(await r.arrayBuffer());
      return buf.subarray(start, end + 1);
    }
    return r.body;
  }
  const r = await db.pool.query('SELECT substring(data from $2 for $3) AS chunk FROM app_media WHERE id = $1', [meta.id, start + 1, end - start + 1]);
  return r.rows[0]?.chunk || Buffer.alloc(0);
}
