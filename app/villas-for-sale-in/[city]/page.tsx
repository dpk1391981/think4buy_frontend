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
  const title = `Villas for Sale in ${city} | Independent Houses & Bungalows | Think4BuySale`;
  const desc = data
    ? `Buy villas & independent houses in ${city} — ${data.famousFor}. Luxury, premium & budget villas. Price range: ${data.priceRangeBuy}. RERA-verified listings.`
    : `Buy villas and independent houses in ${city}. Browse luxury bungalows, gated community villas & independent floors. Verified listings from owners and builders.`;

  return {
    title,
    description: desc,
    keywords: `villas for sale in ${city}, independent house ${city}, bungalow ${city}, luxury villa ${city}, villa price ${city}`,
    alternates: { canonical: `${SITE}/villas-for-sale-in-${params.city}` },
    openGraph: { title, description: desc, url: `${SITE}/villas-for-sale-in-${params.city}`, type: 'website' },
  };
}

export default function VillasForSaleInCityPage({ params }: { params: Params }) {
  const city = slugToCity(params.city);

  const schema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE },
    { name: 'Buy Property', url: `${SITE}/buy` },
    { name: `Villas for Sale in ${city}`, url: `${SITE}/villas-for-sale-in-${params.city}` },
  ]);

  return (
    <>
      <JsonLd schema={schema} />
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
        <PropertyListingPage searchParams={{ category: 'buy', city, type: 'villa' }} />
      </Suspense>
      <CityPageContent citySlug={params.city} cityName={city} variant="villa-sale" />
    </>
  );
}
