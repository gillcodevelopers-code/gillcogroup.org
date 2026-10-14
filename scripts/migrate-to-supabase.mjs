#!/usr/bin/env node
// One-time copy: MongoDB (Atlas) -> Supabase (Postgres + Storage)
//
// Usage (from the project folder):
//   SOURCE_MONGO_URL="mongodb+srv://..." SOURCE_DB_NAME="gillco" \
//   DATABASE_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres" \
//   SUPABASE_URL="https://xxxx.supabase.co" SUPABASE_SECRET_KEY="sb_secret_..." \
//   node scripts/migrate-to-supabase.mjs [--dry-run]
//
// - Copies every collection (projects, settings, enquiries, news, team, posts, testimonials, history, ...)
// - Copies every uploaded file (GridFS "media") to Supabase Storage (or into Postgres if no storage keys)
// - Safe to re-run: each collection in Supabase is replaced with the latest copy from MongoDB.
import { MongoClient, GridFSBucket } from 'mongodb';
import pg from 'pg';
import { PgDocStore, SCHEMA_SQL } from '../lib/docstore.js';

const clean = (v) => String(v || '').trim().replace(/^["']|["']$/g, '').trim();
const DRY = process.argv.includes('--dry-run');
const SRC_URL = clean(process.env.SOURCE_MONGO_URL || process.env.MONGO_URL);
const SRC_DB = clean(process.env.SOURCE_DB_NAME || process.env.DB_NAME);
const DST_URL = clean(process.env.DATABASE_URL);
const SUPA_URL = clean(process.env.SUPABASE_URL).replace(/\/+$/, '');
const SUPA_KEY = clean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = clean(process.env.STORAGE_BUCKET) || 'gillco-media';

if (!SRC_URL || !SRC_DB) { console.error('Set SOURCE_MONGO_URL and SOURCE_DB_NAME'); process.exit(1); }
if (!DST_URL) { console.error('Set DATABASE_URL (Supabase Session pooler string)'); process.exit(1); }

function pgConfig(raw) {
  const u = new URL(raw);
  const sslmode = (u.searchParams.get('sslmode') || '').toLowerCase();
  ['sslmode', 'ssl', 'sslrootcert', 'sslcert', 'sslkey'].forEach((k) => u.searchParams.delete(k));
  const local = ['localhost', '127.0.0.1'].includes(u.hostname);
  return { connectionString: u.toString(), ssl: sslmode === 'disable' || local ? false : { rejectUnauthorized: false }, max: 3 };
}
const storageHeaders = () => { const h = { apikey: SUPA_KEY }; if (SUPA_KEY.startsWith('eyJ')) h.Authorization = `Bearer ${SUPA_KEY}`; return h; };

async function main() {
  console.log(`Source: MongoDB db "${SRC_DB}"`);
  console.log(`Target: ${new URL(DST_URL).hostname}${DRY ? '  (DRY RUN - nothing will be written)' : ''}`);
  console.log(`Files : ${SUPA_URL && SUPA_KEY ? `Supabase Storage bucket "${BUCKET}"` : 'stored inside Postgres (no SUPABASE_URL / SUPABASE_SECRET_KEY)'}\n`);

  const mongo = await new MongoClient(SRC_URL).connect();
  const src = mongo.db(SRC_DB);
  const pool = new pg.Pool(pgConfig(DST_URL));
  await pool.query('SELECT 1');
  if (!DRY) await pool.query(SCHEMA_SQL);
  const dst = new PgDocStore(pool);

  // ---- collections
  const names = (await src.listCollections({}, { nameOnly: true }).toArray())
    .map((c) => c.name).filter((n) => !n.startsWith('system.') && !n.startsWith('media.') && !n.startsWith('__restore')).sort();
  const report = [];
  for (const name of names) {
    const docs = (await src.collection(name).find({}).toArray()).map((d) => {
      const { _id, ...rest } = d;
      if (rest.id === undefined || rest.id === null) rest.id = String(_id);
      return JSON.parse(JSON.stringify(rest));
    });
    if (!DRY) {
      const tmp = dst.collection(`__restore_${name}`);
      await tmp.drop();
      if (docs.length) await tmp.insertMany(docs);
      await tmp.rename(name, { dropTarget: true });
    }
    const copied = DRY ? docs.length : await dst.collection(name).countDocuments();
    report.push([name, docs.length, copied]);
    console.log(`  ${name.padEnd(16)} ${String(docs.length).padStart(5)} -> ${String(copied).padStart(5)} ${docs.length === copied ? 'OK' : 'MISMATCH'}`);
  }

  // ---- uploaded files (GridFS bucket "media")
  const files = await src.collection('media.files').find({}).toArray().catch(() => []);
  let fileOk = 0, bytes = 0;
  if (files.length) console.log(`\n  Uploaded files: ${files.length}`);
  if (!DRY && files.length && SUPA_URL && SUPA_KEY) {
    const r = await fetch(`${SUPA_URL}/storage/v1/bucket`, { method: 'POST', headers: { ...storageHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ id: BUCKET, name: BUCKET, public: false }) });
    if (!r.ok && r.status !== 409) { const t = await r.text(); if (!/already exists|duplicate/i.test(t)) throw new Error(`Bucket error ${r.status}: ${t}`); }
  }
  const gfs = new GridFSBucket(src, { bucketName: 'media' });
  for (const f of files) {
    const id = String(f._id);
    const mime = f.metadata?.mime || 'application/octet-stream';
    const original = f.metadata?.originalName || f.filename;
    const chunks = [];
    await new Promise((res, rej) => gfs.openDownloadStream(f._id).on('data', (c) => chunks.push(c)).on('end', res).on('error', rej));
    const buf = Buffer.concat(chunks);
    bytes += buf.length;
    if (!DRY) {
      if (SUPA_URL && SUPA_KEY) {
        const up = await fetch(`${SUPA_URL}/storage/v1/object/${encodeURIComponent(BUCKET)}/${encodeURIComponent(f.filename)}`, { method: 'POST', headers: { ...storageHeaders(), 'Content-Type': mime, 'x-upsert': 'true' }, body: buf });
        if (!up.ok) { console.log(`  ! ${f.filename}: upload failed ${up.status} ${(await up.text()).slice(0, 120)}`); continue; }
        await pool.query(`INSERT INTO app_media (id, filename, mime, original_name, size, storage) VALUES ($1,$2,$3,$4,$5,'supabase')
          ON CONFLICT (id) DO UPDATE SET filename=EXCLUDED.filename, mime=EXCLUDED.mime, original_name=EXCLUDED.original_name, size=EXCLUDED.size, storage='supabase', data=NULL`, [id, f.filename, mime, original, buf.length]);
      } else {
        await pool.query(`INSERT INTO app_media (id, filename, mime, original_name, size, storage, data) VALUES ($1,$2,$3,$4,$5,'db',$6)
          ON CONFLICT (id) DO UPDATE SET filename=EXCLUDED.filename, mime=EXCLUDED.mime, original_name=EXCLUDED.original_name, size=EXCLUDED.size, storage='db', data=EXCLUDED.data`, [id, f.filename, mime, original, buf.length, buf]);
      }
    }
    fileOk++;
  }
  if (files.length) console.log(`  Files copied: ${fileOk}/${files.length} (${(bytes / 1048576).toFixed(1)} MB)`);

  const bad = report.filter(([, a, b]) => a !== b);
  console.log(`\n${bad.length || fileOk !== files.length ? 'FINISHED WITH PROBLEMS' : 'DONE - everything copied'}${DRY ? ' (dry run)' : ''}`);
  await mongo.close(); await pool.end();
  process.exit(bad.length || fileOk !== files.length ? 2 : 0);
}
main().catch((e) => { console.error('\nMIGRATION FAILED:', e.message); process.exit(1); });
