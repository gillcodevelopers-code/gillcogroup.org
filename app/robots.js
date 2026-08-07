export default function robots() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://gillcogroup.org';
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/admin', '/uploads/tmp/'] },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
