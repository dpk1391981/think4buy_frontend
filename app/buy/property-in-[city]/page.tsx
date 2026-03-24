import type { Metadata } from 'next';
import { Suspense } from 'react';
import PropertyListingPage from '@/app/properties/PropertyListingPage';
import ConditionalCityContent from '@/components/seo/ConditionalCityContent';
import { getCityData } from '@/lib/seo/cityData';

type Params = { city: string };

function slugToCity(slug: string): string {
  return slug ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const city = slugToCity(params.city);
  const data = getCityData(params.city);
  const desc = data
    ? `Buy property in ${city} — ${data.famousFor}. Browse verified flats, villas, apartments & plots. Price range: ${data.priceRangeBuy}. RERA registered listings.`
    : `Browse ${city} properties for sale. Find flats, apartments, villas, plots and houses at best prices. Compare 1000+ verified listings in ${city}.`;

  return {
    title: `Property for Sale in ${city} | Buy Flats, Apartments, Villas | Think4BuySale`,
    description: desc,
    keywords: `property for sale in ${city}, buy flat in ${city}, apartments in ${city}, villa in ${city}, plot in ${city}, real estate ${city}`,
    alternates: { canonical: `https://think4buysale.com/buy/property-in-${params.city}` },
    openGraph: {
      title: `Buy Property in ${city} | Think4BuySale`,
      description: `Explore verified properties for sale in ${city}. Find your dream home today.`,
      url: `https://think4buysale.com/buy/property-in-${params.city}`,
      type: 'website',
    },
  };
}

export default function BuyPropertyInCityPage({ params }: { params: Params }) {
  const city = slugToCity(params.city);

  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
        <PropertyListingPage searchParams={{ category: 'buy', city, propertyType: 'apartment' }} />
      </Suspense>
      <ConditionalCityContent citySlug={params.city} cityName={city} variant="flats-for-sale" />
    </>
  );
}
