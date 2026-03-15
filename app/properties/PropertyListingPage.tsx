'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  SlidersHorizontal, Grid3X3, List, ChevronDown, X,
  MapPin, Home, Map, ChevronLeft, ChevronRight,
} from 'lucide-react';
import PropertyCard from '@/components/property/PropertyCard';
import SearchBar from '@/components/search/SearchBar';
import AgentsSection from '@/components/property/AgentsSection';
import { propertiesApi, propertyConfigApi, locationsApi } from '@/lib/api';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Property, PaginatedProperties } from '@/types/property';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PropertyGridSkeleton, InlineLoader } from '@/components/skeleton';

// ssr:false — FilterPanel uses useSearchParams + renders SVG icons that differ on server/client
const FilterPanel = dynamic(() => import('@/components/search/FilterPanel'), { ssr: false });

const MapPropertySearch = dynamic(
  () => import('@/components/search/MapPropertySearch'),
  { ssr: false },
);

const SORT_OPTIONS = [
  { value: 'relevance',      label: 'Relevance' },
  { value: 'createdAt:DESC', label: 'Newest First' },
  { value: 'price:ASC',      label: 'Price ↑' },
  { value: 'price:DESC',     label: 'Price ↓' },
  { value: 'area:DESC',      label: 'Area ↓' },
  { value: 'viewCount:DESC', label: 'Most Popular' },
];

