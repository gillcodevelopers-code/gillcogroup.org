'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

const VALID = /^G-[A-Z0-9]{4,}$/;

// Loads GA4 using the Measurement ID saved in Admin CMS → Settings (or NEXT_PUBLIC_GA4_ID as fallback)
// and auto-tracks every Call (tel:) and WhatsApp link click across the whole site.
const Analytics = () => {
  const pathname = usePathname();
  const idRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    const boot = (id) => {
      if (cancelled || !id || !VALID.test(id) || window.__gaLoaded) return;
      window.__gaLoaded = true;
      idRef.current = id;
      window.dataLayer = window.dataLayer || [];
      window.gtag = function gtag() { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', id, { send_page_view: true });
      const sc = document.createElement('script');
      sc.async = true;
      sc.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
      document.head.appendChild(sc);
    };
    const envId = (process.env.NEXT_PUBLIC_GA4_ID || '').trim().toUpperCase();
    fetch('/api/settings')
      .then(r => (r.ok ? r.json() : {}))
      .then(s => boot(String(s?.ga4Id || envId).trim().toUpperCase()))
      .catch(() => boot(envId));

    const onClick = (e) => {
      const a = e.target?.closest?.('a[href]');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      const label = (a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 80);
      if (href.startsWith('tel:')) {
        trackEvent('click_call', { phone: href.slice(4), link_text: label, page_path: window.location.pathname });
      } else if (/wa\.me|api\.whatsapp\.com|whatsapp:/.test(href) && !a.dataset.gaSkip) {
        trackEvent('click_whatsapp', { link_text: label, page_path: window.location.pathname });
      }
    };
    document.addEventListener('click', onClick, true);
    return () => { cancelled = true; document.removeEventListener('click', onClick, true); };
  }, []);

  // Page views for client-side route changes (blog, EMI calculator, legal pages…)
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    trackEvent('page_view', { page_path: pathname, page_location: window.location.href, page_title: document.title });
  }, [pathname]);

  return null;
};

export default Analytics;
