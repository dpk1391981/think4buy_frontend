import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import PropertyListingPage from '@/app/properties/PropertyListingPage';

type Params = { propertyType: string; city: string };

function slugToCity(slug: string): string {
  return slug ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
}

// Map URL slug to property type filter value and human label
const PROPERTY_TYPE_MAP: Record<string, { type: string; label: string; plural: string }> = {
  flats:       { type: 'apartment', label: 'Flat', plural: 'Flats' },
  apartments:  { type: 'apartment', label: 'Apartment', plural: 'Apartments' },
  villas:      { type: 'villa',     label: 'Villa', plural: 'Villas' },
  plots:       { type: 'plot',      label: 'Plot', plural: 'Plots' },
  houses:      { type: 'house',     label: 'House', plural: 'Houses' },
  penthouses:  { type: 'penthouse', label: 'Penthouse', plural: 'Penthouses' },
  studios:     { type: 'studio',    label: 'Studio Apartment', plural: 'Studio Apartments' },
  'builder-floors': { type: 'builder_floor', label: 'Builder Floor', plural: 'Builder Floors' },
  'farm-houses': { type: 'farm_house', label: 'Farm House', plural: 'Farm Houses' },
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const city = slugToCity(params.city);
  const typeInfo = PROPERTY_TYPE_MAP[params.propertyType];
  if (!typeInfo) {
    return { title: `Buy Property in ${city} | Think4BuySale` };
  }

  const title = `${typeInfo.plural} for Sale in ${city} | Buy ${typeInfo.label} | Think4BuySale`;
  const description = `Find verified ${typeInfo.plural.toLowerCase()} for sale in ${city}. Browse ${typeInfo.plural.toLowerCase()} across all budget ranges. Direct contact with owners and builders.`;

  return {
    title,
    description,
    keywords: `${typeInfo.plural.toLowerCase()} in ${city}, buy ${typeInfo.label.toLowerCase()} in ${city}, ${typeInfo.label.toLowerCase()} for sale in ${city}`,
    alternates: { canonical: `https://think4buysale.com/buy/${params.propertyType}-in-${params.city}` },
    openGraph: {
      title,
      description,
      url: `https://think4buysale.com/buy/${params.propertyType}-in-${params.city}`,
      type: 'website',
    },
  };
}

export default function BuyPropertyTypeInCityPage({ params }: { params: Params }) {
  const typeInfo = PROPERTY_TYPE_MAP[params.propertyType];
  // Redirect unknown property types to property-in-[city]
  if (!typeInfo) {
    redirect(`/buy/property-in-${params.city}`);
  }

  const city = slugToCity(params.city);
  const searchParams = { category: 'buy', city, type: typeInfo.type };

  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
        <PropertyListingPage searchParams={searchParams} />
      </Suspense>

      {/* SEO Content Block */}
      <section className="bg-white border-t border-gray-100 py-12">
        <div className="container-max max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {typeInfo.plural} for Sale in {city}
          </h2>
          <div className="prose prose-gray max-w-none text-sm leading-relaxed space-y-4 text-gray-600">
            <p>
              Browse a wide range of {typeInfo.plural.toLowerCase()} for sale in {city} on Think4BuySale.
              We offer verified listings from owners, agents, and builders across all localities and budget segments.
            </p>
            <p>
              {city} offers excellent options for {typeInfo.plural.toLowerCase()} — from affordable budget units
              to premium luxury properties. Use our filters to narrow down by price range, area, bedrooms, amenities,
              and possession status to find your perfect {typeInfo.label.toLowerCase()} in {city}.
            </p>
            <h3 className="text-lg font-semibold text-gray-800 mt-6">Tips for Buying {typeInfo.plural} in {city}</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Check RERA registration before finalizing any {typeInfo.label.toLowerCase()}</li>
              <li>Compare properties across different localities in {city}</li>
              <li>Evaluate connectivity to metro, highway, and business districts</li>
              <li>Look for verified listings with actual photos and owner contact</li>
              <li>Use home loan services to check EMI affordability</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
