'use client';

import { useRef, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/lib/store';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ArrowRight, ChevronLeft, ChevronRight, Home, Building2, Layers, TrendingUp, Flame } from 'lucide-react';
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

interface LocalityData {
  id: string;
  locality: string;
  city: string;
  pincode?: string;
  propertyCount: number;
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

function toSlug(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// ── CityCard ──────────────────────────────────────────────────────────────────

function CityCard({ city, idx }: { city: CityData; idx: number }) {
  const gradient = GRADIENTS[idx % GRADIENTS.length];
  const slug = city.slug || toSlug(city.cityName);
  const href = `/property-in-${slug}`;

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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        {city.counts.total > 0 && (
          <div className="absolute top-2.5 right-2.5">
            <span className="bg-white/95 backdrop-blur-sm text-gray-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-md">
              {fmt(city.counts.total)}+ listings
            </span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 px-3.5 py-3">
          <h3 className="text-base font-extrabold text-white leading-tight drop-shadow-lg">{city.cityName}</h3>
          <p className="flex items-center gap-1 text-white/75 text-[11px] mt-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            {city.counts.total > 0 ? `${fmt(city.counts.total)} active properties` : 'Properties available'}
          </p>
        </div>
      </div>

      <div className="px-3.5 pt-3 pb-3 flex-1 flex flex-col gap-2.5">
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
          {!hasAny && <p className="text-xs text-gray-400 italic">Various types available</p>}
        </div>
        <div className="mt-auto pt-2.5 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">Explore all properties</span>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 group-hover:text-primary-700 transition-colors">
            View City <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── LocalityCard ──────────────────────────────────────────────────────────────

const CARD_THEMES = [
  { grad: 'from-blue-500 via-blue-600 to-indigo-700',    bar: 'bg-blue-500',    text: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-100'    },
  { grad: 'from-emerald-500 via-emerald-600 to-teal-700',bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  { grad: 'from-violet-500 via-violet-600 to-purple-700',bar: 'bg-violet-500',  text: 'text-violet-600',  bg: 'bg-violet-50',  border: 'border-violet-100'  },
  { grad: 'from-orange-400 via-orange-500 to-rose-600',  bar: 'bg-orange-500',  text: 'text-orange-600',  bg: 'bg-orange-50',  border: 'border-orange-100'  },
  { grad: 'from-rose-500 via-rose-600 to-pink-700',      bar: 'bg-rose-500',    text: 'text-rose-600',    bg: 'bg-rose-50',    border: 'border-rose-100'    },
  { grad: 'from-teal-500 via-teal-600 to-cyan-700',      bar: 'bg-teal-500',    text: 'text-teal-600',    bg: 'bg-teal-50',    border: 'border-teal-100'    },
  { grad: 'from-amber-400 via-amber-500 to-orange-600',  bar: 'bg-amber-500',   text: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-100'   },
  { grad: 'from-indigo-500 via-indigo-600 to-blue-700',  bar: 'bg-indigo-500',  text: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-100'  },
];

function LocalityCard({ loc, citySlug, idx }: { loc: LocalityData; citySlug: string; idx: number }) {
  const theme   = CARD_THEMES[idx % CARD_THEMES.length];
  const href    = `/property-in-${citySlug}-${toSlug(loc.locality)}`;
  const isHot   = loc.propertyCount >= 200;
  const isTrend = loc.propertyCount >= 100 && !isHot;
  const pct     = Math.min(100, Math.round((loc.propertyCount / 500) * 100));

  return (
    <Link
      href={href}
      className="group flex-shrink-0 snap-start w-[200px] sm:w-[218px] rounded-2xl overflow-hidden border border-gray-200 hover:border-transparent shadow-sm hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 bg-white flex flex-col"
    >
      {/* ── Hero ── */}
      <div className={`relative h-[148px] bg-gradient-to-br ${theme.grad} overflow-hidden flex-shrink-0`}>

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.12]"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />

        {/* Giant initial */}
        <span className="absolute inset-0 flex items-center justify-center text-[100px] font-black text-white/10 select-none leading-none tracking-tighter pointer-events-none">
          {loc.locality.charAt(0)}
        </span>

        {/* Hover glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 50% 60%, rgba(255,255,255,0.18) 0%, transparent 65%)' }}
        />

        {/* Bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

        {/* Rank badge — top left */}
        <div className="absolute top-3 left-3 z-10">
          <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/20 backdrop-blur-sm text-white text-[11px] font-black border border-white/20">
            {idx + 1}
          </span>
        </div>

        {/* Status badge — top right */}
        <div className="absolute top-3 right-3 z-10">
          {isHot ? (
            <span className="flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
              <Flame className="w-2.5 h-2.5" /> Hot
            </span>
          ) : isTrend ? (
            <span className="flex items-center gap-1 bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
              <TrendingUp className="w-2.5 h-2.5" /> Trending
            </span>
          ) : loc.propertyCount > 0 ? (
            <span className="flex items-center gap-1 bg-white/90 backdrop-blur-sm text-gray-800 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
              {fmt(loc.propertyCount)}+
            </span>
          ) : null}
        </div>

        {/* Name + location */}
        <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-3 pt-8 z-10"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,.82) 0%, transparent 100%)' }}
        >
          <h3 className="text-[15px] font-extrabold text-white leading-tight drop-shadow-lg line-clamp-1 group-hover:text-white">
            {loc.locality}
          </h3>
          <p className="flex items-center gap-1 text-white/65 text-[10px] mt-0.5">
            <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
            {loc.city}
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="px-3.5 pt-3 pb-3.5 flex-1 flex flex-col gap-2.5">

        {/* Count + pincode row */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold leading-none mb-0.5">
              Properties
            </p>
            <p className="text-xl font-black text-gray-900 leading-none tabular-nums">
              {loc.propertyCount > 0 ? `${fmt(loc.propertyCount)}+` : '—'}
            </p>
          </div>
          {loc.pincode && (
            <span className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-xl ${theme.bg} ${theme.text} ${theme.border} border`}>
              {loc.pincode}
            </span>
          )}
        </div>

        {/* Progress bar */}
        {loc.propertyCount > 0 && (
          <div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${theme.bar} rounded-full transition-all duration-700 ease-out`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5 text-right">{pct}% of area peak</p>
          </div>
        )}

        {/* CTA row */}
        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Explore locality
          </span>
          <span className={`inline-flex items-center gap-1 text-xs font-bold ${theme.text} group-hover:gap-2 transition-all duration-200`}>
            View <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Skeletons ──────────────────────────────────────────────────────────────────

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

function LocalityCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[200px] sm:w-[218px] rounded-2xl overflow-hidden border border-gray-200 bg-white animate-pulse">
      <div className="h-[148px] bg-gray-200" />
      <div className="px-3.5 pt-3 pb-3.5 space-y-2.5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="h-2 bg-gray-200 rounded w-14" />
            <div className="h-6 bg-gray-200 rounded w-12" />
          </div>
          <div className="h-7 bg-gray-100 rounded-xl w-16" />
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full w-full" />
        <div className="h-2 bg-gray-100 rounded w-1/3 ml-auto" />
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
          <div className="h-2.5 bg-gray-100 rounded w-1/3" />
          <div className="h-2.5 bg-gray-200 rounded w-1/5" />
        </div>
      </div>
    </div>
  );
}

// ── Main Section ──────────────────────────────────────────────────────────────

export default function TopCitiesSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft,  setCanScrollLeft]  = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Read selected city from Redux
  const selectedCity   = useAppSelector((s) => s.ui.selectedCity);
  const cityMode       = !!selectedCity;
  const citySlug       = selectedCity ? toSlug(selectedCity) : '';

  // ── Cities query (no city selected) ──
  const citiesQuery = useQuery<CityData[]>({
    queryKey: ['top-cities'],
    queryFn: async () => {
      const res = await locationsApi.getTopCities();
      const raw = res.data;
      return Array.isArray(raw) ? raw : raw?.cities ?? [];
    },
    staleTime: 60 * 60 * 1000,
    enabled: !cityMode,
  });

  // ── Localities query (city selected) ──
  const localitiesQuery = useQuery<LocalityData[]>({
    queryKey: ['top-localities', selectedCity],
    queryFn: async () => {
      const res = await locationsApi.getLocalities(selectedCity, undefined, undefined, true);
      const raw: any[] = Array.isArray(res.data) ? res.data : [];
      return raw
        .filter(l => l.locality && l.locality.trim())
        .slice(0, 16)
        .map(l => ({
          id:            l.id,
          locality:      l.locality,
          city:          l.city,
          pincode:       l.pincode,
          propertyCount: Number(l.propertyCount ?? 0),
        }));
    },
    staleTime: 5 * 60 * 1000,
    enabled: cityMode,
  });

  const isLoading = cityMode ? localitiesQuery.isLoading : citiesQuery.isLoading;
  const hasData   = cityMode
    ? (localitiesQuery.data?.length ?? 0) > 0
    : (citiesQuery.data?.length ?? 0) > 0;

  // Reset scroll position when mode switches
  useEffect(() => {
    scrollRef.current?.scrollTo({ left: 0, behavior: 'instant' as ScrollBehavior });
  }, [selectedCity]);

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
  }, [citiesQuery.data, localitiesQuery.data]);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -440 : 440, behavior: 'smooth' });
  };

  if (!isLoading && !hasData) return null;

  // ── Dynamic header text ──
  const label    = cityMode ? 'Explore Areas' : 'Explore Cities';
  const heading  = cityMode
    ? `Top Residential Areas in ${selectedCity}`
    : 'Top Residential Cities in India';
  const subtext  = cityMode
    ? `Popular localities & neighbourhoods in ${selectedCity}`
    : "India's most sought-after real estate markets";
  const viewAllHref = cityMode ? `/property-in-${citySlug}` : '/property-for-sale-in-top-cities';
  const viewAllText = cityMode ? `All in ${selectedCity}` : 'View All';

  return (
    <section className="py-7 sm:py-12 lg:py-13 bg-gray-50 border-b border-gray-100">
      <div className="container-rv">

        {/* ── Header ── */}
        <div className="flex items-end justify-between mb-4 sm:mb-6">
          <div>
              <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-1">
              {label}
            </p>
            <h2 className="rv-h2 leading-tight">
              {heading}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">{subtext}</p>
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
              href={viewAllHref}
              className="ml-1 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              {viewAllText} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ── Scroll container ── */}
        <div className="relative">
          {canScrollLeft && (
            <div className="hidden sm:block absolute left-0 top-0 bottom-2 w-12 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none rounded-l-2xl" />
          )}
          {canScrollRight && (
            <div className="hidden sm:block absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none rounded-r-2xl" />
          )}

          <div className="-mx-4 sm:mx-0">
            <div
              ref={scrollRef}
              className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar px-4 sm:px-0 snap-x snap-mandatory pb-3 scroll-smooth"
            >
              {isLoading ? (
                cityMode
                  ? Array.from({ length: 8 }).map((_, i) => <LocalityCardSkeleton key={i} />)
                  : Array.from({ length: 6 }).map((_, i) => <CityCardSkeleton key={i} />)
              ) : cityMode ? (
                localitiesQuery.data!.map((loc, idx) => (
                  <LocalityCard key={loc.id} loc={loc} citySlug={citySlug} idx={idx} />
                ))
              ) : (
                citiesQuery.data!.map((city, idx) => (
                  <CityCard key={city.id} city={city} idx={idx} />
                ))
              )}
              <div className="flex-shrink-0 w-1 sm:hidden" />
            </div>
          </div>
        </div>

        {/* ── Mobile: scroll hint + view-all ── */}
        <div className="mt-3 flex items-center justify-between sm:hidden">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <ChevronLeft className="w-3 h-3" />
            {cityMode ? `Swipe to explore ${selectedCity} areas` : 'Swipe to explore more cities'}
            <ChevronRight className="w-3 h-3" />
          </p>
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 border border-primary-200 rounded-lg px-3 py-1.5 hover:bg-primary-50 transition-colors"
          >
            {viewAllText} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

      </div>
    </section>
  );
}
