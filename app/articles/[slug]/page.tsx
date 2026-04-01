import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, Eye, ArrowLeft, Tag, Calendar, User, Share2, BookOpen } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`
  : 'http://localhost:3001/api/v1';
const APP_URL  = process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com';

const CATEGORIES = [
  { value: 'news', label: 'News' },
  { value: 'tips', label: 'Tips' },
  { value: 'market-insights', label: 'Market Insights' },
  { value: 'guides', label: 'Guides' },
  { value: 'legal', label: 'Legal' },
  { value: 'investment', label: 'Investment' },
];

const CATEGORY_COLORS: Record<string, string> = {
  news: 'bg-blue-100 text-blue-700',
  tips: 'bg-green-100 text-green-700',
  'market-insights': 'bg-purple-100 text-purple-700',
  guides: 'bg-amber-100 text-amber-700',
  legal: 'bg-red-100 text-red-700',
  investment: 'bg-teal-100 text-teal-700',
};

interface Props {
  params: { slug: string };
}

async function fetchArticle(slug: string) {
  try {
    const res = await fetch(`${API_BASE}/articles/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

async function fetchRelated(category: string, excludeSlug: string) {
  try {
    const res = await fetch(`${API_BASE}/articles?category=${category}&limit=4`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).filter((a: any) => a.slug !== excludeSlug).slice(0, 3);
  } catch { return []; }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await fetchArticle(params.slug);
  if (!article) return { title: 'Article Not Found' };

  const title       = article.metaTitle || article.title;
  const description = article.metaDescription || article.excerpt || '';
  const ogImage     = article.ogImage || article.featuredImage;

  return {
    title,
    description,
    keywords: article.metaKeywords || undefined,
    alternates: {
      canonical: article.canonicalUrl || `${APP_URL}/articles/${article.slug}`,
    },
    openGraph: {
      title: `${title} | Think4BuySale`,
      description,
      type: 'article',
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      tags: article.tags || undefined,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: title }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Think4BuySale`,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

/** Renders markdown-like content: ## headings, **bold**, `code`, --- dividers, tables */
function renderContent(content: string) {
  const paragraphs = content.split('\n\n');

  return paragraphs.map((block, i) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    // Headings
    if (trimmed.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-gray-900 mt-7 mb-3">{trimmed.slice(4)}</h3>;
    if (trimmed.startsWith('## '))  return <h2 key={i} className="text-xl font-bold text-gray-900 mt-8 mb-3 pb-2 border-b border-gray-100">{trimmed.slice(3)}</h2>;
    if (trimmed.startsWith('# '))   return <h1 key={i} className="text-2xl font-bold text-gray-900 mt-8 mb-4">{trimmed.slice(2)}</h1>;

    // Horizontal rule
    if (trimmed === '---') return <hr key={i} className="my-6 border-gray-200" />;

    // Table (simple — detect | chars)
    if (trimmed.includes('|') && trimmed.split('\n').every(l => l.trim().startsWith('|'))) {
      const rows = trimmed.split('\n').filter(r => r.trim() && !r.match(/^\|[-| ]+\|$/));
      const header = rows[0]?.split('|').filter(Boolean).map(c => c.trim());
      const body   = rows.slice(1);
      return (
        <div key={i} className="overflow-x-auto my-5">
          <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
            <thead className="bg-primary-50">
              <tr>{header?.map((h, j) => <th key={j} className="text-left px-4 py-2.5 font-semibold text-gray-700 border-b border-gray-200">{h}</th>)}</tr>
            </thead>
            <tbody>
              {body.map((row, ri) => {
                const cells = row.split('|').filter(Boolean).map(c => c.trim());
                return (
                  <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {cells.map((cell, ci) => <td key={ci} className="px-4 py-2.5 text-gray-700 border-b border-gray-100">{cell}</td>)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    // Bullet list
    if (trimmed.split('\n').every(l => l.trim().startsWith('- '))) {
      const items = trimmed.split('\n').map(l => l.trim().slice(2));
      return (
        <ul key={i} className="my-4 space-y-1.5 pl-4">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-gray-700">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
            </li>
          ))}
        </ul>
      );
    }

    // Numbered list
    if (trimmed.split('\n').every(l => /^\d+\.\s/.test(l.trim()))) {
      const items = trimmed.split('\n').map(l => l.trim().replace(/^\d+\.\s/, ''));
      return (
        <ol key={i} className="my-4 space-y-1.5 pl-4 list-decimal list-inside marker:text-primary-500 marker:font-bold">
          {items.map((item, j) => (
            <li key={j} className="text-gray-700" dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
          ))}
        </ol>
      );
    }

    // Block quote / callout (> text)
    if (trimmed.startsWith('> ')) {
      return (
        <blockquote key={i} className="my-5 pl-4 border-l-4 border-primary-400 bg-primary-50 py-3 pr-4 rounded-r-xl">
          <p className="text-gray-700 text-sm italic" dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed.slice(2)) }} />
        </blockquote>
      );
    }

    // Default paragraph
    return (
      <p key={i} className="text-gray-700 leading-relaxed my-3.5" dangerouslySetInnerHTML={{ __html: inlineFormat(trimmed) }} />
    );
  });
}

/** Simple inline formatting: **bold**, *italic*, `code` */
function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 text-primary-700 px-1.5 py-0.5 rounded text-[0.85em] font-mono">$1</code>');
}

export default async function ArticleDetailPage({ params }: Props) {
  const [article, related] = await Promise.all([
    fetchArticle(params.slug),
    fetchArticle(params.slug).then(a => a ? fetchRelated(a.category, params.slug) : []),
  ]);

  if (!article) notFound();

  const catLabel = CATEGORIES.find(c => c.value === article.category)?.label || article.category;
  const catColor = CATEGORY_COLORS[article.category] || 'bg-gray-100 text-gray-600';

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt || article.metaDescription || '',
    image: article.featuredImage || article.ogImage,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: {
      '@type': 'Person',
      name: article.author?.name || 'Think4BuySale Editorial',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Think4BuySale',
      logo: { '@type': 'ImageObject', url: `${APP_URL}/logo.png` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${APP_URL}/articles/${article.slug}` },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="min-h-screen bg-gray-50 pb-16 lg:pb-8">
        {/* Hero with featured image or gradient */}
        {article.featuredImage ? (
          <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
            <img src={article.featuredImage} alt={article.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 container-max pb-6 pt-20">
              <span className={`inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-full ${catColor} mb-3`}>{catLabel}</span>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-snug max-w-3xl">{article.title}</h1>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 pt-20 pb-10">
            <div className="container-max">
              <span className={`inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-full ${catColor} mb-3`}>{catLabel}</span>
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-snug max-w-3xl">{article.title}</h1>
            </div>
          </div>
        )}

        <div className="container-max py-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-10">
            {/* ── Main content ── */}
            <article className="lg:col-span-2">
              {/* Back link */}
              <Link href="/articles" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors mb-5">
                <ArrowLeft className="w-3.5 h-3.5" /> All Articles
              </Link>

              {/* Meta bar */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 pb-5 border-b border-gray-100">
                {article.author?.name && (
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span className="font-medium text-gray-700">{article.author.name}</span>
                  </span>
                )}
                {article.publishedAt && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(article.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                )}
                {article.readTime && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> {article.readTime} min read
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" /> {article.viewCount || 0} views
                </span>
              </div>

              {/* Excerpt */}
              {article.excerpt && (
                <p className="text-lg text-gray-600 leading-relaxed mb-6 font-medium border-l-4 border-primary-400 pl-4 bg-primary-50 py-3 rounded-r-xl">
                  {article.excerpt}
                </p>
              )}

              {/* Content */}
              <div className="prose-content max-w-none">
                {renderContent(article.content)}
              </div>

              {/* Tags */}
              {article.tags && article.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-8 pt-6 border-t border-gray-100">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  {article.tags.map((tag: string) => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Gallery */}
              {article.gallery && article.gallery.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">Gallery</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {article.gallery.map((url: string, i: number) => (
                      <div key={i} className="rounded-xl overflow-hidden border border-gray-100 aspect-video bg-gray-100">
                        <img src={url} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Share */}
              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-3">
                <Share2 className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">Share:</span>
                <a href={`https://wa.me/?text=${encodeURIComponent(`${article.title} — ${APP_URL}/articles/${article.slug}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-full font-medium hover:bg-green-600 transition-colors">
                  WhatsApp
                </a>
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(`${APP_URL}/articles/${article.slug}`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs bg-sky-500 text-white px-3 py-1.5 rounded-full font-medium hover:bg-sky-600 transition-colors">
                  Twitter
                </a>
              </div>
            </article>

            {/* ── Sidebar ── */}
            <aside className="mt-8 lg:mt-0 space-y-6">
              {/* CTA */}
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-5 text-white">
                <h3 className="font-bold text-base mb-1.5">Looking to buy or sell?</h3>
                <p className="text-primary-100 text-sm mb-4">Browse thousands of verified properties across India.</p>
                <Link href="/properties" className="block w-full text-center bg-white text-primary-700 font-semibold text-sm px-4 py-2.5 rounded-xl hover:bg-primary-50 transition-colors">
                  Browse Properties
                </Link>
              </div>

              {/* Related articles */}
              {related.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
                  <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary-600" /> Related Articles
                  </h3>
                  <div className="space-y-4">
                    {related.map((a: any) => (
                      <Link key={a.id} href={`/articles/${a.slug}`} className="group flex gap-3 items-start">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-primary-50 flex-shrink-0">
                          {a.featuredImage
                            ? <img src={a.featuredImage} alt={a.title} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-5 h-5 text-primary-300" /></div>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-primary-600 transition-colors leading-snug">{a.title}</p>
                          {a.readTime && <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{a.readTime} min</p>}
                        </div>
                      </Link>
                    ))}
                  </div>
                  <Link href={`/articles?category=${article.category}`} className="block text-center text-xs text-primary-600 font-medium hover:underline mt-4 pt-3 border-t border-gray-100">
                    More {catLabel} →
                  </Link>
                </div>
              )}

              {/* Categories */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-card p-5">
                <h3 className="font-bold text-gray-900 text-sm mb-3">Browse by Category</h3>
                <div className="space-y-1">
                  {CATEGORIES.map(cat => (
                    <Link key={cat.value} href={`/articles?category=${cat.value}`}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors ${article.category === cat.value ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}>
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${CATEGORY_COLORS[cat.value]?.split(' ')[0] || 'bg-gray-300'}`} />
                      {cat.label}
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  );
}
