import type { Metadata } from 'next';
import { Suspense } from 'react';
import AgentsListingClient from './AgentsListingClient';
import AgentsLoading from './loading';
import JsonLd from '@/components/seo/JsonLd';

// ISR: agents list is relatively stable — revalidate every 10 minutes
export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Find Real Estate Agents in India | Think4BuySale',
  description: 'Connect with verified real estate agents and brokers in Mumbai, Delhi, Bangalore, Pune, Hyderabad and more cities across India.',
  alternates: { canonical: '/agents' },
  openGraph: {
    title: 'Find Top Real Estate Agents | Think4BuySale',
    description: 'Connect with RERA-certified agents & brokers across India.',
    type: 'website',
  },
};

export default function AgentsPage({ searchParams }: { searchParams: Record<string, string> }) {
  return (
    <>
      <JsonLd schema={{
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Real Estate Agents in India',
        description: 'Verified RERA-certified real estate agents and brokers',
        url: `${process.env.NEXT_PUBLIC_APP_URL}/agents`,
      }} />
      <Suspense fallback={<AgentsLoading />}>
        <AgentsListingClient searchParams={searchParams} />
      </Suspense>
    </>
  );
}
