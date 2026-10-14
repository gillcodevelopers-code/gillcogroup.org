// Tiny GA4 helper — safe to call even when GA4 is not configured.
export function trackEvent(name, params = {}) {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', name, params);
    }
  } catch {}
}
