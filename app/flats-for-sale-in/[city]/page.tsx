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
  const title = `Flats for Sale in ${city} | Apartments | Think4BuySale`;
  const desc = data
    ? `Buy flats & apartments in ${city} — ${data.famousFor}. 1BHK, 2BHK, 3BHK options. Price range: ${data.priceRangeBuy}. Avg ₹/sqft: ${data.avgPricePerSqft}. RERA verified.`
    : `Buy flats and apartments in ${city}. Browse 1000+ verified flat listings — 1BHK, 2BHK, 3BHK & luxury apartments at best prices in ${city}.`;

  return {
    title,
    description: desc,
    keywords: `flats for sale in ${city}, apartments in ${city}, 2BHK flat ${city}, 3BHK flat ${city}, apartment price ${city}`,
    alternates: { canonical: `${SITE}/flats-for-sale-in-${params.city}` },
    openGraph: { title, description: desc, url: `${SITE}/flats-for-sale-in-${params.city}`, type: 'website' },
  };
}

export default function FlatsForSaleInCityPage({ params }: { params: Params }) {
  const city = slugToCity(params.city);

  const schema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE },
    { name: 'Buy Property', url: `${SITE}/buy` },
    { name: `Flats for Sale in ${city}`, url: `${SITE}/flats-for-sale-in-${params.city}` },
  ]);

  return (
    <>
      <JsonLd schema={schema} />
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
        <PropertyListingPage searchParams={{ category: 'buy', city, type: 'apartment' }} />
      </Suspense>
      <CityPageContent citySlug={params.city} cityName={city} variant="flats-for-sale" />
    </>
  );
}
