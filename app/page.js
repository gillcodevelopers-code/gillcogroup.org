'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { toast } from 'sonner';
import { trackEvent } from '@/lib/analytics';
import { mdInline } from '@/lib/safeText';
import {
  Phone, Mail, MapPin, MessageCircle, Menu, X, ChevronLeft, ChevronRight,
  Search, ArrowRight, Award, Building2, Users, LandPlot, Home as HomeIcon,
  Calendar, CheckCircle2, Clock, Sparkles, Download, Printer, Trash2, Plus,
  Edit3, Save, LogIn, LogOut, Filter, Star, ExternalLink, ShieldCheck,
  Play, Facebook, Instagram, Linkedin, Youtube, Twitter,
  Calculator,
} from 'lucide-react';

/* ---------- helpers ---------- */
const api = async (path, opts = {}) => {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401 && err.login && typeof window !== 'undefined') window.dispatchEvent(new Event('gillco:admin-logout'));
    throw new Error(err.error || 'API error');
  }
  return res.json();
};

const STATUS_MAP = {
  delivered: { label: 'Delivered', color: 'bg-emerald-700 text-white', ring: 'ring-emerald-700' },
  ongoing: { label: 'Ongoing', color: 'bg-orange-500 text-white', ring: 'ring-orange-500' },
  upcoming: { label: 'New Launch', color: 'bg-blue-600 text-white', ring: 'ring-blue-600' },
};

const GILLCO_LOGO = 'https://www.gillcogroup.com/gillco-logo-original.png';
const GILLCO_LOGO_WHITE = 'https://www.gillcogroup.com/gillco-logo-white.png';
const IMG_PLACEHOLDER = 'data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20800%20600%22%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22%23f8f5ee%22%2F%3E%3Ctext%20x%3D%22400%22%20y%3D%22300%22%20text-anchor%3D%22middle%22%20fill%3D%22%230b5138%22%20font-family%3D%22serif%22%20font-size%3D%2224%22%3EGillco%20Group%3C%2Ftext%3E%3C%2Fsvg%3E';
const safeImg = (url) => (url && String(url).trim()) || IMG_PLACEHOLDER;

/* ---------- Countdown / urgency badge for soft-launch projects ---------- */
function CountdownBadge({ soft, compact = false, onEnquire }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!soft?.enabled) return null;
  const endsAt = new Date(soft.endsAt).getTime();
  const diff = Math.max(0, endsAt - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);
  const total = soft.slotsTotal || 60;
  const left = Math.max(0, soft.slotsLeft ?? 0);
  const pct = Math.max(4, Math.min(100, (left / total) * 100));
  const urgency = left <= 10 ? 'critical' : left <= 25 ? 'high' : 'normal';
  const urgencyColor = urgency === 'critical' ? 'text-red-600 bg-red-50 border-red-200' : urgency === 'high' ? 'text-orange-700 bg-orange-50 border-orange-200' : 'text-emerald-700 bg-emerald-50 border-emerald-200';

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-500 text-white animate-pulse uppercase tracking-widest">Only {left} left</span>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gillco-gold text-slate-900 uppercase tracking-widest">Ends in {days}d {hours}h</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border-2 border-gillco-gold shadow-lg">
      <div className="gradient-emerald text-white px-5 py-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-[10px] tracking-[0.3em] text-gillco-gold font-bold uppercase">🔥 {soft.offerLabel || 'Priority Booking'}</p>
          <p className="text-sm text-white/90 mt-0.5">Limited-time launch window closing soon</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${urgencyColor} border`}>
          Only <span className="text-lg font-serif">{left}</span> of {total} slots left
        </span>
      </div>
      <div className="bg-white p-5">
        {/* Slot bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Availability</span>
            <span className={urgency === 'critical' ? 'text-red-600 font-semibold' : 'text-slate-600'}>{left}/{total} slots</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full transition-all ${urgency === 'critical' ? 'bg-red-500' : urgency === 'high' ? 'bg-orange-500' : 'bg-emerald-600'}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        {/* Countdown */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            ['Days', days], ['Hours', hours], ['Minutes', mins], ['Seconds', secs],
          ].map(([lbl, val]) => (
            <div key={lbl} className="text-center p-3 rounded-lg bg-gillco-cream border border-gillco-gold/30">
              <div className="font-serif text-3xl text-gillco-green font-bold tabular-nums">{String(val).padStart(2, '0')}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{lbl}</div>
            </div>
          ))}
        </div>
        {/* Benefits */}
        {soft.benefits?.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {soft.benefits.map(b => (
              <div key={b} className="flex items-center gap-1.5 text-xs text-slate-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-gillco-gold shrink-0" />
                <span>{b}</span>
              </div>
            ))}
          </div>
        )}
        {onEnquire && (
          <button onClick={onEnquire} className="w-full py-3 gradient-gold text-slate-900 rounded-full font-bold text-sm hover:brightness-110 transition inline-flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" /> Book Priority Slot Now
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------- brochure generator ---------- */
async function downloadBrochure(project) {
  // If admin uploaded a real brochure URL, download that
  if (project.brochureUrl && project.brochureUrl.trim()) {
    try {
      window.open(project.brochureUrl, '_blank');
      toast.success('Opening brochure…');
      return;
    } catch (e) {
      // fallthrough to generated
    }
  }

  // Otherwise generate a branded PDF brochure from project data
  try {
    toast.loading('Preparing brochure…', { id: 'broc' });
    const jsPDFmod = await import('jspdf');
    const jsPDF = jsPDFmod.jsPDF || jsPDFmod.default;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();

    // Cover — dark green header
    doc.setFillColor(11, 81, 56);
    doc.rect(0, 0, W, H, 'F');
    // Gold band
    doc.setFillColor(201, 162, 75);
    doc.rect(0, H - 60, W, 4, 'F');
    // Brand
    doc.setTextColor(201, 162, 75);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('GILLCO GROUP', 40, 60, { charSpace: 3 });
    doc.setTextColor(255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text("Punjab's Leading Luxury Real Estate Developer", 40, 78);

    // Try to embed hero image
    try {
      const dataUrl = await imgToDataUrl(project.heroImage);
      if (dataUrl) {
        doc.addImage(dataUrl, 'JPEG', 40, 130, W - 80, 260, undefined, 'FAST');
      }
    } catch (e) { /* ignore image failures */ }

    // Title
    doc.setTextColor(255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.text(project.name || '', 40, 460);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.setTextColor(201, 162, 75);
    doc.text(project.tagline || '', 40, 485);
    doc.setTextColor(255);
    doc.setFontSize(11);
    doc.text(project.location || '', 40, 508);

    // Status badge
    const statusText = ({ delivered: 'DELIVERED', ongoing: 'ONGOING', upcoming: 'NEW LAUNCH' })[project.status] || 'PROJECT';
    doc.setFillColor(201, 162, 75);
    doc.roundedRect(40, 540, 100, 22, 3, 3, 'F');
    doc.setTextColor(11, 81, 56);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(statusText, 90, 555, { align: 'center' });

    // Cover footer
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('support@gillcogroup.org  ·  +91 90417 95879  ·  gillcogroup.org', 40, H - 30);

    // ===== Page 2 — Details =====
    doc.addPage();
    doc.setTextColor(11, 81, 56);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('Project Overview', 40, 60);
    doc.setDrawColor(201, 162, 75);
    doc.setLineWidth(2);
    doc.line(40, 68, 120, 68);

    doc.setTextColor(60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const summary = project.summary || '';
    const wrapped = doc.splitTextToSize(summary, W - 80);
    doc.text(wrapped, 40, 95);
    let y = 95 + wrapped.length * 14 + 15;

    // Key facts
    doc.setTextColor(11, 81, 56);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Key Facts', 40, y);
    y += 15;
    const facts = [
      ['Unit Mix', project.unitMix],
      ['Price Range', project.priceRange],
      ['Acres', String(project.acres ?? '')],
      ['Towers', String(project.towers ?? '')],
      ['Total Units', String(project.units ?? '')],
      ['Launch', project.launchDate],
      ['Handover', project.handoverDate],
      ['Construction', `${project.constructionPercent ?? 0}% complete`],
    ];
    doc.setFontSize(10);
    facts.forEach((f, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 40 + col * ((W - 80) / 2);
      const yy = y + row * 40;
      doc.setFillColor(248, 245, 238);
      doc.roundedRect(x, yy, (W - 80) / 2 - 10, 32, 3, 3, 'F');
      doc.setTextColor(120);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(String(f[0]).toUpperCase(), x + 10, yy + 12);
      doc.setTextColor(11, 81, 56);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(String(f[1] || '—'), x + 10, yy + 26);
    });
    y += Math.ceil(facts.length / 2) * 40 + 15;

    // RERA
    doc.setFillColor(11, 81, 56);
    doc.roundedRect(40, y, W - 80, 70, 4, 4, 'F');
    doc.setTextColor(201, 162, 75);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('RERA DISCLOSURE', 55, y + 20);
    doc.setTextColor(255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`RERA No.: ${project.reraNumber || 'N/A'}`, 55, y + 38);
    doc.text(`Status: ${project.reraStatus || '—'}`, 55, y + 52);
    doc.text(`Updated: ${project.reraUpdatedAt || '—'}`, 320, y + 52);
    y += 90;

    // Amenities
    if (project.amenities?.length) {
      doc.setTextColor(11, 81, 56);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Amenities', 40, y);
      y += 15;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(60);
      const perRow = 3;
      project.amenities.forEach((a, i) => {
        const col = i % perRow;
        const row = Math.floor(i / perRow);
        doc.text(`•  ${a}`, 45 + col * ((W - 80) / perRow), y + row * 16);
      });
      y += Math.ceil(project.amenities.length / perRow) * 16 + 10;
    }

    // Footer
    doc.setDrawColor(201, 162, 75);
    doc.setLineWidth(1);
    doc.line(40, H - 60, W - 40, H - 60);
    doc.setTextColor(120);
    doc.setFontSize(8);
    doc.text('© Gillco Group  ·  Established 2001  ·  Punjab, India', 40, H - 42);
    doc.text('This brochure is generated from live CMS data.', 40, H - 30);
    doc.setTextColor(11, 81, 56);
    doc.setFont('helvetica', 'bold');
    doc.text('support@gillcogroup.org  |  +91 90417 95879', W - 40, H - 30, { align: 'right' });

    doc.save(`${(project.slug || 'gillco') + '-brochure'}.pdf`);
    toast.success('Brochure downloaded', { id: 'broc' });
  } catch (e) {
    console.error(e);
    toast.error('Failed to generate brochure', { id: 'broc' });
  }
}

// Convert an image URL to a data URL for jsPDF embedding (best-effort)
async function imgToDataUrl(url) {
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
  } catch { return null; }
}

/* ============================ MAIN APP ============================ */
function App() {
  const [view, setView] = useState('home'); // home | projects | about | team | news | contact | admin
  useEffect(() => { if (new URLSearchParams(window.location.search).get('admin-reset')) setView('admin'); }, []);
  const [settings, setSettings] = useState(null);
  const [projects, setProjects] = useState([]);
  const [news, setNews] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeProject, setActiveProject] = useState(null); // project detail modal
  const [compare, setCompare] = useState([]); // ids
  const [showCompare, setShowCompare] = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);
  const [enquiryPrefill, setEnquiryPrefill] = useState({});
  const [showVideo, setShowVideo] = useState(null);
  const [showEmi, setShowEmi] = useState(false);
  const [emiPrefillPrice, setEmiPrefillPrice] = useState(null);

  const [mobileNav, setMobileNav] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  const [testimonials, setTestimonials] = useState([]);
  /* -------- load data (progressive, mobile-first) -------- */
  // Critical: settings + projects (above-the-fold). Load first and show the page as soon as they're ready.
  useEffect(() => {
    (async () => {
      try {
        const [s, p] = await Promise.all([
          api('/settings'),
          api('/projects'),
        ]);
        setSettings(s);
        const statusOrder = { upcoming: 1, ongoing: 2, delivered: 3 };
        const sorted = [...p].sort((a, b) => {
          if (a.slug === 'meraqui') return -1;
          if (b.slug === 'meraqui') return 1;
          const sd = (statusOrder[a.status] || 9) - (statusOrder[b.status] || 9);
          if (sd) return sd;
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        });
        setProjects(sorted);
      } catch (e) {
        console.error('critical load fail', e);
        toast.error('Failed to load site content');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Below-the-fold: news + team load in background after first paint
  useEffect(() => {
    if (loading) return;
    (async () => {
      try {
        const [n, t] = await Promise.all([
          api('/news').catch(() => []),
          api('/team').catch(() => []),
        ]);
        setNews(n || []);
        setTeam(t || []);
        api('/testimonials').then(setTestimonials).catch(() => {});
      } catch (e) { /* silent */ }
    })();
  }, [loading]);

  /* -------- popup enquiry (configurable) -------- */
  const popupRef = useRef(false);
  const viewRef = useRef(view);
  useEffect(() => { viewRef.current = view; if (view === 'admin') setShowEnquiry(prev => (enquiryPrefillRef.current?.type === 'popup' ? false : prev)); }, [view]);
  const enquiryPrefillRef = useRef(null);
  useEffect(() => {
    if (!settings?.popup?.enabled) return;
    if (popupRef.current) return;
    if (view === 'admin') return; // never interrupt the Admin CMS
    const cookieName = 'gillco_popup_seen';
    if (typeof document !== 'undefined' && document.cookie.includes(`${cookieName}=1`)) {
      popupRef.current = true;
      return;
    }
    const t = setTimeout(() => {
      if (popupRef.current || viewRef.current === 'admin') return;
      popupRef.current = true;
      enquiryPrefillRef.current = { type: 'popup' };
      setShowEnquiry(true);
      setEnquiryPrefill({ type: 'popup' });
      const hrs = settings.popup.cookieHours || 24;
      const d = new Date();
      d.setTime(d.getTime() + hrs * 60 * 60 * 1000);
      document.cookie = `${cookieName}=1; expires=${d.toUTCString()}; path=/`;
    }, (settings.popup.delaySeconds || 6) * 1000);
    return () => clearTimeout(t);
  }, [settings, view]);

  const filtered = useMemo(() => {
    return projects.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (categoryFilter !== 'all') {
        // Match against primary category OR offerings/flags (so a mixed-use project appears under both Residential and Commercial)
        const primary = (p.category || '').toLowerCase();
        const offerings = Array.isArray(p.offerings) ? p.offerings.map(o => (o.type || '').toLowerCase()) : [];
        const hasResidential = p.hasResidential === true || primary === 'residential' || primary === 'mixed-use' || offerings.includes('residential');
        const hasCommercial = p.hasCommercial === true || primary === 'commercial' || primary === 'mixed-use' || offerings.includes('commercial');
        const hasIndustrial = primary === 'industrial';
        if (categoryFilter === 'residential' && !hasResidential) return false;
        if (categoryFilter === 'commercial' && !hasCommercial) return false;
        if (categoryFilter === 'industrial' && !hasIndustrial) return false;
      }
      if (search && !`${p.name} ${p.location}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [projects, statusFilter, categoryFilter, search]);

  const toggleCompare = (id) => {
    setCompare(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 4) {
        toast.warning('You can compare up to 4 projects');
        return prev;
      }
      return [...prev, id];
    });
  };

  const openEnquiry = (prefill = {}) => {
    setEnquiryPrefill(prefill);
    setShowEnquiry(true);
  };

  const goTo = (v) => {
    setView(v);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gillco-cream">
        {/* Fake header shell */}
        <div className="h-16 bg-white border-b border-stone-200 flex items-center px-4">
          <img decoding="async" src={GILLCO_LOGO} alt="Gillco" className="h-10" />
        </div>
        {/* Shimmer hero */}
        <div className="relative h-[70vh] bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.15)_50%,transparent_100%)] animate-pulse" />
          <div className="relative max-w-7xl mx-auto px-4 h-full flex flex-col justify-center">
            <div className="h-5 w-32 bg-white/10 rounded mb-6" />
            <div className="h-12 md:h-20 w-3/4 bg-white/10 rounded mb-4" />
            <div className="h-12 md:h-20 w-1/2 bg-white/10 rounded mb-8" />
            <div className="h-6 w-80 bg-white/10 rounded mb-2" />
            <div className="h-6 w-60 bg-white/10 rounded" />
          </div>
        </div>
        <div className="text-center py-8 text-gillco-green/60 text-sm">Loading luxury homes…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header settings={settings} view={view} goTo={goTo} mobileNav={mobileNav} setMobileNav={setMobileNav} onEnquire={() => openEnquiry({ type: 'header' })} />

      {view === 'home' && (
        <HomeView
          settings={settings}
          projects={projects}
          news={news}
          testimonials={testimonials}
          onProject={setActiveProject}
          onEnquire={openEnquiry}
          goTo={goTo}
          onCompareToggle={toggleCompare}
          compare={compare}
          onVideo={setShowVideo}
        />
      )}
      {view === 'projects' && (
        <ProjectsView
          projects={filtered}
          all={projects}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
          search={search} setSearch={setSearch}
          onProject={setActiveProject}
          onCompareToggle={toggleCompare}
          compare={compare}
          onOpenCompare={() => setShowCompare(true)}
        />
      )}
      {view === 'delivered' && (
        <ProjectsView projects={projects.filter(p => p.status === 'delivered')} all={projects} statusFilter="delivered" setStatusFilter={setStatusFilter} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} search={search} setSearch={setSearch} onProject={setActiveProject} onCompareToggle={toggleCompare} compare={compare} onOpenCompare={() => setShowCompare(true)} title="Delivered Projects" subtitle="A legacy of communities we've handed over" />
      )}
      {view === 'ongoing' && (
        <ProjectsView projects={projects.filter(p => p.status === 'ongoing')} all={projects} statusFilter="ongoing" setStatusFilter={setStatusFilter} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} search={search} setSearch={setSearch} onProject={setActiveProject} onCompareToggle={toggleCompare} compare={compare} onOpenCompare={() => setShowCompare(true)} title="Ongoing Projects" subtitle="Live construction updates & milestone tracking" />
      )}
      {view === 'upcoming' && (
        <ProjectsView projects={projects.filter(p => p.status === 'upcoming')} all={projects} statusFilter="upcoming" setStatusFilter={setStatusFilter} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter} search={search} setSearch={setSearch} onProject={setActiveProject} onCompareToggle={toggleCompare} compare={compare} onOpenCompare={() => setShowCompare(true)} title="Upcoming & Soft Launch" subtitle="Priority booking on tomorrow's landmarks" />
      )}
      {view === 'about' && <AboutView settings={settings} />}
      {view === 'team' && <TeamView team={team} />}
      {view === 'news' && <NewsView news={news} />}
      {view === 'contact' && <ContactView settings={settings} onSubmit={openEnquiry} />}
      {view === 'admin' && <AdminView projects={projects} setProjects={setProjects} settings={settings} setSettings={setSettings} news={news} setNews={setNews} testimonials={testimonials} setTestimonials={setTestimonials} />}

      <Footer settings={settings} goTo={goTo} />

      {/* Sticky Enquire Button */}
      <div className="fixed bottom-6 right-6 z-40 no-print flex flex-col items-end gap-3">
        {/* Call + WhatsApp parallel */}
        <div className="flex items-center gap-3">
          {/* Instant Call */}
          <a
            href={`tel:${settings?.phone?.replace(/\s|-/g, '')}`}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white shadow-2xl flex items-center justify-center transition group relative"
            title="Call Us Instantly"
            aria-label="Call Us Instantly"
          >
            <span className="absolute inset-0 rounded-full bg-amber-400 animate-ping opacity-30"></span>
            <Phone className="w-6 h-6 relative animate-wiggle" />
          </a>
          {/* Premium WhatsApp */}
          <a
            href={`https://wa.me/${settings?.whatsapp}?text=Hi%20Gillco%20Group%2C%20I%27d%20like%20to%20know%20more.`}
            target="_blank" rel="noreferrer"
            className="w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1EBE57] text-white shadow-[0_8px_24px_rgba(37,211,102,0.45)] hover:shadow-[0_10px_32px_rgba(37,211,102,0.65)] flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 group relative overflow-hidden"
            title="Chat on WhatsApp"
            aria-label="Chat on WhatsApp"
          >
            <span className="absolute inset-0 rounded-full ring-2 ring-white/40 group-hover:ring-white/70 animate-pulse"></span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-7 h-7 relative drop-shadow" fill="currentColor" aria-hidden="true">
              <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.27-.832-2.52-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.03 1.332-1.044 2.27v.14c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.186-.472.286-1.01.315-1.52 0-.445-2.137-1.094-2.593-1.02M16.46 27.1c-5.98 0-10.86-4.88-10.86-10.86 0-5.965 4.88-10.845 10.86-10.845s10.86 4.88 10.86 10.86-4.88 10.845-10.86 10.845zm0-24.11C9.145 2.99 3.197 8.94 3.197 16.24c0 2.335.615 4.58 1.76 6.57L3 29.73l7.085-1.86a13.144 13.144 0 0 0 6.37 1.634h.015c7.3 0 13.247-5.95 13.247-13.247.015-3.54-1.374-6.87-3.87-9.37-2.498-2.512-5.827-3.9-9.38-3.9z"/>
            </svg>
          </a>
        </div>
        {/* Enquire */}
        <button
          onClick={() => openEnquiry({ type: 'sticky' })}
          className="px-5 h-14 rounded-full gradient-gold text-slate-900 font-semibold shadow-2xl hover:brightness-110 transition flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" /> Enquire Now
        </button>
      </div>

      {/* Compare bar */}
      {compare.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 no-print">
          <div className="bg-gillco-green text-white shadow-2xl rounded-full flex items-center gap-3 pl-5 pr-2 py-2">
            <span className="text-sm">{compare.length} selected to compare</span>
            <button onClick={() => setShowCompare(true)} className="bg-gillco-gold text-slate-900 font-semibold px-4 py-2 rounded-full text-sm hover:brightness-110">
              Compare Now
            </button>
            <button onClick={() => setCompare([])} className="text-white/70 hover:text-white p-2"><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {activeProject && (
        <ProjectDetail
          project={activeProject}
          onClose={() => setActiveProject(null)}
          onEnquire={(t) => { setActiveProject(null); openEnquiry({ type: t, projectId: activeProject.id, projectName: activeProject.name }); }}
          onCompareToggle={toggleCompare}
          inCompare={compare.includes(activeProject.id)}
          onWatchVideo={setShowVideo}
        />
      )}

      {showCompare && (
        <CompareModal
          projects={projects.filter(p => compare.includes(p.id))}
          onClose={() => setShowCompare(false)}
          onRemove={(id) => setCompare(prev => prev.filter(x => x !== id))}
        />
      )}

      {showEnquiry && (
        <EnquiryModal
          prefill={enquiryPrefill}
          settings={settings}
          onClose={() => setShowEnquiry(false)}
          projects={projects}
        />
      )}

      {showVideo && (
        <VideoModal video={showVideo} onClose={() => setShowVideo(null)} />
      )}

      {showEmi && (
        <EmiCalculatorModal
          initialPrice={emiPrefillPrice}
          projects={projects}
          onClose={() => { setShowEmi(false); setEmiPrefillPrice(null); }}
          onEnquire={(prefill) => { setShowEmi(false); setEnquiryPrefill(prefill || { type: 'emi' }); setShowEnquiry(true); }}
        />
      )}
    </div>
  );
}

