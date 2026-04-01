import type { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Clock, Eye, Tag, ArrowRight, TrendingUp } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`
  : 'http://localhost:3001/api/v1';

const CATEGORIES = [
  { value: '', label: 'All Articles' },
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
  searchParams: { category?: string; page?: string; search?: string };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const cat = searchParams.category;
  const catLabel = CATEGORIES.find(c => c.value === cat)?.label || 'All';
  return {
    title: `${catLabel} Real Estate Articles & Guides`,
    description: 'Expert real estate articles, guides, market insights, legal tips, and investment advice for Indian property buyers, sellers, and investors.',
    openGraph: {
      title: `${catLabel} Articles | Think4BuySale`,
      description: 'Expert real estate articles and guides for property buyers, sellers, and investors in India.',
    },
  };
}

async function fetchArticles(params: { category?: string; page?: number; search?: string }) {
  try {
    const q = new URLSearchParams({ limit: '12', page: String(params.page || 1) });
    if (params.category) q.set('category', params.category);
    if (params.search) q.set('search', params.search);
    const res = await fetch(`${API_BASE}/articles?${q}`, { next: { revalidate: 300 } });
    if (!res.ok) return { items: [], total: 0, pages: 1 };
    return res.json();
  } catch { return { items: [], total: 0, pages: 1 }; }
}

async function fetchFeatured() {
  try {
    const res = await fetch(`${API_BASE}/articles?featured=true&limit=3`, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch { return []; }
}

function ArticleCard({ article, featured = false }: { article: any; featured?: boolean }) {
  const catLabel = CATEGORIES.find(c => c.value === article.category)?.label || article.category;
  const catColor = CATEGORY_COLORS[article.category] || 'bg-gray-100 text-gray-600';

  return (
    <Link href={`/articles/${article.slug}`} className={`group block bg-white rounded-2xl border border-gray-100 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden ${featured ? 'lg:flex' : ''}`}>
      {/* Thumbnail placeholder — show if featuredImage exists */}
      {article.featuredImage ? (
        <div className={`bg-gray-100 overflow-hidden flex-shrink-0 ${featured ? 'lg:w-64 h-48 lg:h-auto' : 'h-44'}`}>
          <img src={article.featuredImage} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <div className={`bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center flex-shrink-0 ${featured ? 'lg:w-64 h-40 lg:h-auto' : 'h-36'}`}>
          <BookOpen className="w-10 h-10 text-primary-300" />
        </div>
      )}

      <div className="p-5 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${catColor}`}>{catLabel}</span>
          {article.isFeatured && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Featured</span>}
        </div>

        <h2 className={`font-bold text-gray-900 leading-snug group-hover:text-primary-600 transition-colors ${featured ? 'text-lg' : 'text-base'} line-clamp-2`}>
          {article.title}
        </h2>

        {article.excerpt && (
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{article.excerpt}</p>
        )}

        <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto pt-1">
          {article.readTime && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {article.readTime} min read
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" /> {article.viewCount || 0} views
          </span>
          {article.publishedAt && (
            <span>{new Date(article.publishedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          )}
        </div>

        {featured && (
          <span className="inline-flex items-center gap-1 text-primary-600 text-sm font-semibold group-hover:gap-2 transition-all mt-1">
            Read article <ArrowRight className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    </Link>
  );
}

export default async function ArticlesPage({ searchParams }: Props) {
  const category = searchParams.category || '';
  const page     = Number(searchParams.page) || 1;
  const search   = searchParams.search || '';
  const isHome   = !category && !search && page === 1;

  const [data, featured] = await Promise.all([
    fetchArticles({ category, page, search }),
    isHome ? fetchFeatured() : Promise.resolve([]),
  ]);

  const { items: articles, total, pages } = data;

  return (
    <div className="min-h-screen bg-gray-50 pb-16 lg:pb-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white pt-20 pb-10">
        <div className="container-max text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-4">
            <TrendingUp className="w-3.5 h-3.5" /> Real Estate Knowledge Hub
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Articles & Guides</h1>
          <p className="text-primary-100 max-w-xl mx-auto text-sm md:text-base">
            Expert insights on buying, selling, renting, investing — everything you need to navigate Indian real estate with confidence.
          </p>
        </div>
      </div>

      <div className="container-max mt-8 space-y-8">
        {/* Category filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map(cat => (
            <Link
              key={cat.value}
              href={cat.value ? `/articles?category=${cat.value}` : '/articles'}
              className={`filter-chip flex-shrink-0 ${category === cat.value ? 'active' : ''}`}
            >
              {cat.label}
            </Link>
          ))}
        </div>

        {/* Featured articles (home only) */}
        {isHome && featured.length > 0 && (
          <section>
            <h2 className="section-title mb-5">Featured</h2>
            <div className="space-y-4">
              {featured.slice(0, 1).map((a: any) => <ArticleCard key={a.id} article={a} featured />)}
              {featured.length > 1 && (
                <div className="grid md:grid-cols-2 gap-4">
                  {featured.slice(1).map((a: any) => <ArticleCard key={a.id} article={a} />)}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Main listing */}
        <section>
          {(category || search) && (
            <div className="flex items-center justify-between mb-5">
              <h2 className="section-title">
                {search ? `Results for "${search}"` : CATEGORIES.find(c => c.value === category)?.label}
                <span className="text-base font-normal text-gray-400 ml-2">({total})</span>
              </h2>
              <Link href="/articles" className="text-sm text-primary-600 hover:underline">Clear filters</Link>
            </div>
          )}
          {!isHome && !category && !search && <h2 className="section-title mb-5">All Articles</h2>}
          {isHome && featured.length > 0 && <h2 className="section-title mb-5">Latest Articles</h2>}

          {articles.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3" />
              <p className="font-medium">No articles found</p>
              <p className="text-sm mt-1">Try a different category or check back soon.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {articles.map((a: any) => <ArticleCard key={a.id} article={a} />)}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              {page > 1 && (
                <Link href={`/articles?${new URLSearchParams({ ...(category && { category }), ...(search && { search }), page: String(page - 1) })}`}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors bg-white">
                  Previous
                </Link>
              )}
              <span className="text-sm text-gray-500 px-4">Page {page} of {pages}</span>
              {page < pages && (
                <Link href={`/articles?${new URLSearchParams({ ...(category && { category }), ...(search && { search }), page: String(page + 1) })}`}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors bg-white">
                  Next
                </Link>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
