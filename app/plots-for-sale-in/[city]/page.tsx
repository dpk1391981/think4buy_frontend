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
  const title = `Plots for Sale in ${city} | Residential & Commercial Land | Think4BuySale`;
  const desc = data
    ? `Buy plots and land in ${city} — ${data.famousFor}. Residential plots, commercial land & agricultural plots. Price range: ${data.priceRangeBuy}. Verified listings.`
    : `Buy plots and land in ${city}. Browse residential plots, commercial land & investment-grade agricultural land. Clear titles, verified ownership. RERA & NA plots available.`;

  return {
    title,
    description: desc,
    keywords: `plots for sale in ${city}, land for sale ${city}, residential plot ${city}, plot price ${city}, buy land ${city}`,
    alternates: { canonical: `${SITE}/plots-for-sale-in-${params.city}` },
    openGraph: { title, description: desc, url: `${SITE}/plots-for-sale-in-${params.city}`, type: 'website' },
  };
}

export default function PlotsForSaleInCityPage({ params }: { params: Params }) {
  const city = slugToCity(params.city);

  const schema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE },
    { name: 'Buy Property', url: `${SITE}/buy` },
    { name: `Plots for Sale in ${city}`, url: `${SITE}/plots-for-sale-in-${params.city}` },
  ]);

  return (
    <>
      <JsonLd schema={schema} />
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
        <PropertyListingPage searchParams={{ category: 'buy', city, type: 'plot' }} />
      </Suspense>
      <CityPageContent citySlug={params.city} cityName={city} variant="plot-sale" />
    </>
  );
}
