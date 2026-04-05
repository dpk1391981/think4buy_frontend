import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ArrowRight, Building2, ChevronRight } from 'lucide-react';
import DbSeoContent from '@/components/seo/DbSeoContent';
import { KNOWN_CITY_SLUGS } from '@/lib/city-slugs';
import { seoApi } from '@/lib/api';
import JsonLd, { buildBreadcrumbSchema } from '@/components/seo/JsonLd';
import HomeSearchPanel from '@/components/home/HomeSearchPanel';
import FeaturedProperties from '@/components/home/FeaturedProperties';
import dynamic from 'next/dynamic';
import CityHomeSetup from './CityHomeSetup';

const TrendingProperties = dynamic(() => import('@/components/home/TrendingProperties'), { ssr: true  });
const TopNewProjects     = dynamic(() => import('@/components/home/TopNewProjects'),     { ssr: true  });
const TopAgents          = dynamic(() => import('@/components/home/TopAgents'),          { ssr: true  });
const CityPriceSnapshot  = dynamic(() => import('@/components/home/CityPriceSnapshot'), { ssr: true  });
const TopLocalities      = dynamic(() => import('@/components/home/TopLocalities'),      { ssr: false });
const TopDevelopers      = dynamic(() => import('@/components/home/TopDevelopers'),      { ssr: false });

export const revalidate = 600;

