'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { TrendingUp, ArrowRight, ChevronLeft, ChevronRight, Flame } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/lib/store';
import { homeApi } from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Category metadata (icon + gradient) ─────────────────────────────────────

const CAT_STYLE: Record<string, { gradient: string; bgLight: string; textColor: string }> = {
  apartment:            { gradient: 'from-blue-500 to-blue-700',     bgLight: 'bg-blue-50',    textColor: 'text-blue-700'   },
  villa:                { gradient: 'from-emerald-500 to-teal-600',  bgLight: 'bg-emerald-50', textColor: 'text-emerald-700'},
  plot:                 { gradient: 'from-amber-500 to-orange-600',  bgLight: 'bg-amber-50',   textColor: 'text-amber-700'  },
  house:                { gradient: 'from-orange-500 to-red-500',    bgLight: 'bg-orange-50',  textColor: 'text-orange-700' },
  penthouse:            { gradient: 'from-violet-500 to-purple-700', bgLight: 'bg-violet-50',  textColor: 'text-violet-700' },
  studio:               { gradient: 'from-pink-500 to-rose-600',     bgLight: 'bg-pink-50',    textColor: 'text-pink-700'   },
  commercial_office:    { gradient: 'from-sky-500 to-cyan-600',      bgLight: 'bg-sky-50',     textColor: 'text-sky-700'    },
  commercial_shop:      { gradient: 'from-indigo-500 to-indigo-700', bgLight: 'bg-indigo-50',  textColor: 'text-indigo-700' },
  commercial_warehouse: { gradient: 'from-gray-500 to-gray-700',     bgLight: 'bg-gray-50',    textColor: 'text-gray-700'   },
  pg:                   { gradient: 'from-purple-500 to-purple-700', bgLight: 'bg-purple-50',  textColor: 'text-purple-700' },
  co_living:            { gradient: 'from-teal-500 to-emerald-600',  bgLight: 'bg-teal-50',    textColor: 'text-teal-700'   },
  builder_floor:        { gradient: 'from-lime-500 to-green-600',    bgLight: 'bg-lime-50',    textColor: 'text-lime-700'   },
  farm_house:           { gradient: 'from-green-500 to-teal-600',    bgLight: 'bg-green-50',   textColor: 'text-green-700'  },
  land:                 { gradient: 'from-yellow-500 to-amber-600',  bgLight: 'bg-yellow-50',  textColor: 'text-yellow-700' },
  showroom:             { gradient: 'from-red-500 to-rose-600',      bgLight: 'bg-red-50',     textColor: 'text-red-700'    },
  industrial_shed:      { gradient: 'from-slate-500 to-slate-700',   bgLight: 'bg-slate-50',   textColor: 'text-slate-700'  },
  factory:              { gradient: 'from-zinc-500 to-zinc-700',     bgLight: 'bg-zinc-50',    textColor: 'text-zinc-700'   },
};

const DEFAULT_STYLE = { gradient: 'from-primary-500 to-primary-700', bgLight: 'bg-primary-50', textColor: 'text-primary-700' };

// ─── Category href builder ────────────────────────────────────────────────────

function buildCategoryHref(
  propertyType: string,
  city?: string,
  state?: string,
): string {
  const commercialTypes = ['commercial_office', 'commercial_shop', 'commercial_warehouse', 'showroom', 'factory', 'industrial_shed'];
  const rentTypes       = ['pg', 'co_living'];
  const category        = commercialTypes.includes(propertyType) ? 'commercial'
    : rentTypes.includes(propertyType) ? 'pg'
    : 'buy';

  const params = new URLSearchParams({ category, type: propertyType });
  if (city)  params.set('city',  city);
  if (state) params.set('state', state);
  return `/properties?${params.toString()}`;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[140px] sm:w-[160px] snap-start animate-pulse">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="aspect-square bg-gray-200" />
        <div className="p-3 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-4/5 mx-auto" />
          <div className="h-3 bg-gray-200 rounded w-3/5 mx-auto" />
        </div>
      </div>
    </div>
  );
}

// ─── Category Card ────────────────────────────────────────────────────────────

interface CategoryItem {
  propertyType:  string;
  label:         string;
  icon:          string;
  totalListings: number;
  totalViews:    number;
  totalSearches: number;
  score:         number;
  rank:          number;
  isTrending:    boolean;
  trendingScore: number;
}