const SLUG_STYLE: Record<string, { color: string; bg: string; icon: string }> = {
  buy:             { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: '🏠' },
  rent:            { color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',       icon: '🏢' },
  pg:              { color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200',   icon: '🛏️' },
  commercial:      { color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200',   icon: '🏬' },
  industrial:      { color: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200',     icon: '🏭' },
  builder_project: { color: 'text-cyan-700',    bg: 'bg-cyan-50 border-cyan-200',       icon: '🏗️' },
  investment:      { color: 'text-indigo-700',  bg: 'bg-indigo-50 border-indigo-200',   icon: '💰' },
  new_projects:    { color: 'text-teal-700',    bg: 'bg-teal-50 border-teal-200',       icon: '🏗️' },
};
const DEFAULT_STYLE = { color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200', icon: '🏠' };

const FILTER_LABELS: Record<string, string> = {
  bedrooms: 'Bedrooms', minPrice: 'Min Price', maxPrice: 'Max Price',
  minArea: 'Min Area', maxArea: 'Max Area', type: 'Type',
  furnishingStatus: 'Furnishing', possessionStatus: 'Possession',
  agentId: 'Agent', amenityIds: 'Amenities', listedBy: 'Posted By',
  builderName: 'Builder', isVerified: 'Verified', isNewProject: 'New Project',
  keyword: 'Search', search: 'Search', locality: 'Locality', pincode: 'Pincode',
};

function formatFilterValue(key: string, value: string): string {
  if (key === 'furnishingStatus')
    return { furnished: 'Furnished', semi_furnished: 'Semi', unfurnished: 'Unfurnished' }[value] || value;
  if (key === 'possessionStatus')
    return { ready_to_move: 'Ready', under_construction: 'U/C' }[value] || value;
  if (key === 'listedBy')
    return { owner: 'Owner', agent: 'Agent', builder: 'Builder' }[value] || value;
  if (key === 'minPrice' || key === 'maxPrice') {
    const n = Number(value);
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000)   return `₹${(n / 100000).toFixed(0)}L`;
    return `₹${(n / 1000).toFixed(0)}K`;
  }
  if (key === 'minArea' || key === 'maxArea') return `${value} sqft`;
  if (key === 'bedrooms')     return `${value} BHK`;
  if (key === 'isVerified')   return 'Verified';
  if (key === 'isNewProject') return 'New Project';
  if (key === 'amenityIds')   return `${value.split(',').length} Amenities`;
  return value;
}

interface Props {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function PropertyListingPage({ searchParams: propSearchParams }: Props) {
  const urlSearchParams = useSearchParams();
  const router = useRouter();

  const [data, setData]                   = useState<PaginatedProperties | null>(null);
  const [loading, setLoading]             = useState(true);
  const [viewMode, setViewMode]           = useState<'grid' | 'list' | 'map'>('list');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortValue, setSortValue]         = useState('relevance');
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [seoContent, setSeoContent]       = useState<{
    type: 'city' | 'state'; name: string;
    h1: string | null; introContent: string | null; seoContent: string | null;
    faqs: { question: string; answer: string }[];
  } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // ── stable propDefaults ─────────────────────────────────────────────────────
  const propDefaults = useMemo(
    () => Object.fromEntries(
      Object.entries(propSearchParams || {}).map(([k, v]) => [
        k, Array.isArray(v) ? v[0] ?? '' : (v ?? ''),
      ]),
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(propSearchParams)],
  );

  const getMerged = (key: string) => urlSearchParams.get(key) ?? propDefaults[key] ?? '';

  // ── Config / SEO fetches ────────────────────────────────────────────────────
  useEffect(() => {
    propertyConfigApi.getCategories().then(({ data }) => {
      const map: Record<string, string> = {};
      for (const c of data) map[c.slug] = c.name;
      setCategoryNames(map);
    }).catch(() => {});
  }, []);

  const cityParam  = getMerged('city');
  const stateParam = getMerged('state');
  useEffect(() => {
    if (!cityParam && !stateParam) { setSeoContent(null); return; }
    locationsApi.getSeoContent({ city: cityParam || undefined, state: stateParam || undefined })
      .then(({ data }) => setSeoContent(data || null))
      .catch(() => setSeoContent(null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityParam, stateParam]);

  // ── Fetch properties ────────────────────────────────────────────────────────
  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { ...propDefaults };
      urlSearchParams.forEach((val, key) => { params[key] = val; });
      if (sortValue === 'relevance') {
        params.sortBy = 'relevance';
      } else {
        const [sortBy, sortOrder] = sortValue.split(':');
        params.sortBy = sortBy;
        params.sortOrder = sortOrder;
      }
      const res = await propertiesApi.getAll(params);
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [urlSearchParams, sortValue, propDefaults]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const category     = getMerged('category');
  const isNewProject = (urlSearchParams.get('isNewProject') ?? propDefaults['isNewProject']) === 'true';
  const city         = getMerged('city');
  const search       = getMerged('search');
  const keyword      = getMerged('keyword');
  const locality     = getMerged('locality');

  const { trackSearch } = useAnalytics();
  useEffect(() => {
    const q = search || keyword;
    if (q || city || category) {
      trackSearch(q, {
        city: city || undefined, state: urlSearchParams.get('state') || undefined,
        propertyType: urlSearchParams.get('type') || undefined,
        filters: { category, city,
          minPrice: urlSearchParams.get('minPrice') || undefined,
          maxPrice: urlSearchParams.get('maxPrice') || undefined,
          bedrooms: urlSearchParams.get('bedrooms') || undefined },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearchParams.toString()]);

  const effectiveSlug = isNewProject ? 'new_projects' : category;
  const style = SLUG_STYLE[effectiveSlug] ?? DEFAULT_STYLE;
  const catLabel = isNewProject
    ? 'New Projects'
    : (categoryNames[category]
        ? `${categoryNames[category]} Properties`
        : category ? `${category} Properties` : 'All Properties');

  const headingParts = [catLabel];
  if (locality) headingParts.push(`in ${locality}`);
  else if (city) headingParts.push(`in ${city}`);
  if (keyword) headingParts.push(`"${keyword}"`);
  else if (search) headingParts.push(`"${search}"`);
  const heading = headingParts.join(' ');

  const activeFilters = Array.from(urlSearchParams.entries()).filter(
    ([k]) => Object.keys(FILTER_LABELS).includes(k) && k !== 'category' && k !== 'city',
  );

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(urlSearchParams.toString());
    if (key === 'minPrice') params.delete('maxPrice');
    if (key === 'maxPrice') params.delete('minPrice');
    if (key === 'minArea')  params.delete('maxArea');
    if (key === 'maxArea')  params.delete('minArea');
    params.delete(key);
    params.set('page', '1');
    router.push(`/properties?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(urlSearchParams.toString());
    params.set('page', String(page));
    router.push(`/properties?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const mapSearchParams: Record<string, string> = { ...propDefaults };
  urlSearchParams.forEach((val, key) => { mapSearchParams[key] = val; });

  // Dedupe price/area chips
  const dedupedFilters: [string, string][] = [];
  const seen = new Set<string>();
  for (const [key, value] of activeFilters) {
    if (key === 'maxPrice' && seen.has('minPrice')) continue;
    if (key === 'maxArea'  && seen.has('minArea'))  continue;
    dedupedFilters.push([key, value]);
    seen.add(key);
  }

  const isListView = viewMode === 'list';
  const totalStr   = loading ? '…' : (data?.meta.total.toLocaleString('en-IN') ?? '0');

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pt-16">

      {/* ═══════════════════════════════════════════════════════════════════════
          STICKY TOP BLOCK — search bar + mobile toolbar
          Both live in one sticky wrapper so they scroll together
      ═══════════════════════════════════════════════════════════════════════ */}
      <div className="sticky top-16 z-30 bg-white shadow-sm border-b border-gray-100">

        {/* Search bar ─────────────────────────────────────────────────────── */}
        <div className="container-max py-2 sm:py-3">
          <SearchBar
            size="sm"
            initialCity={city}
            initialSearch={search}
            initialKeyword={keyword}
            className="max-w-xl"
          />
        </div>

        {/* Mobile toolbar: Filter + Sort + Count  (hidden on lg+) ─────────── */}
        <div className="lg:hidden border-t border-gray-100">
          <div className="flex items-center gap-2 px-3 py-2">

            {/* Filter button */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors flex-shrink-0',
                activeFilters.length > 0
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-200 text-gray-700 bg-white',
              )}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {activeFilters.length > 0 && (
                <span className="bg-white text-primary-700 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center leading-none">
                  {activeFilters.length}
                </span>
              )}
            </button>

            {/* Sort */}
            <div className="relative flex-1">
              <select
                value={sortValue}
                onChange={e => setSortValue(e.target.value)}
                className="w-full appearance-none pl-2.5 pr-6 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Count */}
            <span className="text-xs text-gray-500 flex-shrink-0 font-medium tabular-nums">
              {totalStr}
            </span>
          </div>

          {/* Active filter chips — horizontal scroll */}
          {dedupedFilters.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 pb-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {dedupedFilters.map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => removeFilter(key)}
                  className="flex-shrink-0 flex items-center gap-1 bg-primary-50 text-primary-700 border border-primary-200 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                >
                  {FILTER_LABELS[key] || key}: {formatFilterValue(key, value)}
                  <X className="w-3 h-3" />
                </button>
              ))}
              <button
                onClick={() => {
                  const params = new URLSearchParams();
                  if (category) params.set('category', category);
                  if (city) params.set('city', city);
                  router.push(`/properties?${params.toString()}`);
                }}
                className="flex-shrink-0 text-[11px] text-red-500 font-semibold px-2 whitespace-nowrap"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>
      {/* ══ end sticky block ══════════════════════════════════════════════════ */}

      {/* Category breadcrumb — desktop only ────────────────────────────────── */}
      {(category || isNewProject) && (
        <div className={cn('hidden sm:block border-b', style.bg)}>
          <div className="container-max py-2.5 flex items-center gap-2">
            <span>{style.icon}</span>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/" className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />Home
              </Link>
              <span className="text-gray-300">/</span>
              {city ? (
                <>
                  <Link
                    href={isNewProject ? `/properties?isNewProject=true` : `/properties?category=${category}`}
                    className={cn('hover:underline', style.color)}
                  >
                    {catLabel}
                  </Link>
                  <span className="text-gray-300">/</span>
                  <span className="text-gray-700 font-medium">{city}</span>
                  {locality && (
                    <>
                      <span className="text-gray-300">/</span>
                      <span className="text-gray-700 font-medium">{locality}</span>
                    </>
                  )}
                </>
              ) : (
                <span className={cn('font-medium', style.color)}>{catLabel}</span>
              )}
            </nav>
          </div>
        </div>
      )}

      {/* ── Main layout ────────────────────────────────────────────────────── */}
      <div className={cn(viewMode === 'map' ? 'container-max py-5' : 'sm:container-max py-0 sm:py-5')}>
        <div className={cn('flex gap-0 lg:gap-6', viewMode === 'map' && 'h-[calc(100vh-200px)]')}>

          {/* Desktop sidebar ─────────────────────────────────────────────── */}
          {viewMode !== 'map' && (
            <div className="hidden lg:block w-[260px] flex-shrink-0 sticky top-[125px] self-start h-[calc(100vh-133px)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent pb-4">
              <FilterPanel />
            </div>
          )}

          {/* Main content ───────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 overflow-hidden">

            {/* Desktop header row (hidden on mobile) */}
            <div className="hidden sm:flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{seoContent?.h1 || heading}</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {loading
                    ? <InlineLoader className="text-gray-400" />
                    : data ? <>{data.meta.total.toLocaleString('en-IN')} properties found</> : null}
                </p>
                {seoContent?.introContent && (
                  <p className="text-sm text-gray-600 mt-2 max-w-2xl leading-relaxed">{seoContent.introContent}</p>
                )}
              </div>

              {/* Desktop controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {viewMode !== 'map' && (
                  <div className="relative">
                    <select
                      value={sortValue}
                      onChange={e => setSortValue(e.target.value)}
                      className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      {SORT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                )}
                <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {(['grid', 'list', 'map'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={cn('p-2.5 transition-colors', viewMode === mode ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-50')}
                      aria-label={`${mode} view`}
                    >
                      {mode === 'grid' && <Grid3X3 className="w-4 h-4" />}
                      {mode === 'list' && <List className="w-4 h-4" />}
                      {mode === 'map'  && <Map className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop filter chips */}
            {dedupedFilters.length > 0 && (
              <div className="hidden sm:flex flex-wrap gap-2 mb-4">
                {dedupedFilters.map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => removeFilter(key)}
                    className="flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-primary-100 transition-colors"
                  >
                    {FILTER_LABELS[key] || key}: {formatFilterValue(key, value)}
                    <X className="w-3.5 h-3.5" />
                  </button>
                ))}
                <button
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (category) params.set('category', category);
                    if (city) params.set('city', city);
                    router.push(`/properties?${params.toString()}`);
                  }}
                  className="text-xs text-gray-400 hover:text-red-600 underline px-1"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* ── Map view ─────────────────────────────────────────────── */}
            {viewMode === 'map' ? (
              <div className="relative h-full min-h-[500px]">
                <div className="absolute left-0 top-0 bottom-0 w-64 z-10 overflow-y-auto hidden lg:block">
                  <FilterPanel className="rounded-r-none border-r-0" />
                </div>
                <div className="lg:ml-64 h-full">
                  <MapPropertySearch searchParams={mapSearchParams} className="h-full min-h-[500px]" />
                </div>
              </div>

            ) : loading ? (
              /* ── Skeleton ───────────────────────────────────────────── */
              <div className={cn(isListView && 'sm:space-y-3')}>
                <PropertyGridSkeleton count={6} listView={isListView} />
              </div>

            ) : data?.data.length ? (
              <>
                {/* ── Property list ──────────────────────────────────── */}
                {isListView ? (
                  <div className="divide-y divide-gray-100 sm:divide-y-0 sm:space-y-3">
                    {data.data.map((property: Property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        listView
                        className="sm:rounded-xl rounded-none shadow-none sm:shadow-sm border-x-0 sm:border-x border-t-0 sm:border-t"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 px-4 sm:px-0">
                    {data.data.map((property: Property) => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </div>
                )}

                {/* ── Pagination ─────────────────────────────────────── */}
                {data.meta.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1.5 mt-6 mb-4 px-4 sm:px-0 flex-wrap">
                    <button
                      onClick={() => handlePageChange(data.meta.page - 1)}
                      disabled={data.meta.page === 1}
                      className="flex items-center gap-1 px-3 sm:px-4 h-9 sm:h-10 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 bg-white"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">Prev</span>
                    </button>

                    {(() => {
                      const total = data.meta.totalPages;
                      const cur   = data.meta.page;
                      const pages: (number | '...')[] = [];
                      if (total <= 5) {
                        for (let i = 1; i <= total; i++) pages.push(i);
                      } else {
                        pages.push(1);
                        if (cur > 3) pages.push('...');
                        for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
                        if (cur < total - 2) pages.push('...');
                        pages.push(total);
                      }
                      return pages.map((p, i) =>
                        p === '...' ? (
                          <span key={`e${i}`} className="px-1 text-gray-400 text-sm">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => handlePageChange(p as number)}
                            className={cn(
                              'w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-sm font-medium transition-colors',
                              p === cur
                                ? 'bg-primary-600 text-white shadow-sm'
                                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
                            )}
                          >{p}</button>
                        ),
                      );
                    })()}

                    <button
                      onClick={() => handlePageChange(data.meta.page + 1)}
                      disabled={data.meta.page === data.meta.totalPages}
                      className="flex items-center gap-1 px-3 sm:px-4 h-9 sm:h-10 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 bg-white"
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <p className="text-center text-xs text-gray-400 pb-6 sm:pb-2">
                  Showing {(data.meta.page - 1) * data.meta.limit + 1}–
                  {Math.min(data.meta.page * data.meta.limit, data.meta.total)} of{' '}
                  {data.meta.total.toLocaleString('en-IN')} results
                </p>
              </>

            ) : (
              /* ── Empty state ─────────────────────────────────────── */
              <div className="text-center py-16 mx-4 sm:mx-0 mt-4 bg-white rounded-2xl border border-gray-100">
                <div className="text-5xl mb-4">🏠</div>
                <h3 className="text-base font-bold text-gray-900 mb-2">No Properties Found</h3>
                <p className="text-gray-500 text-sm mb-5 max-w-xs mx-auto leading-relaxed">
                  Try adjusting your filters or searching in a different area.
                </p>
                <button
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (category) params.set('category', category);
                    router.push(`/properties?${params.toString()}`);
                  }}
                  className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium text-sm"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* ── Agents section (diamond + featured, deduped) ────────── */}
            {(locality || city || stateParam) && (
              <AgentsSection locality={locality} city={city} state={stateParam} />
            )}

            {/* ── SEO content block ──────────────────────────────────── */}
            {seoContent && (seoContent.seoContent || seoContent.faqs?.length > 0) && (
              <div className="mt-8 space-y-4 px-4 sm:px-0 pb-6">
                {seoContent.seoContent && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary-500" />
                      About Properties in {seoContent.name}
                    </h2>
                    <div
                      className="prose prose-sm max-w-none text-gray-600 leading-relaxed [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-gray-800 [&_h3]:text-sm [&_h3]:font-semibold [&_p]:mb-3 [&_ul]:pl-4 [&_ul]:list-disc [&_li]:mb-1"
                      dangerouslySetInnerHTML={{ __html: seoContent.seoContent }}
                    />
                  </div>
                )}
                {seoContent.faqs?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h2 className="text-base font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
                    <div className="space-y-2">
                      {seoContent.faqs.map((faq, i) => (
                        <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-sm font-medium text-gray-900">{faq.question}</span>
                            <ChevronDown className={cn('w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200', openFaq === i && 'rotate-180')} />
                          </button>
                          {openFaq === i && (
                            <div className="px-4 pb-4 pt-3 text-sm text-gray-600 leading-relaxed border-t border-gray-50">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── Mobile Filter Drawer ─────────────────────────────────────────── */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
            onClick={() => setShowMobileFilters(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary-600" />
                <span className="font-bold text-gray-900">Filters</span>
                {activeFilters.length > 0 && (
                  <span className="bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {activeFilters.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <FilterPanel className="m-4 border-0 shadow-none" />
            </div>
            <div className="border-t border-gray-100 p-4 bg-white flex-shrink-0">
              <button
                className="w-full bg-primary-600 text-white font-bold py-3.5 rounded-2xl text-sm"
                onClick={() => setShowMobileFilters(false)}
              >
                Show {data?.meta.total?.toLocaleString('en-IN') || ''} Properties
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
