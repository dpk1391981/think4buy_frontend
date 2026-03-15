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
  const title = `Property for Rent in ${city} | Flats & Houses for Rent | Think4BuySale`;
  const desc = data
    ? `Rent property in ${city} — ${data.famousFor}. Verified flats, houses & PG options. Rent range: ${data.priceRangeRent}. Zero brokerage options available.`
    : `Rent property in ${city}. Browse verified flats, houses, PG & co-living spaces for rent in ${city}. Furnished & unfurnished options. Direct owner contact.`;

  return {
    title,
    description: desc,
    keywords: `property for rent in ${city}, rent flat in ${city}, house for rent ${city}, 2BHK for rent ${city}, furnished flat ${city}`,
    alternates: { canonical: `${SITE}/property-for-rent-in-${params.city}` },
    openGraph: { title, description: desc, url: `${SITE}/property-for-rent-in-${params.city}`, type: 'website' },
  };
}

export default function PropertyForRentInCityPage({ params }: { params: Params }) {
  const city = slugToCity(params.city);

  const schema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE },
    { name: 'Rent Property', url: `${SITE}/rent` },
    { name: `Property for Rent in ${city}`, url: `${SITE}/property-for-rent-in-${params.city}` },
  ]);

  return (
    <>
      <JsonLd schema={schema} />
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
        <PropertyListingPage searchParams={{ category: 'rent', city }} />
      </Suspense>
      <CityPageContent citySlug={params.city} cityName={city} variant="property-for-rent" />
    </>
  );
}
