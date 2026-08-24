'use client';

import { useRef, useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { resolveImageSrc } from '@/components/common/OptimizedImage';
import {
  ArrowRight, ChevronLeft, ChevronRight, Building2,
  CheckCircle2, HardHat, Sparkles, Award, MapPin,
  ExternalLink,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { buildersApi } from '@/lib/api';
import { useAppSelector } from '@/lib/store';
import { formatPrice } from '@/lib/utils';
import { cn } from '@/lib/utils';

// ─── Types (mirrors BuilderResponse from backend) ─────────────────────────────

interface BuilderProject {
  id: string;
  title: string;
  slug: string;
  possessionStatus: string | null;
  isNewProject: boolean;
  price: number;
  priceUnit: string | null;
  locality: string;
  city: string;
  category: string;
}

interface Builder {
  builderId: string | null;
  builderName: string;
  builderSlug: string;
  builderLogo: string | null;
  builderVerified: boolean;
  builderReraNumber: string | null;
  builderWebsite: string | null;
  builderExperience: number | null;
  city: string;
  cities: string[];
  totalProjects: number;
  readyToMove: number;
  underConstruction: number;
  newProjects: number;
  topProjects: BuilderProject[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GRADIENTS = [
  'from-blue-600 to-indigo-700',
  'from-emerald-600 to-teal-700',
  'from-violet-600 to-purple-800',
  'from-orange-500 to-rose-600',
  'from-rose-600 to-pink-700',
  'from-teal-600 to-cyan-700',
  'from-indigo-600 to-blue-800',
  'from-amber-500 to-orange-600',
  'from-cyan-600 to-blue-700',
  'from-pink-600 to-rose-700',
];

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

// ─── Status label helper ─────────────────────────────────────────────────────

function getStatusLabel(p: BuilderProject): { label: string; cls: string; icon: ReactNode } {
  if (p.isNewProject)
    return { label: 'New Launch',          cls: 'bg-violet-50 text-violet-700 border-violet-200', icon: <Sparkles className="w-2.5 h-2.5" /> };
  if (p.possessionStatus === 'ready_to_move')
    return { label: 'Ready to Move',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle2 className="w-2.5 h-2.5" /> };
  if (p.possessionStatus === 'under_construction')
    return { label: 'Under Construction',  cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: <HardHat className="w-2.5 h-2.5" /> };
  return { label: '', cls: '', icon: null };
}

// ─── Project mini-row ─────────────────────────────────────────────────────────

function ProjectRow({ p }: { p: BuilderProject }) {
  const { label, cls, icon } = getStatusLabel(p);
  return (
    <Link
      href={`/properties/${p.slug}`}
      className="flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group/proj"
    >
      <span className="text-gray-300 text-xs mt-0.5 flex-shrink-0 group-hover/proj:text-primary-400">›</span>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-gray-800 line-clamp-1 group-hover/proj:text-primary-600 transition-colors leading-snug">
          {p.title}
        </p>
        {label && (
          <span className={cn('inline-flex items-center gap-1 mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded border', cls)}>
            {icon}{label}
          </span>
        )}
      </div>
      <span className="text-[11px] font-bold text-gray-700 whitespace-nowrap mt-0.5 flex-shrink-0">
        {formatPrice(p.price, p.priceUnit ?? undefined)}
      </span>
    </Link>
  );
}

// ─── Builder Card ─────────────────────────────────────────────────────────────

function BuilderCard({ b, idx, allCities }: { b: Builder; idx: number; allCities: boolean }) {
  const gradient  = GRADIENTS[idx % GRADIENTS.length];
  const detailUrl = `/builder/${b.builderSlug}`;

  // Filter-pill links
  const citySlug   = b.city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const baseFilter = allCities
    ? `/properties?builderName=${encodeURIComponent(b.builderName)}&category=builder_project`
    : `/new-projects-in-${citySlug}?builderName=${encodeURIComponent(b.builderName)}`;

  const filterUrl = (status: string) =>
    `${baseFilter}&possessionStatus=${status}`;

  const cityDisplay = allCities
    ? b.cities.slice(0, 2).join(' · ') + (b.cities.length > 2 ? ` +${b.cities.length - 2}` : '')
    : b.city;

  return (
    <div className="group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">

      {/* ── Gradient header ───────────────────────────────────────────── */}
      <div className={`bg-gradient-to-br ${gradient} px-5 pt-5 pb-4 relative`}>

        {/* Rank badge */}
        {idx < 3 && (
          <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shadow">
            <span className="text-[10px] font-black text-yellow-900">#{idx + 1}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Avatar: logo image if available, else initials */}
          <div className="w-14 h-14 rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center flex-shrink-0 shadow-inner group-hover:scale-105 transition-transform overflow-hidden">
            {b.builderLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveImageSrc(b.builderLogo)}
                alt={b.builderName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-black text-white drop-shadow">{initials(b.builderName)}</span>
            )}
          </div>

          {/* Name + city */}
          <div className="min-w-0 flex-1">
            {/* "Builder" pill + verified badge */}
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white/90 uppercase tracking-widest">
                Builder
              </span>
              {b.builderVerified && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-400/20 text-green-200 border border-green-400/30">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Verified
                </span>
              )}
            </div>
            {/* ── Highlighted builder name ── */}
            <h3 className="text-white font-extrabold text-base leading-tight line-clamp-1 drop-shadow-sm group-hover:text-yellow-300 transition-colors">
              {b.builderName}
            </h3>
            {/* Animated accent underline */}
            <div className="mt-1 h-0.5 w-8 bg-white/40 rounded-full group-hover:w-14 group-hover:bg-yellow-400 transition-all duration-300" />
            {/* City */}
            {cityDisplay && (
              <div className="flex items-center gap-1 mt-1.5 text-white/70 text-[11px]">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{cityDisplay}</span>
              </div>
            )}
          </div>
        </div>

        {/* Total projects stat */}
        <div className="mt-3 flex items-center justify-between bg-white/10 rounded-xl px-3 py-2">
          <span className="text-white/70 text-xs font-medium">Total Projects</span>
          <span className="text-white font-extrabold text-sm">{b.totalProjects}</span>
        </div>
      </div>

      {/* ── Status filter pills ───────────────────────────────────────── */}
      <div className="px-4 pt-3 pb-2 flex flex-wrap gap-1.5">
        {b.readyToMove > 0 && (
          <Link
            href={filterUrl('ready_to_move')}
            className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all"
          >
            <CheckCircle2 className="w-3 h-3" />
            Ready to Move ({b.readyToMove})
          </Link>
        )}
        {b.underConstruction > 0 && (
          <Link
            href={filterUrl('under_construction')}
            className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all"
          >
            <HardHat className="w-3 h-3" />
            Under Construction ({b.underConstruction})
          </Link>
        )}
        {b.newProjects > 0 && (
          <Link
            href={`${baseFilter}&isNewProject=true`}
            className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all"
          >
            <Sparkles className="w-3 h-3" />
            New Launch ({b.newProjects})
          </Link>
        )}
      </div>

      {/* ── Top projects inline list ──────────────────────────────────── */}
      {b.topProjects.length > 0 && (
        <div className="px-1 pb-1">
          <p className="px-3 pt-1 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Top Projects
          </p>
          {b.topProjects.slice(0, 3).map(p => (
            <ProjectRow key={p.id} p={p} />
          ))}
        </div>
      )}

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 mt-auto border-t border-gray-50">
        <Link
          href={detailUrl}
          className="flex items-center justify-center gap-1.5 w-full bg-gray-50 group-hover:bg-primary-600 text-gray-600 group-hover:text-white text-xs font-bold py-2.5 rounded-xl transition-all duration-200"
        >
          View All Projects
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[80vw] sm:w-[260px] rounded-2xl border border-gray-100 bg-white overflow-hidden animate-pulse">
      <div className="h-36 bg-gray-200" />
      <div className="px-4 py-3 space-y-2">
        <div className="flex gap-1.5">
          <div className="h-6 bg-gray-100 rounded-full w-28" />
          <div className="h-6 bg-gray-100 rounded-full w-20" />
        </div>
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="h-9 bg-gray-100 rounded-xl mt-3" />
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

export default function TopDevelopers({ city: cityProp }: { city?: string }) {
  const scrollRef    = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const selectedCity = useAppSelector(s => s.ui.selectedCity);

  useEffect(() => { setMounted(true); }, []);

  const effectiveCity = cityProp ?? (mounted ? selectedCity : undefined);
  const allCities     = !effectiveCity;

  const { data: builders = [], isLoading } = useQuery<Builder[]>({
    queryKey: ['top-developers-v2', effectiveCity ?? '__all__'],
    queryFn: () =>
      buildersApi
        .getAll({ city: effectiveCity || undefined, limit: allCities ? 8 : 10 })
        .then(r => r.data as Builder[]),
    staleTime: 10 * 60 * 1000,
  });

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'right' ? 290 : -290, behavior: 'smooth' });
  };

  if (!isLoading && builders.length === 0) return null;

  const locationLabel = allCities ? 'Across India' : effectiveCity ? `in ${effectiveCity}` : '';
  const citySlug      = (effectiveCity ?? '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const viewAllHref   = allCities
    ? '/properties?category=builder_project&approvalStatus=approved'
    : `/new-projects-in-${citySlug}`;

  return (
    <section className="py-7 sm:py-12 lg:py-13 bg-gray-50 border-t border-gray-100">
      <div className="container-rv">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-end justify-between mb-5 sm:mb-7">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-[11px] font-bold px-3 py-1 rounded-full tracking-wide">
                <Award className="w-3 h-3" /> TOP DEVELOPERS
              </span>
              {allCities && (
                <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
                  <Building2 className="w-3 h-3" /> All India
                </span>
              )}
            </div>
            <h2 className="rv-h2 leading-tight">
              Top Builders &amp; Developers{' '}
              <span className="text-primary-600">{locationLabel}</span>
            </h2>
            <p className="text-gray-500 mt-0.5 text-sm">
              Explore new projects by India's most trusted developers — grouped by builder
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-1">
              <button onClick={() => scroll('left')} className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:border-primary-300 hover:bg-primary-50 transition-all shadow-sm">
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <button onClick={() => scroll('right')} className="w-8 h-8 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:border-primary-300 hover:bg-primary-50 transition-all shadow-sm">
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <Link href={viewAllHref} className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700 font-semibold text-sm">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ── Scroll row ─────────────────────────────────────────────── */}
        <div className="-mx-4 sm:mx-0">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto no-scrollbar px-4 sm:px-0 snap-x snap-mandatory pb-2"
          >
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex-shrink-0 w-[80vw] sm:w-[260px] snap-start">
                    <SkeletonCard />
                  </div>
                ))
              : builders.map((b, idx) => (
                  <div key={b.builderName} className="flex-shrink-0 w-[80vw] sm:w-[260px] snap-start">
                    <BuilderCard b={b} idx={idx} allCities={allCities} />
                  </div>
                ))
            }
          </div>
        </div>

        {/* ── Mobile view-all ────────────────────────────────────────── */}
        <div className="text-center mt-5 sm:hidden">
          <Link href={viewAllHref} className="inline-flex items-center gap-2 border border-primary-200 text-primary-700 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-primary-50 transition-colors">
            View All Developers <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
