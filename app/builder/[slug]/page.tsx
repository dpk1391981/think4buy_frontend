import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Building2, MapPin, CheckCircle2, HardHat,
  Sparkles, ArrowRight, Home, ChevronRight,
  BedDouble, Maximize2, Award, Shield, Globe,
  Star, Clock3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import OptimizedImage from '@/components/common/OptimizedImage';

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`
    : 'http://localhost:3001/api/v1';

// ─── Types ────────────────────────────────────────────────────────────────────

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
  type: string;
  bedrooms: number | null;
  area: number | null;
  areaUnit: string | null;
  coverImage: string | null;
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

interface BuilderDetailResponse {
  builder: Builder | null;
  projects: BuilderProject[];
  total: number;
}

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchBuilderDetail(
  slug: string,
  status?: string,
  page = 1,
): Promise<BuilderDetailResponse | null> {
  try {
    const params = new URLSearchParams({ page: String(page), limit: '12' });
    if (status) params.set('status', status);
    const res = await fetch(`${API_BASE}/builders/${slug}?${params}`, {
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: { slug: string } },
): Promise<Metadata> {
  const data = await fetchBuilderDetail(params.slug);
  const name = data?.builder?.builderName ?? params.slug;
  const city = data?.builder?.city;
  return {
    title: city ? `${name} Projects in ${city}` : `${name} — New Projects`,
    description: `Explore verified new projects by ${name}${city ? ` in ${city}` : ''}. Browse ready-to-move, under-construction and new-launch properties.`,
    alternates: { canonical: `/builder/${params.slug}` },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatArea(area: number | null, unit: string | null) {
  if (!area) return null;
  const u = unit || 'sqft';
  return `${area.toLocaleString('en-IN')} ${u}`;
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ p }: { p: BuilderProject }) {
  if (p.isNewProject)
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-600 text-white shadow-sm">
        <Sparkles className="w-2.5 h-2.5" /> New Launch
      </span>
    );
  if (p.possessionStatus === 'ready_to_move')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white shadow-sm">
        <CheckCircle2 className="w-2.5 h-2.5" /> Ready to Move
      </span>
    );
  if (p.possessionStatus === 'under_construction')
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-sm">
        <HardHat className="w-2.5 h-2.5" /> Under Construction
      </span>
    );
  return null;
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({ p, priority }: { p: BuilderProject; priority?: boolean }) {
  return (
    <Link
      href={`/properties/${p.slug}`}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col"
    >
      {/* ── Image ─────────────────────────────────────────────── */}
      <div className="relative h-48 bg-gray-100 overflow-hidden flex-shrink-0">
        <OptimizedImage
          src={p.coverImage}
          alt={p.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          priority={priority}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

        {/* Status badge — top left */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <StatusBadge p={p} />
        </div>

        {/* City — bottom left */}
        <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center gap-1 text-[11px] text-white/90 font-medium">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span>{[p.locality, p.city].filter(Boolean).join(', ')}</span>
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────── */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">

        {/* Title */}
        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 group-hover:text-primary-600 transition-colors leading-snug">
          {p.title}
        </h3>

        {/* Specs row */}
        {(p.bedrooms || p.area) && (
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {p.bedrooms && (
              <span className="flex items-center gap-1">
                <BedDouble className="w-3.5 h-3.5 text-gray-400" />
                {p.bedrooms} BHK
              </span>
            )}
            {p.area && (
              <span className="flex items-center gap-1">
                <Maximize2 className="w-3.5 h-3.5 text-gray-400" />
                {formatArea(p.area, p.areaUnit)}
              </span>
            )}
          </div>
        )}

        {/* Price + CTA */}
        <div className="mt-auto flex items-center justify-between pt-2 border-t border-gray-50">
          <span className="inline-flex items-center bg-emerald-600 text-white text-sm font-black px-2.5 py-1 rounded-lg shadow-sm">
            {formatPrice(p.price, p.priceUnit ?? undefined)}
          </span>
          <span className="text-xs text-primary-600 font-semibold flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
            View Details <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BuilderPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { status?: string; page?: string };
}) {
  const page   = parseInt(searchParams.page ?? '1', 10);
  const status = searchParams.status;
  const data   = await fetchBuilderDetail(params.slug, status, page);

  if (!data || !data.builder) return notFound();

  const { builder, projects, total } = data;
  const totalPages = Math.ceil(total / 12);
  const citySlug   = builder.city.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  const filterHref = (s?: string) => {
    const sp = new URLSearchParams();
    if (s) sp.set('status', s);
    return `/builder/${params.slug}?${sp.toString()}`;
  };

  // Initials for fallback avatar
  const initials = builder.builderName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="min-h-screen bg-gray-50 pt-14 md:pt-16">

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-900 via-primary-900 to-primary-800 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-10 w-72 h-72 bg-primary-600/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-20 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-white/50 text-xs mb-6 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
              <Home className="w-3 h-3" /> Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            {builder.city && (
              <>
                <Link href={`/new-projects-in-${citySlug}`} className="hover:text-white transition-colors">
                  New Projects in {builder.city}
                </Link>
                <ChevronRight className="w-3 h-3" />
              </>
            )}
            <span className="text-white/80">{builder.builderName}</span>
          </nav>

          <div className="flex items-center gap-5 sm:gap-6">

            {/* Logo / Avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/10 border-2 border-white/20 flex items-center justify-center flex-shrink-0 shadow-xl overflow-hidden">
              {builder.builderLogo ? (
                <OptimizedImage
                  src={builder.builderLogo}
                  alt={builder.builderName}
                  width={96}
                  height={96}
                  className="w-full h-full object-contain p-1.5"
                  blurDataURL={false}
                  priority
                />
              ) : (
                <span className="text-2xl font-black text-white drop-shadow">{initials}</span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <span className="inline-block text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-white/70 uppercase tracking-widest mb-2">
                Builder / Developer
              </span>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
                {builder.builderName}
              </h1>
              {builder.cities.length > 0 && (
                <p className="flex items-center gap-1 text-white/60 text-sm mt-1.5">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  {builder.cities.join(' · ')}
                </p>
              )}

              {/* Builder meta chips */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {builder.builderVerified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <Shield className="w-3 h-3" /> Verified
                  </span>
                )}
                {builder.builderReraNumber && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    <Award className="w-3 h-3" /> RERA Registered
                  </span>
                )}
                {builder.builderExperience && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/70 border border-white/20">
                    <Clock3 className="w-3 h-3" /> {builder.builderExperience}+ Years
                  </span>
                )}
                {builder.builderWebsite && (
                  <a
                    href={builder.builderWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/10 text-white/70 border border-white/20 hover:text-white hover:bg-white/20 transition-colors"
                  >
                    <Globe className="w-3 h-3" /> Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Projects',      val: builder.totalProjects,     color: 'text-white',        icon: Building2 },
              { label: 'Ready to Move',       val: builder.readyToMove,       color: 'text-emerald-300',  icon: CheckCircle2 },
              { label: 'Under Construction',  val: builder.underConstruction, color: 'text-amber-300',    icon: HardHat },
              { label: 'New Launch',          val: builder.newProjects,       color: 'text-violet-300',   icon: Star },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-3.5 border border-white/10 hover:bg-white/15 transition-colors">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={cn('w-4 h-4', s.color)} />
                    <p className={cn('text-2xl font-extrabold leading-none', s.color)}>{s.val}</p>
                  </div>
                  <p className="text-white/55 text-xs">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Filter bar ──────────────────────────────────────────────── */}
      <div className="sticky top-14 md:top-16 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { label: 'All Projects',       value: undefined,            count: builder.totalProjects,     icon: Building2 },
            { label: 'Ready to Move',      value: 'ready_to_move',      count: builder.readyToMove,       icon: CheckCircle2 },
            { label: 'Under Construction', value: 'under_construction', count: builder.underConstruction, icon: HardHat },
            { label: 'New Launch',         value: 'isNewProject',       count: builder.newProjects,       icon: Sparkles },
          ].map((f) => {
            const active = (status ?? undefined) === f.value;
            const Icon   = f.icon;
            if (f.count === 0 && f.value !== undefined) return null;
            return (
              <Link
                key={f.label}
                href={filterHref(f.value)}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-all flex-shrink-0',
                  active
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600',
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {f.label}
                <span className={cn('text-xs font-bold ml-0.5', active ? 'text-white/80' : 'text-gray-400')}>
                  ({f.count})
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Projects grid ────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Result count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-500">
            Showing{' '}
            <span className="font-bold text-gray-800">{projects.length}</span> of{' '}
            <span className="font-bold text-gray-800">{total}</span> projects
            {builder.city && (
              <> in <span className="text-primary-600 font-semibold">{builder.city}</span></>
            )}
          </p>
          {builder.builderReraNumber && (
            <span className="hidden sm:inline-flex items-center gap-1 text-xs text-blue-600 font-medium">
              <Shield className="w-3.5 h-3.5" /> RERA: {builder.builderReraNumber}
            </span>
          )}
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-24">
            <Building2 className="w-14 h-14 mx-auto mb-4 text-gray-200" />
            <p className="text-gray-500 font-medium text-lg">No projects found for this filter.</p>
            <p className="text-gray-400 text-sm mt-1">Try removing a filter to see more results.</p>
            <Link
              href={`/builder/${params.slug}`}
              className="inline-flex items-center gap-1.5 mt-5 text-primary-600 font-semibold text-sm hover:underline"
            >
              View all projects <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {projects.map((p, i) => (
              <ProjectCard key={p.id} p={p} priority={i < 4} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {page > 1 && (
              <Link
                href={`/builder/${params.slug}?${new URLSearchParams({ ...(status ? { status } : {}), page: String(page - 1) })}`}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-all"
              >
                ← Previous
              </Link>
            )}
            <span className="text-sm text-gray-500 font-medium px-3 py-2 bg-white rounded-xl border border-gray-100">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/builder/${params.slug}?${new URLSearchParams({ ...(status ? { status } : {}), page: String(page + 1) })}`}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-primary-300 hover:text-primary-600 transition-all"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
