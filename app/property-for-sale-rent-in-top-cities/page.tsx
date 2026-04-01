import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, ArrowRight, Building2, ChevronRight, Home, KeyRound, Briefcase } from 'lucide-react';
import JsonLd, { buildBreadcrumbSchema } from '@/components/seo/JsonLd';

const SITE     = process.env.NEXT_PUBLIC_APP_URL || 'https://www.think4buysale.com';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`
  : 'http://localhost:3001/api/v1';

export const metadata: Metadata = {
  title: 'Property for Sale & Rent in Top Cities | Think4BuySale',
  description:
    "Browse verified properties for sale and rent in India's top cities. Active listings for flats, houses, plots, villas and commercial spaces — directly from owners, builders & agents.",
  keywords:
    'property top cities india, buy property india, rent property india, flats for sale top cities, verified listings india',
  alternates: { canonical: `${SITE}/property-for-sale-rent-in-top-cities` },
  openGraph: {
    title: "Property for Sale & Rent in Top Cities | Think4BuySale",
    description: "Active listings across India's top residential markets.",
    url: `${SITE}/property-for-sale-rent-in-top-cities`,
    type: 'website',
  },
};

interface CityStats {
  id: string;
  cityName: string;
  slug: string;
  counts: {
    total: number;
    buy?: number;
    rent?: number;
    commercial?: number;
  };
}

async function getTopCities(): Promise<CityStats[]> {
  try {
    const res = await fetch(`${API_BASE}/locations/top-cities`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const raw = await res.json();
    const list = Array.isArray(raw) ? raw : raw?.cities ?? [];
    return list;
  } catch {
    return [];
  }
}

function toSlug(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function fmt(n: number): string {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString('en-IN');
}

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

function CityCard({ city, idx }: { city: CityStats; idx: number }) {
  const gradient = GRADIENTS[idx % GRADIENTS.length];
  const total    = city.counts?.total || 0;
  const buy      = city.counts?.buy || 0;
  const rent     = city.counts?.rent || 0;
  const comm     = city.counts?.commercial || 0;

  const buyPct  = total > 0 ? Math.min(Math.round((buy  / total) * 100), 100) : 0;
  const rentPct = total > 0 ? Math.min(Math.round((rent / total) * 100), 100) : 0;
  const commPct = total > 0 ? Math.min(Math.round((comm / total) * 100), 100) : 0;

  const href = `/property-in-${city.slug || toSlug(city.cityName)}`;
  const initials = city.cityName.slice(0, 2).toUpperCase();

  return (
    <Link
      href={href}
      className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      {/* Banner */}
      <div className="relative h-28 overflow-hidden flex-shrink-0">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-black text-white/10 select-none leading-none">
              {initials}
            </span>
          </div>
          <div
            className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle,white 1px,transparent 1px)', backgroundSize: '20px 20px' }}
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Total listings pill */}
        {total > 0 && (
          <div className="absolute top-3 right-3">
            <span className="bg-white/95 backdrop-blur-sm text-gray-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow">
              {fmt(total)} listings
            </span>
          </div>
        )}

        {/* City name */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3">
          <h3 className="text-base font-extrabold text-white leading-tight drop-shadow-lg">
            {city.cityName}
          </h3>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-white/50" />
            <span className="text-white/60 text-[11px]">India</span>
          </div>
        </div>
      </div>

      {/* Stats body */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div className="flex items-end gap-2">
          <span className="text-2xl font-black text-gray-900 leading-none">{fmt(total)}</span>
          <span className="text-xs text-gray-400 mb-0.5 font-medium">active listings</span>
        </div>

        {total > 0 && (buy > 0 || rent > 0 || comm > 0) && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Home className="w-3 h-3 text-emerald-600 flex-shrink-0" />
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${buyPct}%` }} />
              </div>
              <span className="text-[10px] font-semibold text-gray-500 w-14 text-right tabular-nums">
                {fmt(buy)} buy
              </span>
            </div>
            <div className="flex items-center gap-2">
              <KeyRound className="w-3 h-3 text-blue-600 flex-shrink-0" />
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${rentPct}%` }} />
              </div>
              <span className="text-[10px] font-semibold text-gray-500 w-14 text-right tabular-nums">
                {fmt(rent)} rent
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-3 h-3 text-orange-500 flex-shrink-0" />
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: `${commPct}%` }} />
              </div>
              <span className="text-[10px] font-semibold text-gray-500 w-14 text-right tabular-nums">
                {fmt(comm)} comm
              </span>
            </div>
          </div>
        )}

        <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">Click to explore</span>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-primary-600 group-hover:text-primary-700 transition-colors">
            View Properties
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function PropertyInTopCitiesPage() {
  const cities = await getTopCities();

  const totalListings = cities.reduce((s, c) => s + (c.counts?.total || 0), 0);
  const totalBuy      = cities.reduce((s, c) => s + (c.counts?.buy || 0), 0);
  const totalRent     = cities.reduce((s, c) => s + (c.counts?.rent || 0), 0);

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home',                               url: SITE },
    { name: 'Property in Top Cities',             url: `${SITE}/property-for-sale-rent-in-top-cities` },
  ]);

  return (
    <>
      <JsonLd schema={breadcrumb} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-slate-900 via-primary-900 to-primary-800 pt-20 pb-12 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-64 h-64 bg-primary-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="container-max text-center px-4 relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 border border-white/20">
            <Building2 className="w-3.5 h-3.5" />
            Top Cities · India
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3">
            Property for Sale &amp; Rent in Top Cities
          </h1>
          <p className="text-blue-100/70 max-w-xl mx-auto text-sm sm:text-base">
            Active listings across India's most sought-after residential markets — buy, rent, or invest.
          </p>

          {totalListings > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-8 mt-8">
              {[
                { label: 'Active Listings', value: fmt(totalListings), color: 'text-yellow-400' },
                { label: 'Top Cities',      value: String(cities.length), color: 'text-green-400' },
                { label: 'For Sale',        value: fmt(totalBuy),       color: 'text-blue-400'   },
                { label: 'For Rent',        value: fmt(totalRent),      color: 'text-purple-400' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className={`text-xl sm:text-2xl font-black ${s.color}`}>{s.value}</div>
                  <div className="text-white/50 text-[11px] font-medium mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          <nav className="flex items-center justify-center gap-1.5 mt-6 text-xs text-white/40">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/70">Top Cities</span>
          </nav>
        </div>
      </section>

      {/* Cities grid */}
      <section className="py-10 sm:py-14 bg-gray-50">
        <div className="container-max px-4">
          <div className="flex items-end justify-between mb-6 sm:mb-10">
            <div>
              <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">Browse by City</p>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                {cities.length > 0 ? `${cities.length} Cities` : 'Top Cities'} with Active Listings
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Each card shows buy · rent · commercial breakdown — click to explore
              </p>
            </div>
            <Link
              href="/properties"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              All Properties <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {cities.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold text-gray-500">No cities with active listings yet</p>
              <p className="text-sm mt-1">Post a property to get your city listed here.</p>
              <Link
                href="/post-property"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:underline"
              >
                Post your property <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {cities.map((city, idx) => (
                <CityCard key={city.id} city={city} idx={idx} />
              ))}
            </div>
          )}

          <div className="mt-8 flex sm:hidden justify-center">
            <Link
              href="/properties"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 border border-primary-200 rounded-xl px-5 py-2.5 hover:bg-primary-50 transition-colors"
            >
              Browse All Properties <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
