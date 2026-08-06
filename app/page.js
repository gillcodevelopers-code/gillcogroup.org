'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, MapPin, Calendar, ShieldCheck, CheckCircle2, Clock, Sparkles, 
  ChevronRight, Phone, Mail, FileText, Download, Eye, ArrowRight, X, 
  Search, Filter, Plus, Check, Star, Award, Users, Globe, Share2, 
  Printer, MessageSquare, Menu, AlertCircle, RefreshCw, BarChart3, Settings,
  SlidersHorizontal, ExternalLink, ThumbsUp, Layers, HelpCircle
} from 'lucide-react';

// --- MOCK DATA ---
const INITIAL_PROJECTS = [
  {
    id: 'aura-grandeur',
    name: 'Aura Grandeur Residences',
    tagline: 'Ultra-Luxury Skyline Penthouses & 4/5 BHK Mansions',
    category: 'Ongoing',
    statusBadge: 'Ongoing',
    statusColor: 'bg-amber-500 text-white',
    location: 'Bandra West, Mumbai',
    priceRange: '₹8.5 Cr - ₹24 Cr',
    unitMix: '4 & 5 BHK Sky Mansions',
    reraNumber: 'P51800029841',
    reraStatus: 'Verified & Active',
    reraTimestamp: 'Updated 2 weeks ago',
    completionPct: 78,
    launchDate: 'Q1 2023',
    handoverDate: 'Q4 2026',
    acres: '4.5 Acres',
    unitsDelivered: '180 Units',
    image: 'https://images.pexels.com/photos/13416122/pexels-photo-13416122.jpeg',
    gallery: [
      'https://images.pexels.com/photos/13416122/pexels-photo-13416122.jpeg',
      'https://images.pexels.com/photos/33902818/pexels-photo-33902818.jpeg',
      'https://images.pexels.com/photos/37495707/pexels-photo-37495707.jpeg'
    ],
    description: 'Aura Grandeur is an architectural masterpiece offering panoramic sea views, private infinity pools on every deck, and world-class concierge services managed by international hospitality experts.',
    amenities: ['Skyline Infinity Pool', 'Helipad Access', 'Private Elevator', 'Valet & Concierge', 'State-of-the-Art Spa', 'Wine Cellar Lounge'],
    milestones: [
      { title: 'Foundation & Substructure', date: 'June 2023', completed: true },
      { title: 'Superstructure 25th Floor', date: 'January 2025', completed: true },
      { title: 'Facade & Glazing Installation', date: 'October 2025', completed: true },
      { title: 'Interior Fit-outs & MEP', date: 'July 2026', completed: false },
      { title: 'Final Handover & OC', date: 'December 2026', completed: false },
    ],
    progressFeed: [
      { date: '10 June 2026', note: 'Facade glazing completed on the 32nd floor tower A.', img: 'https://images.pexels.com/photos/37495707/pexels-photo-37495707.jpeg' },
      { date: '22 May 2026', note: 'Clubhouse interior marble cladding initiated.', img: 'https://images.pexels.com/photos/33902818/pexels-photo-33902818.jpeg' }
    ]
  },
  {
    id: 'aura-forest-woods',
    name: 'Aura Forest Woods',
    tagline: 'Eco-Luxury Biophilic Villas & 3/4 BHK Apartments',
    category: 'Delivered',
    statusBadge: 'Delivered',
    statusColor: 'bg-emerald-700 text-white',
    location: 'Whitefield, Bangalore',
    priceRange: '₹2.8 Cr - ₹6.5 Cr',
    unitMix: '3, 4 BHK & Garden Villas',
    reraNumber: 'PRM/KA/RERA/1251/308/PR/201215/003810',
    reraStatus: 'Completed & OC Received',
    reraTimestamp: 'Verified 1 month ago',
    completionPct: 100,
    launchDate: 'Q2 2021',
    handoverDate: 'Q1 2025',
    acres: '18 Acres',
    unitsDelivered: '420 Units',
    image: 'https://images.pexels.com/photos/28567004/pexels-photo-28567004.jpeg',
    gallery: [
      'https://images.pexels.com/photos/28567004/pexels-photo-28567004.jpeg',
      'https://images.pexels.com/photos/33634443/pexels-photo-33634443.jpeg'
    ],
    description: 'Designed around 500 preserved mature trees, Aura Forest Woods integrates biophilic design with net-zero carbon infrastructure, organic orchards, and Olympic-length bio-pools.',
    amenities: ['Bio-Pools', 'Organic Farming Plots', 'Solar Micro-Grid', 'Equestrian Stables', 'Organic Cafe', 'Tennis Academy'],
    milestones: [
      { title: 'Land Acquisition & Zoning', date: 'March 2021', completed: true },
      { title: 'Phase 1 Villa Structures', date: 'August 2022', completed: true },
      { title: 'Central Forest Park Development', date: 'May 2023', completed: true },
      { title: 'Occupancy Certificate Received', date: 'January 2025', completed: true },
    ],
    progressFeed: [
      { date: '15 Jan 2025', note: 'All 420 families successfully handed over keys.', img: 'https://images.pexels.com/photos/28567004/pexels-photo-28567004.jpeg' }
    ]
  },
  {
    id: 'aura-sovereign',
    name: 'Aura Sovereign Crown',
    tagline: 'Iconic Financial District Mixed-Use Towers',
    category: 'Upcoming',
    statusBadge: 'Soft Launch',
    statusColor: 'bg-blue-600 text-white',
    location: 'Gachibowli, Hyderabad',
    priceRange: '₹4.2 Cr - ₹12 Cr',
    unitMix: '3 & 4 BHK Smart Residences',
    reraNumber: 'P02400005421',
    reraStatus: 'Approved - Priority Booking Open',
    reraTimestamp: 'Updated 3 days ago',
    completionPct: 15,
    launchDate: 'Q3 2026',
    handoverDate: 'Q2 2029',
    acres: '12 Acres',
    unitsDelivered: '650 Units',
    image: 'https://images.pexels.com/photos/37495707/pexels-photo-37495707.jpeg',
    gallery: [
      'https://images.pexels.com/photos/37495707/pexels-photo-37495707.jpeg',
      'https://images.pexels.com/photos/13416122/pexels-photo-13416122.jpeg'
    ],
    description: 'Aura Sovereign Crown brings futuristic smart home automation, high-speed elevators, and a 100,000 sq.ft clubhouse with rooftop dining to Hyderabad financial hub.',
    amenities: ['100k sq.ft Clubhouse', 'Co-working Suites', 'Rooftop Helipad', 'AI Smart Security', 'Olympic Indoor Pool'],
    milestones: [
      { title: 'Soil Testing & Approvals', date: 'January 2026', completed: true },
      { title: 'Soft Launch & VIP Pre-booking', date: 'July 2026', completed: true },
      { title: 'Excavation & Raft Foundation', date: 'October 2026', completed: false },
      { title: 'Structural Completion', date: 'December 2028', completed: false },
    ],
    progressFeed: [
      { date: '01 July 2026', note: 'VIP Soft Launch event commenced with 250+ EOI bookings.', img: 'https://images.pexels.com/photos/37495707/pexels-photo-37495707.jpeg' }
    ]
  },
  {
    id: 'aura-serenity',
    name: 'Aura Serenity Bay',
    tagline: 'Waterfront Resort Living & Luxury Suites',
    category: 'Delivered',
    statusBadge: 'Delivered',
    statusColor: 'bg-emerald-700 text-white',
    location: 'ECR Coast Road, Chennai',
    priceRange: '₹3.5 Cr - ₹9.0 Cr',
    unitMix: '3 & 4 BHK Beachfront Duplexes',
    reraNumber: 'TN/01/Building/0198/2022',
    reraStatus: 'Completed & Handed Over',
    reraTimestamp: 'Verified 6 months ago',
    completionPct: 100,
    launchDate: 'Q1 2020',
    handoverDate: 'Q4 2023',
    acres: '10 Acres',
    unitsDelivered: '150 Units',
    image: 'https://images.pexels.com/photos/33634443/pexels-photo-33634443.jpeg',
    gallery: [
      'https://images.pexels.com/photos/33634443/pexels-photo-33634443.jpeg',
      'https://images.pexels.com/photos/28567004/pexels-photo-28567004.jpeg'
    ],
    description: 'Experience pristine private beach access, direct ocean vistas, and resort-grade amenities at Aura Serenity Bay, crafted for discerning coastal connoisseurs.',
    amenities: ['Private Beach', 'Yacht Marina Deck', 'Seaside Spa', 'Infinity Saltwater Pool', 'Private Dining Pavilion'],
    milestones: [
      { title: 'Coastal Clearance & Permits', date: 'May 2020', completed: true },
      { title: 'Structural Framing', date: 'December 2021', completed: true },
      { title: 'Handover & Resort Launch', date: 'November 2023', completed: true },
    ],
    progressFeed: [
      { date: '15 Dec 2023', note: 'Property management taken over by Aura Hospitality.', img: 'https://images.pexels.com/photos/33634443/pexels-photo-33634443.jpeg' }
    ]
  }
];

