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
  const title = `Flats for Rent in ${city} | Furnished & Unfurnished | Think4BuySale`;
  const desc = data
    ? `Rent flats & apartments in ${city} — ${data.famousFor}. Furnished & unfurnished options. Rent range: ${data.priceRangeRent}. Zero brokerage options available.`
    : `Rent flats and apartments in ${city}. Browse 1BHK, 2BHK, 3BHK furnished & unfurnished rentals across all localities. Direct contact with property owners.`;

  return {
    title,
    description: desc,
    keywords: `flats for rent in ${city}, apartment for rent ${city}, furnished flat ${city}, 2BHK rent ${city}, flat rental ${city}`,
    alternates: { canonical: `${SITE}/flats-for-rent-in-${params.city}` },
    openGraph: { title, description: desc, url: `${SITE}/flats-for-rent-in-${params.city}`, type: 'website' },
  };
}

export default function FlatsForRentInCityPage({ params }: { params: Params }) {
  const city = slugToCity(params.city);

  const schema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE },
    { name: 'Rent Property', url: `${SITE}/rent` },
    { name: `Flats for Rent in ${city}`, url: `${SITE}/flats-for-rent-in-${params.city}` },
  ]);

  return (
    <>
      <JsonLd schema={schema} />
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
        <PropertyListingPage searchParams={{ category: 'rent', city, type: 'apartment' }} />
      </Suspense>
      <CityPageContent citySlug={params.city} cityName={city} variant="flats-for-rent" />
    </>
  );
}
