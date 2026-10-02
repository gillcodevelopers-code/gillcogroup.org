'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calculator, Sparkles, Phone, MessageCircle, ArrowLeft } from 'lucide-react';

/* ---- helpers ---- */
function parsePriceToINR(input) {
  if (!input && input !== 0) return 0;
  if (typeof input === 'number') return input;
  const s = String(input).toLowerCase();
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

export default function EmiCalculatorPage() {
  const [projects, setProjects] = useState([]);
  const [settings, setSettings] = useState(null);
  const [price, setPrice] = useState(10000000);
  const [downPct, setDownPct] = useState(20);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20);
  const [projectSlug, setProjectSlug] = useState('');

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(setProjects).catch(() => {});
    fetch('/api/settings').then(r => r.json()).then(setSettings).catch(() => {});
  }, []);

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

  const whatsappText = encodeURIComponent(
    `Hi Gillco Group, I'd like help with a home loan.\n` +
    `Property: ${projects.find(x => x.slug === projectSlug)?.name || 'TBD'}\n` +
    `Price: ${fmtINR(price)}\n` +
    `Down: ${fmtINR(downPayment)} (${downPct}%)\n` +
    `Loan: ${fmtINR(loanAmount)}, ${tenure}y @ ${rate}%\n` +
    `Monthly EMI: ${fmtINR(emi)}`
  );
  const wa = settings?.whatsapp ? `https://wa.me/${settings.whatsapp}?text=${whatsappText}` : '#';
  const phone = settings?.phone ? `tel:${settings.phone.replace(/\s|-/g, '')}` : '#';

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        <nav className="text-sm text-emerald-900 mb-5">
          <Link href="/" className="hover:underline inline-flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" /> Back to Home</Link>
        </nav>

        <header className="mb-8 flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-full bg-emerald-900 text-white flex items-center justify-center shrink-0 shadow-lg">
            <Calculator className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <p className="uppercase tracking-widest text-[11px] font-semibold text-amber-700">Gillco Group · Tools</p>
            <h1 className="font-serif text-3xl md:text-5xl text-emerald-900">Home Loan EMI Calculator</h1>
            <p className="text-slate-600 mt-2 max-w-2xl">Estimate your monthly instalment, interest and total payable amount for any Gillco project. Adjust the price, down payment, interest rate and tenure sliders to see live results.</p>
          </div>
        </header>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-100 shadow-sm space-y-6">
            {projects.length > 0 && (
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Pre-fill from Project (optional)</label>
                <select value={projectSlug} onChange={e => onPickProject(e.target.value)} className="w-full mt-1.5 px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white">
                  <option value="">— Choose a project —</option>
                  {projects.map(p => (
                    <option key={p.slug} value={p.slug}>{p.name}{p.priceRange ? ` · ${p.priceRange}` : ''}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <div className="flex justify-between items-baseline">
                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Property Price</label>
                <span className="text-sm font-bold text-emerald-900">{fmtINR(price)}</span>
              </div>
              <input type="range" min="2500000" max="100000000" step="100000" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full accent-emerald-900 mt-2" />
              <input type="number" value={price} onChange={e => setPrice(Math.max(0, Number(e.target.value) || 0))} className="w-full mt-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono" />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 uppercase tracking-wider"><span>₹25 L</span><span>₹10 Cr</span></div>
            </div>

            <div>
              <div className="flex justify-between items-baseline">
                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Down Payment</label>
                <span className="text-sm font-bold text-emerald-900">{downPct}% · {fmtINR(downPayment)}</span>
              </div>
              <input type="range" min="10" max="90" step="5" value={downPct} onChange={e => setDownPct(Number(e.target.value))} className="w-full accent-amber-500 mt-2" />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 uppercase tracking-wider"><span>10%</span><span>90%</span></div>
            </div>

            <div>
              <div className="flex justify-between items-baseline">
                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Interest Rate (p.a.)</label>
                <span className="text-sm font-bold text-emerald-900">{rate.toFixed(2)}%</span>
              </div>
              <input type="range" min="6" max="12" step="0.05" value={rate} onChange={e => setRate(Number(e.target.value))} className="w-full accent-emerald-900 mt-2" />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 uppercase tracking-wider"><span>6%</span><span>12%</span></div>
            </div>

            <div>
              <div className="flex justify-between items-baseline">
                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Loan Tenure</label>
                <span className="text-sm font-bold text-emerald-900">{tenure} yrs</span>
              </div>
              <input type="range" min="5" max="30" step="1" value={tenure} onChange={e => setTenure(Number(e.target.value))} className="w-full accent-amber-500 mt-2" />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 uppercase tracking-wider"><span>5 yrs</span><span>30 yrs</span></div>
            </div>
          </div>

          {/* Outputs */}
          <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 rounded-2xl p-6 md:p-8 text-white shadow-xl flex flex-col">
            <p className="text-[11px] uppercase tracking-widest text-amber-400 font-semibold">Monthly EMI</p>
            <p className="font-serif text-5xl md:text-6xl font-semibold mt-1 leading-none">{fmtINR(emi)}</p>
            <p className="text-xs text-white/70 mt-2">per month for {tenure} years</p>

            <div className="h-px bg-white/15 my-6" />

            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between"><dt className="text-white/80">Loan Amount</dt><dd className="font-semibold">{fmtINR(loanAmount)}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-white/80">Down Payment</dt><dd className="font-semibold">{fmtINR(downPayment)}</dd></div>
              <div className="flex items-center justify-between"><dt className="text-white/80">Total Interest</dt><dd className="font-semibold text-amber-400">{fmtINR(totalInterest)}</dd></div>
              <div className="flex items-center justify-between pt-3 border-t border-white/10"><dt className="text-white/80">Total Payable</dt><dd className="font-bold text-xl">{fmtINR(totalPayable + downPayment)}</dd></div>
            </dl>

            <div className="mt-6">
              <p className="text-[10px] uppercase tracking-widest text-amber-400 mb-1.5">Principal vs Interest</p>
              <div className="h-2.5 w-full rounded-full overflow-hidden bg-white/15 flex">
                <div className="bg-white" style={{ width: `${(loanAmount / Math.max(1, totalPayable)) * 100}%` }} />
                <div className="bg-amber-400" style={{ width: `${(totalInterest / Math.max(1, totalPayable)) * 100}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-white/70 mt-1.5">
                <span>Principal {Math.round((loanAmount / Math.max(1, totalPayable)) * 100)}%</span>
                <span>Interest {Math.round((totalInterest / Math.max(1, totalPayable)) * 100)}%</span>
              </div>
            </div>

            <div className="mt-auto pt-8 grid grid-cols-2 gap-3">
              <a href={wa} target="_blank" rel="noreferrer" className="py-3 rounded-full bg-[#25D366] text-white font-bold hover:brightness-110 transition inline-flex items-center justify-center gap-2 shadow-lg text-sm">
                <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
              </a>
              <a href={phone} className="py-3 rounded-full bg-amber-400 text-slate-900 font-bold hover:brightness-110 transition inline-flex items-center justify-center gap-2 shadow-lg text-sm">
                <Phone className="w-4 h-4" /> Call Now
              </a>
            </div>
            <p className="text-[10px] text-white/50 mt-3 text-center">Indicative calculation. Final rates vary by bank, borrower profile and tenure.</p>
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-10 grid md:grid-cols-3 gap-4">
          {[
            { title: 'RERA-approved projects', desc: 'Every Gillco project is RERA-registered. Verify at rera.punjab.gov.in.' },
            { title: 'Pre-approved from top banks', desc: 'SBI, HDFC, ICICI, LIC HFL, Axis — we help you compare offers.' },
            { title: 'No cash transactions', desc: 'All payments only to Gillco Developers and Builders Pvt. Ltd. by cheque, DD, pay order or RTGS/NEFT.' },
          ].map((t, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
              <Sparkles className="w-5 h-5 text-amber-500 mb-2" />
              <h4 className="font-serif text-lg text-emerald-900">{t.title}</h4>
              <p className="text-sm text-slate-600 mt-1">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
