import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import AgentsListingClient from '@/app/agents/AgentsListingClient';
import AgentsLoading from '@/app/agents/loading';
import { KNOWN_CITY_SLUGS } from '@/lib/city-slugs';
import { seoApi } from '@/lib/api';

export const revalidate = 600;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com';

function slugToCity(slug: string): string {
  return slug
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

interface AgentCitySeo {
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  h1Title?: string;
  canonicalUrl?: string;
  introContent?: string;
  bottomContent?: string;
  faqJson?: { question: string; answer: string }[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  schemaJson?: string;
  robots?: string;
}

async function getAgentCitySeo(citySlug: string): Promise<AgentCitySeo | null> {
  try {
    const slug = `agents-in-${citySlug}`;
    const res = await seoApi.getAgentCitySeoBySlug(slug);
    return res.data ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { city: string };
}): Promise<Metadata> {
  const citySlug = params.city;
  const city = slugToCity(citySlug);
  const seo = await getAgentCitySeo(citySlug);
  const canonicalUrl = `${APP_URL}/agents-in-${citySlug}`;

  const title = seo?.metaTitle || `Real Estate Agents in ${city} | Verified RERA Brokers | Think4BuySale`;
  const description =
    seo?.metaDescription ||
    `Connect with top RERA-certified real estate agents in ${city}. Find experienced property brokers for buying, selling & renting homes in ${city}. Free consultation.`;
  const keywords =
    seo?.metaKeywords ||
    `real estate agents ${city}, property brokers ${city}, RERA agents ${city}, buy sell property ${city}, top agents ${city}`;

  const ogTitle = seo?.ogTitle || title;
  const ogDescription = seo?.ogDescription || description;
  const ogImage = seo?.ogImage || `${APP_URL}/og-image.jpg`;
  const robots = seo?.robots || 'index,follow';
  const [robotsIndex, robotsFollow] = robots.split(',').map(s => s.trim());

  return {
    title,
    description,
    keywords,
    alternates: { canonical: seo?.canonicalUrl || canonicalUrl },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      type: 'website',
      url: seo?.canonicalUrl || canonicalUrl,
      siteName: 'Think4BuySale',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [ogImage],
    },
    robots: {
      index: robotsIndex !== 'noindex',
      follow: robotsFollow !== 'nofollow',
    },
  };
}

export default async function AgentsInCityPage({ params }: { params: { city: string } }) {
  const citySlug = params.city;

  if (!KNOWN_CITY_SLUGS.has(citySlug)) {
    notFound();
  }

  const city = slugToCity(citySlug);
  const seo = await getAgentCitySeo(citySlug);
  const canonicalUrl = `${APP_URL}/agents-in-${citySlug}`;

  const faqSchema = seo?.faqJson?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: seo.faqJson.map(f => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      }
    : null;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: APP_URL },
      { '@type': 'ListItem', position: 2, name: 'Agents', item: `${APP_URL}/agents` },
      { '@type': 'ListItem', position: 3, name: `Agents in ${city}`, item: `${canonicalUrl}` },
    ],
  };

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Verified Real Estate Agents in ${city}`,
    description: `RERA-certified real estate agents and property brokers in ${city} on Think4BuySale`,
    url: canonicalUrl,
  };

  let customSchema: object | null = null;
  if (seo?.schemaJson) {
    try { customSchema = JSON.parse(seo.schemaJson); } catch { /* ignore invalid JSON */ }
  }

  return (
    <>
      {/* Structured data — injected in <head> by Next.js */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      {customSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(customSchema) }} />
      )}

      {/* All SEO content (intro, bottom, FAQ) is passed as props and rendered
          below the agent listing inside AgentsListingClient */}
      <Suspense fallback={<AgentsLoading />}>
        <AgentsListingClient
          searchParams={{}}
          city={city}
          seo={{
            h1Title: seo?.h1Title,
            introContent: seo?.introContent,
            bottomContent: seo?.bottomContent,
            faqJson: seo?.faqJson,
          }}
        />
      </Suspense>
    </>
  );
}
