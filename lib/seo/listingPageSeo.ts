/**
 * Server-side SEO resolver for listing pages.
 * Calls the backend priority resolver and returns the DB-driven SEO config.
 * Returns null if no config found — the page must handle 404/noindex accordingly.
 *
 * URL CONVENTION: hyphen-only (no slashes in listing URLs)
 *   ✅  /flats-for-sale-in-noida
 *   ✅  /flats-for-sale-in-gurgaon-sector-56
 *   ❌  /flats-for-sale-in/noida
 */

import { KNOWN_CITY_SLUGS } from '@/lib/city-slugs';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface SeoPageConfig {
  source: 'category_locality' | 'category_city' | 'locality' | 'city' | 'category';
  h1Title: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  canonicalUrl: string | null;
  introContent: string | null;
  bottomContent: string | null;
  faqJson: { question: string; answer: string }[] | null;
  internalLinks: { label: string; url: string }[] | null;
  robots: string;
  context: {
    categorySlug?: string;
    categoryName?: string;
    citySlug?: string;
    cityName?: string;
    localitySlug?: string;
    localityName?: string;
  };
}

export interface ListingPageParams {
  category?: string;
  city?: string;
  locality?: string;
  /** Property type slug — e.g. 'apartment', 'villa', 'plot' */
  type?: string;
}

/**
 * Fetch resolved SEO config from the backend.
 * Must be called server-side (RSC / generateMetadata).
 * Returns null if no config found (page should noindex or 404).
 */
