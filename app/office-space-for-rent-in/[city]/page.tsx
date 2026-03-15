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
  const title = `Office Space for Rent in ${city} | Verified Offices | Think4BuySale`;
  const desc = data
    ? `Rent office space in ${city} — ${data.famousFor}. Grade A offices, co-working & managed spaces. Monthly leases available. Verified listings from owners.`
    : `Rent office space in ${city}. Browse Grade A offices, co-working spaces, business centres & managed offices in ${city}. Flexible lease options for startups to enterprises.`;

  return {
    title,
    description: desc,
    keywords: `office space for rent in ${city}, office rental ${city}, commercial office ${city}, coworking space ${city}, furnished office ${city}`,
    alternates: { canonical: `${SITE}/office-space-for-rent-in-${params.city}` },
    openGraph: { title, description: desc, url: `${SITE}/office-space-for-rent-in-${params.city}`, type: 'website' },
  };
}

export default function OfficeSpaceForRentInCityPage({ params }: { params: Params }) {
  const city = slugToCity(params.city);

  const schema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE },
    { name: 'Commercial Property', url: `${SITE}/commercial` },
    { name: `Office Space for Rent in ${city}`, url: `${SITE}/office-space-for-rent-in-${params.city}` },
  ]);

  return (
    <>
      <JsonLd schema={schema} />
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
        <PropertyListingPage searchParams={{ category: 'commercial', city, type: 'commercial_office' }} />
      </Suspense>
      <CityPageContent citySlug={params.city} cityName={city} variant="office-rent" />
    </>
  );
}
