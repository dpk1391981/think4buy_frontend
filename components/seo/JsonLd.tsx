/**
 * JsonLd — injects structured data (application/ld+json) for Google rich results.
 *
 * Usage:
 *   <JsonLd schema={propertySchema} />
 *   <JsonLd schema={[breadcrumbSchema, orgSchema]} />
 */
import { resolveImageUrl } from '@/lib/imageUtils';
import { getPropertyArea } from '@/lib/utils';

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
    '@id': `${siteUrl}/#organization`,
    name: 'Think4BuySale',
    url: siteUrl,
    logo: { '@type': 'ImageObject', url: `${siteUrl}/logo.png` },
    image: `${siteUrl}/og-image.jpg`,
    description: "India's trusted real estate portal — 50,000+ verified properties across 50+ cities.",
    email: 'support@think4buysale.com',
    foundingDate: '2023',
    areaServed: { '@type': 'Country', name: 'India' },
    sameAs: [
      'https://www.facebook.com/think4buysale',
      'https://twitter.com/think4buysale',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'support@think4buysale.com',
      availableLanguage: ['English', 'Hindi'],
    },
  };
}

/**
 * LocalBusiness (RealEstateAgent) schema — establishes the platform as a
 * place-based entity for GEO engines (ChatGPT, Perplexity, Gemini).
 * Separate from Organization so both appear in the graph.
 */
export function buildLocalBusinessSchema(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'RealEstateAgent'],
    '@id': `${siteUrl}/#localbusiness`,
    name: 'Think4BuySale',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    image: `${siteUrl}/og-image.jpg`,
    description: "India's trusted online real estate marketplace — buy, rent, or sell properties across 50+ cities with verified listings and RERA-registered agents.",
    email: 'support@think4buysale.com',
    priceRange: 'Free',
    openingHours: 'Mo-Sa 09:00-18:00',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'IN',
    },
    areaServed: { '@type': 'Country', name: 'India' },
    sameAs: [
      'https://www.facebook.com/think4buysale',
      'https://twitter.com/think4buysale',
    ],
  };
}

/**
 * FAQPage schema for homepage — targets Google AI Overviews and featured snippets
 * for branded + category queries ("what is Think4BuySale", "free property listing India").
 */
export function buildHomeFaqSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Think4BuySale?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Think4BuySale is an India-based real estate marketplace connecting home buyers, sellers, and tenants with RERA-verified agents and 50,000+ verified property listings across 50+ cities including Mumbai, Delhi, Bangalore, Pune, and Hyderabad.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is Think4BuySale free to use?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Browsing and searching properties is completely free. Property owners can post one listing for free. Agents subscribe to plans for enhanced features like boosted listings and lead access.',
        },
      },
      {
        '@type': 'Question',
        name: 'Which cities does Think4BuySale cover?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Think4BuySale covers 50+ cities including Mumbai, Delhi, Bangalore, Pune, Hyderabad, Chennai, Kolkata, Noida, Gurgaon, Ahmedabad, Kochi, Surat, Jaipur, and Thane.',
        },
      },
      {
        '@type': 'Question',
        name: 'How do I search for property to buy in India?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Use the search bar on the homepage or browse the Buy section. Filter by city, property type (apartment, villa, plot), BHK configuration, price range, and possession status. A map view is also available to browse by exact location.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does Think4BuySale charge brokerage?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Think4BuySale is a platform, not a brokerage — the platform itself charges zero brokerage. Owner-listed properties are available with zero brokerage. Any brokerage is agreed directly between you and the agent.",
        },
      },
      {
        '@type': 'Question',
        name: 'How do I list my property for free on Think4BuySale?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Click "Post Property FREE" from the header. Complete the property details form with photos, price, and description. Your listing goes live after a quick review — usually within a few hours. No credit card required.',
        },
      },
    ],
  };
}

export function buildWebSiteSchema(siteUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    url: siteUrl,
    name: 'Think4BuySale',
    description: "India's trusted real estate portal — buy, rent & sell properties across 50+ cities.",
    inLanguage: 'en-IN',
    publisher: { '@id': `${siteUrl}/#organization` },
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
  areaUnit?: string;
  extraDetails?: Record<string, any> | null;
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
  amenities?: Array<{ name: string }>;
  reraNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}, siteUrl: string) {
  const url = `${siteUrl}/properties/${property.slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description,
    url,
    ...(property.createdAt && { datePosted: property.createdAt }),
    ...(property.updatedAt && { dateModified: property.updatedAt }),
    image: property.images?.map((img) => resolveImageUrl(img.url)) ?? [],
    ...(property.price && {
      offers: {
        '@type': 'Offer',
        price: property.price,
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock',
        url,
      },
    }),
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address || property.locality,
      addressLocality: property.locality || property.city,
      addressRegion: property.city || property.state,
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
    ...(getPropertyArea(property).area && {
      floorSize: { '@type': 'QuantitativeValue', value: getPropertyArea(property).area, unitCode: 'FTK' },
    }),
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
    ...(property.amenities?.length && {
      amenityFeature: property.amenities.map(a => ({
        '@type': 'LocationFeatureSpecification',
        name: a.name,
        value: true,
      })),
    }),
    ...(property.reraNumber && { permitDetails: property.reraNumber }),
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

/**
 * SearchResultsPage schema — tells Google/LLMs this is a real estate search
 * results page for a specific location. Key for GEO: establishes spatial context.
 */
export function buildListingPageSchema(params: {
  pageTitle: string;
  description: string | null | undefined;
  canonical: string;
  cityName?: string;
  localityName?: string;
  siteUrl: string;
}) {
  const placeName = params.localityName && params.cityName
    ? `${params.localityName}, ${params.cityName}`
    : params.cityName;

  return {
    '@context': 'https://schema.org',
    '@type': 'SearchResultsPage',
    name: params.pageTitle,
    ...(params.description && { description: params.description }),
    url: params.canonical,
    provider: {
      '@type': 'RealEstateAgent',
      name: 'Think4BuySale',
      url: params.siteUrl,
    },
    ...(placeName && {
      spatialCoverage: {
        '@type': 'Place',
        name: placeName,
        containedInPlace: { '@type': 'Country', name: 'India' },
      },
    }),
  };
}

/**
 * WebPage schema with Speakable specification — marks up the h1 and intro
 * summary paragraph for AEO (voice assistants, AI Overviews, featured snippets).
 */
export function buildSpeakableWebPageSchema(params: {
  pageTitle: string;
  description: string | null | undefined;
  canonical: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: params.pageTitle,
    ...(params.description && { description: params.description }),
    url: params.canonical,
    speakable: {
      '@type': 'SpeakableSpecification',
      // targets h1 and the first summary paragraph in DbSeoContent
      cssSelector: ['h1', '.seo-speakable'],
    },
    inLanguage: 'en-IN',
  };
}
