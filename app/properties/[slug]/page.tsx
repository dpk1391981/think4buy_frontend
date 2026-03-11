import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PropertyDetailClient from './PropertyDetailClient';
import { propertiesApi } from '@/lib/api';

interface Props {
  params: { slug: string };
}

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
        ? [{ url: property.images[0].url }]
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

  // JSON-LD structured data for real estate
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/properties/${property.slug}`,
    image: property.images?.map((img: any) => img.url) || [],
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'INR',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address || property.locality,
      addressLocality: property.city,
      postalCode: property.pincode,
      addressCountry: 'IN',
    },
    ...(property.latitude && property.longitude
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: property.latitude,
            longitude: property.longitude,
          },
        }
      : {}),
    floorSize: property.area
      ? { '@type': 'QuantitativeValue', value: property.area, unitCode: 'FTK' }
      : undefined,
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PropertyDetailClient property={property} />
    </>
  );
}