export default function RealEstateApp() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [activeTab, setActiveTab] = useState('home'); // home, projects, compare, delivered, ongoing, upcoming, about, team, news, cms, contact
  const [selectedProject, setSelectedProject] = useState(null); // for project detail modal
  const [compareList, setCompareList] = useState([]); // list of project IDs for comparison
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showEnquireModal, setShowEnquireModal] = useState(false);
  const [enquireProjectName, setEnquireProjectName] = useState('General Enquiry');
  const [toastMessage, setToastMessage] = useState(null);
  
  // Filters for projects
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Chat drawer
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Welcome to AuraCorp Developers! How can I assist you with our luxury properties today?' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // CMS state for editing
  const [cmsProjects, setCmsProjects] = useState(INITIAL_PROJECTS);
  const [popupDelaySec, setPopupDelaySec] = useState(5);
  const [popupEnabled, setPopupEnabled] = useState(true);

  // Trigger popup after delay on initial load
  useEffect(() => {
    if (popupEnabled) {
      const timer = setTimeout(() => {
        const suppressed = sessionStorage.getItem('auracorp_popup_suppressed');
        if (!suppressed) {
          setShowPopup(true);
        }
      }, popupDelaySec * 1000);
      return () => clearTimeout(timer);
    }
  }, [popupEnabled, popupDelaySec]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: newMsg }]);
    setChatInput('');
    setTimeout(() => {
      setChatMessages(prev => [...prev, { sender: 'bot', text: 'Thank you for your query. Our senior sales consultant will connect with you via phone/WhatsApp within 15 minutes.' }]);
    }, 1000);
  };

  const toggleCompare = (id) => {
    if (compareList.includes(id)) {
      setCompareList(compareList.filter(item => item !== id));
      showToast('Project removed from comparison');
    } else {
      if (compareList.length >= 4) {
        showToast('You can compare a maximum of 4 projects simultaneously.');
        return;
      }
      setCompareList([...compareList, id]);
      showToast('Project added to comparison list');
    }
  };

  // Filtered projects
  const filteredProjects = projects.filter(p => {
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.unitMix.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 border border-amber-500 animate-bounce">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <span className="font-medium text-sm">{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER BAR */}
      <div className="bg-emerald-950 text-emerald-100 text-xs py-2 px-4 border-b border-emerald-900">
        <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center space-x-4">
            <span className="flex items-center"><ShieldCheck className="w-4 h-4 mr-1 text-amber-400" /> RERA Registered Developer</span>
            <span className="hidden md:inline">|</span>
            <span className="hidden md:inline">ISO 9001:2015 & ISO 14001:2015 Certified</span>
          </div>
          <div className="flex items-center space-x-6">
            <a href="tel:+918005559999" className="flex items-center hover:text-amber-400 transition">
              <Phone className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> +91 800 555 9999
            </a>
            <button onClick={() => { setActiveTab('contact'); }} className="hover:text-amber-400 transition font-semibold">
              Client Portal / Enquire
            </button>
          </div>
        </div>
      </div>

      {/* MAIN NAVIGATION */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          
          {/* Logo */}
          <div onClick={() => setActiveTab('home')} className="cursor-pointer flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-900 flex items-center justify-center text-amber-400 shadow-md">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-cinzel text-xl font-bold tracking-wider text-emerald-950">AURACORP</h1>
              <p className="text-[10px] tracking-widest text-amber-600 font-semibold uppercase">Luxury Developers</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-6 text-sm font-semibold text-slate-700">
            <button onClick={() => setActiveTab('home')} className={`transition hover:text-emerald-800 ${activeTab === 'home' ? 'text-emerald-800 border-b-2 border-amber-500 pb-1' : ''}`}>Home</button>
            <button onClick={() => setActiveTab('projects')} className={`transition hover:text-emerald-800 ${activeTab === 'projects' ? 'text-emerald-800 border-b-2 border-amber-500 pb-1' : ''}`}>All Projects</button>
            <button onClick={() => setActiveTab('delivered')} className={`transition hover:text-emerald-800 ${activeTab === 'delivered' ? 'text-emerald-800 border-b-2 border-amber-500 pb-1' : ''}`}>Delivered</button>
            <button onClick={() => setActiveTab('ongoing')} className={`transition hover:text-emerald-800 ${activeTab === 'ongoing' ? 'text-emerald-800 border-b-2 border-amber-500 pb-1' : ''}`}>Ongoing</button>
            <button onClick={() => setActiveTab('upcoming')} className={`transition hover:text-emerald-800 ${activeTab === 'upcoming' ? 'text-emerald-800 border-b-2 border-amber-500 pb-1' : ''}`}>Soft Launch</button>
            <button onClick={() => setActiveTab('about')} className={`transition hover:text-emerald-800 ${activeTab === 'about' ? 'text-emerald-800 border-b-2 border-amber-500 pb-1' : ''}`}>About Us</button>
            <button onClick={() => setActiveTab('team')} className={`transition hover:text-emerald-800 ${activeTab === 'team' ? 'text-emerald-800 border-b-2 border-amber-500 pb-1' : ''}`}>Leadership</button>
            <button onClick={() => setActiveTab('news')} className={`transition hover:text-emerald-800 ${activeTab === 'news' ? 'text-emerald-800 border-b-2 border-amber-500 pb-1' : ''}`}>News & Media</button>
            <button onClick={() => setActiveTab('cms')} className={`transition hover:text-emerald-800 text-amber-700 flex items-center ${activeTab === 'cms' ? 'border-b-2 border-amber-500 pb-1' : ''}`}><Settings className="w-3.5 h-3.5 mr-1" /> CMS Panel</button>
          </nav>

          {/* Action buttons */}
          <div className="flex items-center space-x-3">
            {compareList.length > 0 && (
              <button 
                onClick={() => setShowCompareModal(true)}
                className="relative bg-amber-100 text-amber-900 border border-amber-400 px-3 py-2 rounded-lg text-xs font-bold flex items-center hover:bg-amber-200 transition"
              >
                <SlidersHorizontal className="w-4 h-4 mr-1" />
                Compare ({compareList.length})
              </button>
            )}
            <button 
              onClick={() => { setEnquireProjectName('General Enquiry'); setShowEnquireModal(true); }}
              className="bg-emerald-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-800 transition shadow-md flex items-center"
            >
              <Sparkles className="w-4 h-4 mr-2 text-amber-400" />
              Enquire Now
            </button>
          </div>

        </div>
      </header>

      {/* ========================================================== */}
      {/* 1. HOME TAB                                                 */}
      {/* ========================================================== */}
      {activeTab === 'home' && (
        <main className="flex-1">
          {/* Hero Section */}
          <section className="relative bg-emerald-950 text-white min-h-[620px] flex items-center overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-40">
              <img 
                src="https://images.pexels.com/photos/13416122/pexels-photo-13416122.jpeg" 
                alt="Luxury Township" 
                className="w-full h-full object-cover scale-105 animate-pulse duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-950 via-emerald-950/80 to-transparent"></div>
            </div>

            <div className="container mx-auto px-4 z-10 py-20">
              <div className="max-w-3xl">
                <div className="inline-flex items-center space-x-2 bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 rounded-full text-amber-300 text-xs font-bold tracking-wide uppercase mb-6">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Award-Winning Luxury Real Estate Developer</span>
                </div>
                <h1 className="font-cinzel text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight">
                  Crafting Timeless <span className="text-amber-400">Architectural Masterpieces</span>
                </h1>
                <p className="text-slate-200 text-lg md:text-xl mb-8 leading-relaxed">
                  Experience unparalleled elegance, sustainable biophilic design, and ultra-luxury residences across prime metropolitan hubs.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => setActiveTab('projects')}
                    className="bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold px-8 py-4 rounded-xl text-base shadow-xl flex items-center transition transform hover:-translate-y-0.5"
                  >
                    View All Projects <ChevronRight className="w-5 h-5 ml-2" />
                  </button>
                  <button 
                    onClick={() => { setEnquireProjectName('Schedule Site Visit'); setShowEnquireModal(true); }}
                    className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-semibold px-8 py-4 rounded-xl text-base backdrop-blur-sm transition"
                  >
                    Schedule Site Visit
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Stats Bar */}
          <section className="bg-amber-500 text-emerald-950 py-8 shadow-inner">
            <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="font-cinzel text-3xl md:text-4xl font-ext500 font-bold">35+</p>
                <p className="text-xs md:text-sm font-semibold uppercase tracking-wider mt-1">Years of Excellence</p>
              </div>
              <div>
                <p className="font-cinzel text-3xl md:text-4xl font-ext500 font-bold">12M+</p>
                <p className="text-xs md:text-sm font-semibold uppercase tracking-wider mt-1">Sq.Ft Delivered</p>
              </div>
              <div>
                <p className="font-cinzel text-3xl md:text-4xl font-ext500 font-bold">18,000+</p>
                <p className="text-xs md:text-sm font-semibold uppercase tracking-wider mt-1">Happy Families</p>
              </div>
              <div>
                <p className="font-cinzel text-3xl md:text-4xl font-ext500 font-bold">42</p>
                <p className="text-xs md:text-sm font-semibold uppercase tracking-wider mt-1">Global Awards Won</p>
              </div>
            </div>
          </section>

          {/* Featured Projects Carousel / Grid */}
          <section className="py-20 container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
              <div>
                <span className="text-amber-600 font-bold text-xs uppercase tracking-widest">Portfolio Showcase</span>
                <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-emerald-950 mt-1">Featured Townships & Residences</h2>
              </div>
              <button 
                onClick={() => setActiveTab('projects')}
                className="mt-4 md:mt-0 text-emerald-800 hover:text-amber-600 font-semibold text-sm flex items-center transition"
              >
                Browse Complete Catalog <ArrowRight className="w-4 h-4 ml-1.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {projects.slice(0, 3).map((project) => (
                <div key={project.id} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200 hover:shadow-2xl transition duration-300 flex flex-col group">
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={project.image} 
                      alt={project.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className={`text-xs px-3 py-1 rounded-full font-bold shadow ${project.statusColor}`}>
                        {project.statusBadge}
                      </span>
                    </div>
                    <div className="absolute top-4 right-4">
                      <button 
                        onClick={() => toggleCompare(project.id)}
                        className={`p-2 rounded-full shadow ${compareList.includes(project.id) ? 'bg-amber-500 text-white' : 'bg-white/80 text-slate-700 hover:bg-white'} transition`}
                        title="Compare Project"
                      >
                        <SlidersHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center text-xs text-slate-500 mb-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 mr-1" /> {project.location}
                      </div>
                      <h3 className="font-cinzel text-xl font-bold text-emerald-950 mb-1">{project.name}</h3>
                      <p className="text-xs text-slate-600 mb-4">{project.tagline}</p>
                      
                      {/* RERA Badge on front card */}
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 mb-4 text-xs">
                        <div className="flex items-center justify-between text-emerald-950 font-semibold mb-0.5">
                          <span className="flex items-center"><ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-700" /> RERA Reg:</span>
                          <span className="text-[11px] font-mono">{project.reraNumber}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-500 text-[11px]">
                          <span>Status: <strong className="text-emerald-800">{project.reraStatus}</strong></span>
                          <span>{project.reraTimestamp}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-6 text-xs text-slate-600 font-medium">
                        <div className="bg-slate-50 p-2 rounded">
                          <span className="text-slate-400 block text-[10px]">Configurations</span>
                          {project.unitMix}
                        </div>
                        <div className="bg-slate-50 p-2 rounded">
                          <span className="text-slate-400 block text-[10px]">Price Starts</span>
                          <strong className="text-emerald-900">{project.priceRange.split('-')[0]}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
                      <button 
                        onClick={() => setSelectedProject(project)}
                        className="flex-1 bg-emerald-900 hover:bg-emerald-800 text-white py-2.5 rounded-xl text-xs font-semibold transition text-center"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => { setEnquireProjectName(project.name); setShowEnquireModal(true); }}
                        className="px-4 py-2.5 border border-amber-500 text-amber-700 hover:bg-amber-50 rounded-xl text-xs font-semibold transition"
                      >
                        Enquire
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Why Choose AuraCorp */}
          <section className="bg-emerald-900 text-white py-20">
            <div className="container mx-auto px-4">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <span className="text-amber-400 font-bold text-xs uppercase tracking-widest">The AuraCorp Advantage</span>
                <h2 className="font-cinzel text-3xl md:text-4xl font-bold mt-2">Uncompromising Standards of Craftsmanship</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-emerald-950/60 p-8 rounded-2xl border border-emerald-800">
                  <div className="w-12 h-12 bg-amber-500 text-emerald-950 rounded-xl flex items-center justify-center font-bold text-xl mb-6">01</div>
                <h3 className="font-cinzel text-xl font-bold mb-3 text-amber-400">Prime Locations</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Every AuraCorp property is strategically positioned in India’s high-growth financial and coastal corridors, ensuring robust capital appreciation.
                </p>
                </div>
                <div className="bg-emerald-950/60 p-8 rounded-2xl border border-emerald-800">
                  <div className="w-12 h-12 bg-amber-500 text-emerald-950 rounded-xl flex items-center justify-center font-bold text-xl mb-6">02</div>
                <h3 className="font-cinzel text-xl font-bold mb-3 text-amber-400">Biophilic & Sustainable</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Certified green buildings featuring solar micro-grids, rainwater harvesting, vertical forests, and zero-waste community management.
                </p>
                </div>
                <div className="bg-emerald-950/60 p-8 rounded-2xl border border-emerald-800">
                  <div className="w-12 h-12 bg-amber-500 text-emerald-950 rounded-xl flex items-center justify-center font-bold text-xl mb-6">03</div>
                <h3 className="font-cinzel text-xl font-bold mb-3 text-amber-400">RERA & Legal Compliance</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  100% transparent title deeds, timely milestone handovers, and strict RERA compliance with live progress feeds updated weekly.
                </p>
                </div>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* ========================================================== */}
      {/* 2. PROJECTS OVERVIEW TAB                                    */}
      {/* ========================================================== */}
      {activeTab === 'projects' && (
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <span className="text-amber-600 font-bold text-xs uppercase tracking-widest">Complete Portfolio</span>
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-emerald-950 mt-1">Explore Our Developments</h2>
            <p className="text-slate-600 text-sm mt-2">Filter by status or search by location, project name, or configuration.</p>
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-200 mb-10 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {['All', 'Delivered', 'Ongoing', 'Upcoming'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition ${categoryFilter === cat ? 'bg-emerald-900 text-white shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search location, name..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-700"
              />
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredProjects.map((project) => (
              <div key={project.id} className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200 hover:shadow-2xl transition duration-300 flex flex-col group">
                <div className="relative h-60 overflow-hidden">
                  <img src={project.image} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <div className="absolute top-4 left-4">
                    <span className={`text-xs px-3 py-1 rounded-full font-bold shadow ${project.statusColor}`}>{project.statusBadge}</span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <button 
                      onClick={() => toggleCompare(project.id)}
                      className={`p-2 rounded-full shadow ${compareList.includes(project.id) ? 'bg-amber-500 text-white' : 'bg-white/80 text-slate-700 hover:bg-white'} transition`}
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center text-xs text-slate-500 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 mr-1" /> {project.location}
                    </div>
                    <h3 className="font-cinzel text-xl font-bold text-emerald-950 mb-1">{project.name}</h3>
                    <p className="text-xs text-slate-600 mb-4">{project.tagline}</p>
                    
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 mb-4 text-xs">
                      <div className="flex items-center justify-between text-emerald-950 font-semibold mb-0.5">
                        <span className="flex items-center"><ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-700" /> RERA:</span>
                        <span className="text-[11px] font-mono">{project.reraNumber}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span>Status: <strong className="text-emerald-800">{project.reraStatus}</strong></span>
                        <span>{project.reraTimestamp}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-6 text-xs text-slate-600 font-medium">
                      <div className="bg-slate-50 p-2 rounded">
                        <span className="text-slate-400 block text-[10px]">Price</span>
                        <strong className="text-emerald-900">{project.priceRange}</strong>
                      </div>
                      <div className="bg-slate-50 p-2 rounded">
                        <span className="text-slate-400 block text-[10px]">Acres</span>
                        <strong className="text-emerald-900">{project.acres}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => setSelectedProject(project)}
                      className="flex-1 bg-emerald-900 hover:bg-emerald-800 text-white py-2.5 rounded-xl text-xs font-semibold transition text-center"
                    >
                      View Details
                    </button>
                    <button 
                      onClick={() => { setEnquireProjectName(project.name); setShowEnquireModal(true); }}
                      className="px-4 py-2.5 border border-amber-500 text-amber-700 hover:bg-amber-50 rounded-xl text-xs font-semibold transition"
                    >
                      Enquire
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ========================================================== */}
      {/* 3. DELIVERED PROJECTS TAB                                   */}
      {/* ========================================================== */}
      {activeTab === 'delivered' && (
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-amber-600 font-bold text-xs uppercase tracking-widest">Proven Track Record</span>
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-emerald-950 mt-1">Delivered Townships & Handover Milestones</h2>
            <p className="text-slate-600 text-sm mt-2">Explore our completed communities, occupancy statistics, and downloadable handover documentation.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.filter(p => p.category === 'Delivered').map(project => (
              <div key={project.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
                <div className="relative h-72">
                  <img src={project.image} alt={project.name} className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 bg-emerald-700 text-white text-xs px-3 py-1 rounded-full font-bold">
                    {project.statusBadge}
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-amber-600 font-bold">{project.location}</span>
                    <h3 className="font-cinzel text-2xl font-bold text-emerald-950 mt-1 mb-3">{project.name}</h3>
                    <p className="text-slate-600 text-sm mb-6 leading-relaxed">{project.description}</p>
                    
                    <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl mb-6 text-center text-xs">
                      <div>
                        <span className="text-slate-400 block mb-1">Delivered</span>
                        <strong className="text-emerald-900">{project.handoverDate}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-1">Units</span>
                        <strong className="text-emerald-900">{project.unitsDelivered}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block mb-1">Land Area</span>
                        <strong className="text-emerald-900">{project.acres}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => setSelectedProject(project)}
                      className="flex-1 bg-emerald-900 hover:bg-emerald-800 text-white py-3 rounded-xl text-xs font-semibold transition text-center"
                    >
                      View Case Study & Docs
                    </button>
                    <button 
                      onClick={() => showToast('Downloading Handover & Compliance Package (PDF)...')}
                      className="px-4 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center transition"
                    >
                      <Download className="w-4 h-4 mr-1.5 text-amber-600" /> Brochure
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ========================================================== */}
      {/* 4. ONGOING PROJECTS TAB                                     */}
      {/* ========================================================== */}
      {activeTab === 'ongoing' && (
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-amber-600 font-bold text-xs uppercase tracking-widest">Live Progress</span>
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-emerald-950 mt-1">Ongoing Townships & Construction Feeds</h2>
            <p className="text-slate-600 text-sm mt-2">Track weekly progress photos, milestone logs, and expected handover timelines in real time.</p>
          </div>

          <div className="space-y-12">
            {projects.filter(p => p.category === 'Ongoing').map(project => (
              <div key={project.id} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
                <div className="lg:col-span-5 relative min-h-[300px]">
                  <img src={project.image} alt={project.name} className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 bg-amber-500 text-emerald-950 text-xs px-3 py-1 rounded-full font-bold">
                    {project.completionPct}% Completed
                  </div>
                </div>
                
                <div className="lg:col-span-7 p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-xs text-amber-600 font-bold">{project.location}</span>
                        <h3 className="font-cinzel text-2xl font-bold text-emerald-950 mt-1">{project.name}</h3>
                      </div>
                      <span className="text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1 rounded-lg">RERA: {project.reraNumber}</span>
                    </div>
                    <p className="text-slate-600 text-sm mb-6">{project.description}</p>

                    {/* Progress Bar */}
                    <div className="mb-6">
                      <div className="flex justify-between text-xs font-semibold mb-2 text-slate-700">
                        <span>Construction Progress</span>
                        <span className="text-emerald-800">{project.completionPct}% (Handover: {project.handoverDate})</span>
                      </div>
                      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: `${project.completionPct}%` }}></div>
                      </div>
                    </div>

                    {/* Weekly progress feed snippet */}
                    <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-200">
                      <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wide mb-3 flex items-center">
                        <RefreshCw className="w-3.5 h-3.5 text-amber-600 mr-1.5 animate-spin" /> Latest Weekly Site Update ({project.progressFeed[0]?.date})
                      </h4>
                      <p className="text-xs text-slate-600">{project.progressFeed[0]?.note}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => setSelectedProject(project)}
                      className="flex-1 bg-emerald-900 hover:bg-emerald-800 text-white py-3 rounded-xl text-xs font-semibold transition text-center"
                    >
                      View Full Milestone Log
                    </button>
                    <button 
                      onClick={() => { setEnquireProjectName(project.name); setShowEnquireModal(true); }}
                      className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-emerald-950 rounded-xl text-xs font-bold transition shadow"
                    >
                      Schedule Site Visit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ========================================================== */}
      {/* 5. UPCOMING (SOFT LAUNCH) TAB                               */}
      {/* ========================================================== */}
      {activeTab === 'upcoming' && (
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-blue-600 font-bold text-xs uppercase tracking-widest">Exclusive Access</span>
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-emerald-950 mt-1">Upcoming Soft Launches & VIP Reservations</h2>
            <p className="text-slate-600 text-sm mt-2">Secure pre-launch allocations, priority floor choice, and introductory pricing before public release.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {projects.filter(p => p.category === 'Upcoming').map(project => (
              <div key={project.id} className="bg-white rounded-2xl shadow-xl border border-blue-200 overflow-hidden flex flex-col">
                <div className="relative h-72">
                  <img src={project.image} alt={project.name} className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-bold">
                    Soft Launch Priority Booking
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-xs text-blue-600 font-bold">{project.location}</span>
                    <h3 className="font-cinzel text-2xl font-bold text-emerald-950 mt-1 mb-3">{project.name}</h3>
                    <p className="text-slate-600 text-sm mb-6 leading-relaxed">{project.description}</p>
                    
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6 text-xs text-blue-900">
                      <div className="font-bold mb-1 flex items-center">
                        <Sparkles className="w-4 h-4 text-amber-500 mr-1.5" /> Soft Launch Privileges:
                      </div>
                      <ul className="list-disc list-inside space-y-1 text-slate-700">
                        <li>Introductory price benefit of up to ₹15 Lakhs</li>
                        <li>Priority floor & view selection</li>
                        <li>Fully refundable EOI deposit of ₹2.5 Lakhs</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 pt-4 border-t border-slate-100">
                    <button 
                      onClick={() => { setEnquireProjectName(`${project.name} - Soft Launch Reservation`); setShowEnquireModal(true); }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-semibold transition text-center shadow"
                    >
                      Register for Soft Launch
                    </button>
                    <button 
                      onClick={() => setSelectedProject(project)}
                      className="px-4 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ========================================================== */}
      {/* 6. ABOUT US TAB                                             */}
      {/* ========================================================== */}
      {activeTab === 'about' && (
        <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
          <div className="text-center mb-12">
            <span className="text-amber-600 font-bold text-xs uppercase tracking-widest">Our Heritage</span>
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-emerald-950 mt-1">Building Trust Since 1991</h2>
          </div>

          <div className="bg-white p-8 md:p-12 rounded-2xl shadow-lg border border-slate-200 mb-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="font-cinzel text-2xl font-bold text-emerald-950 mb-4">The AuraCorp Philosophy</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  Founded by visionary architect Vikramaditya Aura, AuraCorp has grown from a boutique architectural firm into India’s premier luxury real estate developer. Our developments stand as permanent testaments to rigorous structural engineering, exquisite aesthetics, and uncompromising environmental stewardship.
                </p>
                <p className="text-slate-600 text-sm leading-relaxed">
                  We partner with globally renowned interior designers, landscape architects, and smart-home innovators to deliver living spaces that elevate human well-being.
                </p>
              </div>
              <div className="relative h-72 rounded-xl overflow-hidden shadow-md">
                <img src="https://images.pexels.com/photos/13416122/pexels-photo-13416122.jpeg" alt="AuraCorp Headquarters" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>

          <h3 className="font-cinzel text-2xl font-bold text-emerald-950 mb-8 text-center">Milestones of Excellence</h3>
          <div className="space-y-6">
            {[
              { year: '1991', title: 'Foundation Established', desc: 'AuraCorp founded in Mumbai with its first boutique residential project.' },
              { year: '2005', title: 'Expansion into Biophilic Townships', desc: 'Pioneered sustainable township living with 50+ acre green masterplans.' },
              { year: '2015', title: 'Global Excellence Award', desc: 'Recognized at the International Property Awards for Best High-Rise Architecture.' },
              { year: '2026', title: '12 Million Sq.Ft Delivered', desc: 'Surpassed 18,000 delighted families across Mumbai, Bangalore, Hyderabad, and Chennai.' },
            ].map((m, idx) => (
              <div key={idx} className="bg-white p-6 rounded-xl shadow border border-slate-200 flex items-start space-x-6">
                <div className="bg-amber-500 text-emerald-950 font-cinzel font-bold px-4 py-2 rounded-lg text-lg">
                  {m.year}
                </div>
                <div>
                  <h4 className="font-cinzel text-lg font-bold text-emerald-950 mb-1">{m.title}</h4>
                  <p className="text-slate-600 text-xs">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ========================================================== */}
      {/* 7. TEAM TAB                                                 */}
      {/* ========================================================== */}
      {activeTab === 'team' && (
        <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
          <div className="text-center mb-12">
            <span className="text-amber-600 font-bold text-xs uppercase tracking-widest">Leadership</span>
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-emerald-950 mt-1">Visionary Board & Executives</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Vikramaditya Aura', role: 'Founder & Chairman', img: 'https://images.pexels.com/photos/37495707/pexels-photo-37495707.jpeg', bio: '35+ years leading landmark urban transformations across India.' },
              { name: 'Ananya Sharma', role: 'Managing Director & CEO', img: 'https://images.pexels.com/photos/33902818/pexels-photo-33902818.jpeg', bio: 'Former Harvard GSD fellow specializing in biophilic urban ecosystems.' },
              { name: 'Rajesh Nambiar', role: 'Chief Engineering Officer', img: 'https://images.pexels.com/photos/13416122/pexels-photo-13416122.jpeg', bio: 'Pioneered earthquake-resistant superstructure designs and smart micro-grids.' },
            ].map((member, idx) => (
              <div key={idx} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col">
                <div className="h-64 relative">
                  <img src={member.img} alt={member.name} className="w-full h-full object-cover" />
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-cinzel text-xl font-bold text-emerald-950 mb-1">{member.name}</h3>
                    <p className="text-xs font-semibold text-amber-600 mb-3">{member.role}</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{member.bio}</p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                    <span>AuraCorp Executive</span>
                    <span className="text-emerald-800 font-semibold cursor-pointer hover:underline">LinkedIn Profile</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ========================================================== */}
      {/* 8. NEWS & MEDIA TAB                                         */}
      {/* ========================================================== */}
      {activeTab === 'news' && (
        <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
          <div className="text-center mb-12">
            <span className="text-amber-600 font-bold text-xs uppercase tracking-widest">Press & Updates</span>
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-emerald-950 mt-1">Latest News & Announcements</h2>
          </div>

          <div className="space-y-6">
            {[
              { title: 'AuraCorp Announces Q2 Launch of Sovereign Crown in Gachibowli', date: 'July 1, 2026', cat: 'Press Release', desc: 'Over 250 high-net-worth investors participated in the exclusive VIP soft launch event.' },
              { title: 'Aura Forest Woods Receives Platinum Green Building Certification', date: 'June 15, 2026', cat: 'Sustainability', desc: 'Recognized for 100% net-zero water recycling and solar micro-grid implementation.' },
              { title: 'CEO Ananya Sharma Keynotes International Real Estate Summit', date: 'May 28, 2026', cat: 'Events', desc: 'Discussing the future of biophilic skyline architecture in modern megacities.' },
            ].map((news, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl shadow border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center space-x-3 mb-2 text-xs">
                    <span className="bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full font-bold">{news.cat}</span>
                    <span className="text-slate-400">{news.date}</span>
                  </div>
                  <h3 className="font-cinzel text-xl font-bold text-emerald-950 mb-1">{news.title}</h3>
                  <p className="text-xs text-slate-600">{news.desc}</p>
                </div>
                <button onClick={() => showToast('Opening full press release article...')} className="px-4 py-2 bg-emerald-900 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition whitespace-nowrap">
                  Read Article
                </button>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ========================================================== */}
      {/* 9. CMS / ADMIN PANEL TAB                                    */}
      {/* ========================================================== */}
      {activeTab === 'cms' && (
        <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
          <div className="bg-amber-50 border border-amber-300 p-6 rounded-2xl mb-8 flex justify-between items-center">
            <div>
              <h2 className="font-cinzel text-2xl font-bold text-emerald-950 flex items-center">
                <Settings className="w-6 h-6 mr-2 text-amber-600" /> Strapi Headless CMS Administration Panel
              </h2>
              <p className="text-xs text-slate-600 mt-1">Manage project RERA numbers, status updates, progress feed photos, and popup frequency control in real time.</p>
            </div>
            <button 
              onClick={() => showToast('CMS configuration saved successfully!')} 
              className="bg-emerald-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-800 shadow"
            >
              Save CMS Changes
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow border border-slate-200">
              <h3 className="font-bold text-xs text-slate-500 uppercase mb-2">Popup Enquiry Frequency</h3>
              <label className="text-xs text-slate-600 block mb-1">Delay (seconds):</label>
              <input 
                type="number" 
                value={popupDelaySec} 
                onChange={(e) => setPopupDelaySec(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs mb-3"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Enable Popup:</span>
                <input 
                  type="checkbox" 
                  checked={popupEnabled} 
                  onChange={(e) => setPopupEnabled(e.target.checked)}
                  className="w-4 h-4 accent-emerald-900"
                />
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow border border-slate-200">
              <h3 className="font-bold text-xs text-slate-500 uppercase mb-2">CRM Integration</h3>
              <p className="text-xs text-slate-600 mb-3">HubSpot & Zoho Webhook Connected</p>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2.5 py-1 rounded-full font-bold">Status: Active & Syncing</span>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow border border-slate-200">
              <h3 className="font-bold text-xs text-slate-500 uppercase mb-2">Export Data Feeds</h3>
              <button 
                onClick={() => showToast('Downloaded project listings as CSV/JSON for property portals.')}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 p-2.5 rounded-xl text-xs font-semibold transition flex items-center justify-center mb-2"
              >
                <Download className="w-4 h-4 mr-1.5 text-amber-600" /> Export CSV / JSON
              </button>
            </div>
          </div>

          <h3 className="font-cinzel text-xl font-bold text-emerald-950 mb-4">Edit Project RERA & Status Attributes</h3>
          <div className="space-y-4">
            {projects.map((proj, i) => (
              <div key={proj.id} className="bg-white p-6 rounded-xl shadow border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div>
                  <strong className="text-emerald-950 text-sm block">{proj.name}</strong>
                  <span className="text-xs text-slate-500">{proj.location}</span>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">RERA Number</label>
                  <input 
                    type="text" 
                    value={proj.reraNumber} 
                    onChange={(e) => {
                      const updated = [...projects];
                      updated[i].reraNumber = e.target.value;
                      setProjects(updated);
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block">Status Badge</label>
                  <select 
                    value={proj.statusBadge}
                    onChange={(e) => {
                      const updated = [...projects];
                      updated[i].statusBadge = e.target.value;
                      setProjects(updated);
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs"
                  >
                    <option value="Delivered">Delivered</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Soft Launch">Soft Launch</option>
                  </select>
                </div>
                <div>
                  <button 
                    onClick={() => showToast(`Updated attributes for ${proj.name}`)}
                    className="w-full bg-emerald-900 text-white py-2 rounded text-xs font-semibold hover:bg-emerald-800"
                  >
                    Update Record
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ========================================================== */}
      {/* 10. CONTACT TAB                                             */}
      {/* ========================================================== */}
      {activeTab === 'contact' && (
        <main className="flex-1 container mx-auto px-4 py-12 max-w-4xl">
          <div className="text-center mb-12">
            <span className="text-amber-600 font-bold text-xs uppercase tracking-widest">Connect With Us</span>
            <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-emerald-950 mt-1">Sales Enquiry & Corporate Headquarters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
              <h3 className="font-cinzel text-xl font-bold text-emerald-950 mb-6">Send an Enquiry</h3>
              <form onSubmit={(e) => { e.preventDefault(); showToast('Enquiry submitted successfully! Our sales manager will call you shortly.'); }} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name *</label>
                  <input type="text" required placeholder="Mr. Rajesh Kumar" className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number *</label>
                  <input type="tel" required placeholder="+91 98765 43210" className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Select Project of Interest</label>
                  <select className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs">
                    {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Message / Requirements</label>
                  <textarea rows="3" placeholder="Looking for 4 BHK penthouse..." className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs"></textarea>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <input type="checkbox" required className="accent-emerald-900" />
                  <span>I agree to GDPR terms & consent to receive WhatsApp/call updates.</span>
                </div>
                <button type="submit" className="w-full bg-emerald-900 hover:bg-emerald-800 text-white py-3.5 rounded-xl text-xs font-bold shadow transition">
                  Submit Enquiry
                </button>
              </form>
            </div>

            <div className="bg-emerald-950 text-white p-8 rounded-2xl shadow-lg flex flex-col justify-between">
              <div>
                <h3 className="font-cinzel text-xl font-bold text-amber-400 mb-6">Corporate Headquarters</h3>
                <div className="space-y-4 text-xs text-slate-300">
                  <p className="flex items-start"><MapPin className="w-4 h-4 text-amber-400 mr-2 shrink-0 mt-0.5" /> Aura Towers, 28th Floor, Bandra Kurla Complex (BKC), Mumbai 400051</p>
                  <p className="flex items-center"><Phone className="w-4 h-4 text-amber-400 mr-2 shrink-0" /> +91 800 555 9999 / +91 22 6123 4000</p>
                  <p className="flex items-center"><Mail className="w-4 h-4 text-amber-400 mr-2 shrink-0" /> concierge@auracorpdev.com</p>
                </div>

                <div className="mt-8 pt-8 border-t border-emerald-900">
                  <h4 className="font-cinzel text-sm font-bold text-amber-400 mb-3">Regional Sales Lounges</h4>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li>• Bangalore: Whitefield Main Road, Prestige Tech Park Annex</li>
                    <li>• Hyderabad: Knowledge City, Gachibowli</li>
                    <li>• Chennai: ECR Coastal Highway, Sholinganallur</li>
                  </ul>
                </div>
              </div>

              <div className="mt-8 bg-emerald-900/80 p-4 rounded-xl border border-emerald-800 text-xs">
                <span className="font-bold text-amber-400 block mb-1">WhatsApp Instant Chat</span>
                <p className="text-slate-200">Connect instantly with our AI concierge or live real estate advisor.</p>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ========================================================== */}
      {/* MODALS & OVERLAYS                                           */}
      {/* ========================================================== */}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative border border-slate-200">
            <button 
              onClick={() => setSelectedProject(null)}
              className="absolute top-6 right-6 z-10 bg-white/95 hover:bg-slate-100 p-2.5 rounded-full shadow-lg text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Hero Gallery */}
            <div className="relative h-80">
              <img src={selectedProject.image} alt={selectedProject.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-8">
                <div>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${selectedProject.statusColor} mb-2 inline-block`}>{selectedProject.statusBadge}</span>
                  <h2 className="font-cinzel text-3xl font-bold text-white">{selectedProject.name}</h2>
                  <p className="text-amber-400 text-xs mt-1 flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" /> {selectedProject.location}</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* RERA Banner */}
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
                <div>
                  <span className="font-bold text-emerald-950 flex items-center mb-1"><ShieldCheck className="w-4 h-4 text-emerald-700 mr-1.5" /> RERA Compliance & Verification</span>
                  <p className="text-slate-600 font-mono">Registration No: <strong>{selectedProject.reraNumber}</strong> | {selectedProject.reraStatus}</p>
                </div>
                <span className="text-emerald-800 font-semibold bg-white px-3 py-1 rounded-lg border border-emerald-200">{selectedProject.reraTimestamp}</span>
              </div>

              {/* Summary & Stats */}
              <div>
                <h3 className="font-cinzel text-xl font-bold text-emerald-950 mb-3">Project Overview</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">{selectedProject.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-xs block">Price Range</span>
                    <strong className="text-emerald-900 text-sm">{selectedProject.priceRange}</strong>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-xs block">Unit Configurations</span>
                    <strong className="text-emerald-900 text-sm">{selectedProject.unitMix}</strong>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-xs block">Total Land Area</span>
                    <strong className="text-emerald-900 text-sm">{selectedProject.acres}</strong>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-slate-400 text-xs block">Expected Handover</span>
                    <strong className="text-emerald-900 text-sm">{selectedProject.handoverDate}</strong>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="font-cinzel text-xl font-bold text-emerald-950 mb-3">World-Class Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedProject.amenities?.map((amenity, idx) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center space-x-2 text-xs font-semibold text-slate-700">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Milestone Tracker */}
              <div>
                <h3 className="font-cinzel text-xl font-bold text-emerald-950 mb-3">Milestone & Construction Log</h3>
                <div className="space-y-3">
                  {selectedProject.milestones?.map((m, idx) => (
                    <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                      <div className="flex items-center space-x-3">
                        {m.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                        ) : (
                          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                        )}
                        <div>
                          <strong className="text-emerald-950 block">{m.title}</strong>
                          <span className="text-slate-400 text-[11px]">{m.date}</span>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${m.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {m.completed ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-200">
                <button 
                  onClick={() => { setSelectedProject(null); setEnquireProjectName(selectedProject.name); setShowEnquireModal(true); }}
                  className="flex-1 bg-emerald-900 hover:bg-emerald-800 text-white py-3.5 rounded-xl text-xs font-bold shadow transition flex items-center justify-center"
                >
                  <Sparkles className="w-4 h-4 text-amber-400 mr-2" /> Enquire / Book Visit
                </button>
                <button 
                  onClick={() => showToast('Downloading High-Resolution Brochure & Floorplans (PDF)...')}
                  className="px-6 py-3.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center transition"
                >
                  <Download className="w-4 h-4 mr-2 text-amber-600" /> Download Brochure
                </button>
                <button 
                  onClick={() => showToast('Launching Virtual 3D Tour viewer in immersive mode...')}
                  className="px-6 py-3.5 border border-amber-500 bg-amber-50 text-amber-800 rounded-xl text-xs font-semibold flex items-center transition"
                >
                  <Eye className="w-4 h-4 mr-2 text-amber-600" /> Virtual 3D Tour
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Compare Modal */}
      {showCompareModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative p-8 border border-slate-200">
            <button 
              onClick={() => setShowCompareModal(false)}
              className="absolute top-6 right-6 bg-slate-100 hover:bg-slate-200 p-2.5 rounded-full text-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="font-cinzel text-2xl font-bold text-emerald-950 mb-2">Side-by-Side Project Comparison</h2>
            <p className="text-slate-600 text-xs mb-6">Compare up to 4 luxury developments across RERA compliance, pricing, and amenities.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="p-4 font-bold text-slate-700">Attribute</th>
                    {compareList.map(id => {
                      const proj = projects.find(p => p.id === id);
                      return (
                        <th key={id} className="p-4 font-cinzel text-emerald-950 text-base">
                          {proj?.name}
                          <button onClick={() => toggleCompare(id)} className="block text-[10px] text-red-600 font-normal hover:underline mt-1">Remove</button>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-4 font-bold text-slate-700">Location</td>
                    {compareList.map(id => <td key={id} className="p-4 text-slate-600">{projects.find(p => p.id === id)?.location}</td>)}
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-700">Category & Status</td>
                    {compareList.map(id => <td key={id} className="p-4 text-emerald-800 font-semibold">{projects.find(p => p.id === id)?.statusBadge}</td>)}
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-700">Price Range</td>
                    {compareList.map(id => <td key={id} className="p-4 text-emerald-900 font-bold">{projects.find(p => p.id === id)?.priceRange}</td>)}
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-700">Unit Mix</td>
                    {compareList.map(id => <td key={id} className="p-4 text-slate-600">{projects.find(p => p.id === id)?.unitMix}</td>)}
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-700">RERA Number</td>
                    {compareList.map(id => <td key={id} className="p-4 font-mono text-[11px] text-slate-700">{projects.find(p => p.id === id)?.reraNumber}</td>)}
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-700">Land Area & Units</td>
                    {compareList.map(id => {
                      const p = projects.find(proj => proj.id === id);
                      return <td key={id} className="p-4 text-slate-600">{p?.acres} ({p?.unitsDelivered})</td>;
                    })}
                  </tr>
                  <tr>
                    <td className="p-4 font-bold text-slate-700">Handover Date</td>
                    {compareList.map(id => <td key={id} className="p-4 text-slate-600">{projects.find(p => p.id === id)?.handoverDate}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-slate-200">
              <button onClick={() => showToast('Comparison exported as CSV & PDF successfully.')} className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-6 py-2.5 rounded-xl text-xs font-semibold flex items-center transition">
                <Download className="w-4 h-4 mr-1.5 text-amber-600" /> Export Comparison
              </button>
              <button onClick={() => setShowCompareModal(false)} className="bg-emerald-900 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-xl text-xs font-bold">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* General Enquire Modal */}
      {showEnquireModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl relative border border-slate-200">
            <button onClick={() => setShowEnquireModal(false)} className="absolute top-6 right-6 bg-slate-100 hover:bg-slate-200 p-2 rounded-full text-slate-700">
              <X className="w-5 h-5" />
            </button>

            <span className="text-amber-600 font-bold text-[10px] uppercase tracking-widest block mb-1">Priority Assistance</span>
            <h3 className="font-cinzel text-2xl font-bold text-emerald-950 mb-2">Enquire / Schedule Visit</h3>
            <p className="text-xs text-slate-600 mb-6">Property: <strong className="text-emerald-900">{enquireProjectName}</strong></p>

            <form onSubmit={(e) => { e.preventDefault(); setShowEnquireModal(false); showToast('Enquiry successfully recorded! Our sales consultant will call you within 15 mins.'); }} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Full Name *</label>
                <input type="text" required placeholder="Mr. Rajesh Kumar" className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Phone Number *</label>
                <input type="tel" required placeholder="+91 98765 43210" className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Preferred Date & Time</label>
                <input type="datetime-local" className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs" />
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <input type="checkbox" required className="accent-emerald-900" />
                <span>I agree to receive WhatsApp updates and RERA disclosures.</span>
              </div>
              <button type="submit" className="w-full bg-emerald-900 hover:bg-emerald-800 text-white py-3.5 rounded-xl text-xs font-bold shadow transition">
                Confirm & Submit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Automatic Popup Enquiry Form */}
      {showPopup && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative border border-amber-400">
            <button 
              onClick={() => { setShowPopup(false); sessionStorage.setItem('auracorp_popup_suppressed', 'true'); }} 
              className="absolute top-6 right-6 bg-slate-100 hover:bg-slate-200 p-2 rounded-full text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-amber-500 text-emerald-950 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-amber-600 font-bold text-[10px] uppercase tracking-widest">Exclusive Invitation</span>
              <h3 className="font-cinzel text-2xl font-bold text-emerald-950 mt-1">Unlock VIP Soft Launch Privileges</h3>
              <p className="text-xs text-slate-600 mt-2">Register now to receive priority floor plans, introductory pricing, and an exclusive luxury brochure.</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setShowPopup(false); sessionStorage.setItem('auracorp_popup_suppressed', 'true'); showToast('Thank you! VIP Welcome Package sent to your phone.'); }} className="space-y-4">
              <div>
                <input type="text" required placeholder="Full Name *" className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs" />
              </div>
              <div>
                <input type="tel" required placeholder="Phone Number (+91) *" className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs" />
              </div>
              <button type="submit" className="w-full bg-emerald-900 hover:bg-emerald-800 text-white py-3.5 rounded-xl text-xs font-bold shadow transition">
                Claim VIP Privileges Now
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating WhatsApp / Chat Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          onClick={() => setChatOpen(!chatOpen)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition transform hover:scale-105"
        >
          <MessageSquare className="w-6 h-6 text-amber-400" />
        </button>
      </div>

      {/* Chat Drawer */}
      {chatOpen && (
        <div className="fixed bottom-24 right-6 z-50 bg-white rounded-2xl shadow-2xl w-80 md:w-96 border border-slate-200 flex flex-col overflow-hidden">
          <div className="bg-emerald-900 text-white p-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-ping"></div>
              <span className="font-cinzel text-sm font-bold">AuraCorp Concierge AI</span>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-white hover:text-amber-400"><X className="w-4 h-4" /></button>
          </div>

          <div className="p-4 flex-1 h-72 overflow-y-auto space-y-3 bg-slate-50 text-xs">
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-2xl max-w-[80%] ${msg.sender === 'user' ? 'bg-emerald-900 text-white rounded-br-none' : 'bg-white text-slate-800 shadow border border-slate-200 rounded-bl-none'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex space-x-2">
            <input 
              type="text" 
              placeholder="Ask about price, RERA, site visits..." 
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-1 p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-emerald-800"
            />
            <button type="submit" className="bg-emerald-900 text-white px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-emerald-800">
              Send
            </button>
          </form>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-emerald-950 text-emerald-100 py-16 border-t border-emerald-900">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 text-xs">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-emerald-950 font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="font-cinzel text-lg font-bold text-white">AURACORP</span>
            </div>
            <p className="text-slate-400 leading-relaxed mb-4">
              India's premier luxury real estate developer crafting sustainable townships, skyline penthouses, and biophilic residential communities.
            </p>
            <p className="text-slate-500">© 2026 AuraCorp Developers Ltd. All Rights Reserved.</p>
          </div>

          <div>
            <h4 className="font-cinzel text-sm font-bold text-amber-400 uppercase tracking-widest mb-4">Quick Links</h4>
            <ul className="space-y-2 text-slate-300">
              <li><button onClick={() => setActiveTab('projects')} className="hover:text-amber-400 transition">All Projects</button></li>
              <li><button onClick={() => setActiveTab('delivered')} className="hover:text-amber-400 transition">Delivered Communities</button></li>
              <li><button onClick={() => setActiveTab('ongoing')} className="hover:text-amber-400 transition">Ongoing Construction</button></li>
              <li><button onClick={() => setActiveTab('upcoming')} className="hover:text-amber-400 transition">Soft Launch Reservations</button></li>
              <li><button onClick={() => setActiveTab('about')} className="hover:text-amber-400 transition">About Builder History</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-cinzel text-sm font-bold text-amber-400 uppercase tracking-widest mb-4">RERA Disclaimers</h4>
            <p className="text-slate-400 leading-relaxed">
              All project details, floor plans, and RERA registration numbers are verified per state regulatory authorities. RERA Reg No. P51800029841, PRM/KA/RERA/1251/308, P02400005421.
            </p>
          </div>

          <div>
            <h4 className="font-cinzel text-sm font-bold text-amber-400 uppercase tracking-widest mb-4">Newsletter & Updates</h4>
            <p className="text-slate-400 mb-4">Subscribe for exclusive launch invitations and market research reports.</p>
            <form onSubmit={(e) => { e.preventDefault(); showToast('Subscribed successfully!'); }} className="space-y-2">
              <input type="email" required placeholder="Enter your email" className="w-full p-2.5 bg-emerald-900 border border-emerald-800 rounded-xl text-white text-xs" />
              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-emerald-950 font-bold py-2.5 rounded-xl transition">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </footer>

    </div>
  );
}
