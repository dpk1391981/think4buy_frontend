import type { Metadata } from 'next';
import { Suspense } from 'react';
import PropertyListingPage from './PropertyListingPage';
import CategoryPageContent from '@/components/seo/CategoryPageContent';

interface Props {
  searchParams: { [key: string]: string | string[] | undefined };
}

async function fetchCategorySeo(categorySlug?: string) {
  if (!categorySlug) return null;
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`
      : 'http://localhost:3001/api/v1';
    const res = await fetch(`${apiBase}/seo/categories/${categorySlug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function fetchLocationSeo(city?: string, state?: string) {
  if (!city && !state) return null;
  try {
    const params = new URLSearchParams();
    if (city)  params.set('city', city);
    if (state) params.set('state', state);
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`
      : 'http://localhost:3001/api/v1';
    const res = await fetch(`${apiBase}/locations/seo?${params}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com';

/** Category → its dedicated landing page, which is the indexable form. */
const CATEGORY_LANDING: Record<string, string> = {
  buy:        '/buy',
  rent:       '/rent',
  pg:         '/pg',
  commercial: '/commercial',
};

/**
 * Filters that have no SEO page of their own. Middleware only rewrites
 * category+city(+locality) into a hyphen URL — anything below stays on
 * `/properties?…`, where the permutations are effectively unbounded.
 */
const DEEP_FILTER_KEYS = [
  'type', 'bedrooms', 'bathrooms', 'minPrice', 'maxPrice', 'furnishing',
  'lat', 'lng', 'isNewProject', 'sort', 'page', 'amenities', 'possession',
];

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const category = (searchParams.category as string) || 'buy';
  const city     = searchParams.city  as string | undefined;
  const state    = searchParams.state as string | undefined;
  const type     = searchParams.type  as string | undefined;

  const categoryLabel = { buy: 'Sale', rent: 'Rent', pg: 'PG', commercial: 'Commercial' }[category] || 'Sale';
  const typeLabel = type ? ` ${type.charAt(0).toUpperCase() + type.slice(1)}` : '';
  const cityLabel = city ? ` in ${city}` : state ? ` in ${state}` : ' in India';

  const seo = await fetchLocationSeo(city, state);

  const title       = seo?.metaTitle       || `Properties for ${categoryLabel}${typeLabel}${cityLabel}`;
  const description = seo?.metaDescription || `Browse ${typeLabel || 'all'} properties for ${categoryLabel}${cityLabel}. Verified listings with best prices. Filter by budget, BHK, furnishing & more.`;

  // ── Canonical & indexability ──────────────────────────────────────────────
  //
  // This route is the filter surface, so its URLs multiply combinatorially. It
  // previously emitted no canonical at all, which left every permutation of
  // budget × BHK × furnishing × sort × page separately indexable — duplicate
  // listings competing with the hyphen SEO pages that are meant to rank.
  //
  // Rule: point every variant at the one URL that should rank, and keep the
  // deep-filter permutations out of the index while still letting crawlers
  // follow through to the listings themselves.
  const hasDeepFilter = DEEP_FILTER_KEYS.some((k) => searchParams[k] != null && searchParams[k] !== '');

  const toSlug = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  // Mirrors the middleware's category+city → hyphen mapping, so the canonical
  // names the same URL the middleware would have redirected to.
  const CATEGORY_TO_PREFIX: Record<string, string> = {
    buy:        'property-for-sale-in',
    rent:       'property-for-rent-in',
    pg:         'pg-in',
    commercial: 'commercial-property-in',
  };
  const prefix = CATEGORY_TO_PREFIX[category];

  let canonicalPath: string;
  if (city && prefix) {
    canonicalPath = `/${prefix}-${toSlug(city)}`;
  } else {
    canonicalPath = CATEGORY_LANDING[category] ?? '/properties';
  }

  return {
    title,
    description,
    alternates: { canonical: `${APP_URL}${canonicalPath}` },
    robots: hasDeepFilter
      ? { index: false, follow: true }
      : { index: true,  follow: true },
    openGraph: {
      title: `${title} | Think4BuySale`,
      description,
      url: `${APP_URL}${canonicalPath}`,
    },
  };
}

export default async function Page({ searchParams }: Props) {
  const category = (searchParams.category as string) || 'buy';
  const categorySeo = await fetchCategorySeo(category);
  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
        <PropertyListingPage searchParams={searchParams} />
      </Suspense>
      {categorySeo && <CategoryPageContent category={categorySeo} />}
    </>
  );
}
