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
  const title = `Property for Sale in ${city} | Buy Flats, Houses & Villas | Think4BuySale`;
  const desc = data
    ? `Buy property in ${city} — ${data.famousFor}. Verified flats, houses, villas & plots. Price range: ${data.priceRangeBuy}. RERA-registered listings.`
    : `Buy property in ${city}. Browse 1000+ verified apartments, villas, houses, plots for sale in ${city}. Direct contact with owners, builders & agents. RERA verified.`;

  return {
    title,
    description: desc,
    keywords: `property for sale in ${city}, buy property ${city}, flats for sale in ${city}, houses for sale ${city}, apartments in ${city}, property ${city}`,
    alternates: { canonical: `${SITE}/property-for-sale-in-${params.city}` },
    openGraph: { title, description: desc, url: `${SITE}/property-for-sale-in-${params.city}`, type: 'website' },
  };
}

export default function PropertyForSaleInCityPage({ params }: { params: Params }) {
  const city = slugToCity(params.city);

  const schema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE },
    { name: 'Buy Property', url: `${SITE}/buy` },
    { name: `Property for Sale in ${city}`, url: `${SITE}/property-for-sale-in-${params.city}` },
  ]);

  return (
    <>
      <JsonLd schema={schema} />
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
        <PropertyListingPage searchParams={{ category: 'buy', city }} />
      </Suspense>
      <CityPageContent citySlug={params.city} cityName={city} variant="property-for-sale" />
    </>
  );
}
