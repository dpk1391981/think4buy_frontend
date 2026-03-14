import type { Metadata } from 'next';
import { Suspense } from 'react';
import PropertyListingPage from './PropertyListingPage';
import CategoryPageContent from '@/components/seo/CategoryPageContent';

interface Props {
  searchParams: { [key: string]: string | string[] | undefined };
}

async function fetchCategorySeo(categorySlug?: string) {
  if (!categorySlug) return null;
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const res = await fetch(`${apiBase}/seo/categories/${categorySlug}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

async function fetchLocationSeo(city?: string, state?: string) {
  if (!city && !state) return null;
  try {
    const params = new URLSearchParams();
    if (city)  params.set('city', city);
    if (state) params.set('state', state);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
    const res = await fetch(`${apiBase}/locations/seo?${params}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const category = (searchParams.category as string) || 'buy';
  const city     = searchParams.city  as string | undefined;
  const state    = searchParams.state as string | undefined;
  const type     = searchParams.type  as string | undefined;

  const categoryLabel = { buy: 'Sale', rent: 'Rent', pg: 'PG', commercial: 'Commercial' }[category] || 'Sale';
  const typeLabel = type ? ` ${type.charAt(0).toUpperCase() + type.slice(1)}` : '';
  const cityLabel = city ? ` in ${city}` : state ? ` in ${state}` : ' in India';

  const seo = await fetchLocationSeo(city, state);

  const title       = seo?.metaTitle       || `Properties for ${categoryLabel}${typeLabel}${cityLabel}`;
  const description = seo?.metaDescription || `Browse ${typeLabel || 'all'} properties for ${categoryLabel}${cityLabel}. Verified listings with best prices. Filter by budget, BHK, furnishing & more.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Think4BuySale`,
      description,
    },
  };
}

export default async function Page({ searchParams }: Props) {
  const category = (searchParams.category as string) || 'buy';
  const categorySeo = await fetchCategorySeo(category);
  return (
    <>
      <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
        <PropertyListingPage searchParams={searchParams} />
      </Suspense>
      {categorySeo && <CategoryPageContent category={categorySeo} />}
    </>
  );
}
