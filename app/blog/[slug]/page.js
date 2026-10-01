import Link from 'next/link';
import { notFound } from 'next/navigation';
import ShareButtons from './ShareButtons';

export const dynamic = 'force-dynamic';

async function getPost(slug) {
  try {
    const { MongoClient } = await import('mongodb');
    const client = new MongoClient(process.env.MONGO_URL);
    await client.connect();
    const db = client.db(process.env.DB_NAME || 'gillco');
    const item = await db.collection('posts').findOne({ slug });
    await client.close();
    if (!item) return null;
    return { ...item, _id: undefined };
  } catch (e) {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: 'Post not found' };
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://gillcogroup.org';
  const url = `${base}/blog/${post.slug}`;
  const image = post.cover || `${base}/og-default.jpg`;
  return {
    title: post.title,
    description: post.excerpt || post.title,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      type: 'article',
      url,
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
      publishedTime: post.publishedAt,
      authors: [post.author || 'Gillco Group'],
      tags: Array.isArray(post.tags) ? post.tags : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || post.title,
      images: [image],
    },
  };
}

function fmtDate(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

// Simple markdown-ish renderer: converts \n\n -> <p>, **bold**, *italic*, [text](url), line breaks
function renderBody(text) {
  if (!text) return null;
  const paragraphs = String(text).split(/\n{2,}/);
  return paragraphs.map((para, idx) => {
    const withBold = para.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    const withItalic = withBold.replace(/(^|[^\*])\*(?!\s)([^\*\n]+?)\*(?!\*)/g, '$1<em>$2</em>');
    const withLinks = withItalic.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-emerald-700 underline">$1</a>');
    const withBr = withLinks.replace(/\n/g, '<br />');
    return <p key={idx} className="mb-5 text-slate-700 leading-relaxed text-lg" dangerouslySetInnerHTML={{ __html: withBr }} />;
  });
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://gillcogroup.org';
  const fullUrl = `${base}/blog/${post.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.title,
    image: post.cover ? [post.cover] : undefined,
    datePublished: post.publishedAt,
    author: { '@type': 'Organization', name: post.author || 'Gillco Group' },
    publisher: { '@type': 'Organization', name: 'Gillco Group', logo: { '@type': 'ImageObject', url: 'https://www.gillcogroup.com/gillco-logo-original.png' } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': fullUrl },
  };

  return (
    <main className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero cover */}
      {post.cover && (
        <div className="w-full aspect-[21/9] md:aspect-[21/8] overflow-hidden bg-stone-100 relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.cover} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        </div>
      )}

      <article className="max-w-3xl mx-auto px-4 py-10 md:py-16">
        <nav className="text-sm text-emerald-900 mb-6">
          <Link href="/" className="hover:underline">← Home</Link>
          <span className="mx-2 text-emerald-900/40">/</span>
          <Link href="/blog" className="hover:underline">Blog</Link>
        </nav>

        <div className="flex items-center gap-3 text-xs mb-3">
          <span className="uppercase tracking-widest text-amber-700 font-semibold">{post.author || 'Gillco Group'}</span>
          {post.publishedAt && <span className="text-slate-400">· {fmtDate(post.publishedAt)}</span>}
        </div>

        <h1 className="font-serif text-3xl md:text-5xl text-emerald-900 leading-tight mb-5">{post.title}</h1>

        {post.excerpt && <p className="text-xl text-slate-600 italic mb-8 border-l-4 border-amber-500 pl-4">{post.excerpt}</p>}

        <ShareButtons url={fullUrl} title={post.title} excerpt={post.excerpt} />

        <div className="mt-10">
          {renderBody(post.body)}
        </div>

        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <span key={t} className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">#{t}</span>
            ))}
          </div>
        )}

        {post.sourceUrl && (
          <p className="mt-10 text-sm text-slate-500">
            Original source: <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 underline">{post.sourceUrl}</a>
          </p>
        )}

        <div className="mt-12 pt-8 border-t border-slate-200">
          <ShareButtons url={fullUrl} title={post.title} excerpt={post.excerpt} />
        </div>

        <div className="mt-10 text-center">
          <Link href="/blog" className="inline-block px-6 py-3 bg-emerald-800 text-white rounded-full font-semibold hover:bg-emerald-700">← All Posts</Link>
        </div>
      </article>
    </main>
  );
}
