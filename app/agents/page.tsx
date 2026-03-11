import type { Metadata } from 'next';
import { Suspense } from 'react';
import AgentsListingClient from './AgentsListingClient';

export const metadata: Metadata = {
  title: 'Find Real Estate Agents in India | Think4BuySale',
  description: 'Connect with verified real estate agents and brokers in Mumbai, Delhi, Bangalore, Pune, Hyderabad and more cities across India.',
};

export default function AgentsPage({ searchParams }: { searchParams: Record<string, string> }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16" />}>
      <AgentsListingClient searchParams={searchParams} />
    </Suspense>
  );
}
