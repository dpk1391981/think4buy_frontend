import type { Metadata } from 'next';
import { Suspense } from 'react';
import AgentsListingClient from './AgentsListingClient';
import AgentsLoading from './loading';

export const revalidate = 600;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Record<string, string>;
}): Promise<Metadata> {
  const city = searchParams?.city || '';
  const title = city
    ? `Real Estate Agents in ${city} | Verified Brokers | Think4BuySale`
    : 'Find Verified Real Estate Agents in India | RERA Certified Brokers | Think4BuySale';
  const description = city
    ? `Connect with top RERA-certified real estate agents in ${city}. Find experienced property brokers for buying, selling & renting homes in ${city}. Free consultation.`
    : 'Find verified RERA-certified real estate agents and brokers across India. Connect with top property experts in Mumbai, Delhi, Bangalore, Pune, Hyderabad & 50+ cities. Free expert advice.';

  return {
    title,
    description,
    keywords: city
      ? `real estate agents ${city}, property brokers ${city}, RERA agents ${city}, buy sell property ${city}, top agents ${city}`
      : 'real estate agents India, property brokers, RERA certified agents, find property agent, real estate broker India, top property agents',
    alternates: { canonical: city ? `${APP_URL}/agents?city=${encodeURIComponent(city)}` : `${APP_URL}/agents` },
    openGraph: {
      title,
      description,
      type: 'website',
      url: city ? `${APP_URL}/agents?city=${encodeURIComponent(city)}` : `${APP_URL}/agents`,
      siteName: 'Think4BuySale',
      images: [{ url: `${APP_URL}/og-image.jpg`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${APP_URL}/og-image.jpg`],
    },
    robots: { index: true, follow: true },
  };
}

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I find a verified real estate agent in India?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'On Think4BuySale, you can search for RERA-certified agents by city, filter by rating, experience and badge level. Every agent profile shows their RERA registration number, deals closed, years of experience and verified reviews from real buyers and sellers.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are the real estate agents on Think4BuySale RERA certified?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. All agents on Think4BuySale are required to submit their RERA registration number during onboarding. Our team verifies the documents before awarding a Verified badge. You can see the RERA number directly on each agent profile.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is it free to contact a real estate agent on Think4BuySale?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Absolutely. Contacting any agent on Think4BuySale is completely free for buyers and sellers. Simply click "Call Now" or fill the contact form on the agent profile page to connect directly.',
      },
    },
    {
      '@type': 'Question',
      name: 'How are agents rated on Think4BuySale?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Agent ratings on Think4BuySale are based on real feedback from buyers, sellers and renters who have worked with the agent. Ratings are given on a 5-star scale and the overall score is automatically recalculated after each new review.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I find agents specialising in commercial properties?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Think4BuySale agents cover all property categories including residential, commercial, industrial, plots and PG accommodations. Use the search and filters on the agents page to find specialists in your area of interest.',
      },
    },
  ],
};

const ITEMLIST_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Verified Real Estate Agents in India',
  description: 'RERA-certified real estate agents and property brokers across India on Think4BuySale',
  url: `${APP_URL}/agents`,
};

const SERVICE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Real Estate Agent Finder',
  provider: {
    '@type': 'Organization',
    name: 'Think4BuySale',
    url: APP_URL,
  },
  description: 'Find and connect with RERA-certified real estate agents and property brokers across India for buying, selling, and renting properties.',
  areaServed: { '@type': 'Country', name: 'India' },
  serviceType: 'Real Estate Agent Directory',
};

export default function AgentsPage({ searchParams }: { searchParams: Record<string, string> }) {
  const city = searchParams?.city || '';

  return (
    <>
      {/* Structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ITEMLIST_SCHEMA) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SERVICE_SCHEMA) }} />

      <Suspense fallback={<AgentsLoading />}>
        <AgentsListingClient searchParams={searchParams} city={city} />
      </Suspense>
    </>
  );
}
