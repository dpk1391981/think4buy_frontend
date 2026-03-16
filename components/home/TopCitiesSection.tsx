'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ArrowRight, ChevronRight } from 'lucide-react';
import { locationsApi } from '@/lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface CityData {
  id: string;
  cityName: string;
  slug: string;
  image: string | null;
  counts: {
    plots: number;
    flats: number;
    independentHouse: number;
    total: number;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ── CityCard ──────────────────────────────────────────────────────────────────

function CityCard({ city, idx }: { city: CityData; idx: number }) {
  const gradient = GRADIENTS[idx % GRADIENTS.length];
  const slug = city.slug || city.cityName.toLowerCase().replace(/\s+/g, '-');
  const href = `/property-in/${slug}`;

  const typeRows = [
    { emoji: '🏗️', label: 'Residential Land / Plots', count: city.counts.plots },
    { emoji: '🏢', label: 'Flats / Apartments',        count: city.counts.flats },
    { emoji: '🏠', label: 'Independent House',         count: city.counts.independentHouse },
  ].filter(r => r.count > 0).slice(0, 3);

  return (
    <Link
      href={href}
      className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      {/* ── Image / Gradient banner ── */}
      <div className="relative aspect-[16/10] overflow-hidden flex-shrink-0">
        {city.image ? (
          <Image
            src={city.image}
            alt={`Properties in ${city.cityName}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
            sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
            loading="lazy"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[72px] font-black text-white/15 select-none leading-none">
                {city.cityName.charAt(0)}
              </span>
            </div>
            {/* Subtle dot pattern */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
          </div>
        )}
        

        {/* Bottom gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        {/* Total listings badge — top right */}
        <div className="absolute top-3 right-3">
          <span className="bg-white/95 backdrop-blur-sm text-gray-900 text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
            {fmt(city.counts.total)} listings
          </span>
        </div>

        {/* City name + pin — bottom left */}
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3">
          <h3 className="text-lg font-extrabold text-white leading-tight drop-shadow-lg">
            {city.cityName}
          </h3>
          <p className="flex items-center gap-1 text-white/70 text-[11px] mt-0.5">
            <MapPin className="w-3 h-3" />
            {fmt(city.counts.total)} active properties
          </p>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-4 flex-1 flex flex-col gap-3">
        {/* Property type breakdown */}
        <div className="space-y-2">
          {typeRows.length > 0 ? typeRows.map(row => (
            <div key={row.label} className="flex items-center gap-2 text-sm">
              <span className="text-base w-5 flex-shrink-0 leading-none">{row.emoji}</span>
              <span className="text-gray-600 flex-1 leading-tight">{row.label}</span>
              <span className="font-bold text-gray-900 tabular-nums">{fmt(row.count)}</span>
            </div>
          )) : (
            <p className="text-sm text-gray-400 italic">Various property types available</p>
          )}
        </div>

        {/* Know More CTA */}
        <div className="mt-auto pt-3 border-t border-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-400">Explore all properties</span>
            <span className="inline-flex items-center gap-1 text-sm font-bold text-primary-600 group-hover:text-primary-700 transition-colors">
              Know More
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CityCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm animate-pulse">
      <div className="aspect-[16/10] bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-3.5 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-5/6" />
        <div className="h-3 bg-gray-100 rounded w-4/6" />
      </div>
    </div>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────

export default function TopCitiesSection() {
  const { data, isLoading, isError } = useQuery<CityData[]>({
    queryKey: ['top-cities'],
    queryFn: async () => {
      const res = await locationsApi.getTopCities();
      const raw = res.data;
      return Array.isArray(raw) ? raw : raw?.cities ?? [];
    },
    staleTime: 60 * 60 * 1000, // 1 hour — city data changes rarely
  });

  // Don't render the section if there's nothing to show
  if (!isLoading && (isError || !data?.length)) return null;

  return (
    <section className="py-8 sm:py-14 bg-white">
      <div className="container-max">

        {/* ── Section header ── */}
        <div className="flex items-end justify-between mb-6 sm:mb-10">
          <div>
            <p className="text-xs sm:text-sm font-semibold text-primary-600 uppercase tracking-widest mb-1">
              Explore Cities
            </p>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
              Top Residential Cities in India
            </h2>
            <p className="mt-1 text-sm sm:text-base text-gray-500">
              Discover properties across India&apos;s most sought-after real estate markets
            </p>
          </div>

          <Link
            href="/properties"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors flex-shrink-0"
          >
            View All Cities
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ── Cities grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <CityCardSkeleton key={i} />)
            : data!.map((city, idx) => <CityCard key={city.id} city={city} idx={idx} />)
          }
        </div>

        {/* Mobile "View all" link */}
        <div className="mt-6 flex sm:hidden justify-center">
          <Link
            href="/properties"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 border border-primary-200 rounded-xl px-5 py-2.5 hover:bg-primary-50 transition-colors"
          >
            View All Cities
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
