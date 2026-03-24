import type { Metadata } from 'next';
import { Suspense } from 'react';
import PropertyListingPage from '@/app/properties/PropertyListingPage';

type Params = { city: string };

function slugToCity(slug: string): string {
  return slug ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const city = slugToCity(params.city);
  return {
    title: `Property for Rent in ${city} | Flats, Apartments, Houses | Think4BuySale`,
    description: `Find rental properties in ${city}. Browse flats, apartments, houses, PG accommodations and commercial spaces for rent. 1000+ verified listings in ${city}.`,
    keywords: `property for rent in ${city}, flat for rent in ${city}, apartments on rent in ${city}, house for rent in ${city}, rental in ${city}`,
    alternates: { canonical: `https://think4buysale.com/rent/property-in-${params.city}` },
    openGraph: {
      title: `Rent Property in ${city} | Think4BuySale`,
      description: `Find the best rental properties in ${city}. Flats, houses, PG and more.`,
      url: `https://think4buysale.com/rent/property-in-${params.city}`,
      type: 'website',
    },
  };
}

export default function RentPropertyInCityPage({ params }: { params: Params }) {
  const city = slugToCity(params.city);
  const searchParams = { category: 'rent', city };

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
      <PropertyListingPage searchParams={searchParams} />
    </Suspense>
  );
}
