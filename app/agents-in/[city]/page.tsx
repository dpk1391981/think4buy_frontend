import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import AgentsListingClient from '@/app/agents/AgentsListingClient';
import AgentsLoading from '@/app/agents/loading';
import DbSeoContent from '@/components/seo/DbSeoContent';
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
  const seo = await getAgentCitySeo(citySlug);
  const canonicalUrl = `${APP_URL}/agents-in-${citySlug}`;

  if (!seo) return { robots: { index: false, follow: false } };

  const robots = seo.robots || 'index,follow';
  const [robotsIndex, robotsFollow] = robots.split(',').map(s => s.trim());

  return {
    ...(seo.metaTitle    && { title: seo.metaTitle }),
    ...(seo.metaDescription && { description: seo.metaDescription }),
    ...(seo.metaKeywords && { keywords: seo.metaKeywords }),
    alternates: { canonical: seo.canonicalUrl || canonicalUrl },
    openGraph: {
      type: 'website',
      url: seo.canonicalUrl || canonicalUrl,
      siteName: 'Think4BuySale',
      ...(seo.ogTitle       && { title: seo.ogTitle }),
      ...(seo.ogDescription && { description: seo.ogDescription }),
      ...(seo.ogImage       && { images: [{ url: seo.ogImage, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: 'summary_large_image',
      ...(seo.ogTitle       && { title: seo.ogTitle }),
      ...(seo.ogDescription && { description: seo.ogDescription }),
      ...(seo.ogImage       && { images: [seo.ogImage] }),
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
      {/* Structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      {customSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(customSchema) }} />
      )}

      {/* Agent listing */}
      <Suspense fallback={<AgentsLoading />}>
        <AgentsListingClient searchParams={{}} city={city} />
      </Suspense>

      {/* DB-driven SEO content — only renders non-null fields */}
      {seo && <DbSeoContent config={seo} />}
    </>
  );
}
