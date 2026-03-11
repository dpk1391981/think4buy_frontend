'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SlidersHorizontal, Grid3X3, List, ChevronDown, X, MapPin, Home } from 'lucide-react';
import PropertyCard from '@/components/property/PropertyCard';
import FilterPanel from '@/components/search/FilterPanel';
import SearchBar from '@/components/search/SearchBar';
import { propertiesApi } from '@/lib/api';
import { Property, PaginatedProperties } from '@/types/property';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const SORT_OPTIONS = [
  { value: 'createdAt:DESC', label: 'Newest First' },
  { value: 'price:ASC', label: 'Price: Low to High' },
  { value: 'price:DESC', label: 'Price: High to Low' },
  { value: 'area:DESC', label: 'Area: Largest First' },
  { value: 'viewCount:DESC', label: 'Most Popular' },
];

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  buy:        { label: 'Properties for Sale', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: '🏠' },
  rent:       { label: 'Properties for Rent', color: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200',       icon: '🏢' },
  pg:         { label: 'PG / Co-Living',       color: 'text-purple-700',  bg: 'bg-purple-50 border-purple-200',   icon: '🛏️' },
  commercial: { label: 'Commercial Properties',color: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200',   icon: '🏬' },
};

interface Props {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function PropertyListingPage({ searchParams }: Props) {
  const urlSearchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<PaginatedProperties | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [sortValue, setSortValue] = useState('createdAt:DESC');

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      urlSearchParams.forEach((val, key) => { params[key] = val; });
      const [sortBy, sortOrder] = sortValue.split(':');
      params.sortBy = sortBy;
      params.sortOrder = sortOrder;
      const res = await propertiesApi.getAll(params);
      setData(res.data);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [urlSearchParams, sortValue]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const category = urlSearchParams.get('category') || '';
  const city = urlSearchParams.get('city') || '';
  const search = urlSearchParams.get('search') || '';
  const meta = CATEGORY_META[category];

  const heading = [
    meta?.label || 'All Properties',
    city && `in ${city}`,
    search && `"${search}"`,
  ].filter(Boolean).join(' ');

  // Active filter chips (excluding category/city/search/sort params)
  const FILTER_LABELS: Record<string, string> = {
    bedrooms: 'Bedrooms',
    minPrice: 'Min Price',
    maxPrice: 'Max Price',
    type: 'Type',
    furnishingStatus: 'Furnishing',
    possessionStatus: 'Possession',
    agentId: 'Agent',
  };
  const activeFilters = Array.from(urlSearchParams.entries()).filter(([k]) => Object.keys(FILTER_LABELS).includes(k));

  const removeFilter = (key: string) => {
    const params = new URLSearchParams(urlSearchParams.toString());
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

  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="animate-pulse">
        <div className="bg-gray-200 h-48" />
        <div className="p-4 space-y-3">
          <div className="bg-gray-200 h-5 w-1/3 rounded" />
          <div className="bg-gray-200 h-4 w-2/3 rounded" />
          <div className="bg-gray-200 h-3 w-1/2 rounded" />
          <div className="bg-gray-200 h-px w-full" />
          <div className="flex gap-3">
            <div className="bg-gray-200 h-3 w-16 rounded" />
            <div className="bg-gray-200 h-3 w-16 rounded" />
            <div className="bg-gray-200 h-3 w-20 rounded" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Sticky search bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-16 z-30">
        <div className="container-max py-3">
          <SearchBar size="sm" initialCity={city} initialSearch={search} className="max-w-xl" />
        </div>
      </div>

      {/* Category banner */}
      {meta && (
        <div className={cn('border-b', meta.bg)}>
          <div className="container-max py-3 flex items-center gap-2">
            <span className="text-lg">{meta.icon}</span>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/" className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />Home
              </Link>
              <span className="text-gray-300">/</span>
              {city ? (
                <>
                  <Link href={`/properties?category=${category}`} className={cn('hover:underline', meta.color)}>
                    {meta.label}
                  </Link>
                  <span className="text-gray-300">/</span>
                  <span className="text-gray-700 font-medium">{city}</span>
                </>
              ) : (
                <span className={cn('font-medium', meta.color)}>{meta.label}</span>
              )}
            </nav>
          </div>
        </div>
      )}

      <div className="container-max py-5">
        <div className="flex gap-6">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-36 self-start">
            <FilterPanel />
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header Row */}
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{heading}</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  {loading ? (
                    <span className="animate-pulse">Loading...</span>
                  ) : data ? (
                    <>{data.meta.total.toLocaleString('en-IN')} properties found</>
                  ) : null}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Mobile Filter Toggle */}
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="lg:hidden flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:border-primary-400 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {activeFilters.length > 0 && (
                    <span className="bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {activeFilters.length}
                    </span>
                  )}
                </button>

                {/* Sort */}
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

                {/* View Mode */}
                <div className="hidden sm:flex bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn('p-2 transition-colors', viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-50')}
                    aria-label="Grid view"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn('p-2 transition-colors', viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-50')}
                    aria-label="List view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filter Chips */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {activeFilters.map(([key, value]) => (
                  <span
                    key={key}
                    className="flex items-center gap-1.5 bg-primary-50 text-primary-700 border border-primary-200 text-xs font-medium px-3 py-1 rounded-full"
                  >
                    {FILTER_LABELS[key]}: {value}
                    <button onClick={() => removeFilter(key)} className="hover:text-primary-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
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

            {/* Properties */}
            {loading ? (
              <div className={cn('grid gap-4', viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1')}>
                {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
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
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:border-primary-400 transition-colors bg-white"
                    >
                      ← Previous
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
                              'w-10 h-10 rounded-xl text-sm font-medium transition-colors',
                              p === cur ? 'bg-primary-600 text-white shadow-sm' : 'bg-white border border-gray-200 hover:border-primary-400 text-gray-700',
                            )}
                          >{p}</button>
                        )
                      );
                    })()}
                    <button
                      onClick={() => handlePageChange(data.meta.page + 1)}
                      disabled={data.meta.page === data.meta.totalPages}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium disabled:opacity-40 hover:border-primary-400 transition-colors bg-white"
                    >
                      Next →
                    </button>
                  </div>
                )}

                <p className="text-center text-xs text-gray-400 mt-3">
                  Showing {(data.meta.page - 1) * data.meta.limit + 1}–{Math.min(data.meta.page * data.meta.limit, data.meta.total)} of {data.meta.total.toLocaleString('en-IN')} results
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
              <button onClick={() => setShowMobileFilters(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
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