const APP_URL  = process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`
  : 'http://localhost:3001/api/v1';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PropertyCitySeo {
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

interface CityEntry {
  id: string;
  name: string;
  slug?: string;
  imageUrl?: string;
  propertyCount?: number;
}

interface StateWithCities {
  id: string;
  name: string;
  slug?: string;
  code: string;
  imageUrl?: string;
  propertyCount?: number;
  metaTitle?: string;
  metaDescription?: string;
  h1?: string;
  cities: CityEntry[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugToTitle(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

async function getPropertyCitySeo(citySlug: string): Promise<PropertyCitySeo | null> {
  try {
    const res = await seoApi.getPropertyCitySeoBySlug(`properties-in-${citySlug}`);
    return res.data ?? null;
  } catch {
    return null;
  }
}

async function getStateData(slug: string): Promise<StateWithCities | null> {
  try {
    const res = await fetch(`${API_BASE}/locations/states/by-slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: { city: string } }): Promise<Metadata> {
  const slug = params.city;

  // City page
  if (KNOWN_CITY_SLUGS.has(slug)) {
    const seo = await getPropertyCitySeo(slug);
    const canonicalUrl = `${APP_URL}/properties-in-${slug}`;

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

  // State page
  const data = await getStateData(slug);
  const stateName = data?.name ?? slugToTitle(slug);
  const title =
    data?.metaTitle ||
    `Property in ${stateName} | Buy, Rent & Invest | Think4BuySale`;
  const description =
    data?.metaDescription ||
    `Find properties for sale and rent in ${stateName}. Browse verified flats, houses, plots and commercial spaces across all cities in ${stateName}. Connect with top agents.`;
  const canonical = `${APP_URL}/properties-in-${slug}`;

  return {
    title,
    description,
    keywords: `property in ${stateName}, buy property ${stateName}, rent property ${stateName}, real estate ${stateName}, flats ${stateName}, houses ${stateName}`,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
  };
}

// ── City Card (used on state pages) ──────────────────────────────────────────

const GRADIENTS = [
  'from-blue-600 to-blue-900',
  'from-emerald-600 to-emerald-900',
  'from-violet-600 to-violet-900',
  'from-orange-500 to-orange-800',
  'from-rose-600 to-rose-900',
  'from-teal-600 to-teal-900',
  'from-indigo-600 to-indigo-900',
  'from-pink-500 to-pink-800',
  'from-amber-500 to-amber-800',
  'from-cyan-600 to-cyan-900',
  'from-lime-600 to-lime-900',
  'from-red-600 to-red-900',
];

function toCitySlug(c: CityEntry): string {
  return c.slug || c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function CityCard({ city, idx, stateName }: { city: CityEntry; idx: number; stateName: string }) {
  const slug = toCitySlug(city);
  const gradient = GRADIENTS[idx % GRADIENTS.length];
  const count = city.propertyCount ?? 0;

  return (
    <Link
      href={`/properties-in-${slug}`}
      className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      <div className="relative aspect-[16/9] overflow-hidden flex-shrink-0">
        {city.imageUrl ? (
          <Image
            src={city.imageUrl}
            alt={`Properties in ${city.name}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
            loading="lazy"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl font-black text-white/15 select-none leading-none">
                {city.name.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div
              className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '20px 20px' }}
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {count > 0 && (
          <div className="absolute top-3 right-3">
            <span className="bg-white/95 backdrop-blur-sm text-gray-900 text-[11px] font-bold px-2.5 py-1 rounded-full shadow">
              {count.toLocaleString('en-IN')}+ listings
            </span>
          </div>
        )}

        <div className="absolute bottom-0 left-0 right-0 px-4 py-3">
          <h3 className="text-base font-extrabold text-white leading-tight drop-shadow-lg">
            {city.name}
          </h3>
          <p className="flex items-center gap-1 text-white/70 text-[11px] mt-0.5">
            <MapPin className="w-3 h-3" />
            {stateName}
          </p>
        </div>
      </div>

      <div className="px-4 py-3 flex items-center justify-between bg-gray-50/50">
        <span className="text-xs text-gray-500">
          {count > 0 ? `${count.toLocaleString('en-IN')} properties` : 'View properties'}
        </span>
        <span className="inline-flex items-center gap-1 text-sm font-bold text-primary-600 group-hover:text-primary-700 transition-colors">
          Explore
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function PropertiesInPage({ params }: { params: { city: string } }) {
  const slug = params.city;

  // ── Try state route first only if NOT a city slug ─────────────────────────
  const isKnownState = !KNOWN_CITY_SLUGS.has(slug) && !!(await getStateData(slug));

  // ── State route ───────────────────────────────────────────────────────────
  if (isKnownState) {
    const data = await getStateData(slug);
    if (!data) notFound();
    const cities = (data!.cities || []).filter(c => (c as any).isActive !== false);
    const breadcrumb = buildBreadcrumbSchema([
      { name: 'Home',                         url: APP_URL },
      { name: 'Property in India',            url: `${APP_URL}/property-for-sale-rent-in-india` },
      { name: `Property in ${data!.name}`,   url: `${APP_URL}/properties-in-${slug}` },
    ]);
    return (
      <>
        <JsonLd schema={breadcrumb} />
        <section className="bg-gradient-to-br from-slate-900 via-primary-900 to-primary-800 pt-20 pb-10">
          <div className="container-max text-center px-4">
            <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-white/20">
              <Building2 className="w-3.5 h-3.5" />{data!.name} · India
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3">
              {data!.h1 || `Property in ${data!.name}`}
            </h1>
            <p className="text-blue-100/70 max-w-xl mx-auto text-sm sm:text-base">
              Explore verified listings across {cities.length} {cities.length === 1 ? 'city' : 'cities'} in {data!.name}.
            </p>
            <nav className="flex items-center justify-center gap-1.5 mt-5 text-xs text-white/50">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <Link href="/property-for-sale-rent-in-india" className="hover:text-white transition-colors">India</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white/80">{data!.name}</span>
            </nav>
          </div>
        </section>
        {cities.length > 0 && (
          <section className="py-8 sm:py-12 bg-gray-50 border-b border-gray-100">
            <div className="container-max px-4">
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-6">Top Cities in {data!.name}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cities.map((city, idx) => <CityCard key={city.id} city={city} idx={idx} stateName={data!.name} />)}
              </div>
            </div>
          </section>
        )}
        <Suspense fallback={<div className="min-h-[60vh] bg-white animate-pulse" />}>
          <FeaturedProperties />
        </Suspense>
      </>
    );
  }

  // ── City route (known + unknown city slugs get city homepage) ─────────────
  {
    const city = slugToTitle(slug);
    const seo = await getPropertyCitySeo(slug);
    const canonicalUrl = `${APP_URL}/properties-in-${slug}`;

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
        { '@type': 'ListItem', position: 2, name: 'Properties', item: `${APP_URL}/properties` },
        { '@type': 'ListItem', position: 3, name: `Properties in ${city}`, item: canonicalUrl },
      ],
    };

    const itemListSchema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: `Properties in ${city}`,
      description: `Verified properties for sale and rent in ${city} on Think4BuySale`,
      url: canonicalUrl,
    };

    let customSchema: object | null = null;
    if (seo?.schemaJson) {
      try { customSchema = JSON.parse(seo.schemaJson); } catch { /* ignore invalid JSON */ }
    }

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
        {faqSchema && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        )}
        {customSchema && (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(customSchema) }} />
        )}

        {/* ── Hero with search panel ── */}
        <section className="relative flex items-center bg-gradient-to-br from-slate-900 via-primary-900 to-primary-800 pt-14 md:pt-16">
          {/* Decorative background — overflow-hidden here so blobs stay contained
              but do NOT clip the search dropdown that extends below the section */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-primary-600/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC4zIiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />
          </div>

          <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 lg:pt-12 pb-10 sm:pb-14 lg:pb-16">
            <div className="mb-7 sm:mb-9">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-2">
                Properties in{' '}
                <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  {city}
                </span>
              </h1>
              <p className="text-sm sm:text-base text-blue-100/70">
                {seo?.metaDescription || `Verified properties for sale and rent in ${city}. Browse flats, houses, plots and more.`}
              </p>
            </div>
            <HomeSearchPanel />
          </div>

          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 60" className="w-full fill-gray-50" preserveAspectRatio="none">
              <path d="M0,30L60,28C120,26,240,22,360,22C480,22,600,26,720,30C840,34,960,38,1080,36C1200,34,1320,28,1380,25L1440,22L1440,60L0,60Z" />
            </svg>
          </div>
        </section>

        {/* Sync Redux + localStorage to this city (for navbar & future navigations) */}
        <CityHomeSetup city={city} />

        {/* City-scoped home sections — all receive city prop directly (SSR-safe, no Redux timing issue) */}
        <TrendingProperties city={city} />
        <FeaturedProperties city={city} />
        <TopNewProjects     city={city} />
        <TopLocalities      city={city} />
        <TopDevelopers      city={city} />
        <TopAgents          city={city} />
        <CityPriceSnapshot  city={city} />

        {/* DB-driven SEO content */}
        {seo && <DbSeoContent config={seo} />}
      </>
    );
  }

}
