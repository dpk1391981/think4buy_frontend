'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, Grid3X3, List, ChevronDown, X, MapPin, Home, Map } from 'lucide-react';
import PropertyCard from '@/components/property/PropertyCard';
import FilterPanel from '@/components/search/FilterPanel';
import SearchBar from '@/components/search/SearchBar';
import { propertiesApi, propertyConfigApi, locationsApi } from '@/lib/api';
import { useAnalytics } from '@/hooks/useAnalytics';
import { Property, PaginatedProperties } from '@/types/property';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { PropertyGridSkeleton, InlineLoader } from '@/components/skeleton';

const MapPropertySearch = dynamic(
  () => import('@/components/search/MapPropertySearch'),
  { ssr: false, loading: () => <div className="w-full h-full bg-gray-100 rounded-xl animate-pulse" /> },
);

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'createdAt:DESC', label: 'Newest First' },
  { value: 'price:ASC', label: 'Price: Low to High' },
  { value: 'price:DESC', label: 'Price: High to Low' },
  { value: 'area:DESC', label: 'Area: Largest First' },
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

// Human-readable labels for active filter chips
const FILTER_LABELS: Record<string, string> = {
  bedrooms: 'Bedrooms',
  minPrice: 'Min Price',
  maxPrice: 'Max Price',
  minArea: 'Min Area',
  maxArea: 'Max Area',
  type: 'Type',
  furnishingStatus: 'Furnishing',
  possessionStatus: 'Possession',
  agentId: 'Agent',
  amenityIds: 'Amenities',
  listedBy: 'Posted By',
  builderName: 'Builder',
  isVerified: 'Verified',
  isNewProject: 'New Project',
  keyword: 'Search',
  search: 'Search',
  locality: 'Locality',
  pincode: 'Pincode',
};

