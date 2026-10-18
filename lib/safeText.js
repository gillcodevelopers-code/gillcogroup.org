// Safe text helpers used on the server (when saving) and in the browser (when rendering).

const SAFE_SCHEME = /^(https?:|mailto:|tel:)/i;

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Only http(s), mailto, tel, site-relative (/path) and #anchors are allowed as links
export function safeUrl(url, { allowDataImage = false } = {}) {
  const u = String(url ?? '').trim();
  if (!u) return '';
  // strip whitespace/control chars browsers ignore inside schemes (e.g. "java\tscript:")
  const probe = u.replace(/[\u0000-\u0020\u007f-\u009f]/g, '');
  if (probe.startsWith('/') && !probe.startsWith('//')) return u;
  if (probe.startsWith('#') || probe.startsWith('?')) return u;
  if (SAFE_SCHEME.test(probe)) return u;
  if (allowDataImage && /^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(probe)) return u;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(probe) && /^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(probe)) return `https://${u}`; // "gillcogroup.org/x"
  return '';
}

// Remove HTML: dangerous blocks entirely, every other tag stripped (text kept)
export function stripHtml(s) {
  return String(s ?? '')
    .replace(/<(script|style|iframe|object|embed|noscript|template|svg|math)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|style|iframe|object|embed)\b[^>]*\/?>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/?[a-z][a-z0-9-]*(\s[^<>]*)?\/?>/gi, '');
}

const URL_KEY = /(url|link|href|src|image|img|logo|photo|avatar|video|brochure|thumbnail|cover|banner|icon|website|instagram|facebook|youtube|linkedin|twitter|whatsapp)s?$/i;
const IMAGE_KEY = /(image|img|logo|photo|avatar|thumbnail|cover|banner|icon)s?$/i;

/** Deep-clean a JSON body from the Admin CMS before it is stored. */
export function sanitizeContent(value, key = '') {
  if (typeof value === 'string') {
    // Any value that starts with a link scheme must be a safe one (blocks javascript:, vbscript:, data:text/html, file: ...)
    const probe = value.replace(/[\u0000-\u0020\u007f-\u009f]/g, '');
    if (/^[a-z][a-z0-9+.-]*:/i.test(probe) && !/^(https?|mailto|tel|sms|whatsapp):/i.test(probe)) {
      if (/^data:/i.test(probe)) return IMAGE_KEY.test(key) || URL_KEY.test(key) ? safeUrl(value, { allowDataImage: true }) : value.startsWith('data:image/') ? value : '';
      return /^[a-z][a-z0-9+.-]*:\/\//i.test(probe) || /^(javascript|vbscript|livescript|file|blob|jar):/i.test(probe) ? '' : stripHtml(value);
    }
    return stripHtml(value);
  }
  if (Array.isArray(value)) return value.map((v) => sanitizeContent(v, key));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      out[k] = sanitizeContent(v, k);
    }
    return out;
  }
  return value;
}

/**
 * Markdown-lite -> safe HTML for ONE paragraph/line: **bold**, *italic*, [text](url).
 * Everything is escaped first, so stored HTML can never run.
 */
export function mdInline(text, linkClass = '') {
  let s = escapeHtml(text);
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*(?!\s)([^*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, rawUrl) => {
    const url = safeUrl(rawUrl.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"'));
    if (!url) return label;
    const external = /^https?:/i.test(url);
    return `<a href="${escapeHtml(url)}"${external ? ' target="_blank" rel="noopener noreferrer nofollow"' : ''}${linkClass ? ` class="${escapeHtml(linkClass)}"` : ''}>${label}</a>`;
  });
  return s;
}
