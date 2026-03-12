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
    <>
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
        <PropertyListingPage searchParams={searchParams} />
      </Suspense>

      {/* SEO Content Block */}
      <section className="bg-white border-t border-gray-100 py-12">
        <div className="container-max max-w-4xl">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {typeLabel} for Rent in {city}
          </h2>
          <div className="prose prose-gray max-w-none text-sm leading-relaxed space-y-4 text-gray-600">
            <p>
              Find the best {typeLabel.toLowerCase()} for rent in {city} on Think4BuySale.
              Our listings are verified with real photos, exact locations, and direct owner/agent contact.
              Filter by budget, furnishing, locality, and more.
            </p>
            <h3 className="text-lg font-semibold text-gray-800 mt-6">Renting Tips for {city}</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Check the locality's proximity to your workplace and daily commute routes</li>
              <li>Compare furnished vs. unfurnished options based on your move-in timeline</li>
              <li>Verify the rental agreement before signing — look for maintenance clauses</li>
              <li>Check for security deposit terms (typically 2-3 months)</li>
              <li>Inspect utilities, parking, and society amenities in person</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