// Prettier display values for chip labels
function formatFilterValue(key: string, value: string): string {
  if (key === 'furnishingStatus') {
    return { furnished: 'Furnished', semi_furnished: 'Semi-Furnished', unfurnished: 'Unfurnished' }[value] || value;
  }
  if (key === 'possessionStatus') {
    return { ready_to_move: 'Ready to Move', under_construction: 'Under Construction' }[value] || value;
  }
  if (key === 'listedBy') {
    return { owner: 'Owner', agent: 'Agent', builder: 'Builder' }[value] || value;
  }
  if (key === 'minPrice' || key === 'maxPrice') {
    const n = Number(value);
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(0)}L`;
    return `₹${(n / 1000).toFixed(0)}K`;
  }
  if (key === 'minArea' || key === 'maxArea') return `${value} sqft`;
  if (key === 'bedrooms') return `${value} BHK`;
  if (key === 'isVerified') return 'Verified';
  if (key === 'isNewProject') return 'New Project';
  if (key === 'amenityIds') return `${value.split(',').length} Amenities`;
  return value;
}

interface Props {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function PropertyListingPage({ searchParams: propSearchParams }: Props) {
  const urlSearchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<PaginatedProperties | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortValue, setSortValue] = useState('relevance');
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [seoContent, setSeoContent] = useState<{
    type: 'city' | 'state';
    name: string;
    h1: string | null;
    introContent: string | null;
    seoContent: string | null;
    faqs: { question: string; answer: string }[];
  } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Normalise propSearchParams: flatten string[] → string (first value), stable ref
  const propDefaults = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(propSearchParams || {}).map(([k, v]) => [
          k,
          Array.isArray(v) ? v[0] ?? '' : (v ?? ''),
        ]),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(propSearchParams)],
  );

  // Merge helper: URL params take precedence over page-level prop defaults
  const getMerged = (key: string): string =>
    urlSearchParams.get(key) ?? propDefaults[key] ?? '';

  useEffect(() => {
    propertyConfigApi.getCategories().then(({ data }) => {
      const map: Record<string, string> = {};
      for (const c of data) map[c.slug] = c.name;
      setCategoryNames(map);
    }).catch(() => {});
  }, []);

  // Fetch city/state SEO content whenever city or state params change
  const cityParam  = getMerged('city');
  const stateParam = getMerged('state');
  useEffect(() => {
    if (!cityParam && !stateParam) { setSeoContent(null); return; }
    locationsApi.getSeoContent({ city: cityParam || undefined, state: stateParam || undefined })
      .then(({ data }) => setSeoContent(data || null))
      .catch(() => setSeoContent(null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityParam, stateParam]);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      // Start with page-level defaults (e.g. city, category from SEO route)
      const params: Record<string, any> = { ...propDefaults };
      // URL params override defaults (user-applied filters)
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

  const category = getMerged('category');
  const isNewProject = (urlSearchParams.get('isNewProject') ?? propDefaults['isNewProject']) === 'true';
  const city = getMerged('city');
  const search = getMerged('search');
  const keyword = getMerged('keyword');

  const { trackSearch } = useAnalytics();
  useEffect(() => {
    const q = search || keyword;
    if (q || city || category) {
      trackSearch(q, {
        city:         city || undefined,
        state:        urlSearchParams.get('state') || undefined,
        propertyType: urlSearchParams.get('type')  || undefined,
        filters: {
          category,
          city,
          minPrice: urlSearchParams.get('minPrice') || undefined,
          maxPrice: urlSearchParams.get('maxPrice') || undefined,
          bedrooms: urlSearchParams.get('bedrooms') || undefined,
        },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlSearchParams.toString()]);
  const locality = getMerged('locality');

  const effectiveSlug = isNewProject ? 'new_projects' : category;
  const style = SLUG_STYLE[effectiveSlug] ?? DEFAULT_STYLE;
  const catLabel = isNewProject
    ? 'New Projects'
    : (categoryNames[category]
      ? `${categoryNames[category]} Properties`
      : (category ? `${category} Properties` : 'All Properties'));

  const headingParts = [catLabel];
  if (locality) headingParts.push(`in ${locality}`);
  else if (city) headingParts.push(`in ${city}`);
  if (keyword) headingParts.push(`"${keyword}"`);
  else if (search) headingParts.push(`"${search}"`);
  const heading = headingParts.join(' ');

  // Active filter chips
  const activeFilters = Array.from(urlSearchParams.entries()).filter(
    ([k]) => Object.keys(FILTER_LABELS).includes(k) && k !== 'category' && k !== 'city',
  );

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(urlSearchParams.toString());
    // For price range, remove both min and max together
    if (key === 'minPrice') params.delete('maxPrice');
    if (key === 'maxPrice') params.delete('minPrice');
    if (key === 'minArea') params.delete('maxArea');
    if (key === 'maxArea') params.delete('minArea');
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

  // Build searchParams object for map — merge prop defaults + URL params
  const mapSearchParams: Record<string, string> = { ...propDefaults };
  urlSearchParams.forEach((val, key) => { mapSearchParams[key] = val; });

  // Deduplicate filter chips (minPrice+maxPrice = one chip)
  const dedupedFilters: [string, string][] = [];
  const seen = new Set<string>();
  for (const [key, value] of activeFilters) {
    if (key === 'maxPrice' && seen.has('minPrice')) continue;
    if (key === 'maxArea' && seen.has('minArea')) continue;
    dedupedFilters.push([key, value]);
    seen.add(key);
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Sticky search bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-16 z-30">
        <div className="container-max py-3">
          <SearchBar
            size="sm"
            initialCity={city}
            initialSearch={search}
            initialKeyword={keyword}
            className="max-w-xl"
          />
        </div>
      </div>

      {/* Category banner */}
      {(category || isNewProject) && (
        <div className={cn('border-b', style.bg)}>
          <div className="container-max py-3 flex items-center gap-2">
            <span className="text-lg">{style.icon}</span>
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

      <div className="container-max py-3 sm:py-5">
        <div className={cn('flex gap-6', viewMode === 'map' ? 'h-[calc(100vh-200px)]' : '')}>
          {/* Desktop Filter Sidebar — hidden in map view */}
          {viewMode !== 'map' && (
            <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-36 self-start max-h-[calc(100vh-160px)] overflow-y-auto">
              <FilterPanel />
            </aside>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header Row */}
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {seoContent?.h1 || heading}
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {loading ? (
                    <InlineLoader className="text-gray-400" />
                  ) : data ? (
                    <>{data.meta.total.toLocaleString('en-IN')} properties found</>
                  ) : null}
                </p>
                {seoContent?.introContent && (
                  <p className="text-sm text-gray-600 mt-2 max-w-2xl leading-relaxed">
                    {seoContent.introContent}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white active:bg-gray-50 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {activeFilters.length > 0 && (
                    <span className="bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {activeFilters.length}
                    </span>
                  )}
                </button>

                {/* Sort — hidden in map mode */}
                {viewMode !== 'map' && (
                  <div className="relative">
                    <select
                      value={sortValue}
                      onChange={(e) => setSortValue(e.target.value)}
                      className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:border-primary-400 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-400"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                )}

                {/* View Mode Toggle */}
                <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn('p-2.5 transition-colors', viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-500 active:bg-gray-100')}
                    aria-label="Grid view"
                    title="Grid view"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn('p-2.5 transition-colors', viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-500 active:bg-gray-100')}
                    aria-label="List view"
                    title="List view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={cn('p-2.5 transition-colors', viewMode === 'map' ? 'bg-primary-600 text-white' : 'text-gray-500 active:bg-gray-100')}
                    aria-label="Map view"
                    title="Map view"
                  >
                    <Map className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filter Chips */}
            {dedupedFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {dedupedFilters.map(([key, value]) => {
                  const chipLabel = FILTER_LABELS[key] || key;
                  const chipValue = formatFilterValue(key, value);
                  return (
                    <button
                      key={key}
                      onClick={() => removeFilter(key)}
                      className="flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 text-xs font-medium px-3 py-2 rounded-full active:bg-primary-100 transition-colors"
                      aria-label={`Remove ${chipLabel} filter`}
                    >
                      {chipLabel}: {chipValue}
                      <X className="w-3.5 h-3.5 ml-0.5" />
                    </button>
                  );
                })}
                <button
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (category) params.set('category', category);
                    if (city) params.set('city', city);
                    router.push(`/properties?${params.toString()}`);
                  }}
                  className="text-xs text-gray-500 hover:text-red-600 underline px-1"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Map View */}
            {viewMode === 'map' ? (
              <div className="relative h-full min-h-[500px]">
                {/* Map filter sidebar */}
                <div className="absolute left-0 top-0 bottom-0 w-64 z-10 overflow-y-auto hidden lg:block">
                  <FilterPanel className="rounded-r-none border-r-0" />
                </div>
                <div className="lg:ml-64 h-full">
                  <MapPropertySearch
                    searchParams={mapSearchParams}
                    className="h-full min-h-[500px]"
                  />
                </div>
              </div>
            ) : loading ? (
              <PropertyGridSkeleton count={9} listView={viewMode === 'list'} />
            ) : data?.data.length ? (
              <>
                <div className={cn('grid gap-4', viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1')}>
                  {data.data.map((property: Property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      listView={viewMode === 'list'}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {data.meta.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
                    <button
                      onClick={() => handlePageChange(data.meta.page - 1)}
                      disabled={data.meta.page === 1}
                      className="px-4 h-11 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 active:bg-gray-50 transition-colors bg-white"
                    >
                      ← Prev
                    </button>
                    {(() => {
                      const total = data.meta.totalPages;
                      const cur = data.meta.page;
                      const pages: (number | '...')[] = [];
                      if (total <= 7) {
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
                          <span key={`e${i}`} className="px-2 text-gray-400">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => handlePageChange(p as number)}
                            className={cn(
                              'w-11 h-11 rounded-xl text-sm font-medium transition-colors',
                              p === cur
                                ? 'bg-primary-600 text-white shadow-sm'
                                : 'bg-white border border-gray-200 active:bg-gray-50 text-gray-700',
                            )}
                          >{p}</button>
                        ),
                      );
                    })()}
                    <button
                      onClick={() => handlePageChange(data.meta.page + 1)}
                      disabled={data.meta.page === data.meta.totalPages}
                      className="px-4 h-11 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 active:bg-gray-50 transition-colors bg-white"
                    >
                      Next →
                    </button>
                  </div>
                )}

                <p className="text-center text-xs text-gray-400 mt-3">
                  Showing {(data.meta.page - 1) * data.meta.limit + 1}–
                  {Math.min(data.meta.page * data.meta.limit, data.meta.total)} of{' '}
                  {data.meta.total.toLocaleString('en-IN')} results
                </p>
              </>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">No Properties Found</h3>
                <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                  We couldn't find properties matching your criteria. Try adjusting your filters or searching in a different area.
                </p>
                <button
                  onClick={() => {
                    const params = new URLSearchParams();
                    if (category) params.set('category', category);
                    router.push(`/properties?${params.toString()}`);
                  }}
                  className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-primary-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
            {/* City / State SEO Content Block */}
            {seoContent && (seoContent.seoContent || seoContent.faqs?.length > 0) && (
              <div className="mt-10 space-y-6">
                {seoContent.seoContent && (
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
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
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h2 className="text-base font-bold text-gray-900 mb-4">
                      Frequently Asked Questions
                    </h2>
                    <div className="space-y-2">
                      {seoContent.faqs.map((faq, i) => (
                        <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-sm font-medium text-gray-900">{faq.question}</span>
                            <ChevronDown
                              className={cn(
                                'w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200',
                                openFaq === i ? 'rotate-180' : '',
                              )}
                            />
                          </button>
                          {openFaq === i && (
                            <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50">
                              <div className="pt-3">{faq.answer}</div>
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

      {/* Mobile Filter Drawer */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[85vw] max-w-sm bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary-600" />
                <h2 className="font-bold text-gray-900">Filters</h2>
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
            <div className="border-t border-gray-100 p-4 bg-white">
              <button
                className="w-full bg-primary-600 text-white font-bold py-3 rounded-2xl hover:bg-primary-700 transition-colors"
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
