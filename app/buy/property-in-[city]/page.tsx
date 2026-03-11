import type { Metadata } from 'next';
import { Suspense } from 'react';
import PropertyListingPage from '@/app/properties/PropertyListingPage';

type Params = { city: string };

// Convert slug like "new-delhi" → "New Delhi"
function slugToCity(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const city = slugToCity(params.city);
  return {
    title: `Property for Sale in ${city} | Buy Flats, Apartments, Villas | Think4BuySale`,
    description: `Browse ${city} properties for sale. Find flats, apartments, villas, plots and houses at best prices. Compare 1000+ verified listings in ${city}.`,
    keywords: `property for sale in ${city}, buy flat in ${city}, apartments in ${city}, villa in ${city}, plot in ${city}`,
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
  const searchParams = { category: 'buy', city };

  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
        <PropertyListingPage searchParams={searchParams} />
      </Suspense>

      {/* SEO Content Block */}
      <section className="bg-white border-t border-gray-100 py-12">
        <div className="container-max max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Property for Sale in {city} – Complete Buying Guide
          </h2>
          <div className="prose prose-gray max-w-none text-sm leading-relaxed space-y-4 text-gray-600">
            <p>
              Looking to buy property in {city}? Think4BuySale offers the most comprehensive listing of verified properties
              for sale in {city}, including apartments, flats, villas, independent houses, plots, and commercial spaces.
              Whether you are a first-time homebuyer or an experienced real estate investor, our platform connects you
              with the best deals in {city}.
            </p>
            <p>
              {city} has emerged as one of India's most sought-after real estate destinations, offering excellent
              infrastructure, connectivity, employment opportunities, and lifestyle amenities. Property prices in {city}
              vary across localities, giving buyers options across all budget segments — from affordable housing to luxury
              apartments and premium villas.
            </p>
            <h3 className="text-lg font-semibold text-gray-800 mt-6">Why Buy Property in {city}?</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Strong infrastructure and metro/highway connectivity</li>
              <li>Diverse options from affordable to luxury segments</li>
              <li>Growing rental yield and appreciation potential</li>
              <li>Proximity to IT parks, commercial hubs, and schools</li>
              <li>Wide range of ready-to-move and under-construction options</li>
            </ul>
            <h3 className="text-lg font-semibold text-gray-800 mt-6">How to Buy Property in {city} with Think4BuySale</h3>
            <p>
              Use our advanced search to filter properties in {city} by budget, property type (apartment, villa, plot),
              number of bedrooms, possession status, and locality. Contact verified sellers or agents directly.
              Our platform features RERA-registered properties and verified listings for your peace of mind.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
