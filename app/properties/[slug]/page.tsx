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
export const revalidate = 300; // ISR: revalidate every 5 minutes

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

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com';
  // Index all active/approved properties by default.
  // Explicit allowIndexing === false lets admins noindex specific listings (e.g. duplicates, low-quality).
  const shouldIndex = property.allowIndexing !== false;
  const canonical = `${siteUrl}/properties/${property.slug}`;

  const ogImage = property.images?.[0]
    ? resolveImageUrl(property.images[0].url)
    : `${siteUrl}/og-default.jpg`;

  return {
    title,
    description,
    robots: {
      index: shouldIndex,
      follow: true,
      googleBot: {
        index: shouldIndex,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      siteName: 'Think4BuySale',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      locale: 'en_IN',
      ...(property.createdAt && { publishedTime: property.createdAt }),
      ...(property.updatedAt && { modifiedTime: property.updatedAt }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
      site: '@think4buysale',
    },
    alternates: {
      canonical: shouldIndex ? canonical : undefined,
    },
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const property = await getProperty(params.slug);

  if (!property) {
    notFound();
  }

  const pageUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com';

  return (
    <>
      <JsonLd schema={[
        buildRealEstateListingSchema(property, pageUrl),
        buildBreadcrumbSchema([
          { name: 'Home',       url: pageUrl },
          { name: 'Properties', url: `${pageUrl}/properties` },
          ...(property.city ? [{ name: property.city, url: `${pageUrl}/property-for-sale-in-${property.city?.toLowerCase().replace(/\s+/g, '-')}` }] : []),
          { name: property.title, url: `${pageUrl}/properties/${property.slug}` },
        ]),
      ]} />
      <PropertyDetailClient property={property} />
    </>
  );
}
