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
  const title = `New Projects in ${city} | Under Construction & Pre-Launch | Think4BuySale`;
  const desc = data
    ? `Explore new residential & commercial projects in ${city}. ${data.newProjectsOverview.slice(0, 100)}... RERA-registered projects from top builders.`
    : `Explore new residential and commercial projects launching in ${city}. Browse under-construction apartments, villas & plots from top builders. RERA-verified with transparent pricing.`;

  return {
    title,
    description: desc,
    keywords: `new projects in ${city}, under construction properties ${city}, new launch ${city}, builder projects ${city}, pre-launch apartments ${city}`,
    alternates: { canonical: `${SITE}/new-projects-in-${params.city}` },
    openGraph: { title, description: desc, url: `${SITE}/new-projects-in-${params.city}`, type: 'website' },
  };
}

export default function NewProjectsInCityPage({ params }: { params: Params }) {
  const city = slugToCity(params.city);

  const schema = buildBreadcrumbSchema([
    { name: 'Home', url: SITE },
    { name: 'New Projects', url: `${SITE}/new-projects` },
    { name: `New Projects in ${city}`, url: `${SITE}/new-projects-in-${params.city}` },
  ]);

  return (
    <>
      <JsonLd schema={schema} />
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
        <PropertyListingPage searchParams={{ category: 'buy', city, possessionStatus: 'under_construction' }} />
      </Suspense>
      <CityPageContent citySlug={params.city} cityName={city} variant="new-projects" />
    </>
  );
}
