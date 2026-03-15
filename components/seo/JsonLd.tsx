/**
 * JsonLd — injects structured data (application/ld+json) for Google rich results.
 *
 * Usage:
 *   <JsonLd schema={propertySchema} />
 *   <JsonLd schema={[breadcrumbSchema, orgSchema]} />
 */
import { resolveImageUrl } from '@/lib/imageUtils';

interface Props {
  schema: Record<string, unknown> | Record<string, unknown>[];
}

/** Renders a single or multiple JSON-LD blocks */
export default function JsonLd({ schema }: Props) {
  const schemas = Array.isArray(schema) ? schema : [schema];
  return (
    <>
      {schemas.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
    </>
  );
}

// ─── Schema builders ────────────────────────────────────────────────────────

export function buildOrganizationSchema(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Think4BuySale',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [
      'https://www.facebook.com/think4buysale',
      'https://twitter.com/think4buysale',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English', 'Hindi'],
    },
  };
}

export function buildWebSiteSchema(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: siteUrl,
    name: 'Think4BuySale',
    description: "India's trusted real estate portal",
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/properties?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildRealEstateListingSchema(property: {
  title: string;
  description?: string;
  slug: string;
  price?: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  city?: string;
  state?: string;
  pincode?: string;
  address?: string;
  locality?: string;
  latitude?: number;
  longitude?: number;
  images?: Array<{ url: string }>;
}, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    url: `${siteUrl}/properties/${property.slug}`,
    image: property.images?.map((img) => resolveImageUrl(img.url)) ?? [],
    ...(property.price && {
      offers: {
        '@type': 'Offer',
        price: property.price,
        priceCurrency: 'INR',
      },
    }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address || property.locality,
      addressLocality: property.city,
      addressRegion: property.state,
      postalCode: property.pincode,
      addressCountry: 'IN',
    },
    ...(property.latitude && property.longitude && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: property.latitude,
        longitude: property.longitude,
      },
    }),
    ...(property.area && {
      floorSize: { '@type': 'QuantitativeValue', value: property.area, unitCode: 'FTK' },
    }),
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
  };
}

export function buildAgentSchema(agent: {
  name: string;
  slug: string;
  city?: string;
  phone?: string;
  email?: string;
  company?: string;
  bio?: string;
  avatar?: string;
}, siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: agent.name,
    url: `${siteUrl}/agents/${agent.slug}`,
    description: agent.bio,
    image: agent.avatar,
    telephone: agent.phone,
    email: agent.email,
    ...(agent.company && {
      worksFor: { '@type': 'Organization', name: agent.company },
    }),
    address: {
      '@type': 'PostalAddress',
      addressLocality: agent.city,
      addressCountry: 'IN',
    },
  };
}

export function buildPropertyListingPageSchema(
  city: string | undefined,
  category: string | undefined,
  totalCount: number,
  siteUrl: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${category ? category + ' p' : 'P'}roperties${city ? ` in ${city}` : ' in India'}`,
    description: `Browse ${totalCount}+ verified properties`,
    url: siteUrl + '/properties',
    numberOfItems: totalCount,
  };
}
