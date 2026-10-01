'use client';

import { useState } from 'react';
import { Facebook, Linkedin, Twitter, MessageCircle, Link as LinkIcon, Check } from 'lucide-react';

export default function ShareButtons({ url, title, excerpt }) {
  const [copied, setCopied] = useState(false);
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title || '');
  const encodedText = encodeURIComponent(`${title}${excerpt ? ' — ' + excerpt : ''}`);

  const wa = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const tw = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
  const ln = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement('input');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
      document.body.removeChild(el);
    }
  };

  const Btn = ({ href, label, icon: Icon, color }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Share on ${label}`}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white transition hover:scale-105 ${color}`}
    >
      <Icon className="w-4 h-4" />
      <span className="hidden sm:inline">{label}</span>
    </a>
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold mr-1">Share:</span>
      <Btn href={wa} label="WhatsApp" icon={MessageCircle} color="bg-green-600 hover:bg-green-700" />
      <Btn href={fb} label="Facebook" icon={Facebook} color="bg-blue-600 hover:bg-blue-700" />
      <Btn href={tw} label="X" icon={Twitter} color="bg-slate-800 hover:bg-slate-900" />
      <Btn href={ln} label="LinkedIn" icon={Linkedin} color="bg-sky-700 hover:bg-sky-800" />
      <button
        onClick={copyLink}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition"
      >
        {copied ? <Check className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
        <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy Link'}</span>
      </button>
    </div>
  );
}