function CategoryCard({ cat, city, state }: { cat: CategoryItem; city?: string; state?: string }) {
  const style  = CAT_STYLE[cat.propertyType] || DEFAULT_STYLE;
  const href   = buildCategoryHref(cat.propertyType, city, state);
  const listFmt = cat.totalListings >= 1000
    ? `${(cat.totalListings / 1000).toFixed(1)}K`
    : cat.totalListings > 0 ? `${cat.totalListings}` : null;

  return (
    <Link
      href={href}
      className="group flex-shrink-0 w-[140px] sm:w-[160px] snap-start block focus:outline-none"
    >
      <div className="relative bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">

        {/* Trending ribbon */}
        {cat.isTrending && (
          <div className="absolute top-2 left-2 z-10 flex items-center gap-0.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
            <Flame className="w-2.5 h-2.5" />
            HOT
          </div>
        )}

        {/* Rank badge */}
        {cat.rank <= 3 && (
          <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-amber-400 text-white text-[9px] font-black flex items-center justify-center shadow">
            #{cat.rank}
          </div>
        )}

        {/* Icon area — gradient square */}
        <div
          className={cn(
            'aspect-square flex items-center justify-center bg-gradient-to-br',
            style.gradient,
            'group-hover:scale-105 transition-transform duration-500',
          )}
        >
          <span className="text-4xl sm:text-5xl drop-shadow-md select-none filter brightness-110">
            {cat.icon}
          </span>
        </div>

        {/* Info */}
        <div className="p-3 text-center">
          <h3 className="font-bold text-gray-900 text-xs sm:text-sm leading-tight line-clamp-1 group-hover:text-primary-700 transition-colors">
            {cat.label}
          </h3>
          {listFmt && (
            <p className={cn('text-[11px] font-semibold mt-0.5', style.textColor)}>
              {listFmt}+ listings
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export default function TopCategories() {
  const scrollRef    = useRef<HTMLDivElement>(null);
  const selectedCity    = useAppSelector(s => s.ui.selectedCity);
  const selectedState   = useAppSelector(s => s.ui.selectedState);
  const selectedCountry = useAppSelector(s => s.ui.selectedCountry);

  const { data: categories = [], isLoading } = useQuery<CategoryItem[]>({
    queryKey: ['top-categories', selectedCountry, selectedState, selectedCity],
    queryFn: () =>
      homeApi
        .getTopCategories({
          country: selectedCountry || undefined,
          state:   selectedState   || undefined,
          city:    selectedCity    || undefined,
          limit:   14,
        })
        .then(r => r.data?.data || []),
    staleTime: 10 * 60 * 1000,
  });

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 320 : -320, behavior: 'smooth' });
  };

  const locationLabel = selectedCity
    ? `in ${selectedCity}`
    : selectedState ? `in ${selectedState}`
    : selectedCountry ? `in ${selectedCountry}`
    : 'across India';

  const trendingCount = categories.filter(c => c.isTrending).length;

  if (!isLoading && categories.length === 0) return null;

  return (
    <section className="py-10 sm:py-14 bg-gray-50">
      <div className="container-max">

        {/* ── Header ── */}
        <div className="flex items-end justify-between mb-5 sm:mb-7">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp className="w-4 h-4 text-primary-600" />
              <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">
                Popularity Ranked
              </span>
              {trendingCount > 0 && (
                <span className="inline-flex items-center gap-0.5 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  <Flame className="w-2.5 h-2.5" />
                  {trendingCount} Trending
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              Top Categories {locationLabel}
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              Ranked by listings, views &amp; searches
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Desktop scroll arrows */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => scroll('left')}
                className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:border-primary-300 hover:bg-primary-50 transition-all shadow-sm"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:border-primary-300 hover:bg-primary-50 transition-all shadow-sm"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <Link
              href={`/properties${selectedCity ? `?city=${encodeURIComponent(selectedCity)}` : selectedState ? `?state=${encodeURIComponent(selectedState)}` : ''}`}
              className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ── Scroll row ── */}
        <div className="-mx-4 sm:mx-0">
          <div
            ref={scrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar px-4 sm:px-0 snap-x snap-mandatory pb-2"
          >
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
              : categories.map(cat => (
                  <CategoryCard
                    key={cat.propertyType}
                    cat={cat}
                    city={selectedCity || undefined}
                    state={selectedState || undefined}
                  />
                ))
            }
          </div>
        </div>

        {/* ── Mobile view all ── */}
        <div className="text-center mt-5 sm:hidden">
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 border border-primary-200 text-primary-700 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-primary-50 transition-colors"
          >
            Browse All Categories <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ── Stats strip — desktop only ── */}
        {!isLoading && categories.length > 0 && (
          <div className="hidden sm:flex items-center gap-6 mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Most Active:</p>
            {categories.slice(0, 5).map((cat, i) => {
              const style = CAT_STYLE[cat.propertyType] || DEFAULT_STYLE;
              return (
                <Link
                  key={cat.propertyType}
                  href={buildCategoryHref(cat.propertyType, selectedCity || undefined, selectedState || undefined)}
                  className={cn(
                    'flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors',
                    style.bgLight, style.textColor, 'border-current/20 hover:opacity-80',
                  )}
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                  {cat.isTrending && <Flame className="w-3 h-3 text-red-500" />}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
