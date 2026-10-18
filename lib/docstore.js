// Postgres (Supabase) document store with a small MongoDB-compatible API.
// Every "collection" lives in one table (app_docs) as JSONB rows, so the existing
// API code (find / findOne / insertOne / updateOne / deleteOne / ...) keeps working.
import { randomUUID } from 'crypto';

// ---------------------------------------------------------------- helpers
export const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date);
export const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

function getPath(doc, path) {
  let cur = doc;
  for (const k of String(path).split('.')) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[k];
  }
  return cur;
}
export function setPath(doc, path, value) {
  const keys = String(path).split('.');
  let cur = doc;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!isPlainObject(cur[keys[i]])) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}
function unsetPath(doc, path) {
  const keys = String(path).split('.');
  let cur = doc;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!isPlainObject(cur?.[keys[i]])) return;
    cur = cur[keys[i]];
  }
  delete cur[keys[keys.length - 1]];
}
const norm = (v) => (v instanceof Date ? v.toISOString() : v);

function eq(a, b) {
  a = norm(a); b = norm(b);
  if (a === b) return true;
  if ((a === null || a === undefined) && (b === null || b === undefined)) return true;
  if (typeof a === 'object' && typeof b === 'object' && a && b) return JSON.stringify(a) === JSON.stringify(b);
  return false;
}
// Mongo semantics: { field: value } also matches when field is an array containing value
function valueMatches(fieldVal, target) {
  if (Array.isArray(fieldVal) && !Array.isArray(target)) return fieldVal.some((x) => eq(x, target));
  return eq(fieldVal, target);
}

const TYPE_RANK = (v) => (v === null || v === undefined ? 0 : typeof v === 'number' ? 1 : typeof v === 'string' ? 2 : typeof v === 'object' ? 3 : typeof v === 'boolean' ? 4 : 5);
function cmp(a, b) {
  a = norm(a); b = norm(b);
  const ra = TYPE_RANK(a), rb = TYPE_RANK(b);
  if (ra !== rb) return ra - rb;
  if (ra === 0) return 0;
  if (ra === 3) return JSON.stringify(a) < JSON.stringify(b) ? -1 : JSON.stringify(a) > JSON.stringify(b) ? 1 : 0;
  return a < b ? -1 : a > b ? 1 : 0;
}

function opMatches(fieldVal, ops) {
  for (const [op, arg] of Object.entries(ops)) {
    switch (op) {
      case '$eq': if (!valueMatches(fieldVal, arg)) return false; break;
      case '$ne': if (valueMatches(fieldVal, arg)) return false; break;
      case '$in': if (!(arg || []).some((x) => valueMatches(fieldVal, x))) return false; break;
      case '$nin': if ((arg || []).some((x) => valueMatches(fieldVal, x))) return false; break;
      case '$exists': if ((fieldVal !== undefined) !== Boolean(arg)) return false; break;
      case '$gt': if (fieldVal === undefined || fieldVal === null || cmp(fieldVal, arg) <= 0) return false; break;
      case '$gte': if (fieldVal === undefined || fieldVal === null || cmp(fieldVal, arg) < 0) return false; break;
      case '$lt': if (fieldVal === undefined || fieldVal === null || cmp(fieldVal, arg) >= 0) return false; break;
      case '$lte': if (fieldVal === undefined || fieldVal === null || cmp(fieldVal, arg) > 0) return false; break;
      case '$regex': {
        const re = arg instanceof RegExp ? arg : new RegExp(arg, ops.$options || '');
        if (typeof fieldVal !== 'string' || !re.test(fieldVal)) return false; break;
      }
      case '$options': break;
      default: throw new Error(`Unsupported query operator ${op}`);
    }
  }
  return true;
}

