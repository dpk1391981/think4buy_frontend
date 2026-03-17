import type { Metadata } from 'next';
import { Suspense } from 'react';
import PropertyListingPage from '@/app/properties/PropertyListingPage';
import CityPageContent from '@/components/seo/CityPageContent';
import JsonLd, { buildBreadcrumbSchema } from '@/components/seo/JsonLd';
import { getCityData } from '@/lib/seo/cityData';

// ── Helpers ───────────────────────────────────────────────────────────────────

type Params = { city: string };

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com';

function slugToCity(slug: string): string {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const city = slugToCity(params.city);
  const data = getCityData(params.city);

  const title = data
    ? `Property in ${city} | Flats, Plots and Houses | Think4BuySale`
    : `Property for Sale in ${city} | Flats, Plots and Houses | Think4BuySale`;

  const description = data
    ? `Explore flats, plots and independent houses for sale in ${city}. ${data.famousFor}. Compare prices, view listings and connect with agents. RERA verified properties.`
    : `Explore flats, plots and independent houses for sale in ${city}. Compare prices, view listings and connect with agents directly. Browse 1000+ verified properties in ${city}.`;

  const canonical = `${SITE}/property-in-${params.city}`;

  return {
    title,
    description,
    keywords: `property in ${city}, buy property ${city}, flats in ${city}, plots for sale ${city}, houses in ${city}, apartments ${city}, real estate ${city}`,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PropertyInCityPage({ params }: { params: Params }) {
  const city = slugToCity(params.city);

  const schema = buildBreadcrumbSchema([
    { name: 'Home',              url: SITE },
    { name: 'Properties',        url: `${SITE}/properties` },
    { name: `Property in ${city}`, url: `${SITE}/property-in-${params.city}` },
  ]);

  return (
    <>
      <JsonLd schema={schema} />
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
        <PropertyListingPage searchParams={{ city }} />
      </Suspense>
      <CityPageContent citySlug={params.city} cityName={city} variant="property-for-sale" />
    </>
  );
}
