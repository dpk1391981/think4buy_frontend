import type { Metadata } from 'next';
import { Suspense } from 'react';
import PropertyListingPage from '@/app/properties/PropertyListingPage';
import CityPageContent from '@/components/seo/CityPageContent';
import { getCityData } from '@/lib/seo/cityData';

type Params = { city: string };

function slugToCity(slug: string): string {
  return slug ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const city = slugToCity(params.city);
  const data = getCityData(params.city);
  const desc = data
    ? `Buy flats & apartments in ${city} — ${data.famousFor}. 1BHK, 2BHK, 3BHK options. Price range: ${data.priceRangeBuy}. Avg ₹/sqft: ${data.avgPricePerSqft}. RERA verified.`
    : `Buy flats and apartments in ${city}. Browse 1000+ verified flat listings — 1BHK, 2BHK, 3BHK & luxury apartments at best prices in ${city}.`;

  return {
    title: `Flats for Sale in ${city} | Apartments & Flats | Think4BuySale`,
    description: desc,
    keywords: `flats for sale in ${city}, apartments in ${city}, buy flat ${city}, 2BHK flat ${city}, 3BHK flat ${city}, apartment price ${city}`,
    alternates: { canonical: `https://think4buysale.com/flats-for-sale/${params.city}` },
    openGraph: {
      title: `Flats for Sale in ${city} | Think4BuySale`,
      description: `Find verified flats and apartments for sale in ${city}. Best prices, RERA registered properties.`,
      url: `https://think4buysale.com/flats-for-sale/${params.city}`,
      type: 'website',
    },
  };
}

export default function FlatsForSaleInCityPage({ params }: { params: Params }) {
  const city = slugToCity(params.city);

  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
        <PropertyListingPage searchParams={{ category: 'buy', city, propertyType: 'apartment' }} />
      </Suspense>
      <CityPageContent citySlug={params.city} cityName={city} variant="flats-for-sale" />
    </>
  );
}
