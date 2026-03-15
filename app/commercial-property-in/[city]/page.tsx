import type { Metadata } from 'next';
import { Suspense } from 'react';
import PropertyListingPage from '@/app/properties/PropertyListingPage';
import CityPageContent from '@/components/seo/CityPageContent';
import JsonLd, { buildBreadcrumbSchema } from '@/components/seo/JsonLd';
import { getCityData } from '@/lib/seo/cityData';

type Params = { city: string };

const SITE = 'https://think4buysale.com';

function slugToCity(slug: string): string {
  return slug ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const city = slugToCity(params.city);
  const data = getCityData(params.city);
  const title = `Commercial Property in ${city} | Office, Shop & Warehouse | Think4BuySale`;
  const desc = data
    ? `Buy or rent commercial property in ${city} — ${data.famousFor}. Verified offices, shops, showrooms & warehouses. Direct contact with owners and agents.`
    : `Buy or rent commercial property in ${city}. Browse offices, retail shops, showrooms, warehouses & co-working spaces. Verified listings across all business districts in ${city}.`;

  return {
    title,
    description: desc,
    keywords: `commercial property in ${city}, office space ${city}, shop for rent ${city}, warehouse ${city}, commercial space for sale ${city}`,
    alternates: { canonical: `${SITE}/commercial-property-in-${params.city}` },
    openGraph: { title, description: desc, url: `${SITE}/commercial-property-in-${params.city}`, type: 'website' },
  };
}

export default function CommercialPropertyInCityPage({ params }: { params: Params }) {
  const city = slugToCity(params.city);

  const schema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE },
    { name: 'Commercial Property', url: `${SITE}/commercial` },
    { name: `Commercial Property in ${city}`, url: `${SITE}/commercial-property-in-${params.city}` },
  ]);

  return (
    <>
      <JsonLd schema={schema} />
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
        <PropertyListingPage searchParams={{ category: 'commercial', city }} />
      </Suspense>
      <CityPageContent citySlug={params.city} cityName={city} variant="commercial" />
    </>
  );
}
