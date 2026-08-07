import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { NextResponse } from 'next/server';
import fs from 'fs';
import nodePath from 'path';

let clientPromise;
let db;
let seeded = false;

async function connectToMongo() {
  if (!clientPromise) {
    const c = new MongoClient(process.env.MONGO_URL);
    clientPromise = c.connect().then((connected) => {
      db = connected.db(process.env.DB_NAME);
      return connected;
    });
  }
  await clientPromise;
  return db;
}

function cors(res) {
  res.headers.set('Access-Control-Allow-Origin', process.env.CORS_ORIGINS || '*');
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return res;
}

function strip(doc) {
  if (!doc) return doc;
  const { _id, _seedVersion, ...rest } = doc;
  return rest;
}

// Record a history entry for later Undo
async function recordHistory(db, { entity, entityId, action, before = null, after = null, label = '' }) {
  const entry = {
    id: uuidv4(),
    ts: new Date().toISOString(),
    entity, entityId, action, label,
    before: before ? JSON.parse(JSON.stringify(before, (k, v) => (k === '_id' ? undefined : v))) : null,
    after: after ? JSON.parse(JSON.stringify(after, (k, v) => (k === '_id' ? undefined : v))) : null,
    undone: false,
  };
  try { await db.collection('history').insertOne(entry); } catch (e) { console.error('history log fail', e); }
  return entry;
}

