// MySQL / MariaDB (Hostinger) document store with a small MongoDB-compatible API.
// Every "collection" lives in one table (app_docs) as JSON text rows, so the existing
// API code (find / findOne / insertOne / updateOne / deleteOne / ...) keeps working unchanged.
import { randomUUID } from 'crypto';
import { matches, applyUpdate, sortDocs, project, clone, isPlainObject, setPath } from './docstore.js';

export const MYSQL_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS app_docs (
    seq BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    collection VARCHAR(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    k VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    ver INT UNSIGNED NOT NULL DEFAULT 1,
    data LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_coll_k (collection, k),
    KEY idx_coll_seq (collection, seq)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS app_media (
    id VARCHAR(64) NOT NULL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    mime VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NULL,
    size BIGINT UNSIGNED NOT NULL DEFAULT 0,
    chunk_size INT UNSIGNED NOT NULL DEFAULT 524288,
    storage VARCHAR(32) NOT NULL DEFAULT 'db',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  `CREATE TABLE IF NOT EXISTS app_media_chunks (
    media_id VARCHAR(64) NOT NULL,
    n INT UNSIGNED NOT NULL,
    data MEDIUMBLOB NOT NULL,
    PRIMARY KEY (media_id, n)
  ) ENGINE=InnoDB`,
];

export const MEDIA_CHUNK = 512 * 1024; // small rows stay under Hostinger's max_allowed_packet

const parse = (row) => ({ key: row.k, ver: row.ver, data: JSON.parse(row.data) });

class Cursor {
  constructor(coll, filter, options = {}) {
    this.coll = coll; this.filter = filter || {};
    this._sort = options.sort || null; this._limit = options.limit || 0; this._skip = options.skip || 0;
    this._projection = options.projection || null;
  }
  sort(s) { this._sort = s; return this; }
  limit(n) { this._limit = n; return this; }
  skip(n) { this._skip = n; return this; }
  project(p) { this._projection = p; return this; }
  async toArray() {
    let docs = (await this.coll._rows(this.filter)).map((r) => r.data);
    docs = sortDocs(docs, this._sort);
    if (this._skip) docs = docs.slice(this._skip);
    if (this._limit) docs = docs.slice(0, this._limit);
    return docs.map((d) => project(d, this._projection));
  }
}

class MyCollection {
  constructor(store, name) { this.store = store; this.name = name; }

  async _rows(filter = {}, conn) {
    const q = conn || this.store.pool;
    const idv = filter?.id;
    const byKey = (typeof idv === 'string' || typeof idv === 'number') ? String(idv) : null;
    const [rows] = byKey !== null
      ? await q.query('SELECT k, ver, data FROM app_docs WHERE collection = ? AND k = ?', [this.name, byKey])
      : await q.query('SELECT k, ver, data FROM app_docs WHERE collection = ? ORDER BY seq', [this.name]);
    return rows.map(parse).filter((r) => matches(r.data, filter));
  }

  find(filter = {}, options = {}) { return new Cursor(this, filter, options); }
  async findOne(filter = {}, options = {}) {
    const docs = await new Cursor(this, filter, options).sort(options.sort || null).limit(1).toArray();
    return docs[0] || null;
  }
  async countDocuments(filter = {}) {
    if (!filter || !Object.keys(filter).length) {
      const [r] = await this.store.pool.query('SELECT COUNT(*) AS n FROM app_docs WHERE collection = ?', [this.name]);
      return Number(r[0].n);
    }
    return (await this._rows(filter)).length;
  }
  async estimatedDocumentCount() { return this.countDocuments({}); }

  _prepare(doc) {
    const data = clone(doc) || {};
    let key = data.id ?? data._id;
    delete data._id;
    if (key === undefined || key === null || key === '') key = randomUUID();
    return { key: String(key), data };
  }

  async insertOne(doc) {
    const { key, data } = this._prepare(doc);
    await this.store.pool.query('INSERT INTO app_docs (collection, k, data) VALUES (?, ?, ?)', [this.name, key, JSON.stringify(data)]);
    return { acknowledged: true, insertedId: key };
  }

  async insertMany(docs = []) {
    if (!docs.length) return { acknowledged: true, insertedCount: 0 };
    const conn = await this.store.pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const d of docs) {
        const { key, data } = this._prepare(d);
        await conn.query('INSERT INTO app_docs (collection, k, data) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE data = VALUES(data), ver = ver + 1', [this.name, key, JSON.stringify(data)]);
      }
      await conn.commit();
    } catch (e) { await conn.rollback().catch(() => {}); throw e; } finally { conn.release(); }
    return { acknowledged: true, insertedCount: docs.length };
  }

  async _update(filter, update, { upsert = false, many = false } = {}) {
    let matched = 0, modified = 0;
    for (let attempt = 0; attempt < 5; attempt++) {
      const rows = await this._rows(filter);
      const targets = many ? rows : rows.slice(0, 1);
      if (!targets.length) break;
      let conflict = false;
      for (const row of targets) {
        const next = applyUpdate(row.data, update);
        // optimistic concurrency: write only if nobody changed the row since we read it
        const [r] = await this.store.pool.query(
          'UPDATE app_docs SET data = ?, ver = ver + 1 WHERE collection = ? AND k = ? AND ver = ?',
          [JSON.stringify(next), this.name, row.key, row.ver]
        );
        if (r.affectedRows === 1) { matched++; if (JSON.stringify(next) !== JSON.stringify(row.data)) modified++; }
        else conflict = true;
      }
      if (!conflict || many) return { acknowledged: true, matchedCount: matched, modifiedCount: modified, upsertedCount: 0 };
      matched = 0; modified = 0; // re-read + re-check filter, so locks like {escalated:{$ne:true}} stay atomic
    }
    if (upsert && matched === 0) {
      const base = {};
      for (const [k, v] of Object.entries(filter || {})) if (!k.startsWith('$') && !(isPlainObject(v) && Object.keys(v).some((x) => x.startsWith('$')))) setPath(base, k, v);
      const doc = applyUpdate(base, { ...update, $set: { ...(update.$setOnInsert || {}), ...(update.$set || {}) } });
      const { insertedId } = await this.insertOne(doc);
      return { acknowledged: true, matchedCount: 0, modifiedCount: 0, upsertedCount: 1, upsertedId: insertedId };
    }
    return { acknowledged: true, matchedCount: matched, modifiedCount: modified, upsertedCount: 0 };
  }
  updateOne(f, u, o = {}) { return this._update(f, u, { ...o, many: false }); }
  updateMany(f, u, o = {}) { return this._update(f, u, { ...o, many: true }); }
  async replaceOne(filter, replacement, options = {}) {
    const rows = await this._rows(filter);
    if (!rows.length) {
      if (options.upsert) { await this.insertOne(replacement); return { matchedCount: 0, modifiedCount: 0, upsertedCount: 1 }; }
      return { matchedCount: 0, modifiedCount: 0 };
    }
    const data = clone(replacement); delete data._id;
    await this.store.pool.query('UPDATE app_docs SET data = ?, ver = ver + 1 WHERE collection = ? AND k = ?', [JSON.stringify(data), this.name, rows[0].key]);
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async deleteOne(filter = {}) {
    const rows = await this._rows(filter);
    if (!rows.length) return { acknowledged: true, deletedCount: 0 };
    const [r] = await this.store.pool.query('DELETE FROM app_docs WHERE collection = ? AND k = ?', [this.name, rows[0].key]);
    return { acknowledged: true, deletedCount: r.affectedRows };
  }
  async deleteMany(filter = {}) {
    if (!filter || !Object.keys(filter).length) {
      const [r] = await this.store.pool.query('DELETE FROM app_docs WHERE collection = ?', [this.name]);
      return { acknowledged: true, deletedCount: r.affectedRows };
    }
    const rows = await this._rows(filter);
    if (!rows.length) return { acknowledged: true, deletedCount: 0 };
    const [r] = await this.store.pool.query('DELETE FROM app_docs WHERE collection = ? AND k IN (?)', [this.name, rows.map((x) => x.key)]);
    return { acknowledged: true, deletedCount: r.affectedRows };
  }
  async distinct(field, filter = {}) {
    const out = [];
    for (const r of await this._rows(filter)) {
      const v = String(field).split('.').reduce((a, k) => (a == null ? a : a[k]), r.data);
      for (const x of [v].flat()) if (x !== undefined && !out.some((y) => JSON.stringify(y) === JSON.stringify(x))) out.push(x);
    }
    return out;
  }
  async drop() { await this.store.pool.query('DELETE FROM app_docs WHERE collection = ?', [this.name]); return true; }
  async rename(newName, { dropTarget = false } = {}) {
    const conn = await this.store.pool.getConnection();
    try {
      await conn.beginTransaction();
      if (dropTarget) await conn.query('DELETE FROM app_docs WHERE collection = ?', [newName]);
      await conn.query('UPDATE app_docs SET collection = ? WHERE collection = ?', [newName, this.name]);
      await conn.commit();
    } catch (e) { await conn.rollback().catch(() => {}); throw e; } finally { conn.release(); }
    return new MyCollection(this.store, newName);
  }
  async createIndex() { return 'noop'; }
}

export class MysqlDocStore {
  constructor(pool) { this.pool = pool; this.provider = 'mysql'; this._colls = new Map(); }
  collection(name) {
    if (!this._colls.has(name)) this._colls.set(name, new MyCollection(this, name));
    return this._colls.get(name);
  }
  listCollections() {
    const pool = this.pool;
    return { toArray: async () => { const [r] = await pool.query('SELECT DISTINCT collection AS name FROM app_docs ORDER BY 1'); return r.map((x) => ({ name: x.name, type: 'collection' })); } };
  }
  async createCollection() { return true; }
  async command() { await this.pool.query('SELECT 1'); return { ok: 1 }; }

  // ---- uploaded files, stored in 512 KB chunks
  async putMedia({ id, fname, mime, originalName, buffer }) {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query('DELETE FROM app_media_chunks WHERE media_id = ?', [id]);
      await conn.query(
        `INSERT INTO app_media (id, filename, mime, original_name, size, chunk_size, storage) VALUES (?, ?, ?, ?, ?, ?, 'db')
         ON DUPLICATE KEY UPDATE filename = VALUES(filename), mime = VALUES(mime), original_name = VALUES(original_name), size = VALUES(size), chunk_size = VALUES(chunk_size)`,
        [id, fname, mime, originalName || fname, buffer.length, MEDIA_CHUNK]
      );
      for (let n = 0, off = 0; off < buffer.length; n++, off += MEDIA_CHUNK) {
        await conn.query('INSERT INTO app_media_chunks (media_id, n, data) VALUES (?, ?, ?)', [id, n, buffer.subarray(off, off + MEDIA_CHUNK)]);
      }
      await conn.commit();
    } catch (e) { await conn.rollback().catch(() => {}); throw e; } finally { conn.release(); }
  }
  async getMediaMeta(id) {
    const [r] = await this.pool.query('SELECT id, filename, mime, original_name, size, chunk_size FROM app_media WHERE id = ?', [id]);
    const m = r[0];
    return m ? { id: m.id, filename: m.filename, mime: m.mime, originalName: m.original_name, size: Number(m.size), chunkSize: Number(m.chunk_size), storage: 'mysql' } : null;
  }
  async readMedia(meta, start, end) {
    const cs = meta.chunkSize || MEDIA_CHUNK;
    const first = Math.floor(start / cs), last = Math.floor(end / cs);
    const [rows] = await this.pool.query('SELECT n, data FROM app_media_chunks WHERE media_id = ? AND n BETWEEN ? AND ? ORDER BY n', [meta.id, first, last]);
    const buf = Buffer.concat(rows.map((r) => r.data));
    return buf.subarray(start - first * cs, end - first * cs + 1);
  }
}
