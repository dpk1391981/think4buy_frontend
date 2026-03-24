import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import PropertyListingPage from '@/app/properties/PropertyListingPage';

type Params = { propertyType: string; city: string };

function slugToCity(slug: string): string {
  return slug ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
}

const PROPERTY_TYPE_MAP: Record<string, { type: string; label: string; plural: string }> = {
  flats:       { type: 'apartment', label: 'Flat', plural: 'Flats' },
  apartments:  { type: 'apartment', label: 'Apartment', plural: 'Apartments' },
  villas:      { type: 'villa',     label: 'Villa', plural: 'Villas' },
  houses:      { type: 'house',     label: 'House', plural: 'Houses' },
  studios:     { type: 'studio',    label: 'Studio Apartment', plural: 'Studio Apartments' },
  offices:     { type: 'commercial_office', label: 'Office Space', plural: 'Office Spaces' },
  shops:       { type: 'commercial_shop', label: 'Shop', plural: 'Shops' },
  'builder-floors': { type: 'builder_floor', label: 'Builder Floor', plural: 'Builder Floors' },
};

const BHK_MAP: Record<string, number> = {
  '1-bhk': 1, '2-bhk': 2, '3-bhk': 3, '4-bhk': 4,
};

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const city = slugToCity(params.city);
  const typeInfo = PROPERTY_TYPE_MAP[params.propertyType];
  const bhk = BHK_MAP[params.propertyType];

  let title: string;
  let description: string;

  if (bhk) {
    title = `${bhk} BHK Apartments for Rent in ${city} | Think4BuySale`;
    description = `Find ${bhk} BHK apartments, flats, and houses for rent in ${city}. Verified listings with photos. Best rental prices in ${city}.`;
  } else if (typeInfo) {
    title = `${typeInfo.plural} for Rent in ${city} | Think4BuySale`;
    description = `Rent ${typeInfo.plural.toLowerCase()} in ${city}. Browse verified rental listings with photos, prices & direct owner/agent contact.`;
  } else {
    return { title: `Rent Property in ${city} | Think4BuySale` };
  }

  return {
    title,
    description,
    alternates: { canonical: `https://think4buysale.com/rent/${params.propertyType}-in-${params.city}` },
    openGraph: { title, description, type: 'website' },
  };
}

export default function RentPropertyTypeInCityPage({ params }: { params: Params }) {
  const typeInfo = PROPERTY_TYPE_MAP[params.propertyType];
  const bhk = BHK_MAP[params.propertyType];
  const city = slugToCity(params.city);

  if (!typeInfo && !bhk) {
    redirect(`/rent/property-in-${params.city}`);
  }

  const searchParams: Record<string, string> = { category: 'rent', city };
  if (typeInfo) searchParams.type = typeInfo.type;
  if (bhk) searchParams.bedrooms = String(bhk);

  const typeLabel = bhk ? `${bhk} BHK Apartments` : typeInfo?.plural || 'Properties';

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
      <PropertyListingPage searchParams={searchParams} />
    </Suspense>
  );
}
