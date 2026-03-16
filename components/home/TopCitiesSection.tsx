'use client';

import { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ArrowRight, ChevronLeft, ChevronRight, Home, Building2, Layers } from 'lucide-react';
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
    { icon: <Layers className="w-3 h-3" />,   label: 'Plots',   count: city.counts.plots },
    { icon: <Building2 className="w-3 h-3" />, label: 'Flats',   count: city.counts.flats },
    { icon: <Home className="w-3 h-3" />,      label: 'Houses',  count: city.counts.independentHouse },
  ];

  const hasAny = typeRows.some(r => r.count > 0);

  return (
    <Link
      href={href}
      className="group flex-shrink-0 snap-start w-[210px] sm:w-[232px] rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white flex flex-col"
    >
      {/* ── Image / Gradient ── */}
      <div className="relative h-[130px] sm:h-[148px] overflow-hidden flex-shrink-0">
        {city.image ? (
          <Image
            src={city.image}
            alt={`Properties in ${city.cityName}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="232px"
            loading="lazy"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-6xl font-black text-white/15 select-none leading-none">
                {city.cityName.charAt(0)}
              </span>
            </div>
            <div
              className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '22px 22px' }}
            />
          </div>
        )}

        {/* Gradient overlay for text */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Total count badge — top right */}
        {city.counts.total > 0 && (
          <div className="absolute top-2.5 right-2.5">
            <span className="bg-white/95 backdrop-blur-sm text-gray-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
              {fmt(city.counts.total)}+ listings
            </span>
          </div>
        )}

        {/* City name — bottom left */}
        <div className="absolute bottom-0 left-0 right-0 px-3.5 py-3">
          <h3 className="text-base font-extrabold text-white leading-tight drop-shadow-lg">
            {city.cityName}
          </h3>
          <p className="flex items-center gap-1 text-white/75 text-[11px] mt-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {city.counts.total > 0 ? `${fmt(city.counts.total)} active properties` : 'Properties available'}
          </p>
        </div>
      </div>

      {/* ── Info body ── */}
      <div className="px-3.5 pt-3 pb-3 flex-1 flex flex-col gap-2.5">

        {/* Property type breakdown */}
        <div className="space-y-1.5">
          {typeRows.map(row => (
            <div key={row.label} className="flex items-center gap-2">
              <span className="text-gray-400 flex-shrink-0">{row.icon}</span>
              <span className="text-gray-500 text-xs flex-1">{row.label}</span>
              <span className={`text-xs font-bold tabular-nums ${row.count > 0 ? 'text-gray-900' : 'text-gray-300'}`}>
                {row.count > 0 ? fmt(row.count) : '—'}
              </span>
            </div>
          ))}
          {!hasAny && (
            <p className="text-xs text-gray-400 italic">Various types available</p>
          )}
        </div>

        {/* CTA */}
        <div className="mt-auto pt-2.5 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">Explore all properties</span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 group-hover:text-primary-700 transition-colors">
            View City
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function CityCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[210px] sm:w-[232px] rounded-2xl overflow-hidden border border-gray-200 bg-white animate-pulse">
      <div className="h-[130px] sm:h-[148px] bg-gray-200" />
      <div className="px-3.5 pt-3 pb-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-3/4" />
        <div className="h-2.5 bg-gray-100 rounded w-full" />
        <div className="h-2.5 bg-gray-100 rounded w-5/6" />
        <div className="h-2.5 bg-gray-100 rounded w-4/6" />
        <div className="h-3 bg-gray-200 rounded w-1/2 mt-2" />
      </div>
    </div>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────

export default function TopCitiesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft,  setCanScrollLeft]  = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { data, isLoading, isError } = useQuery<CityData[]>({
    queryKey: ['top-cities'],
    queryFn: async () => {
      const res = await locationsApi.getTopCities();
      const raw = res.data;
      return Array.isArray(raw) ? raw : raw?.cities ?? [];
    },
    staleTime: 60 * 60 * 1000,
  });

  // Update arrow states on scroll
  const syncArrows = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    syncArrows();
    el.addEventListener('scroll', syncArrows, { passive: true });
    return () => el.removeEventListener('scroll', syncArrows);
  }, [data]);

  const scroll = (dir: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -480 : 480, behavior: 'smooth' });
  };

  if (!isLoading && (isError || !data?.length)) return null;

  return (
    <section className="py-5 sm:py-12 bg-gray-50 border-b border-gray-100">
      <div className="container-max">

        {/* ── Header ── */}
        <div className="flex items-end justify-between mb-4 sm:mb-6">
          <div>
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">
              Explore Cities
            </p>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
              Top Residential Cities in India
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              India&apos;s most sought-after real estate markets
            </p>
          </div>

          {/* Desktop: arrows + view-all */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className="w-9 h-9 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-primary-600 hover:border-primary-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className="w-9 h-9 rounded-full border border-gray-200 bg-white shadow-sm flex items-center justify-center text-gray-500 hover:text-primary-600 hover:border-primary-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <Link
              href="/properties"
              className="ml-1 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ── Scroll container ── */}
        <div className="relative">
          {/* Left fade hint */}
          {canScrollLeft && (
            <div className="hidden sm:block absolute left-0 top-0 bottom-2 w-12 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none rounded-l-2xl" />
          )}
          {/* Right fade hint */}
          {canScrollRight && (
            <div className="hidden sm:block absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none rounded-r-2xl" />
          )}

          <div className="-mx-4 sm:mx-0">
            <div
              ref={scrollRef}
              className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar px-4 sm:px-0 snap-x snap-mandatory pb-3 scroll-smooth"
            >
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <CityCardSkeleton key={i} />)
                : data!.map((city, idx) => <CityCard key={city.id} city={city} idx={idx} />)
              }
              {/* Spacer so last card isn't flush */}
              <div className="flex-shrink-0 w-1 sm:hidden" />
            </div>
          </div>
        </div>

        {/* ── Mobile: scroll hint text + view-all ── */}
        <div className="mt-3 flex items-center justify-between sm:hidden">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <ChevronLeft className="w-3 h-3" />
            Swipe to explore more cities
            <ChevronRight className="w-3 h-3" />
          </p>
          <Link
            href="/properties"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 border border-primary-200 rounded-lg px-3 py-1.5 hover:bg-primary-50 transition-colors"
          >
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

      </div>
    </section>
  );
}
