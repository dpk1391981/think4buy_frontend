import type { Metadata } from 'next';
import { Suspense } from 'react';
import PropertyListingPage from '@/app/properties/PropertyListingPage';
import CityPageContent from '@/components/seo/CityPageContent';
import { getCityData } from '@/lib/seo/cityData';

type Params = { city: string };

function slugToCity(slug: string): string {
  return slug ? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : '';
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const city = slugToCity(params.city);
  const data = getCityData(params.city);
  const desc = data
    ? `New residential & commercial projects in ${city} — ${data.famousFor}. Under-construction & new launch apartments, villas and plots. ${data.newProjectsOverview.slice(0, 100)}...`
    : `Explore new residential & commercial projects in ${city}. Latest under-construction and new launch properties from top builders with best pre-launch prices.`;

  return {
    title: `New Projects in ${city} | Under Construction & New Launch | Think4BuySale`,
    description: desc,
    keywords: `new projects in ${city}, new launch ${city}, under construction projects ${city}, new apartments ${city}, upcoming projects ${city}, RERA projects ${city}`,
    alternates: { canonical: `https://think4buysale.com/new-projects/${params.city}` },
    openGraph: {
      title: `New Projects in ${city} | Think4BuySale`,
      description: `Discover latest new residential and commercial projects launching in ${city}. Pre-launch prices, RERA registered.`,
      url: `https://think4buysale.com/new-projects/${params.city}`,
      type: 'website',
    },
  };
}

export default function NewProjectsInCityPage({ params }: { params: Params }) {
  const city = slugToCity(params.city);

  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
        <PropertyListingPage searchParams={{ category: 'buy', city, possession: 'under_construction' }} />
      </Suspense>
      <CityPageContent citySlug={params.city} cityName={city} variant="new-projects" />
    </>
  );
}
