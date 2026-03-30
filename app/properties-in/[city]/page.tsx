import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ArrowRight, Building2, ChevronRight } from 'lucide-react';
import PropertyListingPage from '@/app/properties/PropertyListingPage';
import DbSeoContent from '@/components/seo/DbSeoContent';
import { KNOWN_CITY_SLUGS } from '@/lib/city-slugs';
import { seoApi } from '@/lib/api';
import JsonLd, { buildBreadcrumbSchema } from '@/components/seo/JsonLd';

export const revalidate = 600;

const APP_URL  = process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

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
      href={`/property-in-${slug}`}
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

  // ── City route ────────────────────────────────────────────────────────────
  if (KNOWN_CITY_SLUGS.has(slug)) {
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

        <Suspense fallback={<div className="min-h-screen bg-gray-50 pt-16 animate-pulse" />}>
          <PropertyListingPage searchParams={{ city }} />
        </Suspense>

        {/* DB-driven SEO content — only renders non-null fields */}
        {seo && <DbSeoContent config={seo} />}
      </>
    );
  }

  // ── State route ───────────────────────────────────────────────────────────
  const data = await getStateData(slug);
  if (!data) notFound();

  const cities = (data.cities || []).filter(c => (c as any).isActive !== false);

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home',                           url: APP_URL },
    { name: 'Property in India',              url: `${APP_URL}/property-for-sale-rent-in-india` },
    { name: `Property in ${data.name}`,       url: `${APP_URL}/properties-in-${slug}` },
  ]);

  return (
    <>
      <JsonLd schema={breadcrumb} />

      <section className="bg-gradient-to-br from-slate-900 via-primary-900 to-primary-800 pt-20 pb-10">
        <div className="container-max text-center px-4">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-white/20">
            <Building2 className="w-3.5 h-3.5" />
            {data.name} · India
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3">
            {data.h1 || `Property in ${data.name}`}
          </h1>
          <p className="text-blue-100/70 max-w-xl mx-auto text-sm sm:text-base">
            Explore verified listings in {data.cities.length} {data.cities.length === 1 ? 'city' : 'cities'} across {data.name}. Buy, rent or invest.
          </p>

          <nav className="flex items-center justify-center gap-1.5 mt-5 text-xs text-white/50">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/property-for-sale-rent-in-india" className="hover:text-white transition-colors">
              India
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/80">{data.name}</span>
          </nav>
        </div>
      </section>

      {/* {cities.length > 0 && (
        <section className="py-8 sm:py-12 bg-gray-50 border-b border-gray-100">
          <div className="container-max px-4">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">Browse by City</p>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                  Top Cities in {data.name}
                </h2>
                <p className="text-sm text-gray-500 mt-1">Select a city to view its property listings</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {cities.map((city, idx) => (
                <CityCard key={city.id} city={city} idx={idx} stateName={data.name} />
              ))}
            </div>
          </div>
        </section>
      )} */}

      <Suspense fallback={<div className="min-h-[60vh] bg-white animate-pulse" />}>
        <PropertyListingPage searchParams={{ state: data.name }} />
      </Suspense>
    </>
  );
}
