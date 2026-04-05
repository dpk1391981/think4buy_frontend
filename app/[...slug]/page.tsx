/**
 * Programmatic SEO Listing Page — Catch-All Route
 *
 * Handles ALL flat hyphen listing URLs:
 *   /property-for-sale-in-noida
 *   /flats-for-sale-in-gurgaon
 *   /flats-for-sale-in-gurgaon-sector-56
 *   /commercial-property-in-bangalore
 *   /pg-in-delhi
 *
 * Hard rules:
 *  - ALL SEO content comes exclusively from DB config
 *  - If no SEO config found → 404 (notFound())
 *  - No static/hardcoded fallback content
 *
 * URL CONVENTION: hyphen-only — /prefix-in-city[-locality]
 * Middleware 301-redirects any slash patterns to this form before routing.
 */
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import PropertyListingPage from '@/app/properties/PropertyListingPage';
import DbSeoContent from '@/components/seo/DbSeoContent';
import JsonLd, { buildBreadcrumbSchema } from '@/components/seo/JsonLd';
import {
  resolveListingPageSeo,
  parseListingSlug,
  parseSlugToFilters,
  buildFaqSchema,
  type SeoPageConfig,
} from '@/lib/seo/listingPageSeo';

type Props = { params: { slug: string[] } };

const SITE = 'https://think4buysale.com';

/** Convert slug to display name: "navi-mumbai" → "Navi Mumbai" */
function slugToName(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Join catch-all segments into a single flat slug.
 * Middleware should already send single-segment hyphen URLs,
 * but multi-segment is handled for safety.
 */
function buildSlug(parts: string[]): string {
  return parts.join('-');
}

async function getSeoConfig(slugParts: string[]): Promise<SeoPageConfig | null> {
  const slug = buildSlug(slugParts);
  const parsed = parseListingSlug(slug);
  // Always pass the raw slug so the backend can match footer-link SEO (Priority 0)
  // even when the URL pattern isn't in LISTING_PREFIXES.
  return resolveListingPageSeo({ ...parsed, urlSlug: slug });
}

// ── generateMetadata ──────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug   = buildSlug(params.slug);
  const config = await getSeoConfig(params.slug);

  // No SEO config — noindex but still renderable if URL is parseable
  if (!config) return { robots: { index: false, follow: false } };

  const robots = config.robots ?? 'index,follow';
  const [idx, fol] = robots.split(',');
  const canonical = config.canonicalUrl ?? `${SITE}/${slug}`;

  return {
    ...(config.metaTitle && { title: config.metaTitle }),
    ...(config.metaDescription && { description: config.metaDescription }),
    ...(config.metaKeywords && { keywords: config.metaKeywords }),
    robots: {
      index: idx?.trim().toLowerCase() !== 'noindex',
      follow: fol?.trim().toLowerCase() !== 'nofollow',
    },
    alternates: { canonical },
    ...(config.metaTitle && config.metaDescription && {
      openGraph: {
        title: config.metaTitle,
        description: config.metaDescription,
        url: canonical,
        type: 'website',
      },
    }),
  };
}

// ── Page Component ────────────────────────────────────────────────────────────

export default async function ProgrammaticSeoListingPage({ params }: Props) {
  const slug   = buildSlug(params.slug);
  const config = await getSeoConfig(params.slug);

  // Parse the URL slug into listing filters regardless of whether a SEO config exists.
  // This lets redirected URLs (e.g. /property-for-sale-in-noida-sector-62) render the
  // property grid even before an admin has configured a SEO record for that page.
  const urlParsed    = parseListingSlug(slug);
  const smartFilters = await parseSlugToFilters(params.slug.join(' '));

  // If the URL can't be parsed into any recognisable filters AND there's no SEO config,
  // serve a 404 (unknown/garbage URL).
  if (!config && !urlParsed.city && !urlParsed.category) {
    notFound();
  }

  // Fall-through context: use SEO config if available, else derive from URL parsing
  const context      = config?.context ?? {};
  const cityName     = context.cityName     ?? (context.citySlug     ? slugToName(context.citySlug)     : (urlParsed.city     ? slugToName(urlParsed.city)     : undefined));
  const localityName = context.localityName ?? (context.localitySlug ? slugToName(context.localitySlug) : (urlParsed.locality ? slugToName(urlParsed.locality) : undefined));

  // Breadcrumb
  const citySlugForBreadcrumb = context.citySlug ?? urlParsed.city;
  const breadcrumbs: { name: string; url: string }[] = [{ name: 'Home', url: SITE }];
  if (cityName && citySlugForBreadcrumb) breadcrumbs.push({ name: cityName, url: `${SITE}/property-in-${citySlugForBreadcrumb}` });
  if (localityName && citySlugForBreadcrumb) {
    breadcrumbs.push({ name: localityName, url: `${SITE}/${slug}` });
  }

  // JSON-LD schemas
  const schemas: Record<string, unknown>[] = [buildBreadcrumbSchema(breadcrumbs)];
  if (config?.faqJson?.length) schemas.push(buildFaqSchema(config.faqJson));

  // Build listing params: URL parsing is authoritative for category/city/locality;
  // smart NLP fills in any gaps (e.g. type from property-type prefix words).
  // NLP smart-search MUST NOT override URL-parsed city/locality — numeric slugs like
  // "noida-63" cause the NLP to emit city="noida 63" which breaks the exact-match city filter.
  const listingParams: Record<string, string> = { ...smartFilters };
  const resolvedCategory = urlParsed.category ?? context.categorySlug;
  if (resolvedCategory) listingParams.category = resolvedCategory;
  // Always overwrite with URL-parsed values — they are canonical for SEO pages.
  if (cityName)     listingParams.city     = cityName;
  if (localityName) listingParams.locality = localityName;
  if (listingParams.category === 'builder_project' || listingParams.category === 'new_projects') {
    listingParams.isNewProject = 'true';
  }

  return (
    <>
      <JsonLd schema={schemas} />

      {/* Property listings — always rendered from property DB */}
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-4" />}>
        <PropertyListingPage searchParams={listingParams} pageH1={config?.h1Title ?? null} />
      </Suspense>

      {/* DB-driven SEO content — only renders when SEO config has non-null fields */}
      {config && <DbSeoContent config={config} />}
    </>
  );
}
