import type { Metadata } from 'next';
import { Suspense } from 'react';
import PropertyListingPage from './PropertyListingPage';

interface Props {
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const category = (searchParams.category as string) || 'buy';
  const city = searchParams.city as string;
  const type = searchParams.type as string;

  const categoryLabel = { buy: 'Sale', rent: 'Rent', pg: 'PG', commercial: 'Commercial' }[category] || 'Sale';
  const typeLabel = type ? ` ${type.charAt(0).toUpperCase() + type.slice(1)}` : '';
  const cityLabel = city ? ` in ${city}` : ' in India';

  return {
    title: `Properties for ${categoryLabel}${typeLabel}${cityLabel}`,
    description: `Browse ${typeLabel || 'all'} properties for ${categoryLabel}${cityLabel}. Verified listings with best prices. Filter by budget, BHK, furnishing & more.`,
    openGraph: {
      title: `Properties for ${categoryLabel}${typeLabel}${cityLabel} | Think4BuySale`,
      description: `Browse verified property listings${cityLabel}. Best prices guaranteed.`,
    },
  };
}

export default function Page({ searchParams }: Props) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
      <PropertyListingPage searchParams={searchParams} />
    </Suspense>
  );
}
