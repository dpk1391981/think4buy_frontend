import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Rent Property in India | Apartments, Flats, Houses for Rent',
  description: 'Rent furnished & unfurnished apartments, flats, villas and houses in Mumbai, Delhi, Bangalore & more. Best monthly rental deals.',
};

export default function RentPage({ searchParams }: { searchParams: Record<string, string> }) {
  const params = new URLSearchParams({ category: 'rent', ...searchParams });
  redirect(`/properties?${params.toString()}`);
}
