'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { toast } from 'sonner';
import {
  Phone, Mail, MapPin, MessageCircle, Menu, X, ChevronLeft, ChevronRight,
  Search, ArrowRight, Award, Building2, Users, LandPlot, Home as HomeIcon,
  Calendar, CheckCircle2, Clock, Sparkles, Download, Printer, Trash2, Plus,
  Edit3, Save, LogIn, LogOut, Filter, Star, ExternalLink, ShieldCheck,
  Play, Facebook, Instagram, Linkedin, Youtube, Twitter,
} from 'lucide-react';

/* ---------- helpers ---------- */
const api = async (path, opts = {}) => {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) throw new Error((await res.json()).error || 'API error');
  return res.json();
};

const STATUS_MAP = {
  delivered: { label: 'Delivered', color: 'bg-emerald-700 text-white', ring: 'ring-emerald-700' },
  ongoing: { label: 'Ongoing', color: 'bg-orange-500 text-white', ring: 'ring-orange-500' },
  upcoming: { label: 'New Launch', color: 'bg-blue-600 text-white', ring: 'ring-blue-600' },
};

const GILLCO_LOGO = 'https://www.gillcogroup.com/gillco-logo-original.png';
const GILLCO_LOGO_WHITE = 'https://www.gillcogroup.com/gillco-logo-white.png';

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
    doc.text('helpdesk@gillcogroup.com  ·  +91 75290 19797  ·  gillcogroup.com', 40, H - 30);

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
    doc.text('helpdesk@gillcogroup.com  |  +91 75290 19797', W - 40, H - 30, { align: 'right' });

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

  const [mobileNav, setMobileNav] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');

  /* -------- load data -------- */
  useEffect(() => {
    (async () => {
      try {
        const [s, p, n, t] = await Promise.all([
          api('/settings'),
          api('/projects'),
          api('/news'),
          api('/team'),
        ]);
        setSettings(s);
        setProjects(p);
        setNews(n);
        setTeam(t);
      } catch (e) {
        console.error(e);
        toast.error('Failed to load site content');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* -------- popup enquiry (configurable) -------- */
  const popupRef = useRef(false);
  useEffect(() => {
    if (!settings?.popup?.enabled) return;
    if (popupRef.current) return;
    const cookieName = 'gillco_popup_seen';
    if (typeof document !== 'undefined' && document.cookie.includes(`${cookieName}=1`)) {
      popupRef.current = true;
      return;
    }
    const t = setTimeout(() => {
      if (popupRef.current) return;
      popupRef.current = true;
      setShowEnquiry(true);
      setEnquiryPrefill({ type: 'popup' });
      const hrs = settings.popup.cookieHours || 24;
      const d = new Date();
      d.setTime(d.getTime() + hrs * 60 * 60 * 1000);
      document.cookie = `${cookieName}=1; expires=${d.toUTCString()}; path=/`;
    }, (settings.popup.delaySeconds || 6) * 1000);
    return () => clearTimeout(t);
  }, [settings]);

  const filtered = useMemo(() => {
    return projects.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
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
      <div className="min-h-screen flex items-center justify-center bg-gillco-cream">
        <div className="text-center">
          <img src={GILLCO_LOGO} alt="Gillco" className="h-16 mx-auto mb-4 animate-pulse" />
          <p className="text-gillco-green font-medium">Loading Gillco Group…</p>
        </div>
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
      {view === 'admin' && <AdminView projects={projects} setProjects={setProjects} settings={settings} setSettings={setSettings} news={news} setNews={setNews} />}

      <Footer settings={settings} goTo={goTo} />

      {/* Sticky Enquire Button */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3 no-print">
        <a
          href={`https://wa.me/${settings?.whatsapp}?text=Hi%20Gillco%20Group`}
          target="_blank" rel="noreferrer"
          className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-2xl flex items-center justify-center transition"
          title="Chat on WhatsApp"
        >
          <MessageCircle className="w-6 h-6" />
        </a>
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
    { id: 'upcoming', label: 'Soft Launch' },
    { id: 'team', label: 'Team' },
    { id: 'news', label: 'Spotlight' },
    { id: 'contact', label: 'Contact' },
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
            <img src={GILLCO_LOGO} alt="Gillco Group" className="h-10 md:h-12" />
          </button>
          <nav className="hidden lg:flex items-center gap-6">
            {nav.map(n => (
              <button key={n.id} onClick={() => goTo(n.id)}
                className={`text-sm font-medium transition ${view === n.id ? 'text-gillco-green' : 'text-slate-600 hover:text-gillco-green'}`}>
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
function HomeView({ settings, projects, news, onProject, onEnquire, goTo, onCompareToggle, compare, onVideo }) {
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
                  <img src={p.heroImage} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-gillco-green-dark via-gillco-green/60 to-transparent" />
                  <span className={`absolute top-4 left-4 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${STATUS_MAP[p.status].color}`}>{STATUS_MAP[p.status].label}</span>
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <h3 className="font-serif text-2xl leading-tight">{p.name}</h3>
                    <p className="text-xs text-white/80 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {p.location}</p>
                  </div>
                  <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gillco-gold/95 backdrop-blur flex items-center justify-center text-slate-900 shadow-lg">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>
                {/* RERA panel */}
                <div className="bg-white p-5 space-y-2.5">
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

      {/* Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Award, val: `${settings?.stats?.years}+`, label: 'Years of Excellence' },
              { icon: Building2, val: `${settings?.stats?.projects}+`, label: 'Projects Delivered' },
              { icon: Users, val: `${settings?.stats?.families?.toLocaleString('en-IN')}+`, label: 'Happy Families' },
              { icon: LandPlot, val: settings?.stats?.sqft, label: 'Sq. Ft. Developed' },
            ].map((s, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-gillco-cream border border-gillco-gold/20 hover:shadow-md transition">
                <s.icon className="w-8 h-8 text-gillco-gold mx-auto mb-3" />
                <div className="font-serif text-4xl md:text-5xl text-gillco-green font-semibold">{s.val}</div>
                <div className="text-xs md:text-sm text-slate-600 mt-2 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Project — Meraqui */}
      {featured && (
        <section className="py-20 bg-gillco-cream">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <img src={featured.heroImage} alt={featured.name} className="rounded-2xl shadow-2xl w-full aspect-[4/3] object-cover" />
                <div className="absolute -bottom-6 -right-6 bg-gillco-green text-white p-6 rounded-2xl shadow-xl hidden md:block">
                  <div className="text-4xl font-serif text-gillco-gold">{featured.acres}</div>
                  <div className="text-xs uppercase tracking-wider">Acres</div>
                </div>
              </div>
              <div>
                <p className="text-xs tracking-[0.3em] text-gillco-gold font-semibold uppercase">Signature Development</p>
                <h2 className="font-serif text-4xl md:text-5xl text-gillco-green mt-3">{featured.name}</h2>
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
                  <img src={v.poster} alt={v.title} className="w-full h-64 object-cover group-hover:scale-110 transition duration-700" />
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
            {news.slice(0, 3).map(n => (
              <div key={n.id} className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10 hover:bg-white/10 transition">
                <div className="text-gillco-gold text-xs tracking-wider uppercase mb-2">
                  {new Date(n.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} · {n.category}
                </div>
                <p className="text-white/90 leading-relaxed">{n.title}</p>
              </div>
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
          style={{ backgroundImage: `url(${s.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
      ))}
      <div className="absolute inset-0 hero-overlay" />
      <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-center text-white">
        <p className="text-xs md:text-sm tracking-[0.4em] text-gillco-gold uppercase font-semibold animate-fadeInUp">Est. {settings?.founded} · Punjab</p>
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
function ProjectCard({ project, onOpen, onCompareToggle, inCompare }) {
  const s = STATUS_MAP[project.status];
  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all">
      <div className="relative h-64 overflow-hidden">
        <img src={project.heroImage} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
        <span className={`absolute top-4 left-4 text-xs font-semibold px-3 py-1.5 rounded-full ${s.color}`}>{s.label}</span>
        <span className="absolute top-4 right-4 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/90 text-slate-800 capitalize">{project.category}</span>
      </div>
      <div className="p-6">
        <h3 className="font-serif text-2xl text-gillco-green">{project.name}</h3>
        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" /> {project.location}</p>
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
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100 mb-8">
          <div className="grid md:grid-cols-4 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or location…" className="w-full pl-9 pr-3 py-2.5 rounded-full border border-slate-200 text-sm focus:border-gillco-green outline-none" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2.5 rounded-full border border-slate-200 text-sm focus:border-gillco-green outline-none">
              <option value="all">All Status</option>
              <option value="delivered">Delivered</option>
              <option value="ongoing">Ongoing</option>
              <option value="upcoming">Upcoming / Soft Launch</option>
            </select>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-4 py-2.5 rounded-full border border-slate-200 text-sm focus:border-gillco-green outline-none">
              <option value="all">All Categories</option>
              <option value="residential">Residential</option>
              <option value="industrial">Industrial</option>
              <option value="commercial">Commercial</option>
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
function ProjectDetail({ project, onClose, onEnquire, onCompareToggle, inCompare }) {
  const s = STATUS_MAP[project.status];
  const [imgIdx, setImgIdx] = useState(0);
  const gallery = project.gallery?.length ? project.gallery : [project.heroImage];
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm overflow-y-auto no-print">
      <div className="min-h-screen py-8 px-4 flex items-start justify-center">
        <div className="bg-white w-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl">
          {/* Gallery */}
          <div className="relative h-96 bg-slate-100">
            <img src={gallery[imgIdx]} alt={project.name} className="w-full h-full object-cover" />
            <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 hover:bg-white flex items-center justify-center"><X className="w-5 h-5" /></button>
            <span className={`absolute top-4 left-4 text-xs font-semibold px-3 py-1.5 rounded-full ${s.color}`}>{s.label}</span>
            {gallery.length > 1 && (
              <>
                <button onClick={() => setImgIdx((imgIdx - 1 + gallery.length) % gallery.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center"><ChevronLeft /></button>
                <button onClick={() => setImgIdx((imgIdx + 1) % gallery.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center"><ChevronRight /></button>
              </>
            )}
          </div>
          <div className="p-8">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <h2 className="font-serif text-4xl text-gillco-green">{project.name}</h2>
                <p className="text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-4 h-4" /> {project.location}</p>
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

            <p className="mt-6 text-slate-700 leading-relaxed">{project.summary}</p>

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

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => onEnquire('detail-enquire')} className="px-6 py-3 bg-gillco-green text-white rounded-full font-medium">Enquire Now</button>
              <button onClick={() => onEnquire('schedule-visit')} className="px-6 py-3 gradient-gold text-slate-900 rounded-full font-semibold">Schedule a Visit</button>
              {project.status === 'upcoming' && <button onClick={() => onEnquire('soft-launch')} className="px-6 py-3 border-2 border-gillco-green text-gillco-green rounded-full font-medium">Book Soft Launch</button>}
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
      doc.text('© Gillco Group · helpdesk@gillcogroup.com · +91 75290 19797', 40, pageH - 20);

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
                        <img src={p.heroImage} alt={p.name} className="w-full h-32 object-cover rounded-lg mb-2" />
                        <div className="font-serif text-lg text-gillco-green">{p.name}</div>
                        <div className="text-xs text-slate-500">{p.location}</div>
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
function EnquiryModal({ prefill, settings, onClose, projects }) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    projectId: prefill.projectId || '',
    projectName: prefill.projectName || '',
    message: '',
    consent: false,
  });
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
    setSubmitting(true);
    try {
      const proj = projects.find(p => p.id === form.projectId);
      await api('/enquiries', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          projectName: proj?.name || form.projectName,
          type: prefill.type || 'general',
          utm,
        }),
      });
      toast.success('Thank you! Our team will contact you shortly.');
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
            <p className="text-xs tracking-widest text-gillco-gold uppercase font-semibold">Gillco Group</p>
            <h2 className="font-serif text-3xl mt-1">{title}</h2>
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
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">Interested In</label>
              <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} className="w-full mt-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:border-gillco-green outline-none">
                <option value="">Select a project (optional)</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name} — {p.location}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider">Message</label>
              <textarea rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Any specific requirement?" className="w-full mt-1 px-4 py-2.5 border border-slate-200 rounded-lg focus:border-gillco-green outline-none resize-none" />
            </div>
            <label className="flex items-start gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={form.consent} onChange={e => setForm({ ...form, consent: e.target.checked })} className="mt-0.5" />
              I consent to Gillco Group storing my details to contact me about my enquiry. I understand my data will not be shared with third parties without consent.
            </label>
            <button type="submit" disabled={submitting} className="w-full py-3 gradient-emerald text-white rounded-full font-semibold hover:brightness-110 disabled:opacity-50 transition">
              {submitting ? 'Sending…' : 'Submit Enquiry'}
            </button>
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
        <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl bg-black">
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
              <img src={video.poster} alt={video.title} className="w-full h-full object-cover opacity-60" />
              <div className="absolute text-center">
                <p className="text-lg">Video coming soon</p>
                <p className="text-sm text-white/60 mt-1">Contact us for a personalized walkthrough</p>
              </div>
            </div>
          )}
        </div>
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
                <img src={m.photo} alt={m.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
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
function NewsView({ news }) {
  return (
    <section className="py-20 bg-white min-h-screen">
      <div className="max-w-5xl mx-auto px-4">
        <p className="text-xs tracking-[0.3em] text-gillco-gold font-semibold uppercase text-center">Corporate Spotlight</p>
        <h1 className="font-serif text-5xl text-gillco-green text-center mt-3">News & Announcements</h1>
        <div className="mt-12 space-y-4">
          {news.map(n => (
            <div key={n.id} className="p-6 bg-gillco-cream rounded-2xl border border-gillco-gold/20 hover:shadow-md transition">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="w-24 shrink-0">
                  <div className="text-gillco-gold text-xs uppercase tracking-widest font-semibold">
                    {new Date(n.date).toLocaleDateString('en-IN', { month: 'short' })}
                  </div>
                  <div className="font-serif text-3xl text-gillco-green">
                    {new Date(n.date).getFullYear()}
                  </div>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <span className="text-xs bg-gillco-green text-white px-2 py-0.5 rounded-full">{n.category}</span>
                  <p className="text-slate-800 font-medium leading-relaxed mt-2">{n.title}</p>
                </div>
              </div>
            </div>
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
function AdminView({ projects, setProjects, settings, setSettings, news, setNews }) {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState('');
  const [tab, setTab] = useState('projects');
  const [editing, setEditing] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [team, setTeam] = useState([]);

  useEffect(() => { if (authed && tab === 'enquiries') api('/enquiries').then(setEnquiries).catch(() => {}); }, [authed, tab]);
  useEffect(() => { if (authed) api('/team').then(setTeam).catch(() => {}); }, [authed]);

  const login = async (e) => {
    e.preventDefault();
    try {
      const r = await api('/admin/login', { method: 'POST', body: JSON.stringify({ password: pass }) });
      if (r.ok) { setAuthed(true); toast.success('Welcome, admin'); }
    } catch { toast.error('Invalid password'); }
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

  if (!authed) {
    return (
      <section className="py-24 bg-gillco-cream min-h-screen">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow border border-gillco-gold/20">
            <ShieldCheck className="w-10 h-10 text-gillco-gold mx-auto" />
            <h1 className="font-serif text-3xl text-gillco-green text-center mt-4">Admin Login</h1>
            <p className="text-center text-sm text-slate-500 mt-2">Content management for Gillco Group.</p>
            <form onSubmit={login} className="mt-6 space-y-3">
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Admin password" className="w-full px-4 py-3 border border-slate-200 rounded-lg" />
              <button className="w-full py-3 gradient-emerald text-white rounded-full font-semibold inline-flex items-center justify-center gap-2"><LogIn className="w-4 h-4" /> Sign In</button>
              <p className="text-xs text-center text-slate-400 mt-2">Default password: <code className="bg-slate-100 px-1 py-0.5 rounded">gillco2025</code></p>
            </form>
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
    { id: 'team', label: 'Team' },
    { id: 'settings', label: 'Site & Brand' },
    { id: 'enquiries', label: 'Enquiries' },
  ];

  return (
    <section className="py-12 bg-gillco-cream min-h-screen">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="font-serif text-4xl text-gillco-green">Content Manager</h1>
            <p className="text-sm text-slate-500">Edit every piece of content on the site — no code needed.</p>
          </div>
          <button onClick={() => setAuthed(false)} className="px-4 py-2 border border-slate-300 rounded-full text-sm inline-flex items-center gap-2"><LogOut className="w-4 h-4" /> Logout</button>
        </div>

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
                    <img src={p.heroImage || 'https://via.placeholder.com/80x64/f8f5ee/0b5138?text=No+Image'} className="w-20 h-16 object-cover rounded" alt="" />
                    <div>
                      <div className="font-serif text-xl text-gillco-green">{p.name}</div>
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
        {tab === 'team' && (
          <TeamEditor team={team} setTeam={setTeam} />
        )}
        {tab === 'settings' && settings && (
          <SettingsEditor settings={settings} onSave={saveSettings} />
        )}
        {tab === 'enquiries' && (
          <div className="bg-white rounded-xl border border-slate-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gillco-cream">
                <tr><th className="text-left p-3">Date</th><th className="text-left p-3">Name</th><th className="text-left p-3">Phone</th><th className="text-left p-3">Email</th><th className="text-left p-3">Project</th><th className="text-left p-3">Source</th></tr>
              </thead>
              <tbody>
                {enquiries.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-slate-500">No enquiries yet.</td></tr>
                ) : enquiries.map(e => (
                  <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3 text-xs">{new Date(e.createdAt).toLocaleString('en-IN')}</td>
                    <td className="p-3 font-medium">{e.name}</td>
                    <td className="p-3">{e.phone}</td>
                    <td className="p-3">{e.email || '—'}</td>
                    <td className="p-3">{e.projectName || '—'}</td>
                    <td className="p-3"><span className="text-xs bg-gillco-cream text-gillco-green px-2 py-0.5 rounded-full">{e.type}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
            <img src={s.image || 'https://via.placeholder.com/120x80/f8f5ee/0b5138?text=No+Image'} alt="" className="w-32 h-20 rounded object-cover" />
            <div className="flex-1 grid md:grid-cols-3 gap-3 min-w-[300px]">
              <Field label={`Slide ${i + 1} Image URL`} value={s.image} onChange={v => update(i, 'image', v)} />
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
            <img src={v.poster || 'https://via.placeholder.com/160x90/f8f5ee/0b5138?text=Poster'} alt="" className="w-40 h-24 rounded object-cover" />
            <div className="flex-1 grid md:grid-cols-3 gap-3 min-w-[300px]">
              <Field label="Title" value={v.title} onChange={x => update(i, 'title', x)} />
              <Field label="Poster Image URL" value={v.poster} onChange={x => update(i, 'poster', x)} />
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
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-2xl text-gillco-green">News & Announcements</h3>
        <button onClick={() => setEditing({ date: new Date().toISOString().slice(0, 10), title: '', category: 'Corporate' })} className="px-4 py-2 gradient-gold text-slate-900 rounded-full text-sm font-semibold inline-flex items-center gap-2"><Plus className="w-4 h-4" /> Add News</button>
      </div>
      <div className="space-y-2">
        {news.map(n => (
          <div key={n.id} className="border border-slate-100 rounded-lg p-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex-1">
              <div className="text-xs text-gillco-gold">{new Date(n.date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })} · {n.category}</div>
              <div className="text-sm text-slate-800">{n.title}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(n)} className="px-3 py-1.5 bg-gillco-green text-white text-xs rounded-full inline-flex gap-1 items-center"><Edit3 className="w-3 h-3" /> Edit</button>
              <button onClick={() => del(n.id)} className="px-3 py-1.5 border border-red-300 text-red-600 text-xs rounded-full"><Trash2 className="w-3 h-3" /></button>
            </div>
          </div>
        ))}
      </div>
      {editing && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-serif text-xl text-gillco-green">{editing.id ? 'Edit' : 'New'} News</h4>
              <button onClick={() => setEditing(null)}><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <Field label="Date (YYYY-MM-DD)" value={editing.date} onChange={v => setEditing({ ...editing, date: v })} />
              <Field label="Category" value={editing.category} onChange={v => setEditing({ ...editing, category: v })} />
              <div>
                <label className="text-xs text-slate-500 uppercase">Headline</label>
                <textarea rows={3} value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg resize-none" />
              </div>
              <button onClick={() => save(editing)} className="w-full py-2.5 gradient-emerald text-white rounded-full font-semibold"><Save className="w-4 h-4 inline mr-1" /> Save</button>
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
            <img src={m.photo || 'https://via.placeholder.com/120/f8f5ee/0b5138?text=Photo'} alt={m.name} className="w-24 h-24 rounded-full object-cover mx-auto mb-2" />
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
              <Field label="Photo URL" value={editing.photo} onChange={v => setEditing({ ...editing, photo: v })} />
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

      <h4 className="font-serif text-xl text-gillco-green mt-6">Social Media</h4>
      <div className="grid md:grid-cols-2 gap-3">
        <Field label="Facebook URL" value={s.social?.facebook} onChange={v => setS({ ...s, social: { ...(s.social || {}), facebook: v } })} />
        <Field label="Instagram URL" value={s.social?.instagram} onChange={v => setS({ ...s, social: { ...(s.social || {}), instagram: v } })} />
        <Field label="LinkedIn URL" value={s.social?.linkedin} onChange={v => setS({ ...s, social: { ...(s.social || {}), linkedin: v } })} />
        <Field label="YouTube URL" value={s.social?.youtube} onChange={v => setS({ ...s, social: { ...(s.social || {}), youtube: v } })} />
        <Field label="X / Twitter URL" value={s.social?.twitter} onChange={v => setS({ ...s, social: { ...(s.social || {}), twitter: v } })} />
      </div>

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

        {/* Media */}
        <h4 className="font-serif text-lg text-gillco-green mt-6 mb-2">Media</h4>
        <Field label="Hero Image URL" value={p.heroImage} onChange={v => setP({ ...p, heroImage: v })} />
        <Field label="Brochure URL (real PDF, optional — else auto-generated)" value={p.brochureUrl} onChange={v => setP({ ...p, brochureUrl: v })} />
        <div className="mt-3">
          <label className="text-xs text-slate-500 uppercase">Gallery Images</label>
          <div className="flex gap-2 mt-1">
            <input value={galleryInput} onChange={e => setGalleryInput(e.target.value)} placeholder="Paste image URL" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" />
            <button onClick={addGallery} className="px-4 py-2 bg-gillco-green text-white rounded-lg text-sm">Add</button>
          </div>
          <div className="mt-2 flex gap-2 flex-wrap">
            {p.gallery.map((g, i) => (
              <div key={i} className="relative group">
                <img src={g} alt="" className="w-24 h-16 object-cover rounded" />
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

/* ============================ FOOTER ============================ */
function Footer({ settings, goTo }) {
  return (
    <footer className="bg-gillco-green-dark text-white pt-16 pb-8 no-print">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-10">
        <div className="md:col-span-2">
          <img src={GILLCO_LOGO_WHITE} alt="Gillco Group" className="h-14 mb-4" />
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
      </div>
      <div className="max-w-7xl mx-auto px-4 mt-12 pt-6 border-t border-white/10 flex items-center justify-between flex-wrap gap-3 text-xs text-white/60">
        <p>© {new Date().getFullYear()} Gillco Group. All rights reserved.</p>
        <p>Established 2001 · Punjab, India</p>
      </div>
    </footer>
  );
}

export default App;
