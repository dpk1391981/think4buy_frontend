import type { Metadata } from 'next';
import { Suspense } from 'react';
import JsonLd, { buildBreadcrumbSchema } from '@/components/seo/JsonLd';
import { getCityData } from '@/lib/seo/cityData';
import PropertyAgentsInCityClient from './PropertyAgentsInCityClient';

type Params = { city: string };

const SITE = 'https://think4buysale.com';

function slugToCity(slug: string): string {
  return slug ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const city = slugToCity(params.city);
  const data = getCityData(params.city);
  const title = `Property Agents in ${city} | Top RERA Certified Brokers | Think4BuySale`;
  const desc = data
    ? `Find top RERA-certified property agents in ${city} — ${data.famousFor}. Verified brokers for buying, selling & renting. ${data.topLocalitiesBuy.slice(0, 3).map(l => l.name).join(', ')} specialists.`
    : `Find verified real estate agents and brokers in ${city}. Connect with top RERA-certified property experts for buying, selling & renting homes in ${city}. Free consultation.`;

  return {
    title,
    description: desc,
    keywords: `property agents in ${city}, real estate agents ${city}, RERA agents ${city}, property brokers ${city}, top agents ${city}`,
    alternates: { canonical: `${SITE}/property-agents-in-${params.city}` },
    openGraph: {
      title,
      description: desc,
      url: `${SITE}/property-agents-in-${params.city}`,
      type: 'website',
    },
  };
}

export default function PropertyAgentsInCityPage({ params }: { params: Params }) {
  const city = slugToCity(params.city);

  const schema = [
    buildBreadcrumbSchema([
      { name: 'Home', url: SITE },
      { name: 'Find Agents', url: `${SITE}/agents` },
      { name: `Property Agents in ${city}`, url: `${SITE}/property-agents-in-${params.city}` },
    ]),
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Top Property Agents in ${city}`,
      description: `RERA-certified real estate agents and brokers in ${city} on Think4BuySale`,
      url: `${SITE}/property-agents-in-${params.city}`,
    },
  ];

  return (
    <>
      <JsonLd schema={schema} />
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
        <PropertyAgentsInCityClient city={city} citySlug={params.city} />
      </Suspense>
    </>
  );
}
