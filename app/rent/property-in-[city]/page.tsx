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
    <>
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
        <PropertyListingPage searchParams={searchParams} />
      </Suspense>

      {/* SEO Content Block */}
      <section className="bg-white border-t border-gray-100 py-12">
        <div className="container-max max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Property for Rent in {city} – Rental Guide 2025
          </h2>
          <div className="prose prose-gray max-w-none text-sm leading-relaxed space-y-4 text-gray-600">
            <p>
              Searching for a rental property in {city}? Think4BuySale lists thousands of verified rental properties in {city},
              including furnished apartments, unfurnished flats, independent houses, PG accommodations, and commercial spaces.
              Find your ideal home in {city} within your budget with our smart search and filter tools.
            </p>
            <p>
              Rental prices in {city} vary significantly by locality, property type, and furnishing status. The city offers
              a wide spectrum from budget-friendly PG options to premium furnished apartments in gated societies.
            </p>
            <h3 className="text-lg font-semibold text-gray-800 mt-6">Rental Market in {city}</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Wide range of furnished and semi-furnished options</li>
              <li>Zero brokerage and owner-direct listings available</li>
              <li>PG accommodations with meals for working professionals</li>
              <li>Short-term and long-term rental agreements</li>
              <li>Commercial rental spaces in prime business districts</li>
            </ul>
            <h3 className="text-lg font-semibold text-gray-800 mt-6">Tips for Renting in {city}</h3>
            <p>
              When searching for rental properties in {city}, verify the owner/agent credentials, check the locality
              for amenities and connectivity, and review the rental agreement carefully. Think4BuySale's verified listings
              ensure you deal only with genuine property owners and registered agents.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