// -------------------- SEED DATA (Gillco Group real content) --------------------
const SEED_PROJECTS = [
  {
    id: 'meraqui',
    slug: 'meraqui',
    name: 'Gillco Meraqui',
    tagline: 'Ultra Luxe Residential',
    status: 'upcoming',
    category: 'residential',
    location: 'Sector 126, Mohali, Punjab',
    reraNumber: 'PBRERA-SAS81-PR0762',
    reraStatus: 'Approved & Registered',
    reraUpdatedAt: '2025-01-15',
    constructionPercent: 8,
    launchDate: 'Dec 2024',
    handoverDate: 'Dec 2028',
    priceRange: '₹2.4 Cr – ₹4.8 Cr',
    unitMix: '3 & 4 BHK',
    softLaunch: {
      enabled: true,
      endsAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      slotsTotal: 60,
      slotsLeft: 18,
      offerLabel: 'Priority Booking Offer',
      benefits: ['Best Floor Rise Waived', 'Locked Launch Price', 'Choice of Unit', 'Assured Gift on Booking'],
    },
    acres: 12,
    towers: 6,
    units: 444,
    heroImage: 'https://www.gillcogroup.com/assets/meraqui/1.jpg',
    gallery: [
      'https://www.gillcogroup.com/assets/meraqui/1.jpg',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1400&q=80',
      'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?w=1400&q=80',
    ],
    summary: 'Indulge in the art of refined living at Meraqui, an upcoming residential masterpiece in Sector 126, Mohali. A haven of refined spaces, Meraqui features 444 exquisitely designed 3 & 4 BHK luxury residences, spanning six residential towers, as well as a premium commercial space.',
    amenities: ['Clubhouse', 'Infinity Pool', 'Landscaped Gardens', 'Jogging Track', 'Yoga Deck', 'Kids Play Area', 'Squash Court', 'Indoor Games', 'Spa & Salon', 'Multi-purpose Hall', 'Concierge', '24x7 Security'],
    milestones: [
      { date: '2024-12-01', title: 'Grand Unveiling', done: true },
      { date: '2025-03-15', title: 'RERA Registration Complete', done: true },
      { date: '2025-06-01', title: 'Foundation Works Begin', done: false },
      { date: '2026-12-01', title: 'Structure Completion', done: false },
      { date: '2028-12-01', title: 'Handover', done: false },
    ],
    featured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'industrial-park',
    slug: 'industrial-park',
    name: 'Gillco Industrial Park',
    tagline: '200 Acres of Operational Excellence',
    status: 'ongoing',
    category: 'industrial',
    location: 'Airport Road, Mohali, Punjab',
    reraNumber: 'N/A (Industrial)',
    reraStatus: 'Industrial Approval — GMADA',
    reraUpdatedAt: '2024-09-10',
    constructionPercent: 65,
    launchDate: '2018',
    handoverDate: 'Ongoing Phases',
    priceRange: 'On Request',
    unitMix: 'Industrial Plots',
    acres: 200,
    towers: 0,
    units: 300,
    heroImage: 'https://www.gillcogroup.com/assets/industrialPark/1.png',
    gallery: ['https://www.gillcogroup.com/assets/industrialPark/1.png'],
    summary: '200 acres of development on Airport Road, Mohali, Gillco Industrial Park is a game-changer in the business and industrial landscape of North India, hosting Fortune 500 tenants and unicorn startups.',
    amenities: ['24x7 Security', 'Wide Roads', 'Uninterrupted Power', 'Water Supply', 'Waste Management', 'Green Buffer Zones'],
    milestones: [
      { date: '2018-01-01', title: 'Phase 1 Launch', done: true },
      { date: '2022-06-01', title: 'Phase 2 Handover', done: true },
      { date: '2024-09-01', title: 'Crosses 200 acres operational', done: true },
    ],
    featured: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'parkhills',
    slug: 'parkhills',
    name: 'Gillco Parkhills',
    tagline: "Mohali's Finest High-Rise",
    status: 'delivered',
    category: 'residential',
    location: 'Airport Road, Mohali, Punjab',
    reraNumber: 'PBRERA-SAS80-PR0231',
    reraStatus: 'Completed & Handed Over',
    reraUpdatedAt: '2023-06-30',
    constructionPercent: 100,
    launchDate: '2015',
    handoverDate: '2021',
    priceRange: '₹1.1 Cr – ₹2.6 Cr',
    unitMix: '2, 3 & 4 BHK',
    acres: 15,
    towers: 7,
    units: 620,
    heroImage: 'https://www.gillcogroup.com/assets/parkhill/1.png',
    gallery: ['https://www.gillcogroup.com/assets/parkhill/1.png'],
    summary: "Mohali's finest and most sought after S+19-story high Premium 2, 3, and 4 BHK apartments on Airport Road, Mohali.",
    amenities: ['Swimming Pool', 'Clubhouse', 'Gymnasium', 'Landscaped Gardens', 'Kids Play', '24x7 Security'],
    milestones: [{ date: '2021-06-01', title: 'Handover Complete', done: true }],
    featured: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'palms',
    slug: 'palms',
    name: 'Gillco Palms',
    tagline: 'Comfort Meets Elegance',
    status: 'delivered',
    category: 'residential',
    location: 'Kharar-Landran Road, Mohali, Punjab',
    reraNumber: 'PBRERA-SAS79-PR0104',
    reraStatus: 'Completed & Handed Over',
    reraUpdatedAt: '2022-03-15',
    constructionPercent: 100,
    launchDate: '2013',
    handoverDate: '2019',
    priceRange: '₹65 L – ₹1.4 Cr',
    unitMix: '2 & 3 BHK',
    acres: 8,
    towers: 5,
    units: 380,
    heroImage: 'https://www.gillcogroup.com/assets/palm/1.png',
    gallery: ['https://www.gillcogroup.com/assets/palm/1.png'],
    summary: 'Nestled on Kharar-Landran Road, Mohali featuring premium 2 BHK and 3 BHK living spaces designed to blend comfort and elegance.',
    amenities: ['Community Hall', 'Pool', 'Gym', 'Gardens', 'Play Area', 'Security'],
    milestones: [{ date: '2019-11-01', title: 'Handover Complete', done: true }],
    featured: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'villas',
    slug: 'villas',
    name: 'Gillco Villas',
    tagline: 'Independent Living in a Community',
    status: 'delivered',
    category: 'residential',
    location: 'Gillco Valley, Mohali',
    reraNumber: 'PBRERA-SAS78-PR0087',
    reraStatus: 'Completed & Handed Over',
    reraUpdatedAt: '2020-08-20',
    constructionPercent: 100,
    launchDate: '2010',
    handoverDate: '2016',
    priceRange: '₹1.8 Cr – ₹3.2 Cr',
    unitMix: '3 & 4 BHK Duplex',
    acres: 22,
    towers: 0,
    units: 200,
    heroImage: 'https://www.gillcogroup.com/assets/villa/gillco_villas.png',
    gallery: ['https://www.gillcogroup.com/assets/villa/gillco_villas.png'],
    summary: 'Artistically designed 200 Duplex Villas in Gillco Valley for those who value independent lifestyle in a community environment.',
    amenities: ['Private Lawns', 'Community Park', 'Clubhouse', 'Security', 'Wide Roads'],
    milestones: [{ date: '2016-04-01', title: 'Handover Complete', done: true }],
    featured: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'floors',
    slug: 'floors',
    name: 'Gillco Floors',
    tagline: 'Thoughtfully Designed Independent Floors',
    status: 'delivered',
    category: 'residential',
    location: 'Sector 127, Mohali, Punjab',
    reraNumber: 'PBRERA-SAS81-PR0142',
    reraStatus: 'Completed & Handed Over',
    reraUpdatedAt: '2022-11-05',
    constructionPercent: 100,
    launchDate: '2016',
    handoverDate: '2020',
    priceRange: '₹85 L – ₹1.5 Cr',
    unitMix: 'G+2, 3 BHK',
    acres: 6,
    towers: 0,
    units: 120,
    heroImage: 'https://www.gillcogroup.com/assets/floor/floor.png',
    gallery: ['https://www.gillcogroup.com/assets/floor/floor.png'],
    summary: 'Experience the comfort of independent living with thoughtfully designed Ground + 2, 3BHK Floors that offer privacy and space.',
    amenities: ['Private Terraces', 'Parks', 'Security', 'Ample Parking'],
    milestones: [{ date: '2020-09-01', title: 'Handover Complete', done: true }],
    featured: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'towers',
    slug: 'towers',
    name: 'Gillco Towers',
    tagline: 'Spacious Living, Contemporary Design',
    status: 'delivered',
    category: 'residential',
    location: 'Sector 127, Mohali, Punjab',
    reraNumber: 'PBRERA-SAS81-PR0198',
    reraStatus: 'Completed & Handed Over',
    reraUpdatedAt: '2021-12-10',
    constructionPercent: 100,
    launchDate: '2014',
    handoverDate: '2020',
    priceRange: '₹1.3 Cr – ₹2.4 Cr',
    unitMix: '3 & 4 BHK',
    acres: 10,
    towers: 4,
    units: 340,
    heroImage: 'https://www.gillcogroup.com/assets/tower/tower.jpg',
    gallery: ['https://www.gillcogroup.com/assets/tower/tower.jpg'],
    summary: 'Gillco Towers brought together spacious living and contemporary design through thoughtfully crafted 3 & 4 BHK residences.',
    amenities: ['Clubhouse', 'Swimming Pool', 'Gym', 'Kids Play', 'Landscaped Gardens', 'Security'],
    milestones: [{ date: '2020-05-01', title: 'Handover Complete', done: true }],
    featured: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'heights',
    slug: 'heights',
    name: 'Gillco Heights',
    tagline: 'Designed for Modern Families',
    status: 'delivered',
    category: 'residential',
    location: 'Sector 127, Mohali, Punjab',
    reraNumber: 'PBRERA-SAS81-PR0056',
    reraStatus: 'Completed & Handed Over',
    reraUpdatedAt: '2019-06-15',
    constructionPercent: 100,
    launchDate: '2011',
    handoverDate: '2017',
    priceRange: '₹75 L – ₹1.6 Cr',
    unitMix: '2 & 3 BHK',
    acres: 9,
    towers: 5,
    units: 420,
    heroImage: 'https://www.gillcogroup.com/assets/height/height.jpg',
    gallery: ['https://www.gillcogroup.com/assets/height/height.jpg'],
    summary: 'Envisioned as a thoughtfully planned residential community offering spacious 2 & 3 BHK apartments designed for modern family living.',
    amenities: ['Community Park', 'Clubhouse', 'Pool', 'Gym', 'Kids Play', 'Security'],
    milestones: [{ date: '2017-02-01', title: 'Handover Complete', done: true }],
    featured: false,
    createdAt: new Date().toISOString(),
  },
];

