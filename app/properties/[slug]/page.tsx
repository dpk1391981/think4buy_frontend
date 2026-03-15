import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PropertyDetailClient from './PropertyDetailClient';
import { propertiesApi } from '@/lib/api';
import JsonLd, { buildRealEstateListingSchema, buildBreadcrumbSchema } from '@/components/seo/JsonLd';
import { resolveImageUrl } from '@/lib/imageUtils';

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
export const revalidate = 300; // 5 minutes

async function getProperty(slug: string) {
  try {
    const res = await propertiesApi.getBySlug(slug);
    return res.data;
  } catch {
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
    `${property.bedrooms ? property.bedrooms + ' BHK ' : ''}${property.type} for ${property.category === 'buy' ? 'sale' : 'rent'} in ${property.locality}, ${property.city}. ${property.area ? property.area + ' sqft. ' : ''}Contact now.`;

  return {
    title,
    description,
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
      canonical: `/properties/${property.slug}`,
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
