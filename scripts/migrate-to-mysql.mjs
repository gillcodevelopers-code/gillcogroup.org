#!/usr/bin/env node
// One-time copy: MongoDB (Atlas) -> Hostinger MySQL / MariaDB
//
// Usage (from the project folder):
//   SOURCE_MONGO_URL="mongodb+srv://..." SOURCE_DB_NAME="gillco" \
//   MYSQL_HOST="srv1234.hstgr.io" MYSQL_PORT=3306 MYSQL_DATABASE="u123456789_gillco" \
//   MYSQL_USER="u123456789_gillco" MYSQL_PASSWORD="..." \
//   node scripts/migrate-to-mysql.mjs [--dry-run]
//
// (Run from outside Hostinger? Enable hPanel -> Databases -> Remote MySQL for your IP first.)
// - Copies every collection (projects, settings, enquiries, news, team, posts, testimonials, history, ...)
// - Copies every uploaded file (GridFS "media") into MySQL
// - Safe to re-run: each collection in MySQL is replaced with the latest copy from MongoDB.
import { MongoClient, GridFSBucket } from 'mongodb';
import mysql from 'mysql2/promise';
import { MysqlDocStore, MYSQL_SCHEMA } from '../lib/mysqlstore.js';

const clean = (v) => String(v || '').trim().replace(/^["']|["']$/g, '').trim();
const DRY = process.argv.includes('--dry-run');
const SRC_URL = clean(process.env.SOURCE_MONGO_URL || process.env.MONGO_URL);
const SRC_DB = clean(process.env.SOURCE_DB_NAME || process.env.DB_NAME);
const cfg = {
  host: clean(process.env.MYSQL_HOST) || 'localhost',
  port: Number(clean(process.env.MYSQL_PORT) || 3306),
  user: clean(process.env.MYSQL_USER),
  password: String(process.env.MYSQL_PASSWORD ?? ''),
  database: clean(process.env.MYSQL_DATABASE),
  charset: 'utf8mb4',
  connectionLimit: 3,
  ssl: /^(1|true|yes|required)$/i.test(clean(process.env.MYSQL_SSL)) ? { rejectUnauthorized: false } : undefined,
};
if (!SRC_URL || !SRC_DB) { console.error('Set SOURCE_MONGO_URL and SOURCE_DB_NAME'); process.exit(1); }
if (!cfg.user || !cfg.database) { console.error('Set MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD'); process.exit(1); }

async function main() {
  console.log(`Source: MongoDB db "${SRC_DB}"`);
  console.log(`Target: MySQL ${cfg.user}@${cfg.host}:${cfg.port}/${cfg.database}${DRY ? '  (DRY RUN - nothing will be written)' : ''}\n`);
  const mongo = await new MongoClient(SRC_URL).connect();
  const src = mongo.db(SRC_DB);
  const pool = mysql.createPool(cfg);
  await pool.query('SELECT 1');
  if (!DRY) for (const q of MYSQL_SCHEMA) await pool.query(q);
  const dst = new MysqlDocStore(pool);

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

  const files = await src.collection('media.files').find({}).toArray().catch(() => []);
  let fileOk = 0, bytes = 0;
  if (files.length) console.log(`\n  Uploaded files: ${files.length}`);
  const gfs = new GridFSBucket(src, { bucketName: 'media' });
  for (const f of files) {
    const chunks = [];
    await new Promise((res, rej) => gfs.openDownloadStream(f._id).on('data', (c) => chunks.push(c)).on('end', res).on('error', rej));
    const buf = Buffer.concat(chunks);
    bytes += buf.length;
    try {
      if (!DRY) await dst.putMedia({ id: String(f._id), fname: f.filename, mime: f.metadata?.mime || 'application/octet-stream', originalName: f.metadata?.originalName || f.filename, buffer: buf });
      fileOk++;
    } catch (e) { console.log(`  ! ${f.filename}: ${e.message}`); }
  }
  if (files.length) console.log(`  Files copied: ${fileOk}/${files.length} (${(bytes / 1048576).toFixed(1)} MB)`);

  const bad = report.filter(([, a, b]) => a !== b);
  const problems = bad.length || fileOk !== files.length;
  console.log(`\n${problems ? 'FINISHED WITH PROBLEMS' : 'DONE - everything copied'}${DRY ? ' (dry run)' : ''}`);
  await mongo.close(); await pool.end();
  process.exit(problems ? 2 : 0);
}
main().catch((e) => { console.error('\nMIGRATION FAILED:', e.code ? `${e.code} ` : '', e.message); process.exit(1); });
