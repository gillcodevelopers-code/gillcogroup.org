// Dynamic sitemap — pulls project slugs from Mongo at build/request time.
// Falls back to just static routes if DB is unreachable.
export const revalidate = 3600; // regenerate hourly

async function fetchProjects() {
  try {
    const { getDb } = await import('@/lib/db');
    const db = await getDb();
    const projects = await db
      .collection('projects')
      .find({}, { projection: { slug: 1, updatedAt: 1 } })
      .toArray();
    return projects || [];
  } catch (e) {
    return [];
  }
}

export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://gillcogroup.org';
  const now = new Date();

  const staticRoutes = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/#projects`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/#about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/#contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];

  const projects = await fetchProjects();
  const projectRoutes = projects
    .filter((p) => p.slug)
    .map((p) => ({
      url: `${base}/?project=${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

  return [...staticRoutes, ...projectRoutes];
}
