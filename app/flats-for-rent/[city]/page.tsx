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
    ? `Rent flats & apartments in ${city} — ${data.famousFor}. Furnished & unfurnished options. Rent range: ${data.priceRangeRent}. Verified listings, zero brokerage options.`
    : `Find flats and apartments for rent in ${city}. Verified rental listings — 1BHK, 2BHK, 3BHK & furnished apartments. Best rental deals in ${city}.`;

  return {
    title: `Flats for Rent in ${city} | Apartments on Rent | Think4BuySale`,
    description: desc,
    keywords: `flats for rent in ${city}, apartments on rent ${city}, 2BHK rent ${city}, furnished flat rent ${city}, monthly rent flat ${city}, rental property ${city}`,
    alternates: { canonical: `https://think4buysale.com/flats-for-rent/${params.city}` },
    openGraph: {
      title: `Flats for Rent in ${city} | Think4BuySale`,
      description: `Browse verified flats and apartments on rent in ${city}. Furnished & semi-furnished options available.`,
      url: `https://think4buysale.com/flats-for-rent/${params.city}`,
      type: 'website',
    },
  };
}

export default function FlatsForRentInCityPage({ params }: { params: Params }) {
  const city = slugToCity(params.city);

  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
        <PropertyListingPage searchParams={{ category: 'rent', city, propertyType: 'apartment' }} />
      </Suspense>
      <CityPageContent citySlug={params.city} cityName={city} variant="flats-for-rent" />
    </>
  );
}
