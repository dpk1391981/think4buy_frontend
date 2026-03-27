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
  const config = await getSeoConfig(params.slug);

  if (!config) return { robots: { index: false, follow: false } };

  const robots = config.robots ?? 'index,follow';
  const [idx, fol] = robots.split(',');
  const canonical = config.canonicalUrl ?? `${SITE}/${buildSlug(params.slug)}`;

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
  const config = await getSeoConfig(params.slug);
  if (!config) notFound();

  const { context } = config;
  const cityName     = context.cityName     ?? (context.citySlug     ? slugToName(context.citySlug)     : undefined);
  const localityName = context.localityName ?? (context.localitySlug ? slugToName(context.localitySlug) : undefined);

  // Breadcrumb
  const breadcrumbs: { name: string; url: string }[] = [{ name: 'Home', url: SITE }];
  if (cityName) breadcrumbs.push({ name: cityName, url: `${SITE}/property-in-${context.citySlug}` });
  if (localityName && context.citySlug) {
    breadcrumbs.push({ name: localityName, url: `${SITE}/${buildSlug(params.slug)}` });
  }

  // JSON-LD schemas
  const schemas: Record<string, unknown>[] = [buildBreadcrumbSchema(breadcrumbs)];
  if (config.faqJson?.length) schemas.push(buildFaqSchema(config.faqJson));

  // Property listing search params — derived from smart search so ANY admin URL works.
  // e.g. "flat-in-noida" → { type: 'apartment', city: 'Noida' }
  //      "2bhk-villa-gurgaon-sector-56" → { bedrooms: '2', type: 'villa', city: 'Gurgaon', locality: 'sector 56' }
  const smartFilters = await parseSlugToFilters(params.slug.join(' '));
  const listingParams: Record<string, string> = { ...smartFilters };
  // Fill in gaps from SEO context (smart search might not extract category from type-only slugs)
  if (!listingParams.category && context.categorySlug) listingParams.category = context.categorySlug;
  if (!listingParams.city     && cityName)             listingParams.city      = cityName;
  if (!listingParams.locality && localityName)         listingParams.locality  = localityName;

  return (
    <>
      <JsonLd schema={schemas} />

      {/* Property listings — always rendered from property DB */}
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-4" />}>
        <PropertyListingPage searchParams={listingParams} />
      </Suspense>

      {/* DB-driven SEO content — only renders non-null fields */}
      <DbSeoContent config={config} />
    </>
  );
}
