import type { Metadata } from 'next';
import { Suspense } from 'react';
import PropertyListingPage from '@/app/properties/PropertyListingPage';
import JsonLd, { buildBreadcrumbSchema } from '@/components/seo/JsonLd';

// ── Helpers ───────────────────────────────────────────────────────────────────

type Params = { city: string; locality: string };

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com';

function toTitle(slug: string): string {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const city     = toTitle(params.city);
  const locality = toTitle(params.locality);
  const canonical = `${SITE}/property-in-${params.city}/${params.locality}`;

  const title = `Property in ${locality}, ${city} | Flats, Plots & Houses | Think4BuySale`;
  const description =
    `Find flats, plots and houses for sale in ${locality}, ${city}. ` +
    `Browse verified listings, compare prices and connect with local agents. ` +
    `RERA verified properties in ${locality}.`;

  return {
    title,
    description,
    keywords: `property in ${locality}, ${locality} ${city} property, flats in ${locality}, ` +
              `plots ${locality}, houses in ${locality}, ${locality} real estate, ` +
              `buy property ${locality} ${city}`,
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

export default function PropertyInLocalityPage({ params }: { params: Params }) {
  const city     = toTitle(params.city);
  const locality = toTitle(params.locality);

  const schema = buildBreadcrumbSchema([
    { name: 'Home',                        url: SITE },
    { name: 'Properties',                  url: `${SITE}/properties` },
    { name: `Property in ${city}`,         url: `${SITE}/property-in-${params.city}` },
    { name: `Property in ${locality}`,     url: `${SITE}/property-in-${params.city}/${params.locality}` },
  ]);

  return (
    <>
      <JsonLd schema={schema} />
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
        <PropertyListingPage searchParams={{ city, locality }} />
      </Suspense>
    </>
  );
}
