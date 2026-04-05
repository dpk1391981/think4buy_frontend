'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Award, ArrowRight, Globe2, MapPin,
  ChevronLeft, ChevronRight,
  CheckCircle2, HardHat, Sparkles, Building2,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAppSelector } from '@/lib/store';
import { buildersApi } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BuilderProject {
  id: string; title: string; slug: string;
  possessionStatus: string | null; isNewProject: boolean;
  price: number; priceUnit: string | null;
  locality: string; city: string; category: string;
}
interface Builder {
  builderName: string; builderSlug: string; city: string; cities: string[];
  totalProjects: number; readyToMove: number; underConstruction: number; newProjects: number;
  topProjects: BuilderProject[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GRADIENTS = [
  'from-blue-600 to-indigo-700', 'from-emerald-600 to-teal-700',
  'from-violet-600 to-purple-800', 'from-orange-500 to-rose-600',
  'from-rose-600 to-pink-700',   'from-teal-600 to-cyan-700',
  'from-indigo-600 to-blue-800', 'from-amber-500 to-orange-600',
];

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}

// ─── Project status label helpers ────────────────────────────────────────────

function getStatusLabel(p: BuilderProject): { label: string; cls: string; icon: React.ReactNode } {
  if (p.isNewProject)
    return {
      label: 'New Launch',
      cls:   'bg-violet-50 text-violet-700 border-violet-200',
      icon:  <Sparkles className="w-2.5 h-2.5" />,
    };
  if (p.possessionStatus === 'ready_to_move')
    return {
      label: 'Ready to Move',
      cls:   'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon:  <CheckCircle2 className="w-2.5 h-2.5" />,
    };
  if (p.possessionStatus === 'under_construction')
    return {
      label: 'Under Construction',
      cls:   'bg-amber-50 text-amber-700 border-amber-200',
      icon:  <HardHat className="w-2.5 h-2.5" />,
    };
  return { label: '', cls: '', icon: null };
}

// ─── Builder Card ─────────────────────────────────────────────────────────────

function BuilderCard({ b, idx, allCities }: { b: Builder; idx: number; allCities: boolean }) {
  const gradient = GRADIENTS[idx % GRADIENTS.length];
  const citySlug = (b.city ?? '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const baseFilter = allCities
    ? `/properties?builderName=${encodeURIComponent(b.builderName)}&category=builder_project`
    : `/new-projects-in-${citySlug}?builderName=${encodeURIComponent(b.builderName)}`;

  const cityDisplay = allCities
    ? b.cities.slice(0, 2).join(' · ') + (b.cities.length > 2 ? ` +${b.cities.length - 2}` : '')
    : b.city;

  // Show up to 3 top projects
  const projects = b.topProjects.slice(0, 3);

  return (
    <div className="group flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">

      {/* ── Gradient header ─────────────────────────────────────────────── */}
      <div className={`bg-gradient-to-br ${gradient} px-4 pt-4 pb-4 relative`}>
        {idx < 3 && (
          <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shadow">
            <span className="text-[9px] font-black text-yellow-900">#{idx + 1}</span>
          </div>
        )}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-xl bg-white/15 border-2 border-white/30 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-inner">
            <span className="text-base font-black text-white drop-shadow">{initials(b.builderName)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <span className="inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/20 text-white/90 uppercase tracking-widest mb-0.5">
              Builder
            </span>
            {/* Builder name — highlighted */}
            <h3 className="text-white font-extrabold text-sm leading-tight line-clamp-1 group-hover:text-yellow-300 transition-colors drop-shadow-sm">
              {b.builderName}
            </h3>
            <div className="mt-1 h-0.5 w-6 bg-white/40 rounded-full group-hover:w-12 group-hover:bg-yellow-400 transition-all duration-300" />
            {cityDisplay && (
              <p className="flex items-center gap-1 mt-1 text-white/60 text-[10px]">
                <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                <span className="truncate">{cityDisplay}</span>
              </p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {[
            { val: b.totalProjects,      label: 'Total',  color: 'text-white' },
            { val: b.readyToMove,        label: 'Ready',  color: 'text-emerald-300' },
            { val: b.underConstruction,  label: 'UC',     color: 'text-amber-300' },
          ].map(s => (
            <div key={s.label} className="bg-white/10 rounded-lg px-2 py-1.5 text-center">
              <p className={cn('text-sm font-extrabold leading-none', s.color)}>{s.val}</p>
              <p className="text-white/50 text-[9px] mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Project list ─────────────────────────────────────────────────── */}
      <div className="flex-1 px-1 pt-2 pb-1">
        {projects.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-3">No projects available</p>
        ) : (
          <ul className="space-y-0.5">
            {projects.map(p => {
              const { label, cls, icon } = getStatusLabel(p);
              return (
                <li key={p.id}>
                  <Link
                    href={`/properties/${p.slug}`}
                    className="flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors group/proj"
                  >
                    {/* Arrow indicator */}
                    <span className="text-gray-300 text-xs mt-0.5 flex-shrink-0 group-hover/proj:text-primary-400">›</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-gray-800 line-clamp-1 group-hover/proj:text-primary-600 transition-colors leading-snug">
                        {p.title}
                      </p>
                      {/* Status label on its own line */}
                      {label && (
                        <span className={cn(
                          'inline-flex items-center gap-1 mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded border',
                          cls,
                        )}>
                          {icon}{label}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-gray-600 flex-shrink-0 mt-0.5">
                      {formatPrice(p.price, p.priceUnit ?? undefined)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Status filter pills ──────────────────────────────────────────── */}
      <div className="px-3 pt-1 pb-2 flex flex-wrap gap-1 border-t border-gray-50">
        {b.readyToMove > 0 && (
          <Link href={`${baseFilter}&possessionStatus=ready_to_move`}
            className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all">
            <CheckCircle2 className="w-2.5 h-2.5" /> Ready ({b.readyToMove})
          </Link>
        )}
        {b.underConstruction > 0 && (
          <Link href={`${baseFilter}&possessionStatus=under_construction`}
            className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-500 hover:text-white transition-all">
            <HardHat className="w-2.5 h-2.5" /> UC ({b.underConstruction})
          </Link>
        )}
        {b.newProjects > 0 && (
          <Link href={`${baseFilter}&isNewProject=true`}
            className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-600 hover:text-white transition-all">
            <Sparkles className="w-2.5 h-2.5" /> New ({b.newProjects})
          </Link>
        )}
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <div className="px-3 pb-3">
        <Link href={`/builder/${b.builderSlug}`}
          className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-gray-50 group-hover:bg-primary-600 text-gray-600 group-hover:text-white text-xs font-bold rounded-xl transition-all duration-200 border border-gray-100 group-hover:border-primary-600">
          View All Projects <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function BuilderSkeleton() {
  return (
    <div className="flex-shrink-0 w-[260px] rounded-2xl border border-gray-100 bg-white overflow-hidden animate-pulse">
      <div className="h-36 bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-5/6" />
        <div className="flex gap-1 mt-2">
          <div className="h-5 bg-gray-100 rounded-full w-16" />
          <div className="h-5 bg-gray-100 rounded-full w-14" />
        </div>
        <div className="h-9 bg-gray-100 rounded-xl mt-2" />
      </div>
    </div>
  );
}

// ─── Scroll Row ───────────────────────────────────────────────────────────────

function ScrollRow({ children, loading }: { children: React.ReactNode; loading: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'l' | 'r') =>
    ref.current?.scrollBy({ left: dir === 'r' ? 300 : -300, behavior: 'smooth' });

  return (
    <div className="relative">
      <button onClick={() => scroll('l')}
        className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-gray-200 shadow items-center justify-center hover:border-primary-300 hover:bg-primary-50 transition-all">
        <ChevronLeft className="w-4 h-4 text-gray-500" />
      </button>
      <button onClick={() => scroll('r')}
        className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white border border-gray-200 shadow items-center justify-center hover:border-primary-300 hover:bg-primary-50 transition-all">
        <ChevronRight className="w-4 h-4 text-gray-500" />
      </button>
      <div ref={ref} className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-1 -mx-1 px-1">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[260px] snap-start"><BuilderSkeleton /></div>
            ))
          : children}
      </div>
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────

export default function NewProjectsDevelopersSection({ cityOverride }: { cityOverride?: string } = {}) {
  const [mounted, setMounted]     = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'city'>('all');
  const selectedCity = useAppSelector(s => s.ui.selectedCity);

  // cityOverride (city pages) always wins; otherwise use Redux
  const resolvedCity = cityOverride || selectedCity;

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (cityOverride || selectedCity) setActiveTab('city');
    else setActiveTab('all');
  }, [cityOverride, selectedCity]);

  const isCityPage    = !!cityOverride;
  const hasCity       = !!(isCityPage || (mounted && resolvedCity));
  const showCity      = activeTab === 'city' && hasCity;
  const effectiveCity = showCity ? (cityOverride || resolvedCity) : undefined;
  const citySlug      = (resolvedCity ?? '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const { data: builders = [], isLoading } = useQuery<Builder[]>({
    queryKey: ['top-builders-section', effectiveCity ?? '__all__'],
    queryFn: () =>
      buildersApi.getAll({ city: effectiveCity, limit: 8 })
        .then(r => (Array.isArray(r.data) ? r.data : []) as Builder[]),
    staleTime: 10 * 60 * 1000,
  });

  const locationLabel  = showCity ? `in ${resolvedCity}` : 'Across India';
  const viewAllHref    = showCity
    ? `/new-projects-in-${citySlug}`
    : '/properties?category=builder_project&approvalStatus=approved';

  if (!isLoading && builders.length === 0) return null;

  return (
    <section className="py-10 sm:py-16 bg-white border-t border-gray-100">
      <div className="container-max">

        {/* ── Section header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-[11px] font-bold px-3 py-1 rounded-full tracking-wide">
                <Award className="w-3 h-3" /> TOP BUILDERS
              </span>
              {!showCity && (
                <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
                  <Building2 className="w-3 h-3" /> All India
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
              Top Builders &amp; Developers{' '}
              <span className="text-primary-600">{locationLabel}</span>
            </h2>
            <p className="text-gray-500 mt-1 text-sm">
              Explore verified new projects by India&apos;s most trusted developers
            </p>
          </div>

          {/* ── Tab switcher ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 self-start sm:self-end flex-shrink-0">
            {!isCityPage && (
              <button
                onClick={() => setActiveTab('all')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
                  activeTab === 'all'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                )}
              >
                <Globe2 className="w-3.5 h-3.5" /> All India
              </button>
            )}
            {hasCity && (
              <button
                onClick={() => setActiveTab('city')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all',
                  activeTab === 'city'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700',
                )}
              >
                <MapPin className="w-3.5 h-3.5 text-primary-500" />
                {resolvedCity}
              </button>
            )}
          </div>
        </div>

        {/* ── Builder cards scroll row ──────────────────────────────────── */}
        <ScrollRow loading={isLoading}>
          {builders.map((b, idx) => (
            <div key={b.builderName} className="flex-shrink-0 w-[260px] snap-start">
              <BuilderCard b={b} idx={idx} allCities={!showCity} />
            </div>
          ))}
        </ScrollRow>

        {/* ── View all CTA ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-center mt-8">
          <Link href={viewAllHref}
            className="inline-flex items-center gap-2 border border-indigo-200 text-indigo-700 text-sm font-medium px-6 py-2.5 rounded-xl hover:bg-indigo-50 transition-colors">
            <Award className="w-4 h-4" /> View All Developers
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
}
