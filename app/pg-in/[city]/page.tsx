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
  const title = `PG in ${city} | Paying Guest Accommodation & Co-Living | Think4BuySale`;
  const desc = data
    ? `Find PG accommodation and co-living spaces in ${city} — ${data.famousFor}. Single, double & triple sharing rooms. Monthly rent: ${data.priceRangeRent}. Meals & WiFi options.`
    : `Find PG accommodation and co-living spaces in ${city}. Single, double & triple sharing rooms available. Monthly rent includes meals, WiFi & housekeeping. Boys, girls & mixed PGs.`;

  return {
    title,
    description: desc,
    keywords: `PG in ${city}, paying guest ${city}, co-living ${city}, PG accommodation ${city}, hostel ${city}, room for rent ${city}`,
    alternates: { canonical: `${SITE}/pg-in-${params.city}` },
    openGraph: { title, description: desc, url: `${SITE}/pg-in-${params.city}`, type: 'website' },
  };
}

export default function PgInCityPage({ params }: { params: Params }) {
  const city = slugToCity(params.city);

  const schema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE },
    { name: 'PG / Co-Living', url: `${SITE}/pg` },
    { name: `PG in ${city}`, url: `${SITE}/pg-in-${params.city}` },
  ]);

  return (
    <>
      <JsonLd schema={schema} />
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
        <PropertyListingPage searchParams={{ category: 'pg', city }} />
      </Suspense>
      <CityPageContent citySlug={params.city} cityName={city} variant="pg" />
    </>
  );
}