export function matches(doc, filter = {}) {
  for (const [key, cond] of Object.entries(filter || {})) {
    if (key === '$or') { if (!cond.some((f) => matches(doc, f))) return false; continue; }
    if (key === '$and') { if (!cond.every((f) => matches(doc, f))) return false; continue; }
    if (key === '$nor') { if (cond.some((f) => matches(doc, f))) return false; continue; }
    const fieldVal = getPath(doc, key === '_id' ? '_id' : key);
    if (cond instanceof RegExp) { if (typeof fieldVal !== 'string' || !cond.test(fieldVal)) return false; continue; }
    if (isPlainObject(cond) && Object.keys(cond).some((k) => k.startsWith('$'))) {
      if (!opMatches(fieldVal, cond)) return false;
    } else if (!valueMatches(fieldVal, cond)) return false;
  }
  return true;
}

export function applyUpdate(doc, update) {
  const out = clone(doc) || {};
  const ops = Object.keys(update || {}).some((k) => k.startsWith('$')) ? update : { $set: update };
  for (const [op, fields] of Object.entries(ops)) {
    for (const [path, val] of Object.entries(fields || {})) {
      if (path === '_id') continue;
      switch (op) {
        case '$set': setPath(out, path, clone(norm(val))); break;
        case '$setOnInsert': break;
        case '$unset': unsetPath(out, path); break;
        case '$inc': setPath(out, path, (Number(getPath(out, path)) || 0) + Number(val)); break;
        case '$push': {
          const arr = Array.isArray(getPath(out, path)) ? getPath(out, path) : [];
          if (isPlainObject(val) && Array.isArray(val.$each)) arr.push(...clone(val.$each)); else arr.push(clone(val));
          setPath(out, path, arr); break;
        }
        case '$pull': {
          const arr = Array.isArray(getPath(out, path)) ? getPath(out, path) : [];
          setPath(out, path, arr.filter((x) => !(isPlainObject(val) ? matches(x, val) : eq(x, val)))); break;
        }
        case '$addToSet': {
          const arr = Array.isArray(getPath(out, path)) ? getPath(out, path) : [];
          if (!arr.some((x) => eq(x, val))) arr.push(clone(val));
          setPath(out, path, arr); break;
        }
        default: throw new Error(`Unsupported update operator ${op}`);
      }
    }
  }
  return out;
}

// Plain top-level equality fields can be pushed down to Postgres (data @> {...}) for speed
function pushdown(filter = {}) {
  const sub = {};
  for (const [k, v] of Object.entries(filter || {})) {
    if (k.startsWith('$') || k.includes('.') || k === '_id') continue;
    if (v === null || v === undefined || v instanceof RegExp) continue;
    if (['string', 'number', 'boolean'].includes(typeof v)) sub[k] = v;
  }
  return Object.keys(sub).length ? sub : null;
}

export function sortDocs(docs, sortSpec) {
  const keys = Object.entries(sortSpec || {});
  if (!keys.length) return docs;
  return [...docs].sort((a, b) => {
    for (const [k, dir] of keys) {
      const c = cmp(getPath(a, k), getPath(b, k));
      if (c !== 0) return dir < 0 ? -c : c;
    }
    return 0;
  });
}

export function project(doc, projection) {
  if (!projection || !Object.keys(projection).length) return doc;
  const include = Object.entries(projection).filter(([k, v]) => v && k !== '_id');
  if (include.length) {
    const out = {};
    for (const [k] of include) { const v = getPath(doc, k); if (v !== undefined) setPath(out, k, clone(v)); }
    return out;
  }
  const out = clone(doc);
  for (const [k, v] of Object.entries(projection)) if (!v) unsetPath(out, k);
  return out;
}

// ---------------------------------------------------------------- cursor
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
    const rows = await this.coll._rows(this.filter);
    let docs = rows.map((r) => r.data);
    docs = sortDocs(docs, this._sort);
    if (this._skip) docs = docs.slice(this._skip);
    if (this._limit) docs = docs.slice(0, this._limit);
    return docs.map((d) => project(d, this._projection));
  }
}

// ---------------------------------------------------------------- collection
class PgCollection {
  constructor(store, name) { this.store = store; this.name = name; }

