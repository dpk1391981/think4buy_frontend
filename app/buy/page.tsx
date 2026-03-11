import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buy Property in India | Apartments, Villas, Plots for Sale',
  description: 'Buy apartments, villas, independent houses, plots and commercial properties in Mumbai, Delhi, Bangalore & more. Verified listings, best prices.',
};

export default function BuyPage({ searchParams }: { searchParams: Record<string, string> }) {
  const params = new URLSearchParams({ category: 'buy', ...searchParams });
  redirect(`/properties?${params.toString()}`);
}
