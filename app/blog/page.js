import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 min

export const metadata = {
  title: 'Blog & Updates',
  description: 'Latest news, project updates, lifestyle stories and social posts from Gillco Group — shared by Quality Real Estate.',
  openGraph: {
    title: 'Blog & Updates — Gillco Group',
    description: 'Latest news, project updates, lifestyle stories and social posts from Gillco Group.',
    type: 'website',
  },
  alternates: { canonical: '/blog' },
};

async function getPosts() {
  try {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(process.env.MONGO_URL);
    await client.connect();
    const db = client.db(process.env.DB_NAME || 'gillco');
    const items = await db
      .collection('posts')
      .find({ published: { $ne: false } })
      .sort({ publishedAt: -1, createdAt: -1 })
      .toArray();
    await client.close();
    return items.map((p) => ({ ...p, _id: undefined }));
  } catch (e) {
    console.error('blog fetch fail', e?.message);
    return [];
  }
}

function fmtDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

const sourceBadge = {
  manual: { label: 'Blog', color: 'bg-emerald-100 text-emerald-800' },
  instagram: { label: 'Instagram', color: 'bg-pink-100 text-pink-700' },
  facebook: { label: 'Facebook', color: 'bg-blue-100 text-blue-700' },
  twitter: { label: 'X / Twitter', color: 'bg-slate-200 text-slate-800' },
  linkedin: { label: 'LinkedIn', color: 'bg-sky-100 text-sky-800' },
  youtube: { label: 'YouTube', color: 'bg-red-100 text-red-700' },
};

export default async function BlogIndex() {
  const posts = await getPosts();

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <nav className="text-sm text-emerald-900 mb-4">
          <Link href="/" className="hover:underline">← Home</Link>
        </nav>

        <header className="mb-10">
          <p className="uppercase tracking-widest text-xs font-semibold text-amber-700 mb-2">Stories · Updates · Social</p>
          <h1 className="text-4xl md:text-6xl font-serif text-emerald-900">Gillco Blog</h1>
          <p className="mt-3 text-slate-600 max-w-2xl">
            Project launches, lifestyle stories and social highlights from Gillco Group.
            Share any post directly on WhatsApp, Facebook or LinkedIn.
          </p>
        </header>

        {posts.length === 0 && (
          <div className="bg-white rounded-xl p-10 text-center text-slate-500 border border-slate-200">
            <p className="text-lg">No posts yet.</p>
            <p className="text-sm mt-2">Admin can create posts from the CMS → <Link href="/" className="text-emerald-700 underline">Admin Panel</Link>.</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((p) => {
            const src = sourceBadge[p.source] || sourceBadge.manual;
            return (
              <Link
                key={p.id}
                href={`/blog/${p.slug}`}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition border border-slate-100 flex flex-col"
              >
                {p.cover ? (
                  <div className="aspect-[16/10] overflow-hidden bg-stone-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.cover}
                      alt={p.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  </div>
                ) : (
                  <div className="aspect-[16/10] bg-gradient-to-br from-emerald-900 to-emerald-700 flex items-center justify-center">
                    <span className="text-amber-200 font-serif text-2xl">Gillco</span>
                  </div>
                )}
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-semibold ${src.color}`}>{src.label}</span>
                    {p.publishedAt && (
                      <span className="text-slate-400">{fmtDate(p.publishedAt)}</span>
                    )}
                  </div>
                  <h2 className="font-serif text-xl text-emerald-900 group-hover:text-amber-700 transition line-clamp-2">
                    {p.title}
                  </h2>
                  {p.excerpt && (
                    <p className="text-slate-600 text-sm mt-2 line-clamp-3">{p.excerpt}</p>
                  )}
                  {Array.isArray(p.tags) && p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {p.tags.slice(0, 3).map((t) => (
                        <span key={t} className="text-[10px] uppercase tracking-wider text-slate-500 bg-stone-100 px-2 py-0.5 rounded-full">#{t}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-auto pt-4 text-emerald-700 text-sm font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Read →
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
