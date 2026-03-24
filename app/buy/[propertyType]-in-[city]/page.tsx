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
    <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
      <PropertyListingPage searchParams={searchParams} />
    </Suspense>
  );
}
