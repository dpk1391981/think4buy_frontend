'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight, ChevronLeft, ChevronRight, Building2,
  CheckCircle2, HardHat, Sparkles, Award, MapPin,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
import { useAppSelector } from '@/lib/store';
import { Property } from '@/types/property';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeveloperStat {
  name: string;
  /** Primary city (city-specific mode) or first city found (all-cities mode) */
  city: string;
  /** All cities this developer has projects in (all-cities mode) */
  cities: string[];
  total: number;
  ready: number;
  underConstruction: number;
  newLaunch: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const GRADIENTS = [
  'from-blue-600 to-blue-800',
  'from-emerald-600 to-emerald-800',
  'from-violet-600 to-violet-800',
  'from-orange-500 to-orange-700',
  'from-rose-600 to-rose-800',
  'from-teal-600 to-teal-800',
  'from-indigo-600 to-indigo-800',
  'from-amber-500 to-amber-700',
  'from-cyan-600 to-cyan-800',
  'from-pink-600 to-pink-800',
];

const ACCENT_COLORS = [
  'bg-blue-400/20 text-blue-100',
  'bg-emerald-400/20 text-emerald-100',
  'bg-violet-400/20 text-violet-100',
  'bg-orange-400/20 text-orange-100',
  'bg-rose-400/20 text-rose-100',
  'bg-teal-400/20 text-teal-100',
  'bg-indigo-400/20 text-indigo-100',
  'bg-amber-400/20 text-amber-100',
  'bg-cyan-400/20 text-cyan-100',
  'bg-pink-400/20 text-pink-100',
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

function groupByBuilder(props: Property[], cityFilter: string): DeveloperStat[] {
  const map      = new Map<string, DeveloperStat>();
  const cityMaps = new Map<string, Map<string, number>>();

  for (const p of props) {
    const name = (p.builderName || '').trim();
    if (!name) continue;

    if (!map.has(name)) {
      map.set(name, {
        name,
        city: cityFilter || p.city || '',
        cities: [],
        total: 0, ready: 0, underConstruction: 0, newLaunch: 0,
      });
      cityMaps.set(name, new Map());
    }
    const d = map.get(name)!;
    d.total++;

    if (p.city) {
      const cm = cityMaps.get(name)!;
      cm.set(p.city, (cm.get(p.city) ?? 0) + 1);
    }

    const status = (p.possessionStatus as string) ?? '';
    if (status === 'ready_to_move')      d.ready++;
    else if (status === 'under_construction') d.underConstruction++;
    else if (status === 'new_launch')    d.newLaunch++;
  }

  // Build sorted city list per developer
  for (const [name, cm] of cityMaps) {
    const d = map.get(name)!;
    d.cities = [...cm.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([c]) => c);
    // In all-cities mode, use the most-represented city as primary
    if (!cityFilter && d.cities.length) d.city = d.cities[0];
  }

  return Array.from(map.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 12);
}

// ─── Developer Card ───────────────────────────────────────────────────────────

function DeveloperCard({
  dev, idx, allCities,
}: {
  dev: DeveloperStat;
  idx: number;
  allCities: boolean;
}) {
  const gradient = GRADIENTS[idx % GRADIENTS.length];
  const accent   = ACCENT_COLORS[idx % ACCENT_COLORS.length];

  // Link: city-specific → new-projects-in-{city}, all-cities → filter by builder
  const href = allCities
    ? `/properties?builderName=${encodeURIComponent(dev.name)}&category=builder_project&approvalStatus=approved`
    : `/new-projects-in-${(dev.city || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}?builderName=${encodeURIComponent(dev.name)}`;

  const cityDisplay = allCities
    ? dev.cities.slice(0, 2).join(' · ') + (dev.cities.length > 2 ? ` +${dev.cities.length - 2}` : '')
    : dev.city;

  return (
    <Link
      href={href}
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
    >
      {/* ── Gradient header ─────────────────────────────────────────────── */}
      <div className={`bg-gradient-to-br ${gradient} px-5 pt-6 pb-5 flex flex-col items-center text-center relative`}>

        {/* Award ribbon for top 3 */}
        {idx < 3 && (
          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shadow-md">
            <span className="text-[10px] font-black text-yellow-900">#{idx + 1}</span>
          </div>
        )}

        {/* Initials avatar */}
        <div className="w-16 h-16 rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center mb-3 shadow-inner group-hover:scale-105 transition-transform">
          <span className="text-xl font-black text-white tracking-tight drop-shadow">
            {initials(dev.name)}
          </span>
        </div>

        {/* ── Highlighted developer / builder name ── */}
        <div className="mb-1.5">
          {/* Name highlight pill */}
          <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5 ${accent} uppercase tracking-widest`}>
            Builder
          </span>
          <h3 className="text-white font-extrabold text-base leading-snug line-clamp-2 drop-shadow-sm group-hover:text-yellow-300 transition-colors">
            {dev.name}
          </h3>
          {/* Accent underline */}
          <div className="mt-1.5 h-0.5 w-10 bg-white/40 rounded-full mx-auto group-hover:w-16 group-hover:bg-yellow-400 transition-all duration-300" />
        </div>

        {/* City / cities */}
        <div className="flex items-center gap-1 mt-2 text-white/70 text-[11px] font-medium">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="line-clamp-1">{cityDisplay || 'Pan India'}</span>
        </div>
      </div>

      {/* ── Stats body ────────────────────────────────────────────────── */}
      <div className="px-4 py-4 flex flex-col gap-2.5 flex-1">

        {/* Total projects */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 font-medium">Total Projects</span>
          <span className="text-sm font-extrabold text-gray-900">{dev.total}</span>
        </div>

        {/* Status breakdown */}
        <div className="space-y-1.5">
          {dev.ready > 0 && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
              <span className="text-[11px] text-gray-500 flex-1">Ready to Move</span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {dev.ready}
              </span>
            </div>
          )}
          {dev.underConstruction > 0 && (
            <div className="flex items-center gap-2">
              <HardHat className="w-3 h-3 text-amber-500 flex-shrink-0" />
              <span className="text-[11px] text-gray-500 flex-1">Under Construction</span>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                {dev.underConstruction}
              </span>
            </div>
          )}
          {dev.newLaunch > 0 && (
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-primary-500 flex-shrink-0" />
              <span className="text-[11px] text-gray-500 flex-1">New Launch</span>
              <span className="text-[11px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
                {dev.newLaunch}
              </span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-auto pt-3 border-t border-gray-50">
          <span className="flex items-center justify-center gap-1.5 w-full bg-gray-50 group-hover:bg-primary-600 text-gray-600 group-hover:text-white text-xs font-bold py-2.5 rounded-xl transition-all duration-200">
            View Projects
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
      <div className="h-40 bg-gray-200" />
      <div className="px-4 py-4 space-y-2.5">
        <div className="flex justify-between">
          <div className="h-3 bg-gray-100 rounded w-24" />
          <div className="h-3 bg-gray-100 rounded w-6" />
        </div>
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-8 bg-gray-100 rounded mt-3" />
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function TopDevelopers({ city: cityProp }: { city?: string }) {
  const scrollRef   = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const selectedCity = useAppSelector(s => s.ui.selectedCity);

  useEffect(() => { setMounted(true); }, []);

  // cityProp wins (city pages); otherwise use redux-selected city (homepage)
  const effectiveCity = cityProp ?? (mounted ? selectedCity : undefined);
  const allCities     = !effectiveCity;

  const { data: rawProps = [], isLoading } = useQuery({
    queryKey: ['home-top-developers', effectiveCity ?? '__all__'],
    queryFn: () =>
      propertiesApi
        .getAll({
          ...(effectiveCity ? { city: effectiveCity } : {}),
          category: 'builder_project',
          approvalStatus: 'approved',
          sortBy: 'createdAt',
          sortOrder: 'DESC',
          limit: 300,
        })
        .then(r => {
          const d = r.data;
          return (Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : []) as Property[];
        }),
    staleTime: 10 * 60 * 1000,
  });

  const developers = useMemo(
    () => groupByBuilder(rawProps, effectiveCity ?? ''),
    [rawProps, effectiveCity],
  );

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 260 : -260, behavior: 'smooth' });
  };

  // Don't render if data loaded but nothing to show
  if (!isLoading && developers.length === 0) return null;

  const locationLabel = allCities
    ? 'Across India'
    : effectiveCity
    ? `in ${effectiveCity}`
    : '';

  const viewAllHref = allCities
    ? '/properties?category=builder_project&approvalStatus=approved'
    : `/new-projects-in-${(effectiveCity ?? '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;

  return (
    <section className="py-10 sm:py-14 bg-gray-50 border-t border-gray-100">
      <div className="container-max">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="flex items-end justify-between mb-5 sm:mb-7">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-[11px] font-bold px-3 py-1 rounded-full tracking-wide">
                <Award className="w-3 h-3" />
                TOP DEVELOPERS
              </span>
              {allCities && (
                <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
                  <Building2 className="w-3 h-3" />
                  All India
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
              Top Builders &amp; Developers{' '}
              <span className="text-primary-600">{locationLabel}</span>
            </h2>
            <p className="text-gray-500 mt-0.5 text-sm">
              Trusted builders with verified new projects and strong delivery track records
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

        {/* ── Scroll row ──────────────────────────────────────────── */}
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
              : developers.map((dev, idx) => (
                  <div key={dev.name} className="flex-shrink-0 w-[72vw] sm:w-[220px] snap-start">
                    <DeveloperCard dev={dev} idx={idx} allCities={allCities} />
                  </div>
                ))
            }
          </div>
        </div>

        {/* ── Mobile view-all ─────────────────────────────────────── */}
        <div className="text-center mt-5 sm:hidden">
          <Link
            href={viewAllHref}
            className="inline-flex items-center gap-2 border border-primary-200 text-primary-700 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-primary-50 transition-colors"
          >
            View All Developers <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