export async function resolveListingPageSeo(params: ListingPageParams): Promise<SeoPageConfig | null> {
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.city) qs.set('city', params.city);
  if (params.locality) qs.set('locality', params.locality);

  const url = `${API_BASE}/seo/listing-page?${qs.toString()}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 }, // cache for 1 hour
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) return null;
    return res.json() as Promise<SeoPageConfig>;
  } catch {
    return null;
  }
}

// ── URL slug parser ────────────────────────────────────────────────────────────

/**
 * Prefix → category + optional type mapping for all listing URL patterns.
 * Order matters: longer/more-specific prefixes must come first.
 */
const LISTING_PREFIXES: Array<{ prefix: string; category: string; type?: string }> = [
  // Full-form: category + type (most specific first)
  { prefix: 'property-for-sale-in',      category: 'buy' },
  { prefix: 'property-for-rent-in',      category: 'rent' },
  { prefix: 'flats-for-sale-in',         category: 'buy',        type: 'apartment' },
  { prefix: 'flats-for-rent-in',         category: 'rent',       type: 'apartment' },
  { prefix: 'villas-for-sale-in',        category: 'buy',        type: 'villa' },
  { prefix: 'plots-for-sale-in',         category: 'buy',        type: 'plot' },
  { prefix: 'office-space-for-rent-in',  category: 'commercial', type: 'commercial_office' },
  { prefix: 'commercial-property-in',    category: 'commercial' },
  { prefix: 'new-projects-in',           category: 'builder_project' },
  { prefix: 'pg-in',                     category: 'pg',         type: 'pg' },
  { prefix: 'buy-property-in',           category: 'buy' },
  { prefix: 'rent-property-in',          category: 'rent' },
  { prefix: 'properties-in',             category: '' },
  { prefix: 'property-in',               category: '' },
  // Short-form: type-in-city (footer SEO links — no category implied)
  { prefix: 'apartments-in',             category: '',           type: 'apartment' },
  { prefix: 'apartment-in',              category: '',           type: 'apartment' },
  { prefix: 'flats-in',                  category: '',           type: 'apartment' },
  { prefix: 'flat-in',                   category: '',           type: 'apartment' },
  { prefix: 'villas-in',                 category: '',           type: 'villa' },
  { prefix: 'villa-in',                  category: '',           type: 'villa' },
  { prefix: 'plots-in',                  category: '',           type: 'plot' },
  { prefix: 'plot-in',                   category: '',           type: 'plot' },
  { prefix: 'houses-in',                 category: '',           type: 'house' },
  { prefix: 'house-in',                  category: '',           type: 'house' },
  { prefix: 'studios-in',               category: '',           type: 'studio' },
  { prefix: 'studio-in',                category: '',           type: 'studio' },
  { prefix: 'penthouses-in',            category: '',           type: 'penthouse' },
  { prefix: 'penthouse-in',             category: '',           type: 'penthouse' },
  { prefix: 'farmhouses-in',            category: '',           type: 'farm_house' },
  { prefix: 'farmhouse-in',             category: '',           type: 'farm_house' },
  { prefix: 'offices-in',               category: 'commercial', type: 'commercial_office' },
  { prefix: 'office-in',                category: 'commercial', type: 'commercial_office' },
  { prefix: 'shops-in',                 category: 'commercial', type: 'commercial_shop' },
  { prefix: 'shop-in',                  category: 'commercial', type: 'commercial_shop' },
];

/**
 * Split a hyphen slug into (citySlug, localitySlug | undefined) using KNOWN_CITY_SLUGS.
 *
 * Example: "gurgaon-sector-56"
 *   → tries "gurgaon" → found in KNOWN_CITY_SLUGS
 *   → city="gurgaon", locality="sector-56"
 *
 * Example: "navi-mumbai"
 *   → tries "navi" → not found
 *   → tries "navi-mumbai" → found
 *   → city="navi-mumbai", locality=undefined
 *
 * Example: "noida"
 *   → tries "noida" → found
 *   → city="noida", locality=undefined
 */
function splitCityLocality(rest: string): { city: string; locality?: string } {
  const parts = rest.split('-');

  // Try longest city slug first (greedy city match leaves shortest locality)
  for (let i = parts.length; i >= 1; i--) {
    const citySlug = parts.slice(0, i).join('-');
    if (KNOWN_CITY_SLUGS.has(citySlug)) {
      const localitySlug = parts.slice(i).join('-');
      return {
        city: citySlug,
        locality: localitySlug || undefined,
      };
    }
  }

  // No known city matched — treat entire string as city (best-effort)
  return { city: rest };
}

/**
 * Parse a flat hyphen URL slug into listing page params.
 *
 * Accepts the full joined slug (e.g. "flats-for-sale-in-gurgaon-sector-56")
 * and returns { category, city, locality }.
 *
 * Uses KNOWN_CITY_SLUGS to correctly split compound slugs into city + locality.
 */
export function parseListingSlug(slug: string): ListingPageParams {
  const s = slug.toLowerCase().trim().replace(/^\//, '');

  for (const { prefix, category, type } of LISTING_PREFIXES) {
    const prefixWithDash = prefix + '-';
    if (!s.startsWith(prefixWithDash)) continue;

    const rest = s.slice(prefixWithDash.length);
    if (!rest) continue;

    const { city, locality } = splitCityLocality(rest);

    return {
      category: category || undefined,
      city,
      locality,
      type: type || undefined,
    };
  }

  return {};
}

/**
 * Call the smart search API server-side to extract property listing filters from a URL slug.
 * Used by the catch-all route so ANY admin-configured footer URL is decoded correctly —
 * not just the patterns listed in LISTING_PREFIXES.
 *
 * e.g. "flat in noida"  → { type: 'apartment', city: 'Noida' }
 *      "2bhk flat noida sector 62" → { bedrooms: '2', type: 'apartment', city: 'Noida', locality: 'sector 62' }
 */
export async function parseSlugToFilters(slugText: string): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${API_BASE}/smart-search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: slugText }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return {};
    const data = await res.json();
    return (data.filters as Record<string, string>) ?? {};
  } catch {
    return {};
  }
}

/**
 * Build a FAQ JSON-LD schema from the resolved SEO config.
 */
export function buildFaqSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}
