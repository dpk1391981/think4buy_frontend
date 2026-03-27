import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PropertyDetailClient from './PropertyDetailClient';
import { propertiesApi } from '@/lib/api';
import JsonLd, { buildRealEstateListingSchema, buildBreadcrumbSchema } from '@/components/seo/JsonLd';
import { resolveImageUrl } from '@/lib/imageUtils';
import { getPropertyTypeLabel, getCategoryLabel } from '@/lib/utils';

interface Props {
  params: { slug: string };
}

/**
 * ISR — revalidate every 5 minutes.
 *
 * Property details change infrequently (price, status) and are high-traffic.
 * ISR serves the cached HTML instantly from CDN while refreshing in background.
 * For a 20k concurrent platform this is critical — avoids hitting the DB on every view.
 */
export const revalidate = 0; // disable ISR cache temporarily for debugging

async function getProperty(slug: string) {
  try {
    const res = await propertiesApi.getBySlug(slug);
    console.log('[PropertyDetail] API response images:', JSON.stringify(res.data?.images ?? [], null, 2));
    return res.data;
  } catch (err) {
    console.error('[PropertyDetail] API error:', err);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const property = await getProperty(params.slug);

  if (!property) {
    return { title: 'Property Not Found' };
  }

  const title = property.metaTitle || `${property.title} | ${property.city}`;
  const description =
    property.metaDescription ||
    `${property.bedrooms ? property.bedrooms + ' BHK ' : ''}${getPropertyTypeLabel(property.type)} for ${getCategoryLabel(property.category)} in ${property.locality}, ${property.city}. ${property.area ? property.area + ' sqft. ' : ''}Contact now.`;

  // Property detail pages are noindex by default to avoid thin-content SEO penalties.
  // Admin can enable indexing per-property via the allowIndexing flag.
  const shouldIndex = property.allowIndexing === true;

  return {
    title,
    description,
    robots: {
      index: shouldIndex,
      follow: true,
      googleBot: { index: shouldIndex, follow: true },
    },
    openGraph: {
      title,
      description,
      images: property.images?.[0]
        ? [{ url: resolveImageUrl(property.images[0].url) }]
        : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: shouldIndex ? `/properties/${property.slug}` : undefined,
    },
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const property = await getProperty(params.slug);

  if (!property) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com';

  return (
    <>
      <JsonLd schema={[
        buildRealEstateListingSchema(property, siteUrl),
        buildBreadcrumbSchema([
          { name: 'Home',       url: siteUrl },
          { name: 'Properties', url: `${siteUrl}/properties` },
          ...(property.city ? [{ name: property.city, url: `${siteUrl}/properties?city=${property.city}` }] : []),
          { name: property.title, url: `${siteUrl}/properties/${property.slug}` },
        ]),
      ]} />
      <PropertyDetailClient property={property} />
    </>
  );
}
