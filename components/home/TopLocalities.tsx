'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight, ChevronLeft, ChevronRight, Home, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { locationsApi } from '@/lib/api';
import { useAppSelector } from '@/lib/store';

// ─── Locality Card ────────────────────────────────────────────────────────────

const ACCENT_COLORS = [
  { bg: 'bg-blue-50',    border: 'border-blue-100',   dot: 'bg-blue-500',    text: 'text-blue-700'   },
  { bg: 'bg-emerald-50', border: 'border-emerald-100', dot: 'bg-emerald-500', text: 'text-emerald-700'},
  { bg: 'bg-violet-50',  border: 'border-violet-100',  dot: 'bg-violet-500',  text: 'text-violet-700' },
  { bg: 'bg-orange-50',  border: 'border-orange-100',  dot: 'bg-orange-500',  text: 'text-orange-700' },
  { bg: 'bg-rose-50',    border: 'border-rose-100',    dot: 'bg-rose-500',    text: 'text-rose-700'   },
  { bg: 'bg-teal-50',    border: 'border-teal-100',    dot: 'bg-teal-500',    text: 'text-teal-700'   },
  { bg: 'bg-amber-50',   border: 'border-amber-100',   dot: 'bg-amber-500',   text: 'text-amber-700'  },
  { bg: 'bg-cyan-50',    border: 'border-cyan-100',    dot: 'bg-cyan-500',    text: 'text-cyan-700'   },
];

interface LocalityItem {
  id: string;
  locality: string;
  city: string;
  state?: string;
  propertyCount?: number;
}

function LocalityCard({ item, idx, city }: { item: LocalityItem; idx: number; city: string }) {
  const color   = ACCENT_COLORS[idx % ACCENT_COLORS.length];
  const count   = item.propertyCount ?? 0;
  const initials = item.locality.slice(0, 2).toUpperCase();

  const href = `/properties?city=${encodeURIComponent(city)}&locality=${encodeURIComponent(item.locality)}`;

  return (
    <Link
      href={href}
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
    >
      {/* Colour header strip */}
      <div className={`${color.bg} ${color.border} border-b px-4 pt-5 pb-4`}>
        <div className="flex items-start justify-between gap-2">
          <div className={`w-10 h-10 rounded-xl ${color.bg} border ${color.border} flex items-center justify-center flex-shrink-0`}>
            <span className={`text-sm font-black ${color.text}`}>{initials}</span>
          </div>
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${color.bg} ${color.border} border ${color.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
            LOCALITY
          </span>
        </div>
        <h3 className="mt-3 text-sm font-bold text-gray-900 leading-snug line-clamp-1 group-hover:text-primary-700 transition-colors">
          {item.locality}
        </h3>
        <div className="flex items-center gap-1 mt-1">
          <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span className="text-[11px] text-gray-500 truncate">{city}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 flex-1 flex flex-col gap-2">
        {count > 0 && (
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
            <span className="text-xs text-gray-600 font-medium">
              {count.toLocaleString('en-IN')} {count === 1 ? 'property' : 'properties'}
            </span>
          </div>
        )}

        {/* CTA */}
        <div className="mt-auto pt-2 border-t border-gray-50">
          <span className="flex items-center justify-center gap-1.5 w-full bg-gray-50 group-hover:bg-primary-600 text-gray-600 group-hover:text-white text-xs font-bold py-2 rounded-xl transition-all duration-200">
            View Properties
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[72vw] sm:w-[220px] rounded-2xl border border-gray-100 bg-white overflow-hidden animate-pulse">
      <div className="bg-gray-100 h-28 px-4 pt-5 pb-4" />
      <div className="px-4 py-3 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="h-8 bg-gray-100 rounded mt-4" />
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function TopLocalities({ city: cityProp }: { city?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const selectedCity = useAppSelector(s => s.ui.selectedCity);

  useEffect(() => { setMounted(true); }, []);

  const effectiveCity = cityProp ?? (mounted ? selectedCity : '');

  const { data: localities = [], isLoading } = useQuery({
    queryKey: ['home-top-localities', effectiveCity],
    queryFn: () =>
      locationsApi
        .getLocalities(effectiveCity, undefined, undefined, true)
        .then(r => {
          const d = r.data;
          const arr: any[] = Array.isArray(d) ? d : d?.data ?? [];
          return arr
            .filter((l: any) => l.locality)
            .slice(0, 12) as LocalityItem[];
        }),
    enabled: !!effectiveCity,
    staleTime: 5 * 60 * 1000,
  });

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 260 : -260, behavior: 'smooth' });
  };

  if (!effectiveCity) return null;
  if (!isLoading && localities.length === 0) return null;

  const locationLabel = cityProp
    ? `in ${effectiveCity}`
    : mounted && selectedCity
    ? `in ${selectedCity}`
    : '';

  const viewAllHref = effectiveCity
    ? `/properties?city=${encodeURIComponent(effectiveCity)}`
    : '/properties';

  return (
    <section className="py-5 sm:py-14 bg-white border-t border-gray-100">
      <div className="container-max">

        {/* Header */}
        <div className="flex items-end justify-between mb-3 sm:mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 bg-teal-100 text-teal-700 text-[11px] font-bold px-3 py-1 rounded-full tracking-wide">
                <Home className="w-3 h-3" />
                TOP LOCALITIES
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
              Top Localities {locationLabel}
            </h2>
            <p className="text-gray-500 mt-0.5 text-sm">
              Explore prime neighbourhoods with strong demand and capital growth
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
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
              href={viewAllHref}
              className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-semibold text-sm"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Scroll row */}
        <div className="-mx-4 sm:mx-0">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto no-scrollbar px-4 sm:px-0 snap-x snap-mandatory pb-2"
          >
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[72vw] sm:w-[220px] snap-start">
                    <SkeletonCard />
                  </div>
                ))
              : localities.map((loc, idx) => (
                  <div key={loc.id} className="flex-shrink-0 w-[72vw] sm:w-[220px] snap-start">
                    <LocalityCard item={loc} idx={idx} city={effectiveCity} />
                  </div>
                ))
            }
          </div>
        </div>

        {/* Mobile view-all */}
        <div className="text-center mt-5 sm:hidden">
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-2 border border-primary-200 text-primary-700 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-primary-50 transition-colors"
          >
            View All Localities <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