  async _rows(filter = {}, client) {
    const q = client || this.store.pool;
    const sub = pushdown(filter);
    const params = [this.name];
    const where = ['collection = $1'];
    for (const [k, v] of Object.entries(sub || {})) {
      // Mongo semantics: scalar equality OR array-contains
      params.push(JSON.stringify({ [k]: v }), JSON.stringify({ [k]: [v] }));
      where.push(`(data @> $${params.length - 1}::jsonb OR data @> $${params.length}::jsonb)`);
    }
    const res = await q.query(`SELECT key, data FROM app_docs WHERE ${where.join(' AND ')} ORDER BY seq`, params);
    return res.rows.filter((r) => matches(r.data, filter));
  }

  find(filter = {}, options = {}) { return new Cursor(this, filter, options); }

  async findOne(filter = {}, options = {}) {
    const docs = await new Cursor(this, filter, options).sort(options.sort || null).limit(1).toArray();
    return docs[0] || null;
  }

  async countDocuments(filter = {}) {
    if (!filter || !Object.keys(filter).length) {
      const r = await this.store.pool.query('SELECT count(*)::int AS n FROM app_docs WHERE collection = $1', [this.name]);
      return r.rows[0].n;
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
    await this.store.pool.query('INSERT INTO app_docs (collection, key, data) VALUES ($1, $2, $3::jsonb)', [this.name, key, JSON.stringify(data)]);
    return { acknowledged: true, insertedId: key };
  }

  async insertMany(docs = []) {
    if (!docs.length) return { acknowledged: true, insertedCount: 0 };
    const client = await this.store.pool.connect();
    try {
      await client.query('BEGIN');
      for (const d of docs) {
        const { key, data } = this._prepare(d);
        // keep Mongo's "ordered:false" tolerant behaviour for duplicate keys
        await client.query('INSERT INTO app_docs (collection, key, data) VALUES ($1, $2, $3::jsonb) ON CONFLICT (collection, key) DO UPDATE SET data = EXCLUDED.data, updated_at = now()', [this.name, key, JSON.stringify(data)]);
      }
      await client.query('COMMIT');
    } catch (e) { await client.query('ROLLBACK').catch(() => {}); throw e; } finally { client.release(); }
    return { acknowledged: true, insertedCount: docs.length };
  }

  async _updateMatching(filter, update, { upsert = false, many = false } = {}) {
    let matched = 0, modified = 0;
    for (let attempt = 0; attempt < 5; attempt++) {
      const rows = await this._rows(filter);
      const targets = many ? rows : rows.slice(0, 1);
      if (!targets.length) break;
      let conflict = false;
      for (const row of targets) {
        const next = applyUpdate(row.data, update);
        // optimistic concurrency: only write if the row is unchanged since we read it
        const r = await this.store.pool.query(
          'UPDATE app_docs SET data = $4::jsonb, updated_at = now() WHERE collection = $1 AND key = $2 AND data = $3::jsonb',
          [this.name, row.key, JSON.stringify(row.data), JSON.stringify(next)]
        );
        if (r.rowCount === 1) { matched++; if (JSON.stringify(next) !== JSON.stringify(row.data)) modified++; }
        else conflict = true;
      }
      if (!conflict || many) return { acknowledged: true, matchedCount: matched, modifiedCount: modified, upsertedCount: 0 };
      matched = 0; modified = 0; // re-read and retry (filter re-checked, so locks like {escalated:{$ne:true}} stay atomic)
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
  updateOne(filter, update, options = {}) { return this._updateMatching(filter, update, { ...options, many: false }); }
  updateMany(filter, update, options = {}) { return this._updateMatching(filter, update, { ...options, many: true }); }
  async replaceOne(filter, replacement, options = {}) {
    const rows = await this._rows(filter);
    if (!rows.length) {
      if (options.upsert) { await this.insertOne(replacement); return { matchedCount: 0, modifiedCount: 0, upsertedCount: 1 }; }
      return { matchedCount: 0, modifiedCount: 0 };
    }
    const data = clone(replacement); delete data._id;
    await this.store.pool.query('UPDATE app_docs SET data = $3::jsonb, updated_at = now() WHERE collection = $1 AND key = $2', [this.name, rows[0].key, JSON.stringify(data)]);
    return { matchedCount: 1, modifiedCount: 1 };
  }

  async deleteOne(filter = {}) {
    const rows = await this._rows(filter);
    if (!rows.length) return { acknowledged: true, deletedCount: 0 };
    const r = await this.store.pool.query('DELETE FROM app_docs WHERE collection = $1 AND key = $2', [this.name, rows[0].key]);
    return { acknowledged: true, deletedCount: r.rowCount };
  }
  async deleteMany(filter = {}) {
    if (!filter || !Object.keys(filter).length) {
      const r = await this.store.pool.query('DELETE FROM app_docs WHERE collection = $1', [this.name]);
      return { acknowledged: true, deletedCount: r.rowCount };
    }
    const rows = await this._rows(filter);
    if (!rows.length) return { acknowledged: true, deletedCount: 0 };
    const r = await this.store.pool.query('DELETE FROM app_docs WHERE collection = $1 AND key = ANY($2::text[])', [this.name, rows.map((x) => x.key)]);
    return { acknowledged: true, deletedCount: r.rowCount };
  }

  async distinct(field, filter = {}) {
    const docs = (await this._rows(filter)).map((r) => getPath(r.data, field));
    const out = [];
    for (const v of docs.flat()) if (v !== undefined && !out.some((x) => eq(x, v))) out.push(v);
    return out;
  }

  async drop() { await this.store.pool.query('DELETE FROM app_docs WHERE collection = $1', [this.name]); return true; }

  async rename(newName, { dropTarget = false } = {}) {
    const client = await this.store.pool.connect();
    try {
      await client.query('BEGIN');
      if (dropTarget) await client.query('DELETE FROM app_docs WHERE collection = $1', [newName]);
      await client.query('UPDATE app_docs SET collection = $2, updated_at = now() WHERE collection = $1', [this.name, newName]);
      await client.query('COMMIT');
    } catch (e) { await client.query('ROLLBACK').catch(() => {}); throw e; } finally { client.release(); }
    return new PgCollection(this.store, newName);
  }

  async createIndex() { return 'noop'; }
}

// ---------------------------------------------------------------- db
export class PgDocStore {
  constructor(pool) { this.pool = pool; this.provider = 'supabase'; this._colls = new Map(); }
  collection(name) {
    if (!this._colls.has(name)) this._colls.set(name, new PgCollection(this, name));
    return this._colls.get(name);
  }
  listCollections() {
    const pool = this.pool;
    return { toArray: async () => (await pool.query('SELECT DISTINCT collection AS name FROM app_docs ORDER BY 1')).rows.map((r) => ({ name: r.name, type: 'collection' })) };
  }
  async createCollection() { return true; }
  async ping() { await this.pool.query('SELECT 1'); return true; }
  async command() { await this.pool.query('SELECT 1'); return { ok: 1 }; }
}

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS app_docs (
  collection text NOT NULL,
  key        text NOT NULL,
  data       jsonb NOT NULL,
  seq        bigserial,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collection, key)
);
CREATE INDEX IF NOT EXISTS app_docs_data_gin ON app_docs USING gin (data jsonb_path_ops);
CREATE TABLE IF NOT EXISTS app_media (
  id            text PRIMARY KEY,
  filename      text NOT NULL,
  mime          text NOT NULL,
  original_name text,
  size          bigint NOT NULL DEFAULT 0,
  storage       text NOT NULL DEFAULT 'db',
  data          bytea,
  created_at    timestamptz NOT NULL DEFAULT now()
);
-- Block Supabase's public Data API (anon / publishable key) from these tables.
-- The site connects as the database owner, which is not affected.
ALTER TABLE app_docs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_media ENABLE ROW LEVEL SECURITY;
`;