/* ============================ HEADER ============================ */
function Header({ settings, view, goTo, mobileNav, setMobileNav, onEnquire }) {
  const nav = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'Legacy' },
    { id: 'projects', label: 'Projects' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'ongoing', label: 'Ongoing' },
    { id: 'team', label: 'Team' },
    { id: 'news', label: 'Spotlight' },
    { id: 'contact', label: 'Contact' },
    { id: 'admin', label: 'Admin', highlight: true },
  ];
  return (
    <>
      {/* Top bar */}
      <div className="bg-gillco-green text-white text-xs no-print">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <a href={`tel:${settings?.phone?.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:text-gillco-gold transition">
              <Phone className="w-3 h-3" /> {settings?.phone}
            </a>
            <a href={`mailto:${settings?.email}`} className="hidden sm:flex items-center gap-1.5 hover:text-gillco-gold transition">
              <Mail className="w-3 h-3" /> {settings?.email}
            </a>
          </div>
          <div className="flex items-center gap-3">
            {settings?.social?.facebook && (
              <a href={settings.social.facebook} target="_blank" rel="noreferrer" className="hover:text-gillco-gold transition" title="Facebook"><Facebook className="w-3.5 h-3.5" /></a>
            )}
            {settings?.social?.instagram && (
              <a href={settings.social.instagram} target="_blank" rel="noreferrer" className="hover:text-gillco-gold transition" title="Instagram"><Instagram className="w-3.5 h-3.5" /></a>
            )}
            {settings?.social?.linkedin && (
              <a href={settings.social.linkedin} target="_blank" rel="noreferrer" className="hover:text-gillco-gold transition" title="LinkedIn"><Linkedin className="w-3.5 h-3.5" /></a>
            )}
            {settings?.social?.youtube && (
              <a href={settings.social.youtube} target="_blank" rel="noreferrer" className="hover:text-gillco-gold transition" title="YouTube"><Youtube className="w-3.5 h-3.5" /></a>
            )}
            {settings?.social?.twitter && (
              <a href={settings.social.twitter} target="_blank" rel="noreferrer" className="hover:text-gillco-gold transition" title="X (Twitter)"><Twitter className="w-3.5 h-3.5" /></a>
            )}
            <a href={`https://wa.me/${settings?.whatsapp}`} target="_blank" rel="noreferrer" className="hidden md:flex items-center gap-1.5 hover:text-gillco-gold transition ml-2 pl-3 border-l border-white/20">
              <MessageCircle className="w-3 h-3" /> WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-100 no-print">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={() => goTo('home')} className="flex items-center gap-3">
            <img loading="lazy" decoding="async" src={settings?.logoDark || GILLCO_LOGO} alt="Gillco Group" className="h-10 md:h-12" />
          </button>
          <nav className="hidden lg:flex items-center gap-6">
            {nav.map(n => (
              <button key={n.id} onClick={() => goTo(n.id)}
                className={`text-sm font-medium transition ${
                  n.highlight
                    ? (view === n.id ? 'text-gillco-gold' : 'text-gillco-gold/80 hover:text-gillco-gold inline-flex items-center gap-1')
                    : (view === n.id ? 'text-gillco-green' : 'text-slate-600 hover:text-gillco-green')
                }`}>
                {n.highlight && <Edit3 className="w-3 h-3 inline mr-1" />}
                {n.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={onEnquire} className="hidden md:inline-flex px-5 py-2.5 rounded-full gradient-gold text-slate-900 font-semibold text-sm hover:brightness-110 transition">
              Schedule Visit
            </button>
            <button onClick={() => setMobileNav(!mobileNav)} className="lg:hidden p-2 text-gillco-green">
              {mobileNav ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {mobileNav && (
          <div className="lg:hidden border-t border-slate-100 bg-white">
            <div className="px-4 py-3 space-y-1">
              {nav.map(n => (
                <button key={n.id} onClick={() => goTo(n.id)}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm ${view === n.id ? 'bg-gillco-cream text-gillco-green font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}>
                  {n.label}
                </button>
              ))}
              <button onClick={() => { setMobileNav(false); onEnquire(); }} className="w-full mt-2 py-2.5 rounded-full gradient-gold text-slate-900 font-semibold text-sm">Schedule Visit</button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

/* ============================ HOME ============================ */
function HomeView({ settings, projects, news, testimonials, onProject, onEnquire, goTo, onCompareToggle, compare, onVideo }) {
  const featured = projects.find(p => p.slug === 'meraqui') || projects[0];
  const reraCards = useMemo(() => {
    const order = { upcoming: 0, ongoing: 1, delivered: 2 };
    return [...projects].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9)).slice(0, 3);
  }, [projects]);

  return (
    <>
      <Hero settings={settings} onEnquire={onEnquire} goTo={goTo} />

      {/* RERA quick cards — enhanced with imagery */}
      <section className="py-16 bg-gillco-cream">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-white border border-gillco-gold/40 rounded-full px-4 py-1.5">
              <ShieldCheck className="w-4 h-4 text-gillco-gold" />
              <p className="text-xs tracking-[0.3em] text-gillco-green font-semibold uppercase">RERA Compliance</p>
            </div>
            <h2 className="font-serif text-3xl md:text-5xl text-gillco-green mt-4">Latest RERA Status Updates</h2>
            <p className="text-slate-600 mt-3 max-w-xl mx-auto">Live, transparent RERA registration & construction status for every Gillco township.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {reraCards.map(p => (
              <div key={p.id} className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer" onClick={() => onProject(p)}>
                {/* Image with gradient */}
                <div className="relative h-56">
                  <img loading="lazy" decoding="async" src={safeImg(p.heroImage)} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gillco-green-dark via-gillco-green/60 to-transparent" />
                  <span className={`absolute top-4 left-4 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${STATUS_MAP[p.status].color}`}>{STATUS_MAP[p.status].label}</span>
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <div className="flex items-end gap-2.5">
                      {p.logo && (
                        <img
                          loading="lazy"
                          decoding="async"
                          src={safeImg(p.logo)}
                          alt={`${p.name} logo`}
                          className="w-11 h-11 md:w-12 md:h-12 object-contain bg-white rounded-lg border border-white/30 p-1 shadow-md shrink-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_0_18px_rgba(217,169,67,0.5)] group-hover:ring-2 group-hover:ring-gillco-gold/60"
                        />
                      )}
                      <div className="min-w-0 flex-1 pb-0.5">
                        <h3 className="font-serif text-xl md:text-2xl leading-tight drop-shadow">{p.name}</h3>
                        <p className="text-[11px] text-white/90 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {p.location}</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gillco-gold/95 backdrop-blur flex items-center justify-center text-slate-900 shadow-lg">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
                {/* RERA panel */}
                <div className="bg-white p-5 space-y-2.5">
                  {/* Inline stat strip */}
                  <div className="grid grid-cols-3 gap-2 pb-2 border-b border-slate-100">
                    {p.acres !== undefined && p.acres !== null && p.acres !== 0 && (
                      <div className="text-center">
                        <div className="text-[9px] uppercase tracking-widest text-gillco-gold font-semibold">Acres</div>
                        <div className="text-sm font-bold text-gillco-green">{p.acres}</div>
                      </div>
                    )}
                    {p.towers !== undefined && p.towers !== null && p.towers !== 0 && (
                      <div className="text-center">
                        <div className="text-[9px] uppercase tracking-widest text-gillco-gold font-semibold">Towers</div>
                        <div className="text-sm font-bold text-gillco-green">{p.towers}</div>
                      </div>
                    )}
                    {p.units !== undefined && p.units !== null && p.units !== 0 && (
                      <div className="text-center">
                        <div className="text-[9px] uppercase tracking-widest text-gillco-gold font-semibold">Units</div>
                        <div className="text-sm font-bold text-gillco-green">{p.units}</div>
                      </div>
                    )}
                    {(!p.towers || p.towers === 0) && p.constructionPercent !== undefined && p.constructionPercent !== null && (
                      <div className="text-center">
                        <div className="text-[9px] uppercase tracking-widest text-gillco-gold font-semibold">Progress</div>
                        <div className="text-sm font-bold text-gillco-green">{p.constructionPercent}%</div>
                      </div>
                    )}
                    {(!p.units || p.units === 0) && p.handoverDate && (
                      <div className="text-center">
                        <div className="text-[9px] uppercase tracking-widest text-gillco-gold font-semibold">Handover</div>
                        <div className="text-sm font-bold text-gillco-green">{p.handoverDate}</div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">RERA Reg. Number</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">VERIFIED</span>
                  </div>
                  <div className="font-mono text-sm text-gillco-green font-bold tracking-wide bg-gillco-cream px-3 py-2 rounded-lg border border-gillco-gold/30">{p.reraNumber}</div>
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Status</div>
                      <div className="text-xs text-emerald-700 font-semibold">{p.reraStatus}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Updated</div>
                      <div className="text-xs text-slate-800 font-medium">{new Date(p.reraUpdatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                    </div>
                  </div>
                  <button className="w-full mt-3 py-2 bg-gillco-green group-hover:bg-gillco-gold group-hover:text-slate-900 text-white text-sm font-semibold rounded-full transition inline-flex items-center justify-center gap-2">
                    View Full RERA Details <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats — compact */}
      <section className="py-10 md:py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              { icon: Award, val: `${settings?.stats?.years}+`, label: 'Years of Excellence' },
              { icon: Building2, val: `${settings?.stats?.projects}+`, label: 'Projects Delivered' },
              { icon: Users, val: `${settings?.stats?.families?.toLocaleString('en-IN')}+`, label: 'Happy Families' },
              { icon: LandPlot, val: settings?.stats?.sqft, label: 'Sq. Ft. Developed' },
            ].map((s, i) => (
              <div key={i} className="text-center p-3 md:p-4 rounded-xl bg-gillco-cream border border-gillco-gold/20 hover:shadow-md transition">
                <s.icon className="w-5 h-5 md:w-6 md:h-6 text-gillco-gold mx-auto mb-1.5" />
                <div className="font-serif text-2xl md:text-3xl text-gillco-green font-semibold leading-none">{s.val}</div>
                <div className="text-[10px] md:text-xs text-slate-600 mt-1.5 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AwardsWall settings={settings} projects={projects} onProject={onProject} />

      {/* Featured Project — Meraqui */}
      {featured && (
        <section className="py-20 bg-gillco-cream">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <img loading="lazy" decoding="async" src={safeImg(featured.heroImage)} alt={featured.name} className="rounded-2xl shadow-2xl w-full aspect-[4/3] object-cover" />
                <div className="absolute -bottom-6 -right-6 bg-gillco-green text-white p-6 rounded-2xl shadow-xl hidden md:block">
                  <div className="text-4xl font-serif text-gillco-gold">{featured.acres}</div>
                  <div className="text-xs uppercase tracking-wider">Acres</div>
                </div>
              </div>
              <div>
                <p className="text-xs tracking-[0.3em] text-gillco-gold font-semibold uppercase">Signature Development</p>
                <div className="flex items-center gap-3 mt-3">
                  {featured.logo && (
                    <img loading="lazy" decoding="async" src={safeImg(featured.logo)} alt={`${featured.name} logo`} className="h-12 md:h-16 object-contain bg-white rounded-lg border border-slate-100 p-1.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_28px_rgba(217,169,67,0.45)] hover:ring-2 hover:ring-gillco-gold/60 cursor-default" />
                  )}
                  <h2 className="font-serif text-4xl md:text-5xl text-gillco-green">{featured.name}</h2>
                </div>
                <p className="text-slate-500 mt-2">{featured.tagline} · {featured.location}</p>
                <p className="mt-6 text-slate-700 leading-relaxed">{featured.summary}</p>
                <div className="grid grid-cols-3 gap-4 mt-8">
                  <div className="border-l-2 border-gillco-gold pl-3"><div className="font-serif text-2xl text-gillco-green">{featured.towers}</div><div className="text-xs text-slate-500 uppercase">Towers</div></div>
                  <div className="border-l-2 border-gillco-gold pl-3"><div className="font-serif text-2xl text-gillco-green">{featured.unitMix}</div><div className="text-xs text-slate-500 uppercase">BHK</div></div>
                  <div className="border-l-2 border-gillco-gold pl-3"><div className="font-serif text-2xl text-gillco-green">{featured.units}</div><div className="text-xs text-slate-500 uppercase">Residences</div></div>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button onClick={() => onProject(featured)} className="px-6 py-3 bg-gillco-green text-white rounded-full font-medium hover:bg-gillco-green-dark transition inline-flex items-center gap-2">
                    Explore {featured.name.split(' ').pop()} <ArrowRight className="w-4 h-4" />
                  </button>
                  <button onClick={() => onEnquire({ type: 'featured', projectId: featured.id, projectName: featured.name })} className="px-6 py-3 gradient-gold text-slate-900 rounded-full font-semibold hover:brightness-110 transition">
                    Book Soft Launch
                  </button>
                </div>
                {featured?.softLaunch?.enabled && (
                  <div className="mt-8">
                    <CountdownBadge soft={featured.softLaunch} onEnquire={() => onEnquire({ type: 'soft-launch', projectId: featured.id, projectName: featured.name })} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Videos & Virtual Tours */}
      {settings?.videos?.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <p className="text-xs tracking-[0.3em] text-gillco-gold font-semibold uppercase">Video Walkthroughs</p>
              <h2 className="font-serif text-4xl md:text-5xl text-gillco-green mt-3">Experience Gillco in Motion</h2>
              <p className="text-slate-600 mt-3 max-w-xl mx-auto">Take a cinematic walk through our developments — from clubhouses to aerial views.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {settings.videos.map(v => (
                <button key={v.id} onClick={() => onVideo(v)} className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all">
                  <img loading="lazy" decoding="async" src={safeImg(v.poster)} alt={v.title} className="w-full h-64 object-cover group-hover:scale-110 transition duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gillco-green-dark via-transparent to-transparent" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-gillco-gold/90 backdrop-blur flex items-center justify-center shadow-2xl group-hover:scale-110 transition ring-4 ring-white/30">
                      <Play className="w-8 h-8 text-slate-900 ml-1" fill="currentColor" />
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 text-left text-white">
                    <p className="text-xs uppercase tracking-widest text-gillco-gold font-semibold">Walkthrough</p>
                    <h3 className="font-serif text-xl mt-1">{v.title}</h3>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Projects carousel */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <p className="text-xs tracking-[0.3em] text-gillco-gold font-semibold uppercase">Our Portfolio</p>
              <h2 className="font-serif text-4xl text-gillco-green mt-2">Featured Projects</h2>
            </div>
            <button onClick={() => goTo('projects')} className="text-gillco-green font-medium inline-flex items-center gap-2 hover:gap-3 transition-all">
              View All Projects <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.slice(0, 6).map(p => (
              <ProjectCard key={p.id} project={p} onOpen={() => onProject(p)} onCompareToggle={() => onCompareToggle(p.id)} inCompare={compare.includes(p.id)} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Carousel */}
      <TestimonialsCarousel testimonials={testimonials} projects={projects} />

      {/* FAQ Accordion */}
      <FAQSection onEnquire={onEnquire} />

      {/* Announcements */}
      <section className="py-16 bg-gillco-green text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <p className="text-xs tracking-[0.3em] text-gillco-gold font-semibold uppercase">Corporate</p>
              <h2 className="font-serif text-4xl mt-2">Announcements</h2>
            </div>
            <button onClick={() => goTo('news')} className="text-gillco-gold font-medium inline-flex items-center gap-2 hover:gap-3 transition-all">
              All Updates <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {(news || []).filter(isNewsActive).slice(0, 3).map(n => (
              <article key={n.id} className="group bg-white/5 backdrop-blur rounded-xl overflow-hidden border border-white/10 hover:bg-white/10 transition flex flex-col">
                {n.image && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <img
                      loading="lazy"
                      decoding="async"
                      src={safeImg(n.image)}
                      alt={n.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>
                )}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="text-gillco-gold text-xs tracking-wider uppercase mb-2">
                    {n.date ? new Date(n.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} {n.category ? '· ' + n.category : ''}
                  </div>
                  <p className="text-white/90 leading-relaxed font-serif text-lg">{n.title}</p>
                  {n.body && (
                    <div className="text-white/70 text-sm mt-2 line-clamp-3">{renderNewsBody(n.body, true)}</div>
                  )}
                  <div className="mt-auto">
                    <NewsShareBar item={n} dark />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

/* ============================ HERO ============================ */
function Hero({ settings, onEnquire, goTo }) {
  const slides = settings?.hero?.slides || [];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!slides.length) return;
    const t = setInterval(() => setIdx(i => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  return (
    <section className="relative h-[85vh] min-h-[600px] w-full overflow-hidden">
      {slides.map((s, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-1000 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundImage: `url(${safeImg(s.image)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      ))}
      <div className="absolute inset-0 hero-overlay" />
      <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-center text-white">
        <p className="text-xs md:text-sm tracking-[0.4em] text-yellow-400 uppercase font-semibold animate-fadeInUp">Est. {settings?.founded} · Punjab</p>
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl mt-4 leading-tight animate-fadeInUp whitespace-pre-line max-w-4xl">
          {settings?.hero?.headline}
        </h1>
        <p className="mt-6 text-lg md:text-xl text-white/90 max-w-2xl animate-fadeInUp">{settings?.hero?.subline}</p>
        <div className="mt-10 flex flex-wrap gap-4 animate-fadeInUp">
          <button onClick={() => goTo('projects')} className="px-8 py-4 bg-white text-gillco-green rounded-full font-semibold hover:bg-gillco-gold transition inline-flex items-center gap-2">
            View Projects <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => onEnquire({ type: 'hero' })} className="px-8 py-4 border-2 border-white text-white rounded-full font-semibold hover:bg-white hover:text-gillco-green transition">
            Schedule a Visit
          </button>
        </div>

        {/* Slide indicator + controls */}
        <div className="absolute bottom-8 left-4 right-4 max-w-7xl mx-auto flex items-center justify-between text-white">
          <div className="flex gap-2">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-10 bg-gillco-gold' : 'w-6 bg-white/40'}`} />
            ))}
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs uppercase tracking-widest text-gillco-gold">Now Featuring</p>
            <p className="font-serif text-xl">{slides[idx]?.title}</p>
            <p className="text-xs text-white/70">{slides[idx]?.subtitle}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIdx((idx - 1 + slides.length) % slides.length)} className="w-10 h-10 rounded-full border border-white/40 hover:bg-white hover:text-gillco-green transition flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={() => setIdx((idx + 1) % slides.length)} className="w-10 h-10 rounded-full border border-white/40 hover:bg-white hover:text-gillco-green transition flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================ PROJECT CARD ============================ */
function AwardsStrip({ awards = [], compact = false }) {
  const list = (awards || []).filter(a => a?.title || a?.by);
  if (list.length === 0) return null;
  if (compact) {
    return (
      <div className="mt-3 flex flex-wrap gap-1.5" data-testid="awards-badges">
        {list.slice(0, 2).map((a, i) => (
          <span key={a.id || i} title={`${a.title || 'Award'}${a.by ? ` — ${a.by}` : ''}${a.year ? ` (${a.year})` : ''}`} className="inline-flex items-center gap-1.5 max-w-full text-[11px] font-medium pl-1 pr-2.5 py-1 rounded-full bg-gradient-to-r from-amber-50 to-yellow-50 border border-gillco-gold/40 text-amber-900">
            {a.logo
              ? <img loading="lazy" src={a.logo} alt={a.by || 'award'} className="w-4 h-4 object-contain rounded-full bg-white" />
              : <Award className="w-3.5 h-3.5 text-gillco-gold ml-1" />}
            <span className="truncate">{a.by ? `Awarded by ${a.by}` : a.title}</span>
          </span>
        ))}
        {list.length > 2 && <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-slate-100 text-slate-600">+{list.length - 2} more</span>}
      </div>
    );
  }
  return (
    <div className="mt-6 rounded-2xl border border-gillco-gold/40 bg-gradient-to-br from-amber-50/70 via-white to-gillco-cream p-5" data-testid="awards-strip">
      <div className="flex items-center gap-2 mb-3">
        <Award className="w-5 h-5 text-gillco-gold" />
        <span className="text-xs font-semibold uppercase tracking-wider text-gillco-green">Awards & Recognition</span>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {list.map((a, i) => (
          <div key={a.id || i} className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 p-3 transition hover:shadow-md hover:border-gillco-gold/50">
            <div className="w-12 h-12 shrink-0 rounded-full bg-gillco-cream border border-gillco-gold/30 flex items-center justify-center overflow-hidden">
              {a.logo ? <img loading="lazy" src={a.logo} alt={a.by || 'award'} className="w-10 h-10 object-contain" /> : <Award className="w-6 h-6 text-gillco-gold" />}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-800 leading-snug">{a.title || 'Award'}</div>
              <div className="text-xs text-slate-500">{a.by ? `Awarded by ${a.by}` : ''}{a.year ? `${a.by ? ' · ' : ''}${a.year}` : ''}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AwardsWall({ settings, projects = [], onProject }) {
  const items = [
    ...((settings?.groupAwards || []).map(a => ({ ...a, project: null }))),
    ...projects.flatMap(p => (p.awards || []).map(a => ({ ...a, project: p }))),
  ].filter(a => a?.title || a?.by)
    .sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
  if (items.length === 0) return null;
  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-white via-gillco-cream/60 to-white" data-testid="awards-wall">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <p className="text-xs tracking-[0.3em] text-gillco-gold uppercase font-semibold">Recognised for Excellence</p>
          <h2 className="font-serif text-3xl md:text-4xl text-gillco-green mt-2">Awards & Recognition</h2>
          <div className="w-16 h-0.5 bg-gillco-gold mx-auto mt-3" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory md:flex-wrap md:justify-center md:overflow-visible">
          {items.map((a, i) => (
            <div key={a.id || i} data-testid="awards-wall-item"
              onClick={() => a.project && onProject?.(a.project)}
              className={`snap-start shrink-0 w-64 group bg-white rounded-2xl border border-gillco-gold/30 p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(217,169,67,0.25)] hover:border-gillco-gold ${a.project ? 'cursor-pointer' : ''}`}>
              <div className="w-20 h-20 mx-auto rounded-full bg-gillco-cream border-2 border-gillco-gold/40 flex items-center justify-center overflow-hidden transition group-hover:border-gillco-gold">
                {a.logo ? <img loading="lazy" src={a.logo} alt={a.by || 'award'} className="w-16 h-16 object-contain" /> : <Award className="w-9 h-9 text-gillco-gold" />}
              </div>
              {a.year && <div className="mt-3 text-[11px] font-semibold tracking-widest text-gillco-gold">{a.year}</div>}
              <div className="mt-1 font-serif text-lg text-gillco-green leading-snug">{a.title || 'Award'}</div>
              {a.by && <div className="text-xs text-slate-500 mt-1">by {a.by}</div>}
              {a.project && <div className="mt-3 inline-block text-[11px] px-2.5 py-1 rounded-full bg-gillco-cream text-gillco-green font-medium">{a.project.name}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AwardsListEditor({ value = [], onChange, testid }) {
  const list = value || [];
  const upd = (i, patch) => onChange(list.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  return (
    <div className="space-y-3" data-testid={testid}>
      {list.map((a, i) => (
        <div key={a.id || i} className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
          <div className="grid md:grid-cols-3 gap-2">
            <Field label="Award Title" value={a.title} onChange={v => upd(i, { title: v })} />
            <Field label="Awarded By (e.g. CREDAI Punjab)" value={a.by} onChange={v => upd(i, { by: v })} />
            <Field label="Year" value={a.year} onChange={v => upd(i, { year: v })} />
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1"><MediaUploader label="Awarding Body Logo (optional)" value={a.logo} onChange={v => upd(i, { logo: v })} accept="image/*" hint="Square transparent PNG works best" /></div>
            <button type="button" onClick={() => onChange(list.filter((_, idx) => idx !== i))} className="px-3 py-2 text-red-600 border border-red-200 rounded-full text-sm inline-flex items-center gap-1"><Trash2 className="w-4 h-4" /> Remove</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...list, { id: `a${Date.now()}`, title: '', by: '', year: String(new Date().getFullYear()), logo: '' }])} className="px-4 py-2 border border-slate-300 rounded-full text-sm inline-flex items-center gap-2">
        <Plus className="w-4 h-4" /> Add Award
      </button>
    </div>
  );
}

function ProjectCard({ project, onOpen, onCompareToggle, inCompare }) {
  const s = STATUS_MAP[project.status];
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all">
      <div className="relative h-64 overflow-hidden">
        <img loading="lazy" decoding="async" src={safeImg(project.heroImage)} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
        <span className={`absolute top-4 left-4 text-xs font-semibold px-3 py-1.5 rounded-full ${s.color}`}>{s.label}</span>
        <span className="absolute top-4 right-4 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/90 text-slate-800 capitalize">
          {project.hasResidential && project.hasCommercial
            ? '🏠🏢 Residential + Commercial'
            : project.hasResidential
              ? '🏠 Residential'
              : project.hasCommercial
                ? '🏢 Commercial'
                : project.category}
        </span>
      </div>
      <div className="p-6">
        <div className="flex items-start gap-3">
          {project.logo && (
            <img loading="lazy" decoding="async" src={safeImg(project.logo)} alt={`${project.name} logo`} className="w-12 h-12 object-contain shrink-0 bg-white rounded-md border border-slate-100 p-1 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:ring-2 group-hover:ring-gillco-gold/40" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-serif text-2xl text-gillco-green leading-tight transition-colors duration-300 group-hover:text-gillco-green-dark">{project.name}</h3>
            <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {project.location}</p>
          </div>
        </div>
        {project.softLaunch?.enabled && (
          <div className="mt-3"><CountdownBadge soft={project.softLaunch} compact /></div>
        )}
        <AwardsStrip awards={project.awards} compact />
        <p className="text-sm text-slate-600 mt-3 line-clamp-2">{project.summary}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
          <span>{project.unitMix}</span>
          <span className="font-mono">{project.reraNumber}</span>
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={onOpen} className="flex-1 py-2.5 bg-gillco-green text-white rounded-full text-sm font-medium hover:bg-gillco-green-dark transition">
            View Details
          </button>
          <button
            onClick={onCompareToggle}
            className={`px-4 py-2.5 rounded-full text-sm font-medium transition ${inCompare ? 'bg-gillco-gold text-slate-900' : 'border border-gillco-green text-gillco-green hover:bg-gillco-cream'}`}
            title="Add to Compare"
          >
            {inCompare ? '✓ Added' : 'Compare'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================ PROJECTS VIEW ============================ */
function ProjectsView({ projects, all, statusFilter, setStatusFilter, categoryFilter, setCategoryFilter, search, setSearch, onProject, onCompareToggle, compare, onOpenCompare, title = 'Our Projects', subtitle = 'Building excellence across Punjab' }) {
  return (
    <section className="py-16 bg-gillco-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.3em] text-gillco-gold font-semibold uppercase">Building Excellence</p>
          <h1 className="font-serif text-5xl text-gillco-green mt-3">{title}</h1>
          <p className="text-slate-600 mt-3">{subtitle}</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 mb-8 space-y-4">
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or location…" className="w-full pl-9 pr-3 py-2.5 rounded-full border border-slate-200 text-sm focus:border-gillco-green outline-none" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-full border border-slate-200 text-sm focus:border-gillco-green outline-none bg-white">
              <option value="all">All Status</option>
              <option value="delivered">Delivered</option>
              <option value="ongoing">Ongoing</option>
              <option value="upcoming">Upcoming / Soft Launch</option>
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold mr-1 shrink-0">Your Requirement:</span>
            {[
              { v: 'all', label: 'All', icon: '✨' },
              { v: 'residential', label: 'Residential', icon: '🏠' },
              { v: 'commercial', label: 'Commercial', icon: '🏢' },
              { v: 'industrial', label: 'Industrial', icon: '🏭' },
            ].map(c => (
              <button
                key={c.v}
                onClick={() => setCategoryFilter(c.v)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition border inline-flex items-center gap-1.5 ${
                  categoryFilter === c.v
                    ? 'bg-gillco-green text-white border-gillco-green shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-gillco-green hover:text-gillco-green'
                }`}
              >
                <span>{c.icon}</span> {c.label}
              </button>
            ))}
          </div>
          <div className="hidden">
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
              <option value="all">All Categories</option>
              <option value="residential">Residential</option>
              <option value="industrial">Industrial</option>
            </select>
          </div>
          {compare.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-sm text-slate-600">{compare.length} project(s) selected</span>
              <button onClick={onOpenCompare} className="px-4 py-2 gradient-gold text-slate-900 rounded-full text-sm font-semibold">Open Compare Tool</button>
            </div>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-20 text-slate-500">No projects match your filters.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(p => (
              <ProjectCard key={p.id} project={p} onOpen={() => onProject(p)} onCompareToggle={() => onCompareToggle(p.id)} inCompare={compare.includes(p.id)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================ PROJECT DETAIL MODAL ============================ */
function ProjectDetail({ project, onClose, onEnquire, onCompareToggle, inCompare, onWatchVideo }) {
  const s = STATUS_MAP[project.status];
  const [imgIdx, setImgIdx] = useState(0);
  const gallery = project.gallery?.length ? project.gallery : [project.heroImage];
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto no-print">
      <div className="min-h-screen py-8 px-4 flex items-start justify-center">
        <div className="bg-white w-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl">
          {/* Gallery */}
          <div className="relative h-96 bg-slate-100">
            <img loading="lazy" decoding="async" src={safeImg(gallery[imgIdx])} alt={project.name} className="w-full h-full object-cover" />
            <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center"><X className="w-5 h-5" /></button>
            <span className={`absolute top-4 left-4 text-xs font-semibold px-3 py-1.5 rounded-full ${s.color}`}>{s.label}</span>
            {project.youtubeId && (
              <button onClick={() => onWatchVideo?.({ title: project.name + ' — Walkthrough', poster: project.heroImage, youtubeId: project.youtubeId })} className="absolute inset-0 m-auto w-20 h-20 rounded-full bg-red-500/90 hover:bg-red-500 backdrop-blur flex items-center justify-center text-white shadow-2xl transition group ring-4 ring-white/30" title="Play video walkthrough">
                <Play className="w-8 h-8 ml-1" fill="currentColor" />
              </button>
            )}
            {gallery.length > 1 && (
              <>
                <button onClick={() => setImgIdx((imgIdx - 1 + gallery.length) % gallery.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center"><ChevronLeft /></button>
                <button onClick={() => setImgIdx((imgIdx + 1) % gallery.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center"><ChevronRight /></button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur">
                  <span className="text-white text-xs font-medium">{imgIdx + 1} / {gallery.length}</span>
                </div>
              </>
            )}
          </div>
          {/* Thumbnail strip */}
          {gallery.length > 1 && (
            <div className="px-6 pt-4 pb-2 border-b border-slate-100">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {gallery.map((g, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIdx(i)}
                    className={`shrink-0 w-20 h-14 rounded-md overflow-hidden ring-2 transition ${i === imgIdx ? 'ring-gillco-gold' : 'ring-transparent hover:ring-gillco-green/50'}`}
                  >
                    <img loading="lazy" decoding="async" src={safeImg(g)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="p-8">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-start gap-4">
                {project.logo && (
                  <img loading="lazy" decoding="async" src={safeImg(project.logo)} alt={`${project.name} logo`} className="w-16 h-16 md:w-20 md:h-20 object-contain bg-white rounded-lg border border-slate-100 p-1.5 shrink-0 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(217,169,67,0.35)] hover:ring-2 hover:ring-gillco-gold/50 cursor-default" />
                )}
                <div>
                  <h2 className="font-serif text-4xl text-gillco-green">{project.name}</h2>
                  <p className="text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-4 h-4" /> {project.location}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={onCompareToggle} className={`px-4 py-2 rounded-full text-sm font-medium ${inCompare ? 'bg-gillco-gold text-slate-900' : 'border border-gillco-green text-gillco-green'}`}>
                  {inCompare ? '✓ Added to Compare' : '+ Add to Compare'}
                </button>
              </div>
            </div>

            {/* RERA */}
            <div className="mt-6 bg-gillco-cream rounded-2xl p-5 border border-gillco-gold/30">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-gillco-gold" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gillco-green">RERA Disclosure</span>
              </div>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div><span className="text-slate-500 block text-xs">RERA Number</span><span className="font-mono text-slate-800">{project.reraNumber}</span></div>
                <div><span className="text-slate-500 block text-xs">Status</span><span className="text-emerald-700 font-medium">{project.reraStatus}</span></div>
                <div><span className="text-slate-500 block text-xs">Last Updated</span><span className="text-slate-800">{new Date(project.reraUpdatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span></div>
              </div>
            </div>

            <AwardsStrip awards={project.awards} />

            <p className="mt-6 text-slate-700 leading-relaxed">{project.summary}</p>

            {/* Soft launch urgency */}
            {project.softLaunch?.enabled && (
              <div className="mt-6">
                <CountdownBadge soft={project.softLaunch} onEnquire={() => onEnquire('soft-launch')} />
              </div>
            )}

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                ['Unit Mix', project.unitMix],
                ['Price Range', project.priceRange],
                ['Acres', project.acres],
                ['Total Units', project.units],
              ].map(([l, v]) => (
                <div key={l} className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-500 uppercase">{l}</div>
                  <div className="text-slate-900 font-medium mt-1">{v}</div>
                </div>
              ))}
            </div>

            {/* Progress */}
            {project.status !== 'delivered' && (
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-semibold text-gillco-green">Construction Progress</span>
                  <span className="text-slate-600">{project.constructionPercent}% Complete</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full gradient-emerald" style={{ width: `${project.constructionPercent}%` }} />
                </div>
              </div>
            )}

            {/* Residential + Commercial Side-by-Side */}
            {(project.hasResidential || project.hasCommercial) && (project.residentialOffering || project.commercialOffering) && (
              <div className="mt-8">
                <h3 className="font-serif text-2xl text-gillco-green mb-4">Available Offerings</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {project.hasResidential && (
                    <div className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 hover:shadow-lg transition">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🏠</span>
                        <h4 className="font-serif text-xl text-emerald-900">Residential</h4>
                      </div>
                      <dl className="space-y-2 text-sm">
                        {project.residentialOffering?.unitMix && (
                          <div><dt className="text-xs uppercase tracking-wider text-slate-500">Unit Mix</dt><dd className="font-semibold text-slate-800">{project.residentialOffering.unitMix}</dd></div>
                        )}
                        {project.residentialOffering?.priceRange && (
                          <div><dt className="text-xs uppercase tracking-wider text-slate-500">Price Range</dt><dd className="font-semibold text-gillco-gold">{project.residentialOffering.priceRange}</dd></div>
                        )}
                        {project.residentialOffering?.carpet && (
                          <div><dt className="text-xs uppercase tracking-wider text-slate-500">Carpet / Super Area</dt><dd className="font-semibold text-slate-800">{project.residentialOffering.carpet}</dd></div>
                        )}
                      </dl>
                      {Array.isArray(project.residentialOffering?.highlights) && project.residentialOffering.highlights.length > 0 && (
                        <ul className="mt-3 space-y-1">
                          {project.residentialOffering.highlights.map((h, i) => (
                            <li key={i} className="text-xs text-slate-700 flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> {h}</li>
                          ))}
                        </ul>
                      )}
                      <button onClick={() => onEnquire({ projectId: project.id, type: 'residential' })} className="mt-4 w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-full text-sm font-semibold">Enquire — Residential</button>
                    </div>
                  )}
                  {project.hasCommercial && (
                    <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 hover:shadow-lg transition">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🏢</span>
                        <h4 className="font-serif text-xl text-amber-900">Commercial</h4>
                      </div>
                      <dl className="space-y-2 text-sm">
                        {project.commercialOffering?.unitMix && (
                          <div><dt className="text-xs uppercase tracking-wider text-slate-500">Unit Type</dt><dd className="font-semibold text-slate-800">{project.commercialOffering.unitMix}</dd></div>
                        )}
                        {project.commercialOffering?.priceRange && (
                          <div><dt className="text-xs uppercase tracking-wider text-slate-500">Price Range</dt><dd className="font-semibold text-amber-700">{project.commercialOffering.priceRange}</dd></div>
                        )}
                        {project.commercialOffering?.carpet && (
                          <div><dt className="text-xs uppercase tracking-wider text-slate-500">Carpet / Super Area</dt><dd className="font-semibold text-slate-800">{project.commercialOffering.carpet}</dd></div>
                        )}
                      </dl>
                      {Array.isArray(project.commercialOffering?.highlights) && project.commercialOffering.highlights.length > 0 && (
                        <ul className="mt-3 space-y-1">
                          {project.commercialOffering.highlights.map((h, i) => (
                            <li key={i} className="text-xs text-slate-700 flex items-start gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" /> {h}</li>
                          ))}
                        </ul>
                      )}
                      <button onClick={() => onEnquire({ projectId: project.id, type: 'commercial' })} className="mt-4 w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-full text-sm font-semibold">Enquire — Commercial</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Milestones */}
            {project.milestones?.length > 0 && (
              <div className="mt-8">
                <h3 className="font-serif text-2xl text-gillco-green mb-4">Project Milestones</h3>
                <div className="space-y-3">
                  {project.milestones.map((m, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      {m.done ? <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" /> : <Clock className="w-5 h-5 text-slate-400 mt-0.5" />}
                      <div className="flex-1">
                        <div className="font-medium text-slate-800">{m.title}</div>
                        <div className="text-xs text-slate-500">{new Date(m.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            {project.amenities?.length > 0 && (
              <div className="mt-8">
                <h3 className="font-serif text-2xl text-gillco-green mb-4">Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {project.amenities.map(a => (
                    <span key={a} className="px-3 py-1.5 bg-gillco-cream text-gillco-green border border-gillco-gold/30 rounded-full text-sm">{a}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Video Gallery (multi-angle playlist) */}
            {project.videos?.length > 0 && (
              <div className="mt-8">
                <div className="flex items-baseline justify-between mb-4">
                  <h3 className="font-serif text-2xl text-gillco-green">Video Gallery</h3>
                  <span className="text-xs text-slate-500 uppercase tracking-widest">{project.videos.length} angles</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {project.videos.map(v => (
                    <button
                      key={v.id}
                      onClick={() => onWatchVideo?.({ title: `${project.name} — ${v.title}`, poster: v.poster, youtubeId: v.youtubeId })}
                      className="group relative rounded-xl overflow-hidden aspect-video bg-slate-100 shadow-md hover:shadow-2xl transition"
                    >
                      <img loading="lazy" decoding="async" src={safeImg(v.poster)} alt={v.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-red-500/95 flex items-center justify-center shadow-lg ring-2 ring-white/50 group-hover:scale-110 transition">
                          <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 text-left">
                        {v.angle && <p className="text-[10px] uppercase tracking-widest text-gillco-gold font-bold">{v.angle}</p>}
                        <p className="text-sm text-white font-semibold line-clamp-1">{v.title}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => onEnquire('detail-enquire')} className="px-6 py-3 bg-gillco-green text-white rounded-full font-medium">Enquire Now</button>
              <button onClick={() => onEnquire('schedule-visit')} className="px-6 py-3 gradient-gold text-slate-900 rounded-full font-semibold">Schedule a Visit</button>
              {project.status === 'upcoming' && <button onClick={() => onEnquire('soft-launch')} className="px-6 py-3 border-2 border-gillco-green text-gillco-green rounded-full font-medium">Book Soft Launch</button>}
              {project.youtubeId && (
                <button onClick={() => onWatchVideo?.({ title: project.name + ' — Walkthrough', poster: project.heroImage, youtubeId: project.youtubeId })} className="px-6 py-3 border-2 border-red-500 text-red-600 rounded-full font-medium inline-flex items-center gap-2 hover:bg-red-50">
                  <Play className="w-4 h-4" fill="currentColor" /> Watch Video
                </button>
              )}
              <button onClick={() => downloadBrochure(project)} className="px-6 py-3 border border-slate-300 text-slate-700 rounded-full font-medium inline-flex items-center gap-2 hover:bg-slate-50"><Download className="w-4 h-4" /> Download Brochure</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================ COMPARE MODAL ============================ */
function CompareModal({ projects, onClose, onRemove }) {
  const rows = [
    ['Status', p => STATUS_MAP[p.status].label],
    ['Category', p => p.category],
    ['Location', p => p.location],
    ['RERA Number', p => p.reraNumber],
    ['RERA Status', p => p.reraStatus],
    ['Launch', p => p.launchDate],
    ['Handover', p => p.handoverDate],
    ['Unit Mix', p => p.unitMix],
    ['Price Range', p => p.priceRange],
    ['Acres', p => p.acres],
    ['Towers', p => p.towers],
    ['Total Units', p => p.units],
    ['Construction %', p => `${p.constructionPercent}%`],
    ['Amenities', p => (p.amenities || []).slice(0, 5).join(', ') + (p.amenities?.length > 5 ? '…' : '')],
  ];

  const exportPDF = async () => {
    try {
      const jsPDFmod = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const jsPDF = jsPDFmod.jsPDF || jsPDFmod.default;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

      // Header
      doc.setFillColor(11, 81, 56);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 60, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.text('Gillco Group — Project Comparison', 40, 38);
      doc.setFontSize(9);
      doc.setTextColor(201, 162, 75);
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, doc.internal.pageSize.getWidth() - 200, 38);

      const head = [['Attribute', ...projects.map(p => p.name)]];
      const body = rows.map(([label, fn]) => [label, ...projects.map(p => String(fn(p) ?? '—'))]);

      autoTable(doc, {
        head, body,
        startY: 80,
        theme: 'grid',
        headStyles: { fillColor: [11, 81, 56], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [248, 245, 238] },
        styles: { font: 'helvetica', fontSize: 9, cellPadding: 6 },
        columnStyles: { 0: { fontStyle: 'bold', fillColor: [248, 245, 238], textColor: [11, 81, 56] } },
      });

      const pageH = doc.internal.pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text('© Gillco Group · support@gillcogroup.org · +91 90417 95879', 40, pageH - 20);

      doc.save(`gillco-compare-${Date.now()}.pdf`);
      toast.success('PDF downloaded');
    } catch (e) {
      console.error(e);
      toast.error('PDF export failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen py-8 px-4 flex items-start justify-center">
        <div className="bg-white w-full max-w-6xl rounded-3xl shadow-2xl">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between no-print">
            <div>
              <h2 className="font-serif text-3xl text-gillco-green">Compare Projects</h2>
              <p className="text-sm text-slate-500">Side-by-side comparison of up to 4 projects.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => window.print()} className="px-4 py-2 border border-slate-300 rounded-full text-sm inline-flex items-center gap-2"><Printer className="w-4 h-4" /> Print</button>
              <button onClick={exportPDF} className="px-4 py-2 bg-gillco-green text-white rounded-full text-sm font-semibold inline-flex items-center gap-2"><Download className="w-4 h-4" /> Export PDF</button>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-5 h-5" /></button>
            </div>
          </div>

          {projects.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No projects selected yet. Choose "Compare" on any project card.</div>
          ) : (
            <div className="overflow-x-auto p-6">
              <table className="w-full min-w-[700px] border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-3 bg-gillco-cream text-gillco-green text-sm font-semibold w-40">Attribute</th>
                    {projects.map(p => (
                      <th key={p.id} className="p-3 bg-gillco-cream text-left align-top min-w-[200px]">
                        <div className="relative mb-2">
                          <img loading="lazy" decoding="async" src={safeImg(p.heroImage)} alt={p.name} className="w-full h-32 object-cover rounded-lg" />
                          {p.logo && (
                            <img
                              loading="lazy"
                              decoding="async"
                              src={safeImg(p.logo)}
                              alt={`${p.name} logo`}
                              className="absolute -bottom-3 left-2 w-10 h-10 object-contain bg-white rounded-md border border-slate-200 p-1 shadow-sm"
                            />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          {p.logo && (
                            <img
                              loading="lazy"
                              decoding="async"
                              src={safeImg(p.logo)}
                              alt=""
                              className="w-6 h-6 object-contain rounded border border-slate-100 bg-white p-0.5 shrink-0 md:hidden"
                            />
                          )}
                          <div className="font-serif text-lg text-gillco-green leading-tight">{p.name}</div>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{p.location}</div>
                        <button onClick={() => onRemove(p.id)} className="mt-2 text-xs text-red-600 inline-flex items-center gap-1 no-print"><Trash2 className="w-3 h-3" /> Remove</button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(([label, fn], i) => (
                    <tr key={label} className={i % 2 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="p-3 text-sm font-medium text-gillco-green">{label}</td>
                      {projects.map(p => (
                        <td key={p.id} className="p-3 text-sm text-slate-700">{String(fn(p) ?? '—')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================ ENQUIRY MODAL ============================ */
const PROPERTY_TYPES = [
  { id: 'residential', label: 'Residential' },
  { id: 'commercial', label: 'Commercial' },
  { id: 'industrial', label: 'Industrial Plot' },
];
const BUDGET_OPTIONS = [
  { label: 'Under ₹50 Lakh', min: 0, max: 0.5 },
  { label: '₹50 Lakh – ₹1 Cr', min: 0.5, max: 1 },
  { label: '₹1 – 1.5 Cr', min: 1, max: 1.5 },
  { label: '₹1.5 – 2 Cr', min: 1.5, max: 2 },
  { label: '₹2 – 3 Cr', min: 2, max: 3 },
  { label: '₹3 – 5 Cr', min: 3, max: 5 },
  { label: '₹5 Cr+', min: 5, max: Infinity },
];

// "₹85 L – ₹1.5 Cr" -> { start: 0.85, end: 1.5 } in Crore. Returns null for "On Request".
function parsePriceRangeCr(str) {
  if (!str) return null;
  const parts = String(str).split(/[–—-]|\bto\b/i).map(x => x.trim()).filter(Boolean);
  // a bare number without a unit (e.g. "₹1.5 – 2 Cr") inherits the unit of the other part
  const unitOf = (x) => (String(x).toLowerCase().match(/(cr|crore|l\b|lac|lakh)/) || [])[1] || '';
  const fallbackUnit = parts.map(unitOf).find(Boolean) || 'cr';
  const vals = parts.map(x => parsePriceToINR(unitOf(x) ? x : `${x} ${fallbackUnit}`) / 1e7).filter(v => v > 0);
  if (vals.length === 0) return null;
  return { start: Math.min(...vals), end: Math.max(...vals) };
}

function budgetRangeCr(budget, custom) {
  if (budget === 'custom') {
    const c = Number(custom);
    return c > 0 ? { min: c * 0.75, max: c * 1.1 } : null;
  }
  const o = BUDGET_OPTIONS.find(b => b.label === budget);
  return o ? { min: o.min, max: o.max } : null;
}

function matchProjects(projects, type, budget, custom) {
  const range = budgetRangeCr(budget, custom);
  if (!type && !range) return [];
  const scored = [];
  for (const p of projects || []) {
    if (!projectMatchesType(p, type)) continue;
    const pr = parsePriceRangeCr(p.priceRange);
    if (range) {
      if (!pr) { scored.push({ p, score: 1, fit: 'Price on request' }); continue; }
      if (pr.start > range.max || pr.end < range.min) continue; // no overlap
      const inside = pr.start >= range.min && pr.start <= range.max;
      scored.push({ p, score: inside ? 3 : 2, fit: inside ? 'Within budget' : 'Options in your budget' });
    } else {
      scored.push({ p, score: 2, fit: '' });
    }
  }
  const statusRank = { upcoming: 0, ongoing: 1, delivered: 2 };
  return scored
    .sort((a, b) => b.score - a.score || (statusRank[a.p.status] ?? 3) - (statusRank[b.p.status] ?? 3))
    .slice(0, 3);
}

function projectMatchesType(p, type) {
  if (!type) return true;
  const primary = (p.category || '').toLowerCase();
  const offerings = Array.isArray(p.offerings) ? p.offerings.map(o => (o.type || '').toLowerCase()) : [];
  if (type === 'residential') return p.hasResidential === true || primary === 'residential' || primary === 'mixed-use' || offerings.includes('residential');
  if (type === 'commercial') return p.hasCommercial === true || primary === 'commercial' || primary === 'mixed-use' || offerings.includes('commercial');
  if (type === 'industrial') return primary === 'industrial';
  return true;
}

function EnquiryModal({ prefill, settings, onClose, projects }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    projectId: prefill.projectId || '',
    projectName: prefill.projectName || '',
    propertyType: '',
    budget: '',
    budgetCustom: '',
    message: '',
    consent: false,
  });
  const typeProjects = useMemo(() => (projects || []).filter(p => projectMatchesType(p, form.propertyType)), [projects, form.propertyType]);
  const selectedProject = (projects || []).find(p => p.id === form.projectId);
  const budgetText = form.budget === 'custom'
    ? (form.budgetCustom ? `₹${form.budgetCustom} Cr` : '')
    : form.budget;
  const propertyTypeLabel = PROPERTY_TYPES.find(t => t.id === form.propertyType)?.label || '';
  const matches = useMemo(() => matchProjects(projects, form.propertyType, form.budget, form.budgetCustom), [projects, form.propertyType, form.budget, form.budgetCustom]);
  const showMatches = !!(form.propertyType || form.budget) && !(form.budget === 'custom' && !(Number(form.budgetCustom) > 0));
  const [submitting, setSubmitting] = useState(false);

  const utm = useMemo(() => {
    if (typeof window === 'undefined') return {};
    const p = new URLSearchParams(window.location.search);
    return {
      utm_source: p.get('utm_source') || 'direct',
      utm_medium: p.get('utm_medium') || '',
      utm_campaign: p.get('utm_campaign') || '',
      referrer: document.referrer || '',
    };
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error('Name and phone are required'); return; }
    if (!form.consent) { toast.error('Please accept the consent to continue'); return; }
    if (form.budget === 'custom' && form.budgetCustom && !(Number(form.budgetCustom) > 0)) { toast.error('Please enter your budget in Crore, e.g. 1.25'); return; }
    setSubmitting(true);
    try {
      const proj = projects.find(p => p.id === form.projectId);
      const projectName = proj?.name || form.projectName || 'General';

      // Sales team round-robin — pick next active member BEFORE saving
      const active = (settings?.salesTeam || []).filter(s => s.active !== false && s.whatsapp);
      let picked;
      if (active.length > 0) {
        const key = 'gillco_sales_rr';
        let idx = parseInt(localStorage.getItem(key) || '0', 10);
        if (isNaN(idx) || idx < 0) idx = 0;
        picked = active[idx % active.length];
        localStorage.setItem(key, String((idx + 1) % active.length));
      }

      await api('/enquiries', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          projectName,
          propertyType: propertyTypeLabel,
          budget: budgetText,
          type: prefill.type || 'general',
          utm,
          routedTo: picked?.name || null,
          routedToId: picked?.id || null,
        }),
      });
      toast.success('Thank you! Routing to WhatsApp for instant confirmation…');
      trackEvent('generate_lead', { form_type: prefill.type || 'general', project_name: projectName, property_type: propertyTypeLabel || 'any', budget: budgetText || 'not given', lead_source: utm.utm_source || 'website', routed_to: picked?.name || 'default' });

      const adminWA = picked?.whatsapp || settings?.whatsapp || '919041795879';
      const agentLabel = picked?.name || 'Gillco Sales Team';
      const src = utm.utm_source || 'website';
      const waLines = [
        '🔔 *New Enquiry — Gillco Group Website*',
        '',
        `👤 Name: ${form.name}`,
        `📞 Phone: ${form.phone}`,
        form.email ? `✉️ Email: ${form.email}` : null,
        `🏢 Project: ${projectName}`,
        propertyTypeLabel ? `🏷️ Property Type: ${propertyTypeLabel}` : null,
        budgetText ? `💰 Budget: ${budgetText}` : null,
        form.message ? `💬 Message: ${form.message}` : null,
        `🎯 Type: ${prefill.type || 'general'}`,
        `📥 Source: ${src}`,
        `👥 Routed to: ${agentLabel}`,
        `🕒 ${new Date().toLocaleString('en-IN')}`,
      ].filter(Boolean).join('\n');
      const waUrl = `https://wa.me/${adminWA}?text=${encodeURIComponent(waLines)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      onClose();
    } catch (err) {
      toast.error('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const title = {
    popup: 'Get in Touch',
    'schedule-visit': 'Schedule a Site Visit',
    'soft-launch': 'Book Soft Launch',
    'detail-enquire': 'Project Enquiry',
    hero: 'Schedule a Visit',
    sticky: 'Enquire Now',
    featured: 'Book Soft Launch',
    header: 'Schedule a Visit',
    general: 'Enquire Now',
  }[prefill.type] || 'Enquire Now';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto no-print">
      <div className="min-h-screen py-8 px-4 flex items-center justify-center">
        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
          <div className="gradient-emerald text-white p-6 relative">
            <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"><X className="w-4 h-4" /></button>
            <div className="flex items-center gap-3 pr-10">
              <img src={settings?.logoWhite || GILLCO_LOGO_WHITE} alt="Gillco Group" data-testid="enquiry-logo" className="h-10 w-auto object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} />
              <span className="h-8 w-px bg-white/30" />
              <p className="text-xs tracking-widest text-gillco-gold uppercase font-semibold">Gillco Group</p>
            </div>
            <h2 className="font-serif text-3xl mt-3">{title}</h2>
            <p className="text-sm text-white/80 mt-1">A relationship manager will call within 24 hours.</p>
          </div>
          <form onSubmit={submit} className="p-6 space-y-4">
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">Full Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full mt-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:border-gillco-green outline-none" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider">Phone *</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full mt-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:border-gillco-green outline-none" required />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full mt-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:border-gillco-green outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider">Property Type</label>
                <select data-testid="enquiry-property-type" value={form.propertyType} onChange={e => {
                  const t = e.target.value;
                  const keep = !form.projectId || (projects || []).some(p => p.id === form.projectId && projectMatchesType(p, t));
                  setForm({ ...form, propertyType: t, projectId: keep ? form.projectId : '' });
                }} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-lg focus:border-gillco-green outline-none bg-white">
                  <option value="">Any type</option>
                  {PROPERTY_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider">Budget (₹ Cr)</label>
                <select data-testid="enquiry-budget" value={form.budget} onChange={e => setForm({ ...form, budget: e.target.value })} className="w-full mt-1 px-3 py-2.5 border border-slate-200 rounded-lg focus:border-gillco-green outline-none bg-white">
                  <option value="">Select budget</option>
                  {BUDGET_OPTIONS.map(b => <option key={b.label} value={b.label}>{b.label}</option>)}
                  <option value="custom">Custom amount…</option>
                </select>
              </div>
            </div>
            {form.budget === 'custom' && (
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider">Your Budget</label>
                <div className="mt-1 flex items-center border border-slate-200 rounded-lg focus-within:border-gillco-green overflow-hidden">
                  <span className="px-3 text-slate-500 text-sm">₹</span>
                  <input data-testid="enquiry-budget-custom" type="number" inputMode="decimal" min="0.1" step="0.05" autoFocus value={form.budgetCustom} onChange={e => setForm({ ...form, budgetCustom: e.target.value })} placeholder="e.g. 1.25" className="flex-1 py-2.5 outline-none" />
                  <span className="px-3 py-2.5 bg-gillco-cream text-gillco-green text-sm font-semibold">Crore</span>
                </div>
                {Number(form.budgetCustom) > 0 && <p className="text-[11px] text-slate-500 mt-1">≈ ₹{(Number(form.budgetCustom) * 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })} Lakh</p>}
              </div>
            )}
            {showMatches && (
              <div data-testid="enquiry-matches" className="rounded-2xl border border-gillco-gold/40 bg-gradient-to-br from-gillco-cream to-white p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gillco-green mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-gillco-gold" />
                  {matches.length ? `${matches.length} matching project${matches.length > 1 ? 's' : ''} for you` : 'Matching projects'}
                </div>
                {matches.length === 0 ? (
                  <p className="text-xs text-slate-600">No exact match right now — submit anyway and our advisor will share the closest options and upcoming launches.</p>
                ) : (
                  <div className="space-y-2">
                    {matches.map(({ p, fit }) => {
                      const active = form.projectId === p.id;
                      return (
                        <button type="button" key={p.id} data-testid="enquiry-match-item" onClick={() => setForm({ ...form, projectId: active ? '' : p.id })}
                          className={`w-full flex items-center gap-3 text-left rounded-xl border p-2 transition ${active ? 'border-gillco-green bg-emerald-50 ring-2 ring-gillco-green/30' : 'border-slate-200 bg-white hover:border-gillco-gold hover:shadow-md'}`}>
                          <img src={safeImg(p.heroImage)} alt={p.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              {p.logo && <img src={safeImg(p.logo)} alt="" className="w-5 h-5 object-contain" />}
                              <span className="font-semibold text-sm text-slate-800 truncate">{p.name}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">{p.location}</div>
                            <div className="text-[11px] mt-0.5 flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-gillco-green">{p.priceRange || 'Price on request'}</span>
                              {STATUS_MAP[p.status] && <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${STATUS_MAP[p.status].color}`}>{STATUS_MAP[p.status].label}</span>}
                              {fit && <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-900">{fit}</span>}
                            </div>
                          </div>
                          <span className={`text-[11px] font-semibold shrink-0 ${active ? 'text-gillco-green' : 'text-slate-400'}`}>{active ? '✓ Selected' : 'Select'}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">Interested In</label>
              <div className="flex items-center gap-2 mt-1">
                {selectedProject?.logo && (
                  <img src={safeImg(selectedProject.logo)} alt={`${selectedProject.name} logo`} data-testid="enquiry-project-logo" className="w-11 h-11 object-contain bg-white rounded-md border border-slate-200 p-1 shrink-0" />
                )}
                <select data-testid="enquiry-project" value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:border-gillco-green outline-none bg-white">
                  <option value="">{typeProjects.length ? 'Select a project (optional)' : 'No projects for this type yet'}</option>
                  {typeProjects.map(p => <option key={p.id} value={p.id}>{p.name} — {p.location}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">Message</label>
              <textarea rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Any specific requirement?" className="w-full mt-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:border-gillco-green outline-none resize-none" />
            </div>
            <label className="flex items-start gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={form.consent} onChange={e => setForm({ ...form, consent: e.target.checked })} className="mt-0.5" />
              I consent to Gillco Group storing my details to contact me about my enquiry. I understand my data will not be shared with third parties without consent.
            </label>
            <button type="submit" disabled={submitting} className="w-full py-3 gradient-emerald text-white rounded-full font-semibold hover:brightness-110 disabled:opacity-50 transition inline-flex items-center justify-center gap-2">
              {submitting ? 'Sending…' : (<>Submit &amp; Confirm on WhatsApp <MessageCircle className="w-4 h-4" /></>)}
            </button>
            <p className="text-center text-[11px] text-slate-500">On submit, WhatsApp opens with your details pre-filled — just tap Send to instantly reach our sales team.</p>
            <p className="text-center text-xs text-slate-500">
              Or call <a className="text-gillco-green font-semibold" href={`tel:${settings?.phone}`}>{settings?.phone}</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

/* ============================ VIDEO MODAL ============================ */
/* ============================ EMI CALCULATOR MODAL ============================ */
// Parses a price range string like "₹1.5 Cr onwards" or "₹85 L - 1.2 Cr" and returns an INR number.
function parsePriceToINR(input) {
  if (!input && input !== 0) return 0;
  if (typeof input === 'number') return input;
  const s = String(input).toLowerCase();
  // Match the first number in the string
  const match = s.match(/([\d.,]+)\s*(cr|crore|crores|l|lac|lacs|lakh|lakhs|k|thousand)?/);
  if (!match) return 0;
  const num = parseFloat(match[1].replace(/,/g, '')) || 0;
  const unit = match[2] || '';
  if (unit.startsWith('cr')) return num * 1e7;
  if (unit.startsWith('l') || unit.startsWith('lac') || unit.startsWith('lakh')) return num * 1e5;
  if (unit.startsWith('k') || unit.startsWith('thousand')) return num * 1e3;
  return num;
}

function fmtINR(n) {
  if (!isFinite(n)) return '₹0';
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

function EmiCalculatorModal({ initialPrice, projects = [], onClose, onEnquire }) {
  const seedPrice = initialPrice && initialPrice > 0 ? initialPrice : 10000000; // ₹1 Cr default
  const [price, setPrice] = useState(seedPrice);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);
  const [projectSlug, setProjectSlug] = useState('');

  const onPickProject = (slug) => {
    setProjectSlug(slug);
    if (!slug) return;
    const p = projects.find(x => x.slug === slug);
    const parsed = parsePriceToINR(p?.priceRange || p?.startingPrice || p?.price);
    if (parsed > 0) setPrice(parsed);
  };

  const downPayment = Math.round((price * downPct) / 100);
  const loanAmount = Math.max(0, price - downPayment);
  const monthlyRate = rate / 100 / 12;
  const months = tenure * 12;
  const emi = monthlyRate > 0 && months > 0
    ? Math.round((loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1))
    : Math.round(loanAmount / Math.max(1, months));
  const totalPayable = emi * months;
  const totalInterest = Math.max(0, totalPayable - loanAmount);

  const requestPreapproval = () => {
    const projName = projects.find(x => x.slug === projectSlug)?.name || '';
    onEnquire({
      type: 'emi',
      projectId: projectSlug || '',
      message: `EMI Pre-approval request\nProperty: ${projName || 'TBD'}\nPrice: ${fmtINR(price)}\nDown Payment: ${fmtINR(downPayment)} (${downPct}%)\nLoan: ${fmtINR(loanAmount)}\nTenure: ${tenure} yrs @ ${rate}%\nEstimated EMI: ${fmtINR(emi)}`,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white max-w-3xl w-full rounded-2xl shadow-2xl my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gillco-green text-white flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-xl md:text-2xl text-gillco-green leading-tight">Home Loan EMI Calculator</h3>
              <p className="text-xs text-slate-500">Estimate your monthly instalment · Powered by Gillco Group</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="w-9 h-9 rounded-full border border-slate-200 hover:bg-slate-50 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 grid md:grid-cols-2 gap-6">
          {/* Inputs */}
          <div className="space-y-5">
            {projects.length > 0 && (
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Pre-fill from Project (optional)</label>
                <select value={projectSlug} onChange={e => onPickProject(e.target.value)} className="w-full mt-1.5 px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white">
                  <option value="">— Choose a project —</option>
                  {projects.map(p => (
                    <option key={p.slug} value={p.slug}>{p.name} {p.priceRange ? `· ${p.priceRange}` : ''}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <div className="flex justify-between items-baseline">
                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Property Price</label>
                <span className="text-sm font-bold text-gillco-green">{fmtINR(price)}</span>
              </div>
              <input type="range" min="2500000" max="100000000" step="100000" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full accent-gillco-green mt-2" />
              <input type="number" value={price} onChange={e => setPrice(Math.max(0, Number(e.target.value) || 0))} className="w-full mt-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono" />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 uppercase tracking-wider"><span>₹25 L</span><span>₹10 Cr</span></div>
            </div>

            <div>
              <div className="flex justify-between items-baseline">
                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Down Payment</label>
                <span className="text-sm font-bold text-gillco-green">{downPct}% · {fmtINR(downPayment)}</span>
              </div>
              <input type="range" min="10" max="90" step="5" value={downPct} onChange={e => setDownPct(Number(e.target.value))} className="w-full accent-gillco-gold mt-2" />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 uppercase tracking-wider"><span>10%</span><span>90%</span></div>
            </div>

            <div>
              <div className="flex justify-between items-baseline">
                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Interest Rate (p.a.)</label>
                <span className="text-sm font-bold text-gillco-green">{rate.toFixed(2)}%</span>
              </div>
              <input type="range" min="6" max="12" step="0.05" value={rate} onChange={e => setRate(Number(e.target.value))} className="w-full accent-gillco-green mt-2" />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 uppercase tracking-wider"><span>6%</span><span>12%</span></div>
            </div>

            <div>
              <div className="flex justify-between items-baseline">
                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Loan Tenure</label>
                <span className="text-sm font-bold text-gillco-green">{tenure} yrs</span>
              </div>
              <input type="range" min="5" max="30" step="1" value={tenure} onChange={e => setTenure(Number(e.target.value))} className="w-full accent-gillco-gold mt-2" />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 uppercase tracking-wider"><span>5 yrs</span><span>30 yrs</span></div>
            </div>
          </div>

          {/* Outputs */}
          <div className="bg-gradient-to-br from-gillco-green to-gillco-green-dark rounded-xl p-6 text-white flex flex-col">
            <p className="text-[11px] uppercase tracking-widest text-gillco-gold font-semibold">Monthly EMI</p>
            <p className="font-serif text-4xl md:text-5xl font-semibold mt-1 leading-none">{fmtINR(emi)}</p>
            <p className="text-xs text-white/70 mt-1">per month for {tenure} years</p>

            <div className="h-px bg-white/15 my-5" />

            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><dt className="text-white/80">Loan Amount</dt><dd className="font-semibold">{fmtINR(loanAmount)}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-white/80">Down Payment</dt><dd className="font-semibold">{fmtINR(downPayment)}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-white/80">Total Interest</dt><dd className="font-semibold text-gillco-gold">{fmtINR(totalInterest)}</dd></div>
              <div className="flex items-center justify-between pt-2 border-t border-white/10"><dt className="text-white/80">Total Payable</dt><dd className="font-bold text-lg">{fmtINR(totalPayable + downPayment)}</dd></div>
            </dl>

            {/* Pie-ish split bar */}
            <div className="mt-6">
              <p className="text-[10px] uppercase tracking-widest text-gillco-gold mb-1.5">Principal vs Interest</p>
              <div className="h-2 w-full rounded-full overflow-hidden bg-white/15 flex">
                <div className="bg-white" style={{ width: `${(loanAmount / Math.max(1, totalPayable)) * 100}%` }} />
                <div className="bg-gillco-gold" style={{ width: `${(totalInterest / Math.max(1, totalPayable)) * 100}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-white/70 mt-1.5">
                <span>Principal {Math.round((loanAmount / Math.max(1, totalPayable)) * 100)}%</span>
                <span>Interest {Math.round((totalInterest / Math.max(1, totalPayable)) * 100)}%</span>
              </div>
            </div>

            <button
              onClick={requestPreapproval}
              className="mt-6 w-full py-3 rounded-full bg-gillco-gold text-slate-900 font-bold hover:brightness-110 transition inline-flex items-center justify-center gap-2 shadow-lg"
            >
              <Sparkles className="w-4 h-4" /> Get Pre-approval Help
            </button>
            <p className="text-[10px] text-white/60 mt-2 text-center">Indicative calculation. Rates vary by bank, profile and tenure.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoModal({ video, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm overflow-y-auto no-print flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-5xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-white">
            <p className="text-xs uppercase tracking-widest text-gillco-gold font-semibold">Gillco Group · Walkthrough</p>
            <h3 className="font-serif text-2xl mt-1">{video.title}</h3>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"><X className="w-5 h-5" /></button>
        </div>
        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black relative">
          {video.youtubeId ? (
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <img loading="lazy" decoding="async" src={safeImg(video.poster)} alt={video.title} className="w-full h-full object-cover opacity-60" />
              <div className="absolute text-center">
                <p className="text-lg">Video coming soon</p>
                <p className="text-sm text-white/60 mt-1">Contact us for a personalized walkthrough</p>
              </div>
            </div>
          )}
        </div>
        {video.youtubeId && (
          <div className="mt-3 flex justify-center">
            <a
              href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-gillco-gold transition"
            >
              <Youtube className="w-4 h-4 text-red-500" />
              If embed doesn't play, watch on YouTube <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================ ABOUT ============================ */
function AboutView({ settings }) {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        <p className="text-xs tracking-[0.3em] text-gillco-gold font-semibold uppercase text-center">Our Legacy</p>
        <h1 className="font-serif text-5xl md:text-6xl text-gillco-green text-center mt-3">About Gillco Group</h1>
        <div className="mt-6 text-center">
          <p className="font-serif text-6xl md:text-7xl text-gillco-gold font-semibold">25+ Years of Excellence</p>
          <p className="text-sm uppercase tracking-widest text-slate-600 mt-3">A quarter-century of building communities</p>
        </div>

        <div className="mt-12 prose prose-lg max-w-none text-slate-700">
          <p className="text-xl leading-relaxed">
            Gillco Group stands as a legacy of trust, disciplined growth, and enduring value, deeply rooted in the ethos of Punjab. Founded in <strong className="text-gillco-green">2001 by Mr. Ranjit Singh Gill and Mrs. Paramjit Gill</strong>, the Group was established with a clear vision — to unlock land potential and create integrated communities for modern India.
          </p>
          <p className="mt-6 leading-relaxed">
            Under the present leadership of <strong className="text-gillco-green">Mr. Tejpreet Singh Gill</strong>, Gillco has evolved into a diversified real estate enterprise, delivering residential and commercial developments defined by quality, reliability, thoughtful design, and long-term value creation for customers and partners — bolstering its position as a leader in North India's real estate landscape.
          </p>
        </div>

        {/* Milestones timeline */}
        <div className="mt-16">
          <h2 className="font-serif text-3xl text-gillco-green text-center mb-10">A Journey of Milestones</h2>
          <div className="relative border-l-2 border-gillco-gold ml-4 md:ml-0 md:mx-auto md:max-w-2xl space-y-8 pl-8">
            {[
              ['2001', 'Founded', 'Gillco Group founded by Mr. Ranjit Singh Gill and Mrs. Paramjit Gill in Punjab.'],
              ['2010', 'Gillco Villas', '200 duplex villas delivered in Gillco Valley — an early flagship community.'],
              ['2015', 'Gillco Parkhills', 'S+19 story high-rise launched on Airport Road, Mohali.'],
              ['2018', 'Industrial Foray', 'Gillco Industrial Park launched on Airport Road, Mohali.'],
              ['2024', 'Forbes Recognition', 'Tejpreet Singh Gill recognized in Forbes India Celebrity 100.'],
              ['2024', 'Meraqui Unveiled', 'Premium ultra-luxe residential development in Sector 126, Mohali.'],
              ['2026', '11M+ Sq. Ft.', 'Crosses 11 million sq. ft. developed with 1,577+ happy families.'],
            ].map(([year, title, desc], i) => (
              <div key={i} className="relative">
                <span className="absolute -left-[41px] top-1 w-4 h-4 rounded-full bg-gillco-gold ring-4 ring-white" />
                <div className="text-xs font-semibold text-gillco-gold tracking-widest">{year}</div>
                <h3 className="font-serif text-2xl text-gillco-green mt-1">{title}</h3>
                <p className="text-slate-600 mt-1">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="mt-20 grid md:grid-cols-3 gap-6">
          {[
            { icon: ShieldCheck, title: 'Trust', desc: 'Two decades of transparent dealings, RERA-compliant delivery, and long-term stakeholder value.' },
            { icon: Star, title: 'Quality', desc: 'Uncompromising build quality, thoughtful design, and premium materials in every project.' },
            { icon: Users, title: 'Community', desc: 'Every project is designed to nurture integrated, livable communities — not just buildings.' },
          ].map((v, i) => (
            <div key={i} className="p-8 rounded-2xl bg-gillco-cream border border-gillco-gold/20 text-center">
              <v.icon className="w-10 h-10 text-gillco-gold mx-auto mb-4" />
              <h3 className="font-serif text-2xl text-gillco-green">{v.title}</h3>
              <p className="text-slate-600 mt-2">{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================ TEAM ============================ */
function TeamView({ team }) {
  return (
    <section className="py-20 bg-gillco-cream min-h-screen">
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-xs tracking-[0.3em] text-gillco-gold font-semibold uppercase text-center">Leadership</p>
        <h1 className="font-serif text-5xl text-gillco-green text-center mt-3">Meet the Gill Family</h1>
        <p className="text-slate-600 text-center mt-3 max-w-2xl mx-auto">The visionaries steering Gillco Group's disciplined growth and community-first ethos.</p>
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          {team.map(m => (
            <div key={m.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition group">
              <div className="h-72 overflow-hidden bg-slate-100">
                <img loading="lazy" decoding="async" src={safeImg(m.photo)} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              </div>
              <div className="p-6">
                <h3 className="font-serif text-2xl text-gillco-green">{m.name}</h3>
                <p className="text-xs uppercase tracking-widest text-gillco-gold mt-1 font-semibold">{m.role}</p>
                <p className="text-sm text-slate-600 mt-4">{m.bio}</p>
                {m.linkedin && (
                  <a href={m.linkedin} className="mt-4 text-sm text-gillco-green inline-flex items-center gap-1 hover:gap-2 transition-all">
                    LinkedIn <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================ NEWS ============================ */
/* ============================ TESTIMONIALS CAROUSEL ============================ */
function TestimonialsCarousel({ testimonials = [], projects = [] }) {
  const [idx, setIdx] = useState(0);
  const items = Array.isArray(testimonials) ? testimonials : [];
  const count = items.length;

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIdx(i => (i + 1) % count), 7000);
    return () => clearInterval(t);
  }, [count]);

  if (count === 0) return null;

  const current = items[idx];
  const projectName = current.projectName || projects.find(p => p.id === current.projectId)?.name || '';
  const prev = () => setIdx((idx - 1 + count) % count);
  const next = () => setIdx((idx + 1) % count);

  return (
    <section className="py-16 md:py-20 bg-gillco-cream relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-gillco-gold/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gillco-green/5 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
      <div className="max-w-5xl mx-auto px-4 relative">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.3em] text-gillco-gold font-semibold uppercase">Our Family of Home-Owners</p>
          <h2 className="font-serif text-4xl md:text-5xl text-gillco-green mt-3">What Our Residents Say</h2>
        </div>

        <div className="relative">
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gillco-gold/20 relative">
            <span className="absolute -top-5 left-8 text-7xl font-serif text-gillco-gold leading-none select-none">“</span>
            <div className="flex items-start gap-6 flex-wrap">
              {current.photo ? (
                <img loading="lazy" decoding="async" src={safeImg(current.photo)} alt={current.name} className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover ring-4 ring-gillco-gold/30 shadow-md shrink-0" />
              ) : (
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gillco-green text-white flex items-center justify-center font-serif text-2xl shrink-0">
                  {(current.name || '?').charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: current.rating || 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-gillco-gold text-gillco-gold" />
                  ))}
                </div>
                <p className="text-slate-700 italic text-lg md:text-xl leading-relaxed">
                  {current.quote}
                </p>
                <div className="mt-4">
                  <div className="font-serif text-xl text-gillco-green">{current.name}</div>
                  <div className="text-sm text-slate-500">
                    {current.role}
                    {current.role && projectName && ' · '}
                    {projectName && <span className="text-gillco-gold font-semibold">{projectName}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {count > 1 && (
            <>
              <button onClick={prev} aria-label="Previous" className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 w-11 h-11 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center hover:bg-gillco-green hover:text-white transition z-10">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={next} aria-label="Next" className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 w-11 h-11 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center hover:bg-gillco-green hover:text-white transition z-10">
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-center gap-2 mt-6">
                {items.map((_, i) => (
                  <button
                    key={i}
                    aria-label={`Go to testimonial ${i + 1}`}
                    onClick={() => setIdx(i)}
                    className={`h-2 rounded-full transition-all ${i === idx ? 'bg-gillco-gold w-8' : 'bg-slate-300 w-2'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* ============================ FAQ ACCORDION ============================ */
const FAQ_LIST = [
  { q: 'Are all Gillco Group projects RERA approved?', a: 'Yes. Every Gillco project is registered under the Real Estate (Regulation and Development) Act, 2016. The RERA registration number is published on each project page. You can independently verify any project at rera.punjab.gov.in.' },
  { q: 'How are payments to Gillco Group made? Is cash accepted?', a: 'All payments must be made in the name of “Gillco Developers and Builders Private Limited” via account-payee cheque, demand draft, pay order or RTGS/NEFT. Cash is strictly NOT accepted for any booking, instalment or allotment. Official receipts are issued only by Gillco Group on company letterhead.' },
  { q: 'When does the price I was quoted get locked in?', a: 'The applicable rate is the one prevailing on the date your formal Application for Booking is received by Gillco Group — not the rate discussed at any earlier stage. Pricing shown here is indicative and may change at the Company’s sole discretion.' },
  { q: 'Can I take a home loan? Which banks are empanelled?', a: 'Yes. Gillco Group is empanelled with top banks and HFCs including SBI, HDFC, ICICI, LIC Housing Finance and Axis Bank. Our team helps you compare offers and complete pre-approval. Try our EMI calculator for an instant estimate.' },
  { q: 'What is the possession / handover timeline?', a: 'Each project has its own committed timeline mentioned in the Allotment Letter and on the project page. Current progress is also disclosed under “Latest RERA Status Updates” on the home page.' },
  { q: 'Can I cancel my booking? What is the refund policy?', a: 'Yes, bookings can be cancelled by submitting a written request to Gillco Group. Refunds are processed within 45–90 working days as per the signed Allotment Letter. Standard deductions apply (up to 10% of BSP + GST already deposited + non-refundable brokerage). Full details on our Cancellation & Refund Policy page.' },
  { q: 'Is NRI purchase allowed? How do NRIs pay?', a: 'Yes. NRIs and PIOs may purchase and remit funds through NRE/NRO/FCNR accounts in compliance with FEMA, 1999 and RBI regulations. We assist with the entire KYC + remittance paperwork.' },
  { q: 'What is included in the quoted price?', a: 'The quoted price is the Basic Sale Price (BSP). GST, stamp duty, registration, PLC (preferential location charges), floor rise, parking, maintenance deposits and any other statutory levies are charged additionally at prevailing rates on the date of payment.' },
  { q: 'Can I visit the construction site?', a: 'Absolutely. Site visits are encouraged — the best way to appreciate construction quality, specifications and the neighbourhood. Request a visit via the Enquire button, WhatsApp, or call us; we’ll arrange a convenient slot with pickup from a city landmark if needed.' },
  { q: 'Who should I contact if someone outside Gillco asks for payment?', a: 'No channel partner, sales agent or third party is authorised to receive payments on behalf of Gillco Group. If anyone asks for payment outside the official modes listed in our Payment Policy, please immediately report it to support@gillcogroup.org or call +91 90417 95879.' },
];

function FAQSection({ onEnquire }) {
  const [open, setOpen] = useState(0);
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_LIST.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
  return (
    <section className="py-16 md:py-20 bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.3em] text-gillco-gold font-semibold uppercase">Buyer Essentials</p>
          <h2 className="font-serif text-4xl md:text-5xl text-gillco-green mt-3">Frequently Asked Questions</h2>
          <p className="text-slate-500 mt-3">Everything you need to know about buying a Gillco home — RERA, payments, possession, loans and more.</p>
        </div>

        <div className="space-y-3">
          {FAQ_LIST.map((f, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className={`rounded-xl border transition-all ${isOpen ? 'border-gillco-gold shadow-md bg-gillco-cream' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-3"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif text-base md:text-lg text-gillco-green pr-4">{f.q}</span>
                  <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-gillco-gold text-slate-900 rotate-45' : 'bg-slate-100 text-slate-600'}`}>
                    <Plus className="w-4 h-4" />
                  </span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-slate-700 leading-relaxed text-sm md:text-base whitespace-pre-line">{f.a}</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <p className="text-slate-600 text-sm mb-3">Still have questions?</p>
          <button onClick={() => onEnquire({ type: 'faq' })} className="px-6 py-3 gradient-gold text-slate-900 rounded-full font-semibold hover:brightness-110 transition inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Ask Our Team
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------- News / Spotlight helpers ---------- */
// Simple markdown-ish renderer: **bold**, *italic*, [text](url), bullets with "- ", blank line = paragraph
function renderNewsBody(text, dark = false) {
  if (!text) return null;
  const paragraphs = String(text).split(/\n{2,}/);
  const nodes = [];
  paragraphs.forEach((para, pi) => {
    const lines = para.split('\n');
    const bullets = lines.every(l => /^\s*[-*]\s+/.test(l));
    const fmt = (s) => mdInline(s, `${dark ? 'text-amber-300' : 'text-emerald-700'} underline`);
    if (bullets && lines.length > 1) {
      nodes.push(
        <ul key={pi} className={`list-disc pl-5 space-y-1 my-3 ${dark ? 'text-white/80' : 'text-slate-700'}`}>
          {lines.map((l, li) => (
            <li key={li} dangerouslySetInnerHTML={{ __html: fmt(l.replace(/^\s*[-*]\s+/, '')) }} />
          ))}
        </ul>
      );
    } else {
      const html = para.split('\n').map(fmt).join('<br />');
      nodes.push(
        <p
          key={pi}
          className={`${dark ? 'text-white/85' : 'text-slate-700'} leading-relaxed mb-3 last:mb-0`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    }
  });
  return nodes;
}

// Returns true if the news item should still be shown publicly (not expired)
function isNewsActive(n) {
  if (!n.expiresAt) return true;
  try {
    return new Date(n.expiresAt).getTime() > Date.now();
  } catch { return true; }
}

// WhatsApp/FB/X/LinkedIn/Copy for a news item (links to the news section anchor + id)
function NewsShareBar({ item, dark = false }) {
  const [copied, setCopied] = useState(false);
  // Build a public shareable URL — points to the home with #news-<id> anchor so the viewer scrolls to it
  const base = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_SITE_URL || 'https://gillcogroup.org');
  const url = `${base}/#news-${item.id}`;
  const text = `${item.title}${item.body ? ' — ' + String(item.body).slice(0, 140).replace(/\n/g, ' ') : ''}`;
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { toast.info(url); }
  };
  const base_classes = `inline-flex items-center justify-center w-8 h-8 rounded-full text-white transition hover:scale-110`;
  return (
    <div className="flex items-center gap-1.5 mt-4">
      <span className={`text-[10px] uppercase tracking-widest font-semibold mr-1 ${dark ? 'text-white/60' : 'text-slate-500'}`}>Share</span>
      <a href={`https://wa.me/?text=${t}%20${u}`} target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp" title="WhatsApp" className={`${base_classes} bg-green-600 hover:bg-green-700`}><MessageCircle className="w-4 h-4" /></a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${u}`} target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook" title="Facebook" className={`${base_classes} bg-blue-600 hover:bg-blue-700`}><Facebook className="w-4 h-4" /></a>
      <a href={`https://twitter.com/intent/tweet?text=${t}&url=${u}`} target="_blank" rel="noopener noreferrer" aria-label="Share on X" title="X" className={`${base_classes} bg-slate-800 hover:bg-slate-900`}><Twitter className="w-4 h-4" /></a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`} target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn" title="LinkedIn" className={`${base_classes} bg-sky-700 hover:bg-sky-800`}><Linkedin className="w-4 h-4" /></a>
      <button onClick={copy} aria-label="Copy link" title="Copy link" className={`${base_classes} ${dark ? 'bg-white/15 hover:bg-white/25' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
        {copied ? <CheckCircle2 className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
      </button>
    </div>
  );
}

function NewsView({ news }) {
  const active = (news || []).filter(isNewsActive);
  return (
    <section className="py-20 bg-white min-h-screen">
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-xs tracking-[0.3em] text-gillco-gold font-semibold uppercase text-center">Corporate Spotlight</p>
        <h1 className="font-serif text-4xl md:text-5xl text-gillco-green text-center mt-3">News & Announcements</h1>
        <p className="text-center text-slate-500 mt-3 max-w-xl mx-auto">The latest updates, milestones and achievements from Gillco Group.</p>

        {active.length === 0 && (
          <p className="text-center text-slate-400 mt-16">No announcements yet.</p>
        )}

        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {active.map(n => (
            <article id={`news-${n.id}`} key={n.id} className="group bg-gillco-cream rounded-2xl border border-gillco-gold/20 overflow-hidden hover:shadow-xl transition flex flex-col scroll-mt-24">
              {n.image ? (
                <div className="aspect-[16/9] overflow-hidden bg-stone-100">
                  <img
                    loading="lazy"
                    decoding="async"
                    src={safeImg(n.image)}
                    alt={n.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                </div>
              ) : null}

              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs bg-gillco-green text-white px-2.5 py-1 rounded-full font-semibold">{n.category || 'Corporate'}</span>
                  {n.date && (
                    <span className="text-xs text-gillco-gold uppercase tracking-widest font-semibold">
                      {new Date(n.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
                <h2 className="font-serif text-xl md:text-2xl text-gillco-green mt-3 leading-snug">{n.title}</h2>
                {n.body && (
                  <div className="mt-3 text-sm md:text-base">{renderNewsBody(n.body)}</div>
                )}
                {n.link && (
                  <a href={n.link} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1 text-gillco-green font-semibold text-sm hover:text-gillco-gold">
                    Read more <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <div className="mt-auto">
                  <NewsShareBar item={n} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ============================ CONTACT ============================ */
function ContactView({ settings, onSubmit }) {
  return (
    <section className="py-20 bg-white min-h-screen">
      <div className="max-w-6xl mx-auto px-4">
        <p className="text-xs tracking-[0.3em] text-gillco-gold font-semibold uppercase text-center">Get in Touch</p>
        <h1 className="font-serif text-5xl text-gillco-green text-center mt-3">Contact Us</h1>
        <div className="grid lg:grid-cols-2 gap-12 mt-16">
          <div className="space-y-6">
            <div className="bg-gillco-cream rounded-2xl p-6 border border-gillco-gold/20">
              <MapPin className="w-8 h-8 text-gillco-gold mb-3" />
              <h3 className="font-serif text-2xl text-gillco-green">Corporate Office</h3>
              <p className="text-slate-700 mt-2">{settings?.address}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <a href={`tel:${settings?.phone?.replace(/\s/g, '')}`} className="bg-white p-5 rounded-xl border border-slate-200 hover:border-gillco-green transition group">
                <Phone className="w-6 h-6 text-gillco-gold mb-2" />
                <div className="text-xs text-slate-500 uppercase">Call</div>
                <div className="text-gillco-green font-semibold group-hover:underline">{settings?.phone}</div>
              </a>
              <a href={`mailto:${settings?.email}`} className="bg-white p-5 rounded-xl border border-slate-200 hover:border-gillco-green transition group">
                <Mail className="w-6 h-6 text-gillco-gold mb-2" />
                <div className="text-xs text-slate-500 uppercase">Email</div>
                <div className="text-gillco-green font-semibold group-hover:underline text-sm">{settings?.email}</div>
              </a>
            </div>
            <a href={`https://wa.me/${settings?.whatsapp}?text=Hi%20Gillco%20Group`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-5 bg-green-500 hover:bg-green-600 text-white rounded-xl transition">
              <MessageCircle className="w-6 h-6" />
              <div>
                <div className="text-xs uppercase tracking-wider opacity-90">WhatsApp</div>
                <div className="font-semibold">Chat with our sales team</div>
              </div>
              <ArrowRight className="w-5 h-5 ml-auto" />
            </a>

            {/* Map placeholder */}
            <div className="rounded-2xl overflow-hidden shadow border border-slate-200 aspect-video">
              <iframe
                title="Gillco Group Location"
                src="https://www.google.com/maps?q=Gillco+Group+Mohali+Airport+Road&output=embed"
                className="w-full h-full"
                loading="lazy"
              />
            </div>
          </div>

          <div className="bg-gillco-cream rounded-2xl p-8 border border-gillco-gold/20">
            <h3 className="font-serif text-3xl text-gillco-green">Fill the Form</h3>
            <p className="text-sm text-slate-600 mt-1">A relationship manager will reach out within 24 hours.</p>
            <button onClick={() => onSubmit({ type: 'contact-page' })} className="mt-6 w-full py-4 gradient-emerald text-white rounded-full font-semibold">
              Open Enquiry Form
            </button>
            <div className="mt-8 pt-8 border-t border-slate-200 space-y-3 text-sm">
              <p className="text-slate-600"><strong className="text-gillco-green">Sales:</strong> {settings?.phone}</p>
              <p className="text-slate-600"><strong className="text-gillco-green">Support:</strong> {settings?.email}</p>
              <p className="text-slate-600"><strong className="text-gillco-green">Hours:</strong> Mon–Sat, 10:00 AM – 7:00 PM</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================ ADMIN (CMS) ============================ */
function AdminView({ projects, setProjects, settings, setSettings, news, setNews, testimonials, setTestimonials }) {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [adminUser, setAdminUser] = useState('');
  const [username, setUsername] = useState('');
  const [pass, setPass] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Restore an existing session (httpOnly cookie) and react to expiry
  useEffect(() => {
    api('/admin/session').then(r => { setAuthed(!!r.authed); setAdminUser(r.user || ''); }).catch(() => {}).finally(() => setChecking(false));
    const onExpired = () => { setAuthed(prev => { if (prev) toast.error('Session expired — please log in again'); return false; }); };
    window.addEventListener('gillco:admin-logout', onExpired);
    return () => window.removeEventListener('gillco:admin-logout', onExpired);
  }, []);
  const logout = async () => {
    try { await api('/admin/logout', { method: 'POST' }); } catch {}
    setAuthed(false); setPass(''); setAdminUser('');
  };
  const [tab, setTab] = useState('projects');
  const [editing, setEditing] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [team, setTeam] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => { if (authed && tab === 'enquiries') api('/enquiries').then(setEnquiries).catch(() => {}); }, [authed, tab]);
  useEffect(() => { if (authed) api('/team').then(setTeam).catch(() => {}); }, [authed]);
  useEffect(() => { if (authed) api('/posts?all=1').then(setPosts).catch(() => {}); }, [authed]);

  const login = async (e) => {
    e.preventDefault();
    setLoginError(''); setLoggingIn(true);
    try {
      const r = await api('/admin/login', { method: 'POST', body: JSON.stringify({ username, password: pass }) });
      if (r.ok) { setAuthed(true); setAdminUser(r.user || username); setPass(''); toast.success('Welcome, admin'); }
    } catch (err) { setLoginError(err?.message || 'Wrong username or password'); }
    setLoggingIn(false);
  };

  const [backingUp, setBackingUp] = useState(false);
  const downloadBackup = async () => {
    setBackingUp(true);
    try {
      const res = await fetch('/api/admin/backup', { cache: 'no-store' });
      if (res.status === 401) { window.dispatchEvent(new Event('gillco:admin-logout')); throw new Error('Session expired — please log in again'); }
      if (!res.ok) throw new Error('Backup failed');
      const blob = await res.blob();
      const name = (res.headers.get('content-disposition') || '').match(/filename="([^"]+)"/)?.[1] || `gillco-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.success(`Backup downloaded (${(blob.size / 1024).toFixed(0)} KB) — keep it somewhere safe`);
    } catch (e) { toast.error(e?.message || 'Backup failed'); }
    setBackingUp(false);
  };

  const [restoreFile, setRestoreFile] = useState(null); // { name, data }
  const [restoreConfirm, setRestoreConfirm] = useState('');
  const [restoring, setRestoring] = useState(false);
  const restoreInputRef = useRef(null);
  const pickRestoreFile = async (file) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (data?.app !== 'gillco-group' || !data?.collections) throw new Error('This is not a Gillco backup file');
      setRestoreFile({ name: file.name, data });
      setRestoreConfirm('');
    } catch (e) { toast.error(e?.message?.includes('JSON') ? 'File is not a valid backup (.json)' : (e?.message || 'Could not read file')); }
    if (restoreInputRef.current) restoreInputRef.current.value = '';
  };
  const runRestore = async () => {
    if (!restoreFile) return;
    setRestoring(true);
    try {
      // Safety first: download a copy of the CURRENT data before replacing it
      await downloadBackup();
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(restoreFile.data),
      });
      const r = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(r.error || 'Restore failed');
      const total = Object.values(r.restored || {}).reduce((a, b) => a + b, 0);
      if (r.ok) toast.success(`Restored ${total} records — reloading…`);
      else toast.error(`Partly restored. Failed: ${Object.keys(r.failed || {}).join(', ')}`);
      setRestoreFile(null);
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) { toast.error(e?.message || 'Restore failed'); }
    setRestoring(false);
  };

  // ---- Import live data from MongoDB Atlas into the current (MySQL) database
  const [importOpen, setImportOpen] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importDb, setImportDb] = useState('');
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importConfirm, setImportConfirm] = useState('');
  const runImport = async (dryRun) => {
    setImportBusy(true); if (dryRun) setImportResult(null);
    try {
      if (!dryRun) await downloadBackup(); // safety copy of what is in MySQL now
      const r = await api('/admin/import-mongo', { method: 'POST', body: JSON.stringify({ mongoUrl: importUrl.trim(), dbName: importDb.trim(), dryRun }) });
      setImportResult(r);
      if (!dryRun) {
        if (r.ok) { toast.success('Live data imported — reloading…'); setTimeout(() => window.location.reload(), 2500); }
        else toast.error('Import finished with problems — see the list');
      }
    } catch (e) { toast.error(e?.message || 'Import failed'); }
    setImportBusy(false);
  };

  const saveProject = async (p) => {
    try {
      const updated = await api(`/projects/${p.id}`, { method: 'PUT', body: JSON.stringify(p) });
      setProjects(prev => prev.map(x => x.id === updated.id ? updated : x));
      setEditing(null);
      toast.success('Project updated');
    } catch { toast.error('Save failed'); }
  };

  const createProject = async () => {
    const doc = { name: 'New Project', slug: `new-${Date.now()}`, status: 'upcoming', category: 'residential', location: '', reraNumber: '', reraStatus: '', reraUpdatedAt: new Date().toISOString().slice(0, 10), constructionPercent: 0, launchDate: '', handoverDate: '', priceRange: 'On Request', unitMix: '', acres: 0, towers: 0, units: 0, heroImage: '', gallery: [], summary: '', amenities: [], milestones: [], tagline: '', brochureUrl: '' };
    const created = await api('/projects', { method: 'POST', body: JSON.stringify(doc) });
    setProjects(prev => [created, ...prev]);
    setEditing(created);
  };

  const deleteProject = async (id) => {
    if (!confirm('Delete this project? This cannot be undone.')) return;
    await api(`/projects/${id}`, { method: 'DELETE' });
    setProjects(prev => prev.filter(x => x.id !== id));
    toast.success('Deleted');
  };

  const saveSettings = async (s) => {
    try {
      const updated = await api('/settings', { method: 'PUT', body: JSON.stringify(s) });
      setSettings(updated);
      toast.success('Settings saved');
    } catch { toast.error('Save failed'); }
  };

  // ---- Forgot / reset password
  const [authMode, setAuthMode] = useState('login'); // login | forgot | reset
  const [forgotEmail, setForgotEmail] = useState('');
  const [authMsg, setAuthMsg] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [resetValid, setResetValid] = useState(null);
  const [newPass, setNewPass] = useState('');
  const [newPass2, setNewPass2] = useState('');
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('admin-reset');
    if (!t) return;
    setResetToken(t); setAuthMode('reset');
    api(`/admin/reset/check?token=${encodeURIComponent(t)}`).then(r => setResetValid(!!r.valid)).catch(() => setResetValid(false));
  }, []);
  const clearResetUrl = () => { const u = new URL(window.location.href); u.searchParams.delete('admin-reset'); window.history.replaceState({}, '', u.pathname + u.search + u.hash); };
  const requestReset = async (e) => {
    e.preventDefault(); setAuthBusy(true); setAuthMsg(''); setLoginError('');
    try { const r = await api('/admin/forgot', { method: 'POST', body: JSON.stringify({ email: forgotEmail }) }); setAuthMsg(r.message || 'Check your inbox.'); }
    catch (err) { setLoginError(err?.message || 'Could not send the reset email'); }
    setAuthBusy(false);
  };
  const submitReset = async (e) => {
    e.preventDefault(); setLoginError('');
    if (newPass !== newPass2) { setLoginError('The two passwords do not match'); return; }
    setAuthBusy(true);
    try {
      const r = await api('/admin/reset', { method: 'POST', body: JSON.stringify({ token: resetToken, password: newPass }) });
      clearResetUrl(); setAuthMode('login'); setNewPass(''); setNewPass2(''); setAuthMsg(r.message || 'Password changed. Please log in.');
      toast.success('Password changed');
    } catch (err) { setLoginError(err?.message || 'Could not change the password'); }
    setAuthBusy(false);
  };

  if (!authed && checking) {
    return <section className="py-24 bg-gillco-cream min-h-screen flex items-center justify-center text-slate-500 text-sm">Checking session…</section>;
  }
  if (!authed) {
    return (
      <section className="py-24 bg-gillco-cream min-h-screen">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow border border-gillco-gold/20">
            <ShieldCheck className="w-10 h-10 text-gillco-gold mx-auto" />
            <h1 className="font-serif text-3xl text-gillco-green text-center mt-4">Admin Login</h1>
            <p className="text-center text-sm text-slate-500 mt-2">Content management for Gillco Group.</p>
            {authMode === 'reset' ? (
              <form onSubmit={submitReset} className="mt-6 space-y-3" data-testid="admin-reset-form">
                <p className="text-sm font-semibold text-gillco-green text-center">Set a new password</p>
                {resetValid === false ? (
                  <p className="text-sm text-red-600 text-center" data-testid="reset-invalid">This reset link is invalid, already used or expired.</p>
                ) : (
                  <>
                    <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password (10+ characters, letters & numbers)" autoComplete="new-password" required minLength={10} data-testid="reset-new-password" className="w-full px-4 py-3 border border-slate-200 rounded-lg" />
                    <input type="password" value={newPass2} onChange={e => setNewPass2(e.target.value)} placeholder="Repeat new password" autoComplete="new-password" required data-testid="reset-new-password-2" className="w-full px-4 py-3 border border-slate-200 rounded-lg" />
                  </>
                )}
                {loginError && <p className="text-sm text-red-600 text-center" data-testid="admin-login-error">{loginError}</p>}
                {resetValid !== false && <button disabled={authBusy || resetValid === null} data-testid="reset-submit-btn" className="w-full py-3 gradient-emerald text-white rounded-full font-semibold disabled:opacity-60">{authBusy ? 'Saving…' : 'Save new password'}</button>}
                <button type="button" onClick={() => { clearResetUrl(); setAuthMode(resetValid === false ? 'forgot' : 'login'); setLoginError(''); }} className="w-full text-xs text-slate-500 hover:text-gillco-green">{resetValid === false ? 'Request a new link' : 'Back to login'}</button>
              </form>
            ) : authMode === 'forgot' ? (
              <form onSubmit={requestReset} className="mt-6 space-y-3" data-testid="admin-forgot-form">
                <p className="text-sm text-slate-600 text-center">Enter the admin email. We'll send a reset link (valid 30 minutes).</p>
                <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="support@gillcogroup.org" autoComplete="email" required data-testid="forgot-email" className="w-full px-4 py-3 border border-slate-200 rounded-lg" />
                {authMsg && <p className="text-sm text-emerald-700 text-center" data-testid="forgot-message">{authMsg}</p>}
                {loginError && <p className="text-sm text-red-600 text-center" data-testid="admin-login-error">{loginError}</p>}
                <button disabled={authBusy} data-testid="forgot-submit-btn" className="w-full py-3 gradient-emerald text-white rounded-full font-semibold disabled:opacity-60">{authBusy ? 'Sending…' : 'Send reset link'}</button>
                <button type="button" onClick={() => { setAuthMode('login'); setAuthMsg(''); setLoginError(''); }} className="w-full text-xs text-slate-500 hover:text-gillco-green">Back to login</button>
              </form>
            ) : (
            <form onSubmit={login} className="mt-6 space-y-3">
              {authMsg && <p className="text-sm text-emerald-700 text-center" data-testid="auth-message">{authMsg}</p>}
              <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Email or username" autoComplete="username" required data-testid="admin-username" className="w-full px-4 py-3 border border-slate-200 rounded-lg" />
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Password" autoComplete="current-password" required data-testid="admin-password" className="w-full px-4 py-3 border border-slate-200 rounded-lg" />
              {loginError && <p className="text-sm text-red-600 text-center" data-testid="admin-login-error">{loginError}</p>}
              <button disabled={loggingIn} data-testid="admin-login-btn" className="w-full py-3 gradient-emerald text-white rounded-full font-semibold inline-flex items-center justify-center gap-2 disabled:opacity-60"><LogIn className="w-4 h-4" /> {loggingIn ? 'Signing in…' : 'Sign In'}</button>
              <button type="button" onClick={() => { setAuthMode('forgot'); setLoginError(''); setAuthMsg(''); }} data-testid="forgot-link" className="w-full text-xs text-slate-500 hover:text-gillco-green">Forgot password?</button>
            </form>
            )}
          </div>
        </div>
      </section>
    );
  }

  const tabs = [
    { id: 'projects', label: 'Projects' },
    { id: 'hero', label: 'Hero Slides' },
    { id: 'videos', label: 'Videos' },
    { id: 'news', label: 'News' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'posts', label: 'Blog / Social' },
    { id: 'team', label: 'Team' },
    { id: 'settings', label: 'Site & Brand' },
    { id: 'enquiries', label: 'Enquiries' },
    { id: 'history', label: 'History' },
  ];

  return (
    <section className="py-12 bg-gillco-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="font-serif text-4xl text-gillco-green">Content Manager</h1>
            <p className="text-sm text-slate-500">Edit every piece of content on the site — no code needed.</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={downloadBackup} disabled={backingUp} data-testid="admin-backup-btn" title="Downloads a full copy of all projects, enquiries, settings, team, news, posts and testimonials" className="px-4 py-2 bg-gillco-green text-white rounded-full text-sm inline-flex items-center gap-2 hover:bg-gillco-green-dark disabled:opacity-60">
              <Download className="w-4 h-4" /> {backingUp ? 'Preparing…' : 'Download Backup'}
            </button>
            <input ref={restoreInputRef} type="file" accept="application/json,.json" className="hidden" data-testid="admin-restore-input" onChange={e => pickRestoreFile(e.target.files?.[0])} />
            <button onClick={() => restoreInputRef.current?.click()} data-testid="admin-restore-btn" className="px-4 py-2 border border-gillco-green text-gillco-green rounded-full text-sm inline-flex items-center gap-2 hover:bg-white">
              <Clock className="w-4 h-4" /> Restore Backup
            </button>
            <button onClick={() => { setImportOpen(true); setImportResult(null); setImportConfirm(''); }} data-testid="admin-import-btn" className="px-4 py-2 border border-gillco-green text-gillco-green rounded-full text-sm inline-flex items-center gap-2 hover:bg-white">
              <Download className="w-4 h-4 rotate-180" /> Import from MongoDB
            </button>
            <button onClick={logout} data-testid="admin-logout-btn" title={adminUser ? `Signed in as ${adminUser}` : undefined} className="px-4 py-2 border border-slate-300 rounded-full text-sm inline-flex items-center gap-2"><LogOut className="w-4 h-4" /> Logout</button>
          </div>
        </div>

        {importOpen && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" data-testid="import-modal">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="font-serif text-2xl text-gillco-green">Import live data from MongoDB</h3>
              <p className="text-sm text-slate-600 mt-1">Copies all projects, leads, settings, blog, team, testimonials, history <b>and uploaded images/PDFs</b> from MongoDB Atlas into this site's database. The link is used once and is not saved.</p>
              <label className="block text-xs text-slate-500 mt-4">MongoDB Atlas connection link</label>
              <input value={importUrl} onChange={e => setImportUrl(e.target.value)} placeholder="mongodb+srv://user:password@cluster0.xxxx.mongodb.net/" data-testid="import-url" autoComplete="off" className="w-full mt-1 px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-gillco-green text-sm" />
              <label className="block text-xs text-slate-500 mt-3">Database name (Atlas → Browse Collections)</label>
              <input value={importDb} onChange={e => setImportDb(e.target.value)} placeholder="gillco" data-testid="import-db" autoComplete="off" className="w-full mt-1 px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-gillco-green text-sm" />
              {importResult && (
                <div className="mt-4 text-sm" data-testid="import-result">
                  <p className="font-semibold text-gillco-green mb-2">{importResult.dryRun ? 'Found in MongoDB:' : (importResult.ok ? 'Imported successfully:' : 'Imported with problems:')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(importResult.collections || {}).map(([k, v]) => (
                      <div key={k} className="flex justify-between bg-gillco-cream rounded-lg px-3 py-1.5"><span className="capitalize">{k}</span><b>{importResult.dryRun ? v.source : `${v.copied}/${v.source}`}</b></div>
                    ))}
                    <div className="flex justify-between bg-gillco-cream rounded-lg px-3 py-1.5"><span>Images &amp; files</span><b>{importResult.dryRun ? importResult.media?.source : `${importResult.media?.copied}/${importResult.media?.source}`}</b></div>
                  </div>
                  {importResult.media?.failed?.length > 0 && <p className="text-xs text-red-600 mt-2">{importResult.media.failed.slice(0, 3).join(' · ')}</p>}
                </div>
              )}
              {importResult?.dryRun && (
                <>
                  <div className="mt-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg p-3">Everything currently in this site's database will be <b>replaced</b> by the data above. A backup of the current data downloads first.</div>
                  <label className="block text-xs text-slate-500 mt-3">Type <b>IMPORT</b> to confirm</label>
                  <input value={importConfirm} onChange={e => setImportConfirm(e.target.value)} data-testid="import-confirm-input" className="w-full mt-1 px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-gillco-green" />
                </>
              )}
              <div className="mt-5 flex justify-end gap-2 flex-wrap">
                <button onClick={() => setImportOpen(false)} disabled={importBusy} className="px-4 py-2 border border-slate-300 rounded-full text-sm">Close</button>
                <button onClick={() => runImport(true)} disabled={importBusy || !importUrl || !importDb} data-testid="import-check-btn" className="px-4 py-2 border border-gillco-green text-gillco-green rounded-full text-sm font-semibold disabled:opacity-40">{importBusy && !importResult?.dryRun ? 'Checking…' : '1. Check'}</button>
                <button onClick={() => runImport(false)} disabled={importBusy || !importResult?.dryRun || importConfirm.trim().toUpperCase() !== 'IMPORT'} data-testid="import-run-btn" className="px-5 py-2 bg-red-600 text-white rounded-full text-sm font-semibold disabled:opacity-40">{importBusy && importResult?.dryRun ? 'Importing…' : '2. Import now'}</button>
              </div>
            </div>
          </div>
        )}

        {restoreFile && (
          <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" data-testid="restore-modal">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
              <h3 className="font-serif text-2xl text-gillco-green">Restore from backup?</h3>
              <p className="text-sm text-slate-600 mt-1">File: <b>{restoreFile.name}</b>{restoreFile.data.createdAt && <> · made on <b>{new Date(restoreFile.data.createdAt).toLocaleString('en-IN')}</b></>}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {Object.entries(restoreFile.data.collections || {}).filter(([, v]) => Array.isArray(v)).map(([k, v]) => (
                  <div key={k} className="flex justify-between bg-gillco-cream rounded-lg px-3 py-1.5"><span className="capitalize">{k}</span><b>{v.length}</b></div>
                ))}
              </div>
              <div className="mt-4 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg p-3">
                Everything currently on the site in these sections will be <b>replaced</b> with the backup. A copy of the current data downloads automatically first, so you can undo this.
              </div>
              <label className="block text-xs text-slate-500 mt-4">Type <b>RESTORE</b> to confirm</label>
              <input value={restoreConfirm} onChange={e => setRestoreConfirm(e.target.value)} data-testid="restore-confirm-input" className="w-full mt-1 px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:border-gillco-green" />
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setRestoreFile(null)} disabled={restoring} className="px-4 py-2 border border-slate-300 rounded-full text-sm">Cancel</button>
                <button onClick={runRestore} disabled={restoreConfirm.trim().toUpperCase() !== 'RESTORE' || restoring} data-testid="restore-confirm-btn" className="px-5 py-2 bg-red-600 text-white rounded-full text-sm font-semibold disabled:opacity-40">
                  {restoring ? 'Restoring…' : 'Restore now'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-5 py-2 rounded-full text-sm font-medium ${tab === t.id ? 'bg-gillco-green text-white' : 'bg-white text-slate-700 border border-slate-200'}`}>{t.label}</button>
          ))}
        </div>

        {tab === 'projects' && (
          <div>
            <div className="flex justify-end mb-3">
              <button onClick={createProject} className="px-4 py-2 gradient-gold text-slate-900 rounded-full text-sm font-semibold inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add Project</button>
            </div>
            <div className="space-y-3">
              {projects.map(p => (
                <div key={p.id} className="bg-white rounded-xl p-4 border border-slate-100 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                    <img loading="lazy" decoding="async" src={safeImg(p.heroImage)} className="w-20 h-16 object-cover rounded" alt="" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {p.logo && <img loading="lazy" decoding="async" src={safeImg(p.logo)} alt="" className="w-6 h-6 object-contain rounded border border-slate-100 bg-white p-0.5 shrink-0" />}
                        <div className="font-serif text-xl text-gillco-green truncate">{p.name}</div>
                      </div>
                      <div className="text-xs text-slate-500">{p.location} · {p.reraNumber}</div>
                      <div className="text-xs mt-1"><span className={`px-2 py-0.5 rounded-full text-white text-[10px] ${STATUS_MAP[p.status]?.color || 'bg-slate-400'}`}>{STATUS_MAP[p.status]?.label || p.status}</span></div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditing(p)} className="px-4 py-2 bg-gillco-green text-white rounded-full text-sm inline-flex items-center gap-2"><Edit3 className="w-3 h-3" /> Edit</button>
                    <button onClick={() => deleteProject(p.id)} className="px-3 py-2 border border-red-300 text-red-600 rounded-full text-sm inline-flex items-center gap-1"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'hero' && settings && (
          <HeroSlidesEditor settings={settings} onSave={saveSettings} />
        )}
        {tab === 'videos' && settings && (
          <VideosEditor settings={settings} onSave={saveSettings} />
        )}
        {tab === 'news' && (
          <NewsEditor news={news} setNews={setNews} />
        )}
        {tab === 'testimonials' && (
          <TestimonialsEditor testimonials={testimonials} setTestimonials={setTestimonials} projects={projects} />
        )}
        {tab === 'posts' && (
          <PostsEditor posts={posts} setPosts={setPosts} />
        )}
        {tab === 'team' && (
          <TeamEditor team={team} setTeam={setTeam} />
        )}
        {tab === 'settings' && settings && (
          <SettingsEditor settings={settings} onSave={saveSettings} />
        )}
        {tab === 'history' && (
          <HistoryPanel onRestore={async () => {
            // Reload everything after undo
            const [s, p, n, t] = await Promise.all([
              api('/settings'), api('/projects'), api('/news'), api('/team'),
            ]);
            setSettings(s); setProjects(p); setNews(n); setTeam(t);
          }} />
        )}
        {tab === 'enquiries' && (
          <EnquiriesPanel settings={settings} />
        )}

        {editing && <ProjectEditor project={editing} onSave={saveProject} onClose={() => setEditing(null)} />}
      </div>
    </section>
  );
}

/* ---------- Sub-editors ---------- */
function HeroSlidesEditor({ settings, onSave }) {
  const [slides, setSlides] = useState(settings.hero?.slides || []);
  const [headline, setHeadline] = useState(settings.hero?.headline || '');
  const [subline, setSubline] = useState(settings.hero?.subline || '');

  const update = (i, k, v) => setSlides(prev => prev.map((s, idx) => idx === i ? { ...s, [k]: v } : s));
  const remove = (i) => setSlides(prev => prev.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const arr = [...slides]; const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    setSlides(arr);
  };
  const add = () => setSlides(prev => [...prev, { image: '', title: 'New Slide', subtitle: '' }]);
  const save = () => onSave({ ...settings, hero: { ...(settings.hero || {}), headline, subline, slides } });

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-serif text-2xl text-gillco-green">Hero Slideshow</h3>
        <div className="flex gap-2">
          <button onClick={add} className="px-4 py-2 border border-slate-300 rounded-full text-sm inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add Slide</button>
          <button onClick={save} className="px-5 py-2 gradient-emerald text-white rounded-full text-sm font-semibold inline-flex items-center gap-2"><Save className="w-4 h-4" /> Save Hero</button>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Hero Headline (use \n for line break)" value={headline} onChange={setHeadline} />
        <Field label="Hero Subline" value={subline} onChange={setSubline} />
      </div>
      <div className="space-y-3">
        {slides.map((s, i) => (
          <div key={i} className="border border-slate-200 rounded-xl p-4 flex gap-4 items-start flex-wrap">
            <div className="w-56 shrink-0">
              <MediaUploader label={`Slide ${i + 1} Image`} value={s.image} onChange={v => update(i, 'image', v)} accept="image/*" />
            </div>
            <div className="flex-1 grid md:grid-cols-2 gap-3 min-w-[300px]">
              <Field label="Title" value={s.title} onChange={v => update(i, 'title', v)} />
              <Field label="Subtitle" value={s.subtitle} onChange={v => update(i, 'subtitle', v)} />
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={() => move(i, -1)} className="w-8 h-8 border border-slate-200 rounded" title="Up">↑</button>
              <button onClick={() => move(i, 1)} className="w-8 h-8 border border-slate-200 rounded" title="Down">↓</button>
              <button onClick={() => remove(i)} className="w-8 h-8 border border-red-200 text-red-600 rounded" title="Remove"><Trash2 className="w-3 h-3 mx-auto" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VideosEditor({ settings, onSave }) {
  const [videos, setVideos] = useState(settings.videos || []);
  const update = (i, k, v) => setVideos(prev => prev.map((x, idx) => idx === i ? { ...x, [k]: v } : x));
  const add = () => setVideos(prev => [...prev, { id: `v${Date.now()}`, title: 'New Video', poster: '', youtubeId: '' }]);
  const remove = (i) => setVideos(prev => prev.filter((_, idx) => idx !== i));
  const save = () => onSave({ ...settings, videos });
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-serif text-2xl text-gillco-green">Video Walkthroughs</h3>
        <div className="flex gap-2">
          <button onClick={add} className="px-4 py-2 border border-slate-300 rounded-full text-sm inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add Video</button>
          <button onClick={save} className="px-5 py-2 gradient-emerald text-white rounded-full text-sm font-semibold inline-flex items-center gap-2"><Save className="w-4 h-4" /> Save</button>
        </div>
      </div>
      <div className="space-y-3">
        {videos.map((v, i) => (
          <div key={i} className="border border-slate-200 rounded-xl p-4 flex gap-4 items-start flex-wrap">
            <div className="w-56 shrink-0">
              <MediaUploader label="Poster" value={v.poster} onChange={x => update(i, 'poster', x)} accept="image/*" />
            </div>
            <div className="flex-1 grid md:grid-cols-2 gap-3 min-w-[300px]">
              <Field label="Title" value={v.title} onChange={x => update(i, 'title', x)} />
              <Field label="YouTube Video ID (e.g. dQw4w9WgXcQ)" value={v.youtubeId} onChange={x => update(i, 'youtubeId', x)} />
            </div>
            <button onClick={() => remove(i)} className="w-8 h-8 border border-red-200 text-red-600 rounded"><Trash2 className="w-3 h-3 mx-auto" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsEditor({ news, setNews }) {
  const [editing, setEditing] = useState(null);
  const save = async (n) => {
    if (n.id && news.find(x => x.id === n.id)) {
      const upd = await api(`/news/${n.id}`, { method: 'PUT', body: JSON.stringify(n) });
      setNews(prev => prev.map(x => x.id === upd.id ? upd : x).sort((a, b) => (b.date || '').localeCompare(a.date || '')));
    } else {
      const created = await api('/news', { method: 'POST', body: JSON.stringify(n) });
      setNews(prev => [created, ...prev].sort((a, b) => (b.date || '').localeCompare(a.date || '')));
    }
    setEditing(null);
    toast.success('Saved');
  };
  const del = async (id) => {
    if (!confirm('Delete this news item?')) return;
    await api(`/news/${id}`, { method: 'DELETE' });
    setNews(prev => prev.filter(x => x.id !== id));
  };
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-serif text-2xl text-gillco-green">News & Announcements</h3>
          <p className="text-xs text-slate-500 mt-1">Corporate spotlight shown on the Spotlight page. Add an image, headline, short description and optional external link.</p>
        </div>
        <button onClick={() => setEditing({ date: new Date().toISOString().slice(0, 10), title: '', category: 'Corporate', image: '', body: '', link: '' })} className="px-4 py-2 gradient-gold text-slate-900 rounded-full text-sm font-semibold inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add News</button>
      </div>
      <div className="space-y-2">
        {news.map(n => (
          <div key={n.id} className="border border-slate-100 rounded-lg p-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-1 min-w-[220px]">
              {n.image ? (
                <img loading="lazy" decoding="async" src={safeImg(n.image)} alt="" className="w-16 h-12 rounded object-cover" />
              ) : (
                <div className="w-16 h-12 rounded bg-gillco-green/10 flex items-center justify-center text-gillco-green text-xs font-serif">G</div>
              )}
              <div className="flex-1">
                <div className="text-xs text-gillco-gold flex items-center gap-2 flex-wrap">
                  <span>{n.date ? new Date(n.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''} · {n.category}</span>
                  {n.expiresAt && (
                    isNewsActive(n)
                      ? <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">Expires {new Date(n.expiresAt).toLocaleDateString('en-IN')}</span>
                      : <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">Expired · Hidden</span>
                  )}
                </div>
                <div className="text-sm text-slate-800 font-medium">{n.title}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(n)} className="px-3 py-1.5 bg-gillco-green text-white text-xs rounded-full inline-flex gap-1 items-center"><Edit3 className="w-3 h-3" /> Edit</button>
              <button onClick={() => del(n.id)} className="px-3 py-1.5 border border-red-300 text-red-600 text-xs rounded-full"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-xl w-full rounded-2xl p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-serif text-xl text-gillco-green">{editing.id ? 'Edit' : 'New'} Announcement</h4>
              <button onClick={() => setEditing(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date" value={editing.date} onChange={v => setEditing({ ...editing, date: v })} />
                <div>
                  <label className="text-xs text-slate-500 uppercase">Category</label>
                  <select value={editing.category || 'Corporate'} onChange={e => setEditing({ ...editing, category: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg">
                    <option>Corporate</option>
                    <option>Launch</option>
                    <option>Award</option>
                    <option>Milestone</option>
                    <option>Press</option>
                    <option>Event</option>
                    <option>Project Update</option>
                  </select>
                </div>
              </div>
              <MediaUploader label="Image (optional, recommended 1200×675)" value={editing.image} onChange={v => setEditing({ ...editing, image: v })} accept="image/*" hint="Shown on the Spotlight page card" />
              <div>
                <label className="text-xs text-slate-500 uppercase">Headline</label>
                <textarea rows={2} value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg resize-none" placeholder="e.g. Meraqui launches priority booking at Sector 126, Mohali" />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-500 uppercase">Short Description (rich text)</label>
                  <div className="flex items-center gap-1 text-[10px]">
                    <button type="button" onClick={() => setEditing({ ...editing, body: (editing.body || '') + '**bold text**' })} className="px-2 py-0.5 border border-slate-200 rounded font-bold hover:bg-slate-50" title="Bold">B</button>
                    <button type="button" onClick={() => setEditing({ ...editing, body: (editing.body || '') + '*italic text*' })} className="px-2 py-0.5 border border-slate-200 rounded italic hover:bg-slate-50" title="Italic">I</button>
                    <button type="button" onClick={() => setEditing({ ...editing, body: (editing.body || '') + '\n- bullet point 1\n- bullet point 2\n- bullet point 3' })} className="px-2 py-0.5 border border-slate-200 rounded hover:bg-slate-50" title="Bullet list">• List</button>
                    <button type="button" onClick={() => setEditing({ ...editing, body: (editing.body || '') + '[link text](https://example.com)' })} className="px-2 py-0.5 border border-slate-200 rounded hover:bg-slate-50" title="Link">🔗</button>
                  </div>
                </div>
                <textarea rows={6} value={editing.body || ''} onChange={e => setEditing({ ...editing, body: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg resize-none font-mono text-sm" placeholder="Write the announcement body. Supports:
**bold**, *italic*, [link](https://url.com)
Use blank lines for paragraphs.
- Use dash for bullet points
- Each dash on its own line" />
                <p className="text-[10px] text-slate-400 mt-1">Supports <code>**bold**</code>, <code>*italic*</code>, <code>[link](url)</code>, and bullet points with <code>- </code>. Blank line = new paragraph.</p>
              </div>
              <Field label="External Link (optional)" value={editing.link || ''} onChange={v => setEditing({ ...editing, link: v })} />
              <div>
                <label className="text-xs text-slate-500 uppercase">Auto-Expire Date (optional) — hide after this date</label>
                <input type="date" value={typeof editing.expiresAt === 'string' ? editing.expiresAt.slice(0, 10) : ''} onChange={e => setEditing({ ...editing, expiresAt: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg" />
                <p className="text-[10px] text-slate-400 mt-1">Leave blank to show forever. Expired items still visible in admin for editing.</p>
              </div>
              <button onClick={() => save(editing)} className="w-full py-2.5 gradient-emerald text-white rounded-full font-semibold"><Save className="w-4 h-4 inline mr-1" /> Save Announcement</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TestimonialsEditor({ testimonials, setTestimonials, projects = [] }) {
  const [editing, setEditing] = useState(null);
  const save = async (t) => {
    try {
      if (t.id && testimonials.find(x => x.id === t.id)) {
        const upd = await api(`/testimonials/${t.id}`, { method: 'PUT', body: JSON.stringify(t) });
        setTestimonials(prev => prev.map(x => x.id === upd.id ? upd : x));
      } else {
        const created = await api('/testimonials', { method: 'POST', body: JSON.stringify(t) });
        setTestimonials(prev => [created, ...prev]);
      }
      setEditing(null);
      toast.success('Saved');
    } catch (e) { toast.error(e.message || 'Save failed'); }
  };
  const del = async (id) => {
    if (!confirm('Delete this testimonial?')) return;
    await api(`/testimonials/${id}`, { method: 'DELETE' });
    setTestimonials(prev => prev.filter(x => x.id !== id));
  };
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-serif text-2xl text-gillco-green">Buyer Testimonials</h3>
          <p className="text-xs text-slate-500 mt-1">Rotating carousel on the home page. Add real quotes from happy home-owners for social proof.</p>
        </div>
        <button onClick={() => setEditing({ name: '', role: 'Resident', photo: '', projectId: '', quote: '', rating: 5, published: true })} className="px-4 py-2 gradient-gold text-slate-900 rounded-full text-sm font-semibold inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add Testimonial</button>
      </div>
      {testimonials.length === 0 && <p className="text-sm text-slate-500 py-4">No testimonials yet.</p>}
      <div className="space-y-2">
        {testimonials.map(t => (
          <div key={t.id} className="border border-slate-100 rounded-lg p-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-1 min-w-[220px]">
              {t.photo ? (
                <img loading="lazy" decoding="async" src={safeImg(t.photo)} alt="" className="w-12 h-12 rounded-full object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gillco-green text-white flex items-center justify-center font-serif">{(t.name || '?').charAt(0)}</div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-1 text-xs">
                  {Array.from({ length: t.rating || 5 }).map((_, i) => <Star key={i} className="w-3 h-3 fill-gillco-gold text-gillco-gold" />)}
                </div>
                <div className="text-sm font-semibold text-slate-800">{t.name}</div>
                <div className="text-xs text-slate-500">{t.role}{t.projectName ? ` · ${t.projectName}` : ''}</div>
                <div className="text-xs text-slate-500 italic line-clamp-1">"{t.quote}"</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(t)} className="px-3 py-1.5 bg-gillco-green text-white text-xs rounded-full inline-flex gap-1 items-center"><Edit3 className="w-3 h-3" /> Edit</button>
              <button onClick={() => del(t.id)} className="px-3 py-1.5 border border-red-300 text-red-600 text-xs rounded-full"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-xl w-full rounded-2xl p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-serif text-xl text-gillco-green">{editing.id ? 'Edit' : 'New'} Testimonial</h4>
              <button onClick={() => setEditing(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Name" value={editing.name} onChange={v => setEditing({ ...editing, name: v })} />
                <Field label="Role (e.g. Resident, Owner)" value={editing.role || ''} onChange={v => setEditing({ ...editing, role: v })} />
              </div>
              <MediaUploader label="Photo (circular)" value={editing.photo} onChange={v => setEditing({ ...editing, photo: v })} accept="image/*" hint="Square headshot works best" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 uppercase">Project</label>
                  <select value={editing.projectId || ''} onChange={e => {
                    const slug = e.target.value;
                    const p = projects.find(x => x.id === slug);
                    setEditing({ ...editing, projectId: slug, projectName: p?.name || '' });
                  }} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg">
                    <option value="">— None —</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase">Rating (1–5)</label>
                  <input type="number" min="1" max="5" value={editing.rating || 5} onChange={e => setEditing({ ...editing, rating: Math.max(1, Math.min(5, Number(e.target.value) || 5)) })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase">Quote</label>
                <textarea rows={4} value={editing.quote || ''} onChange={e => setEditing({ ...editing, quote: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg resize-none" placeholder="Share what the resident said about living at Gillco…" />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.published !== false} onChange={e => setEditing({ ...editing, published: e.target.checked })} />
                Published (show on home page)
              </label>
              <button onClick={() => save(editing)} className="w-full py-2.5 gradient-emerald text-white rounded-full font-semibold"><Save className="w-4 h-4 inline mr-1" /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PostsEditor({ posts, setPosts }) {
  const [editing, setEditing] = useState(null);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const doImport = async () => {
    const url = importUrl.trim();
    if (!url) return toast.error('Paste a URL first');
    setImporting(true);
    try {
      const data = await api('/posts/import-url', { method: 'POST', body: JSON.stringify({ url }) });
      // Open the editor prefilled
      setEditing({
        title: data.title || '',
        excerpt: data.excerpt || '',
        body: data.body || '',
        cover: data.cover || '',
        source: data.source || 'manual',
        sourceUrl: data.sourceUrl || url,
        tags: data.source && data.source !== 'manual' ? [data.source] : [],
        published: true,
        publishedAt: new Date().toISOString().slice(0, 10),
      });
      setShowImport(false);
      setImportUrl('');
      toast.success('Preview loaded — review and save');
    } catch (e) {
      toast.error(e.message || 'Could not import. The page may be private or block scraping. Add manually.');
    } finally {
      setImporting(false);
    }
  };

  const save = async (p) => {
    try {
      if (p.id && posts.find(x => x.id === p.id)) {
        const upd = await api(`/posts/${p.slug || p.id}`, { method: 'PUT', body: JSON.stringify(p) });
        setPosts(prev => prev.map(x => x.id === upd.id ? upd : x));
      } else {
        const created = await api('/posts', { method: 'POST', body: JSON.stringify(p) });
        setPosts(prev => [created, ...prev]);
      }
      setEditing(null);
      toast.success('Post saved');
    } catch (e) { toast.error(e.message || 'Save failed'); }
  };
  const del = async (slug) => {
    if (!confirm('Delete this post permanently?')) return;
    await api(`/posts/${slug}`, { method: 'DELETE' });
    setPosts(prev => prev.filter(x => x.slug !== slug));
    toast.success('Deleted');
  };
  const togglePublish = async (p) => {
    const upd = await api(`/posts/${p.slug}`, { method: 'PUT', body: JSON.stringify({ ...p, published: !p.published }) });
    setPosts(prev => prev.map(x => x.id === upd.id ? upd : x));
    toast.success(upd.published ? 'Published' : 'Set to draft');
  };
  const copyShareLink = async (p) => {
    const base = window.location.origin;
    const url = `${base}/blog/${p.slug}`;
    try { await navigator.clipboard.writeText(url); toast.success('Link copied: ' + url); }
    catch { toast.info(url); }
  };

  const sources = [
    { v: 'manual', label: 'Blog Post' },
    { v: 'instagram', label: 'Instagram' },
    { v: 'facebook', label: 'Facebook' },
    { v: 'twitter', label: 'X / Twitter' },
    { v: 'linkedin', label: 'LinkedIn' },
    { v: 'youtube', label: 'YouTube' },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-serif text-2xl text-gillco-green">Blog & Social Posts</h3>
          <p className="text-xs text-slate-500 mt-1">Create posts for the <a href="/blog" target="_blank" className="text-emerald-700 underline">/blog</a> section. Each post has a shareable public link with WhatsApp/FB/LinkedIn share buttons.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowImport(true)} className="px-4 py-2 border border-emerald-300 text-emerald-700 rounded-full text-sm font-semibold inline-flex items-center gap-2 hover:bg-emerald-50"><ExternalLink className="w-4 h-4" /> Import from URL</button>
          <button onClick={() => setEditing({ title: '', excerpt: '', body: '', cover: '', tags: '', source: 'manual', published: true, publishedAt: new Date().toISOString().slice(0, 10) })} className="px-4 py-2 gradient-gold text-slate-900 rounded-full text-sm font-semibold inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add Post</button>
        </div>
      </div>

      {showImport && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-serif text-xl text-gillco-green">Import from URL</h4>
              <button onClick={() => { setShowImport(false); setImportUrl(''); }}><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm text-slate-500 mb-3">Paste any public URL — Instagram, Facebook, YouTube, news article, etc. We'll auto-fetch the thumbnail, title and caption from the page's Open Graph tags.</p>
            <input
              type="url"
              value={importUrl}
              onChange={e => setImportUrl(e.target.value)}
              placeholder="https://www.instagram.com/p/..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg mb-3"
              autoFocus
            />
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 mb-3">
              <strong>Tip:</strong> Instagram now requires login for most posts — if the import fails, screenshot the reel, add it manually with "Add Post", and paste the Instagram URL in the "Original Social Post URL" field so viewers can click through.
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowImport(false); setImportUrl(''); }} className="flex-1 py-2.5 border border-slate-200 rounded-full text-sm">Cancel</button>
              <button onClick={doImport} disabled={importing} className="flex-1 py-2.5 gradient-emerald text-white rounded-full font-semibold text-sm disabled:opacity-60">
                {importing ? 'Fetching…' : 'Fetch Preview'}
              </button>
            </div>
          </div>
        </div>
      )}

      {posts.length === 0 && <p className="text-sm text-slate-500 py-4">No posts yet. Click "Add Post" to create your first update.</p>}

      <div className="space-y-2">
        {posts.map(p => (
          <div key={p.id} className="border border-slate-100 rounded-lg p-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-1 min-w-[220px]">
              {p.cover ? (
                <img loading="lazy" decoding="async" src={safeImg(p.cover)} className="w-14 h-14 rounded object-cover" alt="" />
              ) : (
                <div className="w-14 h-14 rounded bg-gillco-green/10 flex items-center justify-center text-gillco-green text-xs font-serif">G</div>
              )}
              <div className="flex-1">
                <div className="text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-semibold ${p.published === false ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {p.published === false ? 'Draft' : 'Published'}
                  </span>
                  <span className="ml-2 text-slate-500 capitalize">{p.source || 'manual'}</span>
                  <span className="ml-2 text-slate-400">{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('en-IN') : ''}</span>
                </div>
                <div className="font-serif text-base text-gillco-green mt-0.5">{p.title}</div>
                <div className="text-xs text-slate-500">/blog/{p.slug}</div>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => copyShareLink(p)} className="px-3 py-1.5 border border-emerald-300 text-emerald-700 text-xs rounded-full inline-flex gap-1 items-center" title="Copy public share link"><ExternalLink className="w-3 h-3" /> Share</button>
              <button onClick={() => togglePublish(p)} className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs rounded-full">{p.published === false ? 'Publish' : 'Unpublish'}</button>
              <button onClick={() => setEditing(p)} className="px-3 py-1.5 bg-gillco-green text-white text-xs rounded-full inline-flex gap-1 items-center"><Edit3 className="w-3 h-3" /> Edit</button>
              <button onClick={() => del(p.slug)} className="px-3 py-1.5 border border-red-300 text-red-600 text-xs rounded-full"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-2xl w-full rounded-2xl p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-serif text-xl text-gillco-green">{editing.id ? 'Edit' : 'New'} Post</h4>
              <button onClick={() => setEditing(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Title" value={editing.title} onChange={v => setEditing({ ...editing, title: v })} />
              <Field label="Slug (optional, auto from title)" value={editing.slug || ''} onChange={v => setEditing({ ...editing, slug: v })} />
              <div>
                <label className="text-xs text-slate-500 uppercase">Short Excerpt (shows in cards & previews)</label>
                <textarea rows={2} value={editing.excerpt || ''} onChange={e => setEditing({ ...editing, excerpt: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg resize-none" />
              </div>
              <MediaUploader label="Cover Image" value={editing.cover} onChange={v => setEditing({ ...editing, cover: v })} accept="image/*" hint="Shown in post card and OG preview. Ideal 1200x630." />
              <div>
                <label className="text-xs text-slate-500 uppercase">Body (supports **bold**, *italic*, [link](url), blank line = new paragraph)</label>
                <textarea rows={10} value={editing.body || ''} onChange={e => setEditing({ ...editing, body: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg font-mono text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 uppercase">Source</label>
                  <select value={editing.source || 'manual'} onChange={e => setEditing({ ...editing, source: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg">
                    {sources.map(s => <option key={s.v} value={s.v}>{s.label}</option>)}
                  </select>
                </div>
                <Field label="Publish Date" value={typeof editing.publishedAt === 'string' ? editing.publishedAt.slice(0, 10) : ''} onChange={v => setEditing({ ...editing, publishedAt: v })} />
              </div>
              <Field label="Tags (comma-separated)" value={Array.isArray(editing.tags) ? editing.tags.join(', ') : (editing.tags || '')} onChange={v => setEditing({ ...editing, tags: v })} />
              {editing.source !== 'manual' && (
                <Field label="Original Social Post URL (optional)" value={editing.sourceUrl || ''} onChange={v => setEditing({ ...editing, sourceUrl: v })} />
              )}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={editing.published !== false} onChange={e => setEditing({ ...editing, published: e.target.checked })} />
                Publish immediately (uncheck to save as draft)
              </label>
              <button onClick={() => save(editing)} className="w-full py-2.5 gradient-emerald text-white rounded-full font-semibold"><Save className="w-4 h-4 inline mr-1" /> Save Post</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TeamEditor({ team, setTeam }) {
  const [editing, setEditing] = useState(null);
  const save = async (m) => {
    if (m.id && team.find(x => x.id === m.id)) {
      const upd = await api(`/team/${m.id}`, { method: 'PUT', body: JSON.stringify(m) });
      setTeam(prev => prev.map(x => x.id === upd.id ? upd : x));
    } else {
      const created = await api('/team', { method: 'POST', body: JSON.stringify(m) });
      setTeam(prev => [...prev, created]);
    }
    setEditing(null);
    toast.success('Saved');
  };
  const del = async (id) => {
    if (!confirm('Remove this team member?')) return;
    await api(`/team/${id}`, { method: 'DELETE' });
    setTeam(prev => prev.filter(x => x.id !== id));
  };
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-2xl text-gillco-green">Team Members</h3>
        <button onClick={() => setEditing({ name: '', role: '', bio: '', photo: '', linkedin: '' })} className="px-4 py-2 gradient-gold text-slate-900 rounded-full text-sm font-semibold inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add Member</button>
      </div>
      <div className="grid md:grid-cols-3 gap-3">
        {team.map(m => (
          <div key={m.id} className="border border-slate-100 rounded-xl p-4 text-center">
            <img loading="lazy" decoding="async" src={safeImg(m.photo)} alt={m.name} className="w-24 h-24 rounded-full object-cover mx-auto mb-2" />
            <div className="font-serif text-lg text-gillco-green">{m.name}</div>
            <div className="text-xs text-gillco-gold uppercase">{m.role}</div>
            <div className="flex justify-center gap-2 mt-3">
              <button onClick={() => setEditing(m)} className="px-3 py-1.5 bg-gillco-green text-white text-xs rounded-full inline-flex gap-1 items-center"><Edit3 className="w-3 h-3" /> Edit</button>
              <button onClick={() => del(m.id)} className="px-3 py-1.5 border border-red-300 text-red-600 text-xs rounded-full"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-serif text-xl text-gillco-green">{editing.id ? 'Edit' : 'New'} Team Member</h4>
              <button onClick={() => setEditing(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Name" value={editing.name} onChange={v => setEditing({ ...editing, name: v })} />
              <Field label="Role" value={editing.role} onChange={v => setEditing({ ...editing, role: v })} />
              <MediaUploader label="Photo" value={editing.photo} onChange={v => setEditing({ ...editing, photo: v })} accept="image/*" />
              <Field label="LinkedIn URL" value={editing.linkedin} onChange={v => setEditing({ ...editing, linkedin: v })} />
              <div>
                <label className="text-xs text-slate-500 uppercase">Bio</label>
                <textarea rows={4} value={editing.bio} onChange={e => setEditing({ ...editing, bio: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg resize-none" />
              </div>
              <button onClick={() => save(editing)} className="w-full py-2.5 gradient-emerald text-white rounded-full font-semibold"><Save className="w-4 h-4 inline mr-1" /> Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SettingsEditor({ settings, onSave }) {
  const [s, setS] = useState(settings);
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100 space-y-4">
      <h3 className="font-serif text-2xl text-gillco-green">Site & Brand Settings</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Brand Name" value={s.brandName} onChange={v => setS({ ...s, brandName: v })} />
        <Field label="Tagline" value={s.tagline} onChange={v => setS({ ...s, tagline: v })} />
        <Field label="Phone" value={s.phone} onChange={v => setS({ ...s, phone: v })} />
        <Field label="WhatsApp (digits only)" value={s.whatsapp} onChange={v => setS({ ...s, whatsapp: v })} />
        <Field label="Email" value={s.email} onChange={v => setS({ ...s, email: v })} />
        <Field label="Address" value={s.address} onChange={v => setS({ ...s, address: v })} />
        <Field label="Founded (year)" type="number" value={s.founded} onChange={v => setS({ ...s, founded: Number(v) })} />
      </div>

      <h4 className="font-serif text-xl text-gillco-green mt-6">Key Stats (shown on home)</h4>
      <div className="grid md:grid-cols-4 gap-3">
        <Field label="Years" type="number" value={s.stats?.years} onChange={v => setS({ ...s, stats: { ...(s.stats || {}), years: Number(v) } })} />
        <Field label="Projects" type="number" value={s.stats?.projects} onChange={v => setS({ ...s, stats: { ...(s.stats || {}), projects: Number(v) } })} />
        <Field label="Happy Families" type="number" value={s.stats?.families} onChange={v => setS({ ...s, stats: { ...(s.stats || {}), families: Number(v) } })} />
        <Field label="Sq. Ft. Developed" value={s.stats?.sqft} onChange={v => setS({ ...s, stats: { ...(s.stats || {}), sqft: v } })} />
      </div>

      <h4 className="font-serif text-xl text-gillco-green mt-6">Site Logo</h4>
      <div className="grid md:grid-cols-2 gap-4">
        <MediaUploader label="Primary Logo (dark background OK)" value={s.logoDark} onChange={v => setS({ ...s, logoDark: v })} accept="image/*" hint="Square or landscape PNG/SVG, transparent" />
        <MediaUploader label="Footer Logo (white version)" value={s.logoWhite} onChange={v => setS({ ...s, logoWhite: v })} accept="image/*" hint="White version for dark footer" />
      </div>

      <h4 className="font-serif text-xl text-gillco-green mt-6">Social Media</h4>
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Facebook URL" value={s.social?.facebook} onChange={v => setS({ ...s, social: { ...(s.social || {}), facebook: v } })} />
        <Field label="Instagram URL" value={s.social?.instagram} onChange={v => setS({ ...s, social: { ...(s.social || {}), instagram: v } })} />
        <Field label="LinkedIn URL" value={s.social?.linkedin} onChange={v => setS({ ...s, social: { ...(s.social || {}), linkedin: v } })} />
        <Field label="YouTube URL" value={s.social?.youtube} onChange={v => setS({ ...s, social: { ...(s.social || {}), youtube: v } })} />
        <Field label="X / Twitter URL" value={s.social?.twitter} onChange={v => setS({ ...s, social: { ...(s.social || {}), twitter: v } })} />
      </div>

      <h4 className="font-serif text-xl text-gillco-green mt-6">Sales Team (WhatsApp round-robin)</h4>
      <p className="text-xs text-slate-500 -mt-2">Enquiries are routed to these agents in rotation. Only entries marked Active receive leads.</p>
      <div className="space-y-2">
        {(s.salesTeam || []).map((m, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center border border-slate-200 rounded-lg p-3">
            <Field label="Agent Name" value={m.name} onChange={v => setS({ ...s, salesTeam: s.salesTeam.map((x, idx) => idx === i ? { ...x, name: v } : x) })} />
            <div className="col-span-3"><Field label="Role" value={m.role} onChange={v => setS({ ...s, salesTeam: s.salesTeam.map((x, idx) => idx === i ? { ...x, role: v } : x) })} /></div>
            <div className="col-span-3"><Field label="WhatsApp (digits, no +)" value={m.whatsapp} onChange={v => setS({ ...s, salesTeam: s.salesTeam.map((x, idx) => idx === i ? { ...x, whatsapp: v } : x) })} /></div>
            <label className="col-span-1 text-xs flex items-center gap-1 pt-4">
              <input type="checkbox" checked={m.active !== false} onChange={e => setS({ ...s, salesTeam: s.salesTeam.map((x, idx) => idx === i ? { ...x, active: e.target.checked } : x) })} /> Active
            </label>
            <button onClick={() => setS({ ...s, salesTeam: s.salesTeam.filter((_, idx) => idx !== i) })} className="col-span-1 text-red-500 text-lg pt-4">×</button>
          </div>
        ))}
        <button onClick={() => setS({ ...s, salesTeam: [...(s.salesTeam || []), { id: `s${Date.now()}`, name: '', role: '', whatsapp: '', active: true }] })} className="px-4 py-2 border border-slate-300 rounded-full text-sm inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Sales Agent
        </button>
      </div>

      <h4 className="font-serif text-xl text-gillco-green mt-6">Lead Overflow / Auto-Escalation</h4>
      <p className="text-xs text-slate-500 -mt-2">If no agent claims a lead within X minutes, the admin panel flags it as OVERDUE and offers a one-click escalation to the manager's WhatsApp.</p>
      <div className="grid md:grid-cols-3 gap-3 items-end">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={s.leadOverflow?.enabled} onChange={e => setS({ ...s, leadOverflow: { ...(s.leadOverflow || {}), enabled: e.target.checked } })} />
          Enable overflow tracking
        </label>
        <Field label="Escalate after (minutes)" type="number" value={s.leadOverflow?.minutes} onChange={v => setS({ ...s, leadOverflow: { ...(s.leadOverflow || {}), minutes: Number(v) } })} />
        <Field label="Manager Name" value={s.leadOverflow?.managerName} onChange={v => setS({ ...s, leadOverflow: { ...(s.leadOverflow || {}), managerName: v } })} />
      </div>
      <Field label="Manager WhatsApp (digits, no +)" value={s.leadOverflow?.managerWhatsapp} onChange={v => setS({ ...s, leadOverflow: { ...(s.leadOverflow || {}), managerWhatsapp: v } })} />
      <Field label="Manager Email (gets the automatic escalation email)" value={s.leadOverflow?.managerEmail} onChange={v => setS({ ...s, leadOverflow: { ...(s.leadOverflow || {}), managerEmail: v } })} />

      <NotificationSettings s={s} setS={setS} />

      <h4 className="font-serif text-xl text-gillco-green mt-6">Group Awards (Home page Awards Wall)</h4>
      <p className="text-xs text-slate-500 -mt-2">Awards won by Gillco Group as a company. Awards added inside each project also appear on the wall automatically. The section stays hidden until at least one award exists.</p>
      <AwardsListEditor testid="group-awards-editor" value={s.groupAwards} onChange={v => setS({ ...s, groupAwards: v })} />

      <h4 className="font-serif text-xl text-gillco-green mt-6">Google Analytics (GA4)</h4>
      <p className="text-xs text-slate-500 -mt-2">Paste your Measurement ID to start tracking visits, enquiries, call and WhatsApp clicks. Leave empty to turn tracking off.</p>
      <Field label="GA4 Measurement ID (e.g. G-ABC123XYZ)" value={s.ga4Id} onChange={v => setS({ ...s, ga4Id: v.trim().toUpperCase() })} />
      {s.ga4Id && !/^G-[A-Z0-9]{4,}$/.test(s.ga4Id) && <p className="text-xs text-red-600 -mt-2">That doesn't look like a GA4 ID — it should start with "G-".</p>}

      <h4 className="font-serif text-xl text-gillco-green mt-6">Popup Form Config</h4>
      <div className="grid md:grid-cols-3 gap-4 items-end">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={s.popup?.enabled} onChange={e => setS({ ...s, popup: { ...(s.popup || {}), enabled: e.target.checked } })} />
          Enable popup
        </label>
        <Field label="Delay (seconds)" type="number" value={s.popup?.delaySeconds} onChange={v => setS({ ...s, popup: { ...(s.popup || {}), delaySeconds: Number(v) } })} />
        <Field label="Cookie Suppression (hours)" type="number" value={s.popup?.cookieHours} onChange={v => setS({ ...s, popup: { ...(s.popup || {}), cookieHours: Number(v) } })} />
      </div>

      <button onClick={() => onSave(s)} className="mt-6 px-6 py-3 gradient-emerald text-white rounded-full font-semibold inline-flex items-center gap-2"><Save className="w-4 h-4" /> Save All Settings</button>
    </div>
  );
}

function NotificationSettings({ s, setS }) {
  const [status, setStatus] = useState(null);
  const [sending, setSending] = useState(false);
  useEffect(() => { api('/notifications/status').then(setStatus).catch(() => {}); }, []);
  const n = s.notifications || {};
  const sendTest = async () => {
    setSending(true);
    try {
      const r = await api('/notifications/test', { method: 'POST' });
      toast.success(`Test email sent to ${(r.to || []).join(', ')}`);
    } catch (e) { toast.error(e?.message || 'Test email failed'); }
    setSending(false);
  };
  return (
    <div data-testid="notification-settings">
      <h4 className="font-serif text-xl text-gillco-green mt-6">Email Alerts for New Leads</h4>
      <p className="text-xs text-slate-500 mt-1">Every enquiry is emailed instantly to these addresses. Unclaimed leads are emailed to the manager automatically after the escalation time above. Save settings before sending a test.</p>
      {status && (
        <div className={`mt-2 text-xs rounded-lg px-3 py-2 ${status.emailConfigured ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
          {status.emailConfigured ? '✓ Email sending is connected.' : '⚠ Email sending is not connected yet — add the RESEND_API_KEY on the server. Until then no emails are sent.'}
        </div>
      )}
      <div className="grid md:grid-cols-3 gap-3 items-end mt-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={n.emailEnabled !== false} onChange={e => setS({ ...s, notifications: { ...n, emailEnabled: e.target.checked } })} />
          Email me every new enquiry
        </label>
        <div className="md:col-span-2"><Field label="Send to (comma-separated emails)" value={n.leadEmails} onChange={v => setS({ ...s, notifications: { ...n, leadEmails: v } })} /></div>
      </div>
      <button type="button" onClick={sendTest} disabled={sending} data-testid="send-test-email" className="mt-3 px-4 py-2 border border-gillco-green text-gillco-green rounded-full text-sm inline-flex items-center gap-2 disabled:opacity-50">
        <Mail className="w-4 h-4" /> {sending ? 'Sending…' : 'Send test email'}
      </button>
    </div>
  );
}

function EnquiriesPanel({ settings }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const overflowMin = settings?.leadOverflow?.minutes || 15;
  const managerWA = settings?.leadOverflow?.managerWhatsapp || settings?.whatsapp;
  const managerName = settings?.leadOverflow?.managerName || 'Sales Manager';

  const load = async () => {
    try { setItems(await api('/enquiries')); } catch {}
    setLoading(false);
  };
  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // auto-refresh every 30s
    return () => clearInterval(t);
  }, []);

  const now = Date.now();
  const isOverdue = (e) => {
    if (e.claimed) return false;
    const created = new Date(e.createdAt).getTime();
    return (now - created) / 60000 > overflowMin;
  };

  const [exporting, setExporting] = useState(false);
  const exportExcel = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/enquiries.xlsx?status=${encodeURIComponent(filter)}`, { cache: 'no-store' });
      if (res.status === 401) { window.dispatchEvent(new Event('gillco:admin-logout')); throw new Error('Session expired — please log in again'); }
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const name = (res.headers.get('Content-Disposition') || '').match(/filename="([^"]+)"/)?.[1] || 'gillco-enquiries.xlsx';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.success('Excel file downloaded');
    } catch (e) { toast.error(e?.message || 'Export failed'); }
    setExporting(false);
  };

  const claim = async (e) => {
    try {
      await api(`/enquiries/${e.id}/claim`, { method: 'POST', body: JSON.stringify({ by: 'admin' }) });
      toast.success(`Lead claimed`);
      load();
    } catch { toast.error('Claim failed'); }
  };

  const escalate = async (e) => {
    try {
      await api(`/enquiries/${e.id}/escalate`, { method: 'POST' });
      // Open manager WhatsApp with escalation message
      const waLines = [
        '🚨 *LEAD ESCALATION — Gillco Group*',
        '',
        `⚠️ Unclaimed for >${overflowMin} minutes`,
        `👤 Name: ${e.name}`,
        `📞 Phone: ${e.phone}`,
        e.email ? `✉️ Email: ${e.email}` : null,
        `🏢 Project: ${e.projectName || '—'}`,
        e.propertyType ? `🏷️ Property Type: ${e.propertyType}` : null,
        e.budget ? `💰 Budget: ${e.budget}` : null,
        e.routedTo ? `👥 Originally routed to: ${e.routedTo}` : null,
        e.message ? `💬 Message: ${e.message}` : null,
        `🕒 Received: ${new Date(e.createdAt).toLocaleString('en-IN')}`,
      ].filter(Boolean).join('\n');
      if (managerWA) {
        window.open(`https://wa.me/${managerWA}?text=${encodeURIComponent(waLines)}`, '_blank', 'noopener,noreferrer');
      }
      toast.success(`Escalated to ${managerName}`);
      load();
    } catch { toast.error('Escalate failed'); }
  };

  const filtered = items.filter(e => {
    if (filter === 'overdue') return isOverdue(e) && !e.escalated;
    if (filter === 'claimed') return e.claimed;
    if (filter === 'escalated') return e.escalated;
    if (filter === 'new') return !e.claimed && !isOverdue(e) && !e.escalated;
    return true;
  });

  const overdueCount = items.filter(e => isOverdue(e) && !e.escalated).length;

  return (
    <div className="space-y-4">
      {/* Overflow alert bar */}
      {overdueCount > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center font-bold animate-pulse">{overdueCount}</div>
            <div>
              <div className="font-serif text-lg text-red-700">Lead overflow — {overdueCount} unclaimed for &gt; {overflowMin} min</div>
              <div className="text-xs text-red-600">Escalate to {managerName} to prevent lost revenue.</div>
            </div>
          </div>
          <button onClick={() => setFilter('overdue')} className="px-4 py-2 bg-red-600 text-white rounded-full text-sm font-semibold">Show Overdue</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        {/* Filters */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {[
            ['all', 'All', items.length],
            ['new', 'New', items.filter(e => !e.claimed && !isOverdue(e) && !e.escalated).length],
            ['overdue', 'Overdue', overdueCount],
            ['claimed', 'Claimed', items.filter(e => e.claimed).length],
            ['escalated', 'Escalated', items.filter(e => e.escalated).length],
          ].map(([k, label, count]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 ${filter === k ? 'bg-gillco-green text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'} ${k === 'overdue' && count > 0 ? 'ring-2 ring-red-400' : ''}`}
            >
              {label} <span className="opacity-70">({count})</span>
            </button>
          ))}
          <button onClick={exportExcel} disabled={exporting} data-testid="export-excel-btn" title={filter === 'all' ? 'Download all enquiries' : `Download the ${filter} enquiries`} className="ml-auto px-3 py-1.5 bg-gillco-green text-white rounded-full text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-60">
            <Download className="w-3.5 h-3.5" /> {exporting ? 'Preparing…' : `Export to Excel${filter !== 'all' ? ` (${filter})` : ''}`}
          </button>
          <button onClick={load} className="px-3 py-1.5 border border-slate-300 rounded-full text-xs">Refresh</button>
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-500">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-slate-500">No enquiries in this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gillco-cream">
                <tr>
                  <th className="text-left p-3 text-xs uppercase text-slate-600">Received</th>
                  <th className="text-left p-3 text-xs uppercase text-slate-600">Lead</th>
                  <th className="text-left p-3 text-xs uppercase text-slate-600">Project</th>
                  <th className="text-left p-3 text-xs uppercase text-slate-600">Routed To</th>
                  <th className="text-left p-3 text-xs uppercase text-slate-600">Status</th>
                  <th className="text-left p-3 text-xs uppercase text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(e => {
                  const overdue = isOverdue(e);
                  const ageMin = Math.floor((now - new Date(e.createdAt).getTime()) / 60000);
                  return (
                    <tr key={e.id} className={`border-t border-slate-100 ${overdue && !e.escalated ? 'bg-red-50/40' : ''}`}>
                      <td className="p-3 text-xs text-slate-600 whitespace-nowrap">
                        <div>{new Date(e.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-[10px] text-slate-400">{ageMin < 60 ? `${ageMin}m ago` : `${Math.floor(ageMin / 60)}h ${ageMin % 60}m ago`}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-slate-800">{e.name}</div>
                        <div className="text-xs text-slate-500">{e.phone}{e.email ? ` · ${e.email}` : ''}</div>
                      </td>
                      <td className="p-3 text-xs">{e.projectName || '—'}{(e.propertyType || e.budget) && <div className="text-[11px] text-slate-500 mt-0.5">{[e.propertyType, e.budget].filter(Boolean).join(' · ')}</div>}</td>
                      <td className="p-3 text-xs">
                        {e.routedTo ? (
                          <span className="text-gillco-green font-medium">{e.routedTo}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        {e.escalated ? (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500 text-white" title={e.escalatedBy === 'auto' ? 'Manager was emailed automatically' : ''}>{e.escalatedBy === 'auto' ? 'AUTO-ESCALATED' : 'ESCALATED'}</span>
                        ) : e.claimed ? (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-600 text-white">CLAIMED</span>
                        ) : overdue ? (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-red-500 text-white animate-pulse">OVERDUE</span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-blue-500 text-white">NEW</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1.5">
                          {!e.claimed && !e.escalated && (
                            <button onClick={() => claim(e)} className="px-2.5 py-1 bg-emerald-600 text-white text-xs rounded-full">Claim</button>
                          )}
                          {overdue && !e.escalated && (
                            <button onClick={() => escalate(e)} className="px-2.5 py-1 bg-red-600 text-white text-xs rounded-full animate-pulse inline-flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Escalate</button>
                          )}
                          <a
                            href={`https://wa.me/91${e.phone.replace(/\D/g, '').replace(/^91/, '')}?text=${encodeURIComponent(`Hi ${e.name}, thanks for your enquiry about ${e.projectName || 'Gillco Group'}.`)}`}
                            target="_blank" rel="noreferrer"
                            className="px-2.5 py-1 border border-slate-300 text-slate-700 text-xs rounded-full inline-flex items-center gap-1"
                          ><MessageCircle className="w-3 h-3" /> WA Lead</a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryPanel({ onRestore }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [undoing, setUndoing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api('/history');
      setItems(data);
    } catch { toast.error('Failed to load history'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const undo = async (id) => {
    if (!confirm('Undo this change? The site will be restored to the previous state.')) return;
    setUndoing(id);
    try {
      await api(`/history/${id}/undo`, { method: 'POST' });
      toast.success('Change undone');
      await onRestore?.();
      await load();
    } catch (e) {
      toast.error('Undo failed: ' + (e.message || 'unknown'));
    } finally {
      setUndoing(null);
    }
  };

  const actionColor = (a) => ({ create: 'bg-emerald-100 text-emerald-700', update: 'bg-blue-100 text-blue-700', delete: 'bg-red-100 text-red-700' })[a] || 'bg-slate-100 text-slate-700';
  const entityLabel = (e) => ({ settings: 'Site Settings', projects: 'Project', news: 'News', team: 'Team' })[e] || e;

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-serif text-2xl text-gillco-green">Change History</h3>
          <p className="text-sm text-slate-500">Every edit is recorded. Click "Undo" to revert.</p>
        </div>
        <button onClick={load} className="px-4 py-2 border border-slate-300 rounded-full text-sm">Refresh</button>
      </div>
      {loading ? (
        <div className="py-10 text-center text-slate-500">Loading history…</div>
      ) : items.length === 0 ? (
        <div className="py-10 text-center text-slate-500">No changes recorded yet. Edit anything to start tracking.</div>
      ) : (
        <div className="space-y-2">
          {items.map(h => (
            <div key={h.id} className={`border rounded-xl p-4 flex items-start gap-3 flex-wrap ${h.undone ? 'border-slate-200 bg-slate-50 opacity-70' : 'border-slate-100'}`}>
              <div className="flex-1 min-w-[240px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${actionColor(h.action)}`}>{h.action.toUpperCase()}</span>
                  <span className="text-xs text-slate-500 uppercase tracking-wider">{entityLabel(h.entity)}</span>
                  {h.undone && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">UNDONE</span>}
                </div>
                <div className="text-sm text-slate-800 mt-1 font-medium">{h.label || '(no label)'}</div>
                <div className="text-xs text-slate-400 mt-1">{new Date(h.ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <button
                onClick={() => undo(h.id)}
                disabled={h.undone || undoing === h.id}
                className="px-4 py-2 rounded-full text-sm font-semibold border border-gillco-green text-gillco-green hover:bg-gillco-cream disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                title={h.undone ? 'Already undone' : 'Undo this change'}
              >
                {undoing === h.id ? '…' : (h.undone ? 'Undone' : 'Undo')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectEditor({ project, onSave, onClose }) {
  const [p, setP] = useState({ ...project, amenities: project.amenities || [], milestones: project.milestones || [], gallery: project.gallery || [] });
  const [amenityInput, setAmenityInput] = useState('');
  const [galleryInput, setGalleryInput] = useState('');

  const addAmenity = () => {
    if (!amenityInput.trim()) return;
    setP({ ...p, amenities: [...p.amenities, amenityInput.trim()] });
    setAmenityInput('');
  };
  const removeAmenity = (i) => setP({ ...p, amenities: p.amenities.filter((_, idx) => idx !== i) });

  const addGallery = () => {
    if (!galleryInput.trim()) return;
    setP({ ...p, gallery: [...p.gallery, galleryInput.trim()] });
    setGalleryInput('');
  };
  const removeGallery = (i) => setP({ ...p, gallery: p.gallery.filter((_, idx) => idx !== i) });

  const updateMilestone = (i, k, v) => setP({ ...p, milestones: p.milestones.map((m, idx) => idx === i ? { ...m, [k]: v } : m) });
  const addMilestone = () => setP({ ...p, milestones: [...p.milestones, { date: new Date().toISOString().slice(0, 10), title: 'New Milestone', done: false }] });
  const removeMilestone = (i) => setP({ ...p, milestones: p.milestones.filter((_, idx) => idx !== i) });

  return (
    <div className="fixed inset-0 bg-black/70 z-50 overflow-y-auto flex items-start justify-center p-4">
      <div className="bg-white max-w-4xl w-full rounded-2xl p-6 my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-2xl text-gillco-green">Edit: {p.name}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
        </div>

        {/* Basics */}
        <h4 className="font-serif text-lg text-gillco-green mb-2">Basics</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Name" value={p.name} onChange={v => setP({ ...p, name: v })} />
          <Field label="Slug (URL id)" value={p.slug} onChange={v => setP({ ...p, slug: v })} />
          <Field label="Tagline" value={p.tagline} onChange={v => setP({ ...p, tagline: v })} />
          <Field label="Location" value={p.location} onChange={v => setP({ ...p, location: v })} />
          <div>
            <label className="text-xs text-slate-500 uppercase">Status</label>
            <select value={p.status} onChange={e => setP({ ...p, status: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg">
              <option value="delivered">Delivered</option>
              <option value="ongoing">Ongoing</option>
              <option value="upcoming">Upcoming / Soft Launch</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase">Category</label>
            <select value={p.category} onChange={e => setP({ ...p, category: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg">
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
            </select>
          </div>
        </div>

        {/* RERA */}
        <h4 className="font-serif text-lg text-gillco-green mt-6 mb-2">RERA Disclosure</h4>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="RERA Number" value={p.reraNumber} onChange={v => setP({ ...p, reraNumber: v })} />
          <Field label="RERA Status" value={p.reraStatus} onChange={v => setP({ ...p, reraStatus: v })} />
          <Field label="Updated On (YYYY-MM-DD)" value={p.reraUpdatedAt} onChange={v => setP({ ...p, reraUpdatedAt: v })} />
        </div>

        {/* Specs */}
        <h4 className="font-serif text-lg text-gillco-green mt-6 mb-2">Specs & Pricing</h4>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Unit Mix" value={p.unitMix} onChange={v => setP({ ...p, unitMix: v })} />
          <Field label="Price Range" value={p.priceRange} onChange={v => setP({ ...p, priceRange: v })} />
          <Field label="Construction %" type="number" value={p.constructionPercent} onChange={v => setP({ ...p, constructionPercent: Number(v) })} />
          <Field label="Launch Date" value={p.launchDate} onChange={v => setP({ ...p, launchDate: v })} />
          <Field label="Handover Date" value={p.handoverDate} onChange={v => setP({ ...p, handoverDate: v })} />
          <Field label="Acres" type="number" value={p.acres} onChange={v => setP({ ...p, acres: Number(v) })} />
          <Field label="Towers" type="number" value={p.towers} onChange={v => setP({ ...p, towers: Number(v) })} />
          <Field label="Total Units" type="number" value={p.units} onChange={v => setP({ ...p, units: Number(v) })} />
        </div>

        {/* Residential + Commercial Offerings (side-by-side on detail page if both filled) */}
        <h4 className="font-serif text-lg text-gillco-green mt-6 mb-2">Offerings (Residential + Commercial)</h4>
        <p className="text-xs text-slate-500 mb-3">Tick each type available in this project. Fill the per-type details to show two side-by-side cards on the detail page. Projects with both are marked "Residential + Commercial" on cards and shown under both filters.</p>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Residential offering */}
          <div className={`rounded-xl border-2 p-4 transition ${p.hasResidential ? 'border-emerald-400 bg-emerald-50/40' : 'border-slate-200 bg-slate-50'}`}>
            <label className="flex items-center gap-2 font-semibold text-emerald-800 cursor-pointer">
              <input type="checkbox" checked={!!p.hasResidential} onChange={e => setP({ ...p, hasResidential: e.target.checked })} className="w-4 h-4 accent-emerald-700" />
              🏠 Residential Available
            </label>
            {p.hasResidential && (
              <div className="mt-3 space-y-2">
                <Field label="Unit Mix (e.g. 3/4 BHK)" value={p.residentialOffering?.unitMix || ''} onChange={v => setP({ ...p, residentialOffering: { ...(p.residentialOffering || {}), unitMix: v } })} />
                <Field label="Price Range (e.g. ₹1.5 Cr onwards)" value={p.residentialOffering?.priceRange || ''} onChange={v => setP({ ...p, residentialOffering: { ...(p.residentialOffering || {}), priceRange: v } })} />
                <Field label="Carpet / Super Area" value={p.residentialOffering?.carpet || ''} onChange={v => setP({ ...p, residentialOffering: { ...(p.residentialOffering || {}), carpet: v } })} />
                <div>
                  <label className="text-xs text-slate-500 uppercase">Highlights (comma-separated)</label>
                  <input value={Array.isArray(p.residentialOffering?.highlights) ? p.residentialOffering.highlights.join(', ') : (p.residentialOffering?.highlights || '')} onChange={e => setP({ ...p, residentialOffering: { ...(p.residentialOffering || {}), highlights: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Modular kitchen, VRF AC, Sky garden" />
                </div>
              </div>
            )}
          </div>
          {/* Commercial offering */}
          <div className={`rounded-xl border-2 p-4 transition ${p.hasCommercial ? 'border-amber-400 bg-amber-50/40' : 'border-slate-200 bg-slate-50'}`}>
            <label className="flex items-center gap-2 font-semibold text-amber-800 cursor-pointer">
              <input type="checkbox" checked={!!p.hasCommercial} onChange={e => setP({ ...p, hasCommercial: e.target.checked })} className="w-4 h-4 accent-amber-700" />
              🏢 Commercial Available
            </label>
            {p.hasCommercial && (
              <div className="mt-3 space-y-2">
                <Field label="Unit Type (e.g. Retail / Office / SCO)" value={p.commercialOffering?.unitMix || ''} onChange={v => setP({ ...p, commercialOffering: { ...(p.commercialOffering || {}), unitMix: v } })} />
                <Field label="Price Range (e.g. ₹80 L onwards)" value={p.commercialOffering?.priceRange || ''} onChange={v => setP({ ...p, commercialOffering: { ...(p.commercialOffering || {}), priceRange: v } })} />
                <Field label="Carpet / Super Area" value={p.commercialOffering?.carpet || ''} onChange={v => setP({ ...p, commercialOffering: { ...(p.commercialOffering || {}), carpet: v } })} />
                <div>
                  <label className="text-xs text-slate-500 uppercase">Highlights (comma-separated)</label>
                  <input value={Array.isArray(p.commercialOffering?.highlights) ? p.commercialOffering.highlights.join(', ') : (p.commercialOffering?.highlights || '')} onChange={e => setP({ ...p, commercialOffering: { ...(p.commercialOffering || {}), highlights: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="High footfall, Metro frontage, Lockable shops" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Media */}
        <h4 className="font-serif text-lg text-gillco-green mt-6 mb-2">Media</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <MediaUploader label="Project Logo" value={p.logo} onChange={v => setP({ ...p, logo: v })} accept="image/*" hint="Transparent PNG preferred, shown next to project name" />
          <MediaUploader label="Hero Image" value={p.heroImage} onChange={v => setP({ ...p, heroImage: v })} accept="image/*" />
        </div>
        <div className="mt-3">
          <Field label="YouTube Video ID (e.g. dQw4w9WgXcQ) — for project walkthrough" value={p.youtubeId} onChange={v => setP({ ...p, youtubeId: v })} />
        </div>

        {/* Awards */}
        <h4 className="font-serif text-lg text-gillco-green mt-6 mb-1">Awards & Recognition</h4>
        <p className="text-xs text-slate-500 mb-2">Shown as "Awarded by…" badges on the project card and inside the project details.</p>
        <div className="space-y-3" data-testid="awards-editor">
          {(p.awards || []).map((a, i) => {
            const upd = (patch) => setP({ ...p, awards: (p.awards || []).map((x, idx) => idx === i ? { ...x, ...patch } : x) });
            return (
              <div key={a.id || i} className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
                <div className="grid md:grid-cols-3 gap-2">
                  <Field label="Award Title (e.g. Best Residential Project)" value={a.title} onChange={v => upd({ title: v })} />
                  <Field label="Awarded By (e.g. CREDAI Punjab)" value={a.by} onChange={v => upd({ by: v })} />
                  <Field label="Year" value={a.year} onChange={v => upd({ year: v })} />
                </div>
                <div className="flex items-end gap-3">
                  <div className="flex-1"><MediaUploader label="Awarding Body Logo (optional)" value={a.logo} onChange={v => upd({ logo: v })} accept="image/*" hint="Square transparent PNG works best" /></div>
                  <button type="button" onClick={() => setP({ ...p, awards: (p.awards || []).filter((_, idx) => idx !== i) })} className="px-3 py-2 text-red-600 border border-red-200 rounded-full text-sm inline-flex items-center gap-1"><Trash2 className="w-4 h-4" /> Remove</button>
                </div>
              </div>
            );
          })}
          <button type="button" data-testid="add-award-btn" onClick={() => setP({ ...p, awards: [...(p.awards || []), { id: `a${Date.now()}`, title: '', by: '', year: String(new Date().getFullYear()), logo: '' }] })} className="px-4 py-2 border border-slate-300 rounded-full text-sm inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Award
          </button>
        </div>
        <div className="mt-3">
          <MediaUploader label="Brochure PDF (optional)" value={p.brochureUrl} onChange={v => setP({ ...p, brochureUrl: v })} accept="application/pdf" hint="PDF files only, up to 15 MB" />
        </div>
        <div className="mt-3">
          <label className="text-xs text-slate-500 uppercase">Gallery Images</label>
          <div className="mt-2">
            <MediaUploader label="Add gallery image" value={galleryInput} onChange={v => { if (v) { setP({ ...p, gallery: [...p.gallery, v] }); setGalleryInput(''); } else setGalleryInput(''); }} accept="image/*" hint="Uploaded images are added to the gallery automatically" />
          </div>
          <div className="mt-3 flex gap-2 flex-wrap">
            {p.gallery.map((g, i) => (
              <div key={i} className="relative group">
                <img loading="lazy" decoding="async" src={safeImg(g)} alt="" className="w-24 h-16 object-cover rounded" />
                <button onClick={() => removeGallery(i)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs">×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <h4 className="font-serif text-lg text-gillco-green mt-6 mb-2">Description</h4>
        <div>
          <label className="text-xs text-slate-500 uppercase">Summary</label>
          <textarea value={p.summary} onChange={e => setP({ ...p, summary: e.target.value })} rows={4} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg resize-none" />
        </div>

        {/* Amenities */}
        <h4 className="font-serif text-lg text-gillco-green mt-6 mb-2">Amenities</h4>
        <div className="flex gap-2">
          <input value={amenityInput} onChange={e => setAmenityInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAmenity(); } }} placeholder="e.g. Infinity Pool" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
          <button onClick={addAmenity} className="px-4 py-2 bg-gillco-green text-white rounded-lg text-sm">Add</button>
        </div>
        <div className="mt-3 flex gap-2 flex-wrap">
          {p.amenities.map((a, i) => (
            <span key={i} className="px-3 py-1 bg-gillco-cream border border-gillco-gold/30 rounded-full text-sm text-gillco-green inline-flex items-center gap-1">
              {a}
              <button onClick={() => removeAmenity(i)} className="text-red-500 hover:text-red-700">×</button>
            </span>
          ))}
        </div>

        {/* Milestones */}
        <h4 className="font-serif text-lg text-gillco-green mt-6 mb-2">Milestones</h4>
        <div className="space-y-2">
          {p.milestones.map((m, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <input type="date" value={m.date} onChange={e => updateMilestone(i, 'date', e.target.value)} className="col-span-3 px-2 py-1.5 border border-slate-200 rounded text-sm" />
              <input value={m.title} onChange={e => updateMilestone(i, 'title', e.target.value)} className="col-span-7 px-2 py-1.5 border border-slate-200 rounded text-sm" />
              <label className="col-span-1 text-xs flex items-center gap-1"><input type="checkbox" checked={m.done} onChange={e => updateMilestone(i, 'done', e.target.checked)} /> Done</label>
              <button onClick={() => removeMilestone(i)} className="col-span-1 text-red-500 text-sm">×</button>
            </div>
          ))}
          <button onClick={addMilestone} className="px-3 py-1.5 border border-slate-300 rounded-full text-sm inline-flex gap-1 items-center"><Plus className="w-3 h-3" /> Add Milestone</button>
        </div>

        {/* Video playlist */}
        <h4 className="font-serif text-lg text-gillco-green mt-6 mb-2">Video Playlist</h4>
        <p className="text-xs text-slate-500 mb-3">Show multiple video angles inside the project detail modal (walkthrough, amenity, interior, drone, etc.)</p>
        <div className="space-y-2">
          {(p.videos || []).map((v, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-center border border-slate-200 rounded-lg p-3">
              <div className="col-span-3"><Field label="Title" value={v.title} onChange={x => setP({ ...p, videos: p.videos.map((y, idx) => idx === i ? { ...y, title: x } : y) })} /></div>
              <div className="col-span-2"><Field label="Angle" value={v.angle} onChange={x => setP({ ...p, videos: p.videos.map((y, idx) => idx === i ? { ...y, angle: x } : y) })} /></div>
              <div className="col-span-3"><Field label="YouTube ID" value={v.youtubeId} onChange={x => setP({ ...p, videos: p.videos.map((y, idx) => idx === i ? { ...y, youtubeId: x } : y) })} /></div>
              <div className="col-span-3"><Field label="Poster URL" value={v.poster} onChange={x => setP({ ...p, videos: p.videos.map((y, idx) => idx === i ? { ...y, poster: x } : y) })} /></div>
              <button onClick={() => setP({ ...p, videos: p.videos.filter((_, idx) => idx !== i) })} className="col-span-1 text-red-500 text-lg pt-4">×</button>
            </div>
          ))}
          <button onClick={() => setP({ ...p, videos: [...(p.videos || []), { id: `v${Date.now()}`, title: '', angle: '', youtubeId: '', poster: '' }] })} className="px-4 py-2 border border-slate-300 rounded-full text-sm inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Video
          </button>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={() => onSave(p)} className="px-6 py-3 gradient-emerald text-white rounded-full font-semibold inline-flex items-center gap-2"><Save className="w-4 h-4" /> Save Project</button>
          <button onClick={onClose} className="px-6 py-3 border border-slate-300 rounded-full font-semibold">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="text-xs text-slate-500 uppercase tracking-wider">{label}</label>
      <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-gillco-green outline-none" />
    </div>
  );
}

/* ============ MediaUploader — drag/drop file uploads ============ */
function MediaUploader({ label, value, onChange, accept = 'image/*', hint = 'PNG, JPG, WebP, PDF up to 10 MB' }) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const upload = async (file) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { toast.error('File too large (max 15 MB)'); return; }
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) throw new Error('upload failed');
      const data = await res.json();
      onChange(data.url);
      toast.success('Uploaded');
    } catch (e) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  };

  const isImage = value && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(value) || value?.startsWith('http') || value?.startsWith('/uploads/') || value?.startsWith('/api/media/');

  return (
    <div>
      <label className="text-xs text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="mt-1 flex gap-3 items-start flex-wrap">
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex-1 min-w-[200px] border-2 border-dashed rounded-lg p-4 cursor-pointer transition text-center ${dragOver ? 'border-gillco-gold bg-gillco-cream' : 'border-slate-300 hover:border-gillco-green'}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={e => upload(e.target.files?.[0])}
            className="hidden"
          />
          {uploading ? (
            <div className="text-sm text-gillco-green py-3">Uploading…</div>
          ) : (
            <>
              <Download className="w-6 h-6 text-slate-400 mx-auto mb-2 rotate-180" />
              <div className="text-sm text-slate-700 font-medium">Drag & drop or click to upload</div>
              <div className="text-xs text-slate-400 mt-1">{hint}</div>
            </>
          )}
        </div>
        {value && (
          <div className="w-24 h-24 rounded-lg overflow-hidden border border-slate-200 relative group shrink-0">
            {isImage ? (
              <img loading="lazy" decoding="async" src={safeImg(value)} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 bg-slate-100 p-1 text-center">{value.split('/').pop()}</div>
            )}
            <button onClick={() => onChange('')} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition">×</button>
          </div>
        )}
      </div>
      <input value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder="…or paste URL" className="w-full mt-2 px-3 py-1.5 border border-slate-200 rounded text-xs text-slate-500 focus:border-gillco-green outline-none" />
    </div>
  );
}

/* ============================ FOOTER ============================ */
function Footer({ settings, goTo }) {
  return (
    <footer className="bg-gillco-green-dark text-white pt-16 pb-8 no-print">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-5 gap-10">
        <div className="md:col-span-2">
          <img loading="lazy" decoding="async" src={settings?.logoWhite || GILLCO_LOGO_WHITE} alt="Gillco Group" className="h-14 mb-4" />
          <p className="text-white/70 leading-relaxed max-w-md">
            Punjab's leading luxury real estate developer since 2001. Curating legacy spaces with modern design.
          </p>
          <div className="mt-6 space-y-2 text-sm">
            <a href={`tel:${settings?.phone}`} className="flex items-center gap-2 text-white/80 hover:text-gillco-gold"><Phone className="w-4 h-4" /> {settings?.phone}</a>
            <a href={`mailto:${settings?.email}`} className="flex items-center gap-2 text-white/80 hover:text-gillco-gold"><Mail className="w-4 h-4" /> {settings?.email}</a>
            <p className="flex items-start gap-2 text-white/80"><MapPin className="w-4 h-4 mt-0.5" /> {settings?.address}</p>
          </div>
        </div>
        <div>
          <h4 className="text-gillco-gold font-semibold uppercase text-sm tracking-widest mb-4">Explore</h4>
          <ul className="space-y-2 text-white/80 text-sm">
            <li><button onClick={() => goTo('about')} className="hover:text-gillco-gold">Legacy</button></li>
            <li><button onClick={() => goTo('projects')} className="hover:text-gillco-gold">Projects</button></li>
            <li><button onClick={() => goTo('team')} className="hover:text-gillco-gold">Team</button></li>
            <li><button onClick={() => goTo('news')} className="hover:text-gillco-gold">Spotlight</button></li>
            <li><a href="/blog" className="hover:text-gillco-gold">Blog</a></li>
            <li><a href="/emi-calculator" className="hover:text-gillco-gold">EMI Calculator</a></li>
            <li><button onClick={() => goTo('contact')} className="hover:text-gillco-gold">Contact</button></li>
          </ul>
        </div>
        <div>
          <h4 className="text-gillco-gold font-semibold uppercase text-sm tracking-widest mb-4">Projects</h4>
          <ul className="space-y-2 text-white/80 text-sm">
            <li><button onClick={() => goTo('upcoming')} className="hover:text-gillco-gold">Soft Launch</button></li>
            <li><button onClick={() => goTo('ongoing')} className="hover:text-gillco-gold">Ongoing</button></li>
            <li><button onClick={() => goTo('delivered')} className="hover:text-gillco-gold">Delivered</button></li>
            <li><button onClick={() => goTo('admin')} className="hover:text-gillco-gold">Admin CMS</button></li>
          </ul>
        </div>
        <div>
          <h4 className="text-gillco-gold font-semibold uppercase text-sm tracking-widest mb-4">Legal</h4>
          <ul className="space-y-2 text-white/80 text-sm">
            <li><a href="/terms" className="hover:text-gillco-gold">Terms & Conditions</a></li>
            <li><a href="/privacy" className="hover:text-gillco-gold">Privacy Policy</a></li>
            <li><a href="/payment-policy" className="hover:text-gillco-gold">Payment Policy</a></li>
            <li><a href="/cancellation-policy" className="hover:text-gillco-gold">Cancellation & Refund</a></li>
            <li><a href="/disclaimer" className="hover:text-gillco-gold">Disclaimer</a></li>
          </ul>
        </div>
      </div>

      {/* Channel Partner Attribution */}
      <div className="max-w-7xl mx-auto px-4 mt-12 pt-6 border-t border-white/10">
        <div className="bg-white/5 rounded-lg p-4 md:p-5 text-xs md:text-sm text-white/70 leading-relaxed">
          <p>
            <span className="font-semibold text-gillco-gold">This website is designed, published and managed by</span>{' '}
            <span className="font-bold text-white">QUALITY REAL ESTATE</span>, an authorised channel partner with{' '}
            <span className="font-bold text-white">GILLCO GROUP / GILLCO DEVELOPERS AND BUILDERS PVT. LTD.</span>, for marketing, branding and promotional purposes.
          </p>
          <p className="mt-2 text-white/50">
            All information, visuals, prices and timelines on this website are indicative and subject to change at the sole discretion of Gillco Group.
            Nothing on this website constitutes a legal offer. Please verify project details on <a href="https://rera.punjab.gov.in" target="_blank" rel="noopener noreferrer" className="underline hover:text-gillco-gold">rera.punjab.gov.in</a> before any booking decision.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6 flex items-center justify-between flex-wrap gap-3 text-xs text-white/50">
        <p>© {new Date().getFullYear()} Gillco Developers and Builders Pvt. Ltd. All rights reserved.</p>
        <p>Established 2001 · Mohali, Punjab, India</p>
      </div>
    </footer>
  );
}

export default App;