const SEED_NEWS = [
  { id: uuidv4(), date: '2026-07-01', title: 'Gillco Group to invest ₹800 crore to develop 12-acre housing project in Mohali', category: 'Corporate' },
  { id: uuidv4(), date: '2024-12-15', title: 'Gillco Unveils Meraqui In Style — A premium high-rise lifestyle development for upscale living in Sector 126, Mohali', category: 'Launch' },
  { id: uuidv4(), date: '2024-11-20', title: "Tricity's Biggest Run For Health Marathon — A health initiative led by Gillco Group", category: 'CSR' },
  { id: uuidv4(), date: '2024-10-10', title: 'Gillco Group Featured in Business Standard — Recognition of our commitment to quality & innovation', category: 'Press' },
  { id: uuidv4(), date: '2024-09-05', title: 'Gillco Industrial Park crosses 200 acres of operational excellence on IT City Road', category: 'Milestone' },
  { id: uuidv4(), date: '2024-08-01', title: 'Forbes India Celebrity 100 — Tejpreet Singh Gill recognized for visionary leadership', category: 'Award' },
];

const SEED_TEAM = [
  { id: uuidv4(), name: 'Mr. Ranjit Singh Gill', role: 'Founder & Chairman', bio: 'Co-founded Gillco Group in 2001 with a vision to unlock land potential and build integrated communities.', photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80', linkedin: '#' },
  { id: uuidv4(), name: 'Mrs. Paramjit Gill', role: 'Co-Founder & Director', bio: "Co-founded Gillco Group. A steady force behind the Group's disciplined growth and community-first ethos.", photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80', linkedin: '#' },
  { id: uuidv4(), name: 'Mr. Tejpreet Singh Gill', role: 'Managing Director', bio: 'Recognized in Forbes India Celebrity 100 for visionary leadership. Leads next-gen expansion across residential, commercial and industrial verticals.', photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80', linkedin: '#' },
];

const SEED_SETTINGS = {
  id: 'site',
  brandName: 'Gillco Group',
  tagline: "Punjab's Leading Luxury Real Estate Developer",
  phone: '+91 90417 95879',
  whatsapp: '919041795879',
  email: 'support@gillcogroup.org',
  address: 'Gillco Group Corporate Office, Airport Road, Mohali, Punjab, India',
  founded: 2001,
  stats: { years: 25, projects: 8, families: 1577, sqft: '11M+' },
  salesTeam: [
    { id: 's1', name: 'Sales — Meraqui Desk', whatsapp: '919041795879', role: 'Senior Advisor', active: true },
    { id: 's2', name: 'Sales — Residential', whatsapp: '919517889797', role: 'Advisor', active: true },
    { id: 's3', name: 'Sales — Industrial Park', whatsapp: '917529019797', role: 'Industrial Specialist', active: true },
  ],
  leadOverflow: {
    enabled: true,
    minutes: 15,
    managerName: 'Sales Manager',
    managerWhatsapp: '919041795879',
  },
  popup: { enabled: true, delaySeconds: 6, cookieHours: 24 },
  social: {
    facebook: 'https://www.facebook.com/gillcogroup',
    instagram: 'https://www.instagram.com/gillcogroup',
    linkedin: 'https://www.linkedin.com/company/gillcogroup',
    youtube: 'https://www.youtube.com/@gillcogroup',
    twitter: 'https://x.com/gillcogroup',
  },
  videos: [
    { id: 'v1', title: 'Gillco Meraqui — Ultra Luxe Living', poster: 'https://www.gillcogroup.com/assets/meraqui/poolCam.jpeg', youtubeId: 'dQw4w9WgXcQ' },
    { id: 'v2', title: 'Gillco Meraqui — Clubhouse Walkthrough', poster: 'https://www.gillcogroup.com/assets/meraqui/clubCam.jpeg', youtubeId: 'dQw4w9WgXcQ' },
    { id: 'v3', title: 'Gillco Industrial Park — 200 Acres', poster: 'https://www.gillcogroup.com/assets/industrialPark/1.png', youtubeId: 'dQw4w9WgXcQ' },
  ],
  hero: {
    headline: 'Curating Legacy Spaces\nWith Modern Design',
    subline: "Punjab's leading luxury real estate developer. Building trust, communities and enduring value since 2001.",
    slides: [
      { image: 'https://www.gillcogroup.com/assets/meraqui/1.jpg', title: 'Gillco Meraqui', subtitle: 'Ultra Luxe Residential — Sector 126, Mohali' },
      { image: 'https://www.gillcogroup.com/assets/meraqui/poolCam.jpeg', title: 'Meraqui Infinity Pool', subtitle: 'Resort-style aquatic experience' },
      { image: 'https://www.gillcogroup.com/assets/meraqui/clubCam.jpeg', title: 'Meraqui Elite Clubhouse', subtitle: 'Curated for the connoisseur' },
      { image: 'https://www.gillcogroup.com/assets/meraqui/yogaCamTerrace.jpeg', title: 'Meraqui Yoga Terrace', subtitle: 'Serenity above the skyline' },
      { image: 'https://www.gillcogroup.com/assets/meraqui/gardenView.png', title: 'Meraqui Landscaped Greens', subtitle: 'Nature woven into every corner' },
      { image: 'https://www.gillcogroup.com/assets/parkhill/1.png', title: 'Gillco Parkhills', subtitle: "Mohali's Finest High-Rise — Airport Road" },
      { image: 'https://www.gillcogroup.com/assets/palm/1.png', title: 'Gillco Palms', subtitle: 'Comfort Meets Elegance — Kharar-Landran' },
      { image: 'https://www.gillcogroup.com/assets/tower/tower.jpg', title: 'Gillco Towers', subtitle: 'Spacious Contemporary Design — Sector 127' },
      { image: 'https://www.gillcogroup.com/assets/height/height.jpg', title: 'Gillco Heights', subtitle: 'Designed for Modern Families' },
      { image: 'https://www.gillcogroup.com/assets/industrialPark/1.png', title: 'Gillco Industrial Park', subtitle: '200 Acres of Operational Excellence' },
    ],
  },
};

async function ensureSeed(db) {
  if (seeded) return;
  const pCount = await db.collection('projects').countDocuments();
  if (pCount === 0) await db.collection('projects').insertMany(SEED_PROJECTS.map(p => ({ ...p })));
  const nCount = await db.collection('news').countDocuments();
  if (nCount === 0) await db.collection('news').insertMany(SEED_NEWS.map(n => ({ ...n })));
  const tCount = await db.collection('team').countDocuments();
  if (tCount === 0) await db.collection('team').insertMany(SEED_TEAM.map(t => ({ ...t })));
  const s = await db.collection('settings').findOne({ id: 'site' });
  if (!s) {
    await db.collection('settings').insertOne({ ...SEED_SETTINGS, _seedVersion: 2 });
  } else if (!s._seedVersion || s._seedVersion < 2) {
    // Merge new keys (social, videos, expanded slides) without wiping edits to core fields
    const merged = {
      ...SEED_SETTINGS,
      ...s,
      social: s.social || SEED_SETTINGS.social,
      videos: s.videos || SEED_SETTINGS.videos,
      hero: {
        ...SEED_SETTINGS.hero,
        ...(s.hero || {}),
        slides: (s.hero?.slides && s.hero.slides.length >= 10) ? s.hero.slides : SEED_SETTINGS.hero.slides,
      },
      _seedVersion: 2,
    };
    await db.collection('settings').updateOne({ id: 'site' }, { $set: merged });
  }
  seeded = true;
}

export async function OPTIONS() { return cors(new NextResponse(null, { status: 200 })); }

async function handleRoute(request, { params }) {
  const { path = [] } = await params;
  const route = `/${path.join('/')}`;
  const method = request.method;

  try {
    const db = await connectToMongo();
    await ensureSeed(db);

    // ---------- UPLOAD ----------
    if (route === '/upload' && method === 'POST') {
      const ct = (request.headers.get('content-type') || '').toLowerCase();
      if (!ct.includes('multipart/form-data')) {
        return cors(NextResponse.json({ error: 'expected multipart/form-data' }, { status: 400 }));
      }
      const formData = await request.formData();
      const file = formData.get('file');
      if (!file || typeof file === 'string') {
        return cors(NextResponse.json({ error: 'no file' }, { status: 400 }));
      }
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const original = file.name || 'file';
      const ext = (original.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
      const fname = `${uuidv4()}.${ext || 'bin'}`;
      const uploadDir = nodePath.join(process.cwd(), 'public', 'uploads');
      try { fs.mkdirSync(uploadDir, { recursive: true }); } catch {}
      await fs.promises.writeFile(nodePath.join(uploadDir, fname), buffer);
      const url = `/uploads/${fname}`;
      return cors(NextResponse.json({ url, filename: original, size: buffer.length, mime: file.type || 'application/octet-stream' }));
    }

    // ---------- HISTORY ----------
    if (route === '/history' && method === 'GET') {
      const items = await db.collection('history').find({}).sort({ ts: -1 }).limit(200).toArray();
      return cors(NextResponse.json(items.map(strip)));
    }
    if (route.startsWith('/history/') && route.endsWith('/undo') && method === 'POST') {
      const id = route.split('/')[2];
      const entry = await db.collection('history').findOne({ id });
      if (!entry) return cors(NextResponse.json({ error: 'history entry not found' }, { status: 404 }));
      if (entry.undone) return cors(NextResponse.json({ error: 'already undone' }, { status: 400 }));

      // Perform inverse operation
      const coll = entry.entity;
      if (entry.action === 'create') {
        // Undo create = delete
        if (coll === 'settings') return cors(NextResponse.json({ error: 'cannot undo settings create' }, { status: 400 }));
        await db.collection(coll).deleteOne({ id: entry.entityId });
      } else if (entry.action === 'update') {
        // Undo update = restore before
        if (!entry.before) return cors(NextResponse.json({ error: 'no before snapshot' }, { status: 400 }));
        if (coll === 'settings') {
          await db.collection('settings').updateOne({ id: 'site' }, { $set: entry.before }, { upsert: true });
        } else {
          await db.collection(coll).updateOne({ id: entry.entityId }, { $set: entry.before });
        }
      } else if (entry.action === 'delete') {
        // Undo delete = re-insert before
        if (!entry.before) return cors(NextResponse.json({ error: 'no before snapshot' }, { status: 400 }));
        const restore = { ...entry.before };
        delete restore._id;
        await db.collection(coll).insertOne(restore);
      }
      await db.collection('history').updateOne({ id }, { $set: { undone: true, undoneAt: new Date().toISOString() } });
      return cors(NextResponse.json({ ok: true }));
    }

    // Root endpoint - health check
    if (route === '/' || route === '/root') {
      return cors(NextResponse.json({ ok: true, service: 'gillco-cms', ts: new Date().toISOString() }));
    }

    // ---------- SETTINGS ----------
    if (route === '/settings' && method === 'GET') {
      const s = await db.collection('settings').findOne({ id: 'site' });
      return cors(NextResponse.json(strip(s)));
    }
    if (route === '/settings' && method === 'PUT') {
      const body = await request.json();
      const before = await db.collection('settings').findOne({ id: 'site' });
      await db.collection('settings').updateOne({ id: 'site' }, { $set: body }, { upsert: true });
      const s = await db.collection('settings').findOne({ id: 'site' });
      await recordHistory(db, { entity: 'settings', entityId: 'site', action: 'update', before: strip(before), after: strip(s), label: 'Updated site settings' });
      return cors(NextResponse.json(strip(s)));
    }

    // ---------- PROJECTS ----------
    if (route === '/projects' && method === 'GET') {
      const items = await db.collection('projects').find({}).sort({ createdAt: -1 }).toArray();
      return cors(NextResponse.json(items.map(strip)));
    }
    if (route === '/projects' && method === 'POST') {
      const body = await request.json();
      const doc = { id: uuidv4(), createdAt: new Date().toISOString(), ...body };
      await db.collection('projects').insertOne(doc);
      await recordHistory(db, { entity: 'projects', entityId: doc.id, action: 'create', after: strip(doc), label: `Created project: ${doc.name || doc.id}` });
      return cors(NextResponse.json(strip(doc)));
    }
    if (route.startsWith('/projects/') && method === 'GET') {
      const id = route.split('/')[2];
      const doc = await db.collection('projects').findOne({ $or: [{ id }, { slug: id }] });
      if (!doc) return cors(NextResponse.json({ error: 'not found' }, { status: 404 }));
      return cors(NextResponse.json(strip(doc)));
    }
    if (route.startsWith('/projects/') && method === 'PUT') {
      const id = route.split('/')[2];
      const body = await request.json();
      delete body._id;
      const before = await db.collection('projects').findOne({ id });
      await db.collection('projects').updateOne({ id }, { $set: body });
      const doc = await db.collection('projects').findOne({ id });
      await recordHistory(db, { entity: 'projects', entityId: id, action: 'update', before: strip(before), after: strip(doc), label: `Updated project: ${doc.name || id}` });
      return cors(NextResponse.json(strip(doc)));
    }
    if (route.startsWith('/projects/') && method === 'DELETE') {
      const id = route.split('/')[2];
      const before = await db.collection('projects').findOne({ id });
      await db.collection('projects').deleteOne({ id });
      if (before) await recordHistory(db, { entity: 'projects', entityId: id, action: 'delete', before: strip(before), label: `Deleted project: ${before?.name || id}` });
      return cors(NextResponse.json({ ok: true }));
    }

    // ---------- ENQUIRIES ----------
    if (route === '/enquiries' && method === 'POST') {
      const body = await request.json();
      const doc = {
        id: uuidv4(),
        name: body.name || '',
        email: body.email || '',
        phone: body.phone || '',
        message: body.message || '',
        projectId: body.projectId || null,
        projectName: body.projectName || null,
        type: body.type || 'general',
        utm: body.utm || {},
        consent: !!body.consent,
        routedTo: body.routedTo || null,
        routedToId: body.routedToId || null,
        claimed: false,
        claimedBy: null,
        claimedAt: null,
        escalated: false,
        escalatedAt: null,
        createdAt: new Date().toISOString(),
      };
      if (!doc.name || !doc.phone) {
        return cors(NextResponse.json({ error: 'name and phone required' }, { status: 400 }));
      }
      await db.collection('enquiries').insertOne(doc);
      return cors(NextResponse.json(strip(doc)));
    }
    if (route === '/enquiries' && method === 'GET') {
      const items = await db.collection('enquiries').find({}).sort({ createdAt: -1 }).limit(500).toArray();
      return cors(NextResponse.json(items.map(strip)));
    }
    if (route.startsWith('/enquiries/') && route.endsWith('/claim') && method === 'POST') {
      const id = route.split('/')[2];
      const body = await request.json().catch(() => ({}));
      await db.collection('enquiries').updateOne(
        { id },
        { $set: { claimed: true, claimedBy: body.by || 'admin', claimedAt: new Date().toISOString() } }
      );
      const doc = await db.collection('enquiries').findOne({ id });
      return cors(NextResponse.json(strip(doc)));
    }
    if (route.startsWith('/enquiries/') && route.endsWith('/escalate') && method === 'POST') {
      const id = route.split('/')[2];
      await db.collection('enquiries').updateOne(
        { id },
        { $set: { escalated: true, escalatedAt: new Date().toISOString() } }
      );
      const doc = await db.collection('enquiries').findOne({ id });
      return cors(NextResponse.json(strip(doc)));
    }

    // ---------- NEWS ----------
    if (route === '/news' && method === 'GET') {
      const items = await db.collection('news').find({}).sort({ date: -1 }).toArray();
      return cors(NextResponse.json(items.map(strip)));
    }
    if (route === '/news' && method === 'POST') {
      const body = await request.json();
      const doc = { id: uuidv4(), ...body };
      await db.collection('news').insertOne(doc);
      await recordHistory(db, { entity: 'news', entityId: doc.id, action: 'create', after: strip(doc), label: `Added news: ${doc.title?.slice(0, 40) || doc.id}` });
      return cors(NextResponse.json(strip(doc)));
    }
    if (route.startsWith('/news/') && method === 'PUT') {
      const id = route.split('/')[2];
      const body = await request.json();
      delete body._id;
      const before = await db.collection('news').findOne({ id });
      await db.collection('news').updateOne({ id }, { $set: body });
      const doc = await db.collection('news').findOne({ id });
      await recordHistory(db, { entity: 'news', entityId: id, action: 'update', before: strip(before), after: strip(doc), label: `Updated news: ${doc.title?.slice(0, 40) || id}` });
      return cors(NextResponse.json(strip(doc)));
    }
    if (route.startsWith('/news/') && method === 'DELETE') {
      const id = route.split('/')[2];
      const before = await db.collection('news').findOne({ id });
      await db.collection('news').deleteOne({ id });
      if (before) await recordHistory(db, { entity: 'news', entityId: id, action: 'delete', before: strip(before), label: `Deleted news: ${before.title?.slice(0, 40) || id}` });
      return cors(NextResponse.json({ ok: true }));
    }

    // ---------- TEAM ----------
    if (route === '/team' && method === 'GET') {
      const items = await db.collection('team').find({}).toArray();
      return cors(NextResponse.json(items.map(strip)));
    }
    if (route === '/team' && method === 'POST') {
      const body = await request.json();
      const doc = { id: uuidv4(), ...body };
      await db.collection('team').insertOne(doc);
      await recordHistory(db, { entity: 'team', entityId: doc.id, action: 'create', after: strip(doc), label: `Added team member: ${doc.name || doc.id}` });
      return cors(NextResponse.json(strip(doc)));
    }
    if (route.startsWith('/team/') && method === 'PUT') {
      const id = route.split('/')[2];
      const body = await request.json();
      delete body._id;
      const before = await db.collection('team').findOne({ id });
      await db.collection('team').updateOne({ id }, { $set: body });
      const doc = await db.collection('team').findOne({ id });
      await recordHistory(db, { entity: 'team', entityId: id, action: 'update', before: strip(before), after: strip(doc), label: `Updated team member: ${doc.name || id}` });
      return cors(NextResponse.json(strip(doc)));
    }
    if (route.startsWith('/team/') && method === 'DELETE') {
      const id = route.split('/')[2];
      const before = await db.collection('team').findOne({ id });
      await db.collection('team').deleteOne({ id });
      if (before) await recordHistory(db, { entity: 'team', entityId: id, action: 'delete', before: strip(before), label: `Removed team member: ${before.name || id}` });
      return cors(NextResponse.json({ ok: true }));
    }

    // ---------- ADMIN AUTH (simple passcode) ----------
    if (route === '/admin/login' && method === 'POST') {
      const body = await request.json();
      const pass = body.password || '';
      const ok = pass === (process.env.ADMIN_PASSWORD || 'gillco2025');
      return cors(NextResponse.json({ ok }, { status: ok ? 200 : 401 }));
    }

    return cors(NextResponse.json({ error: `Route ${route} not found` }, { status: 404 }));
  } catch (e) {
    console.error('API Error', e);
    return cors(NextResponse.json({ error: 'internal', detail: String(e?.message || e) }, { status: 500 }));
  }
}

export const GET = handleRoute;
export const POST = handleRoute;
export const PUT = handleRoute;
export const DELETE = handleRoute;
export const PATCH = handleRoute;
