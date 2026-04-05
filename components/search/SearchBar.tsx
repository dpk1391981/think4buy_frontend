'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Building2, Home, Loader2, TrendingUp, Navigation, X } from 'lucide-react';
import { propertiesApi, locationsApi, smartSearchApi } from '@/lib/api';
import { getGeoCoords } from '@/lib/geolocation';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  initialCity?: string;
  initialSearch?: string;
  initialKeyword?: string;
  className?: string;
  size?: 'sm' | 'lg';
}

const CATEGORY_TABS = [
  { value: 'buy', label: 'Buy' },
  { value: 'rent', label: 'Rent' },
  { value: 'pg', label: 'PG' },
  { value: 'commercial', label: 'Commercial' },
];

interface Suggestion {
  type: 'city' | 'locality' | 'builder' | 'project' | 'keyword';
  label: string;
  subLabel?: string;
  value: string;
  extra?: string;
  count?: number;
}


function SuggestionIcon({ type }: { type: string }) {
  if (type === 'city') return <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />;
  if (type === 'locality') return <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />;
  if (type === 'builder') return <Building2 className="w-4 h-4 text-orange-400 flex-shrink-0" />;
  if (type === 'project') return <Home className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
  return <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />;
}

function SuggestionTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    city: 'bg-primary-50 text-primary-600',
    locality: 'bg-blue-50 text-blue-600',
    builder: 'bg-orange-50 text-orange-600',
    project: 'bg-emerald-50 text-emerald-600',
  };
  const labels: Record<string, string> = {
    city: 'City',
    locality: 'Locality',
    builder: 'Builder',
    project: 'Project',
  };
  if (!labels[type]) return null;
  return (
    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0', colors[type])}>
      {labels[type]}
    </span>
  );
}

interface FilterChip {
  key: string;
  label: string;
  value: string;
}

export default function SearchBar({
  initialCity = '',
  initialSearch = '',
  initialKeyword = '',
  className,
  size = 'lg',
}: SearchBarProps) {
  const router = useRouter();
  const navPush = (url: string) => {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('t4bs:navstart'));
    router.push(url);
  };
  const [category, setCategory] = useState(CATEGORY_TABS[0].value);
  const [query, setQuery] = useState(initialKeyword || initialCity || initialSearch);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [activeChips, setActiveChips] = useState<FilterChip[]>([]);
  const [popularCities, setPopularCities] = useState<{ id: string; cityName: string; counts: { total: number } }[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<{ query: string; count: number }[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Fetch top cities + trending searches once on mount
  useEffect(() => {
    locationsApi.getTopCities().then(r => {
      const raw = r.data;
      const arr: any[] = Array.isArray(raw) ? raw : raw?.cities ?? [];
      setPopularCities(arr.slice(0, 8));
    }).catch(() => {});

    smartSearchApi.getTrending(6).then(r => {
      if (Array.isArray(r?.data)) setTrendingSearches(r.data);
    }).catch(() => {});
  }, []);

  const fetchSuggestions = useCallback(async (val: string) => {
    if (!val.trim() || val.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      // Try smart suggestions from properties first
      const [sugRes, locRes] = await Promise.allSettled([
        propertiesApi.getSearchSuggestions(val),
        locationsApi.search(val),
      ]);

      const propSuggestions: Suggestion[] = [];
      if (sugRes.status === 'fulfilled') {
        for (const s of sugRes.value.data) {
          propSuggestions.push({
            type: s.type,
            label: s.label,
            subLabel: s.subLabel,
            value: s.value,
            extra: s.extra,
            count: s.count,
          });
        }
      }

      // Fill with location suggestions if not enough
      const locSuggestions: Suggestion[] = [];
      if (locRes.status === 'fulfilled' && propSuggestions.length < 5) {
        for (const item of locRes.value.data.slice(0, 4)) {
          const alreadyExists = propSuggestions.some(
            (s) => s.type === 'city' && s.label.toLowerCase() === item.city?.toLowerCase(),
          );
          if (!alreadyExists) {
            locSuggestions.push({
              type: item.locality ? 'locality' : 'city',
              label: item.locality ? `${item.locality}, ${item.city}` : item.city,
              subLabel: item.state,
              value: item.locality ? `${item.locality}|${item.city}` : item.city,
              count: item.propertyCount,
            });
          }
        }
      }

      setSuggestions([...propSuggestions, ...locSuggestions].slice(0, 10));
      setShowSuggestions(true);
      setActiveIndex(-1);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (val: string) => {
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 280);
  };

  const buildSearchUrl = (params: Record<string, string>) => {
    const urlParams = new URLSearchParams(params);
    if (category) urlParams.set('category', category);
    return `/properties?${urlParams.toString()}`;
  };

  /**
   * Main search handler — routes through centralized smart search API.
   * The backend parses the NLP query and returns structured filters + redirect URL.
   */
  const handleSearch = useCallback(async (overrideParams?: Record<string, string>) => {
    if (overrideParams) {
      navPush(buildSearchUrl(overrideParams));
      setShowSuggestions(false);
      return;
    }

    const q = query.trim();
    if (!q) {
      navPush(category ? `/properties?category=${category}` : '/properties');
      setShowSuggestions(false);
      return;
    }

    setSearching(true);
    setShowSuggestions(false);

    try {
      // Call centralized smart search API — parses NLP and returns structured filters
      const res = await smartSearchApi.parse(q, category || undefined);
      const { redirectUrl, chips, filters, nearbySearch } = res.data;

      setActiveChips(chips);

      const url = new URL(redirectUrl, 'http://x');
      if (category && !filters.category) url.searchParams.set('category', category);

      // If NLP detected "near me" intent, append real GPS coords
      if (nearbySearch) {
        try {
          const { lat, lng } = await getGeoCoords();
          url.searchParams.set('lat', String(lat));
          url.searchParams.set('lng', String(lng));
          url.searchParams.set('radius', '5');
          url.searchParams.delete('city');
          url.searchParams.delete('locality');
        } catch { /* geolocation denied — proceed without geo */ }
      }

      navPush(`/properties?${url.searchParams.toString()}`);
    } catch {
      // Fallback: simple city or keyword search
      navPush(buildSearchUrl(/\s/.test(q) ? { keyword: q } : { city: q }));
    } finally {
      setSearching(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category, router]);

  /** Geo "Near Me" search — requests browser location then searches by radius */
  const handleNearMe = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false);
        const { latitude, longitude } = pos.coords;
        setQuery('Near Me');
        smartSearchApi.logSearch({
          searchQuery: 'Near Me',
          latitude,
          longitude,
        });
        const params = new URLSearchParams({ lat: String(latitude), lng: String(longitude), radius: '5' });
        if (category) params.set('category', category);
        navPush(`/properties?${params.toString()}`);
        setShowSuggestions(false);
      },
      () => {
        setGeoLoading(false);
        alert('Could not detect your location. Please enable location access.');
      },
      { timeout: 8000 },
    );
  }, [category, router]);

  const handleSuggestionClick = (item: Suggestion) => {
    setShowSuggestions(false);
    if (item.type === 'city') {
      setQuery(item.label);
      navPush(buildSearchUrl({ city: item.value }));
    } else if (item.type === 'locality') {
      const [locality, city] = item.value.split('|');
      setQuery(`${locality}, ${city}`);
      navPush(buildSearchUrl({ city, locality }));
    } else if (item.type === 'builder') {
      setQuery(item.label);
      navPush(buildSearchUrl({ builderName: item.value }));
    } else if (item.type === 'project') {
      setQuery(item.label);
      navPush(buildSearchUrl({ search: item.value }));
    } else {
      setQuery(item.label);
      navPush(buildSearchUrl({ search: item.value }));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') handleSearch();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0) handleSuggestionClick(suggestions[activeIndex]);
      else handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn('w-full', className)}>
      {/* Active Filter Chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 bg-white/90 text-primary-700 text-xs font-semibold px-3 py-1 rounded-full border border-primary-200 shadow-sm"
            >
              {chip.label}
              <button
                onClick={() => setActiveChips((prev) => prev.filter((c) => c.key !== chip.key))}
                className="ml-1 hover:text-red-500 transition-colors"
                aria-label={`Remove ${chip.label} filter`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <button
            onClick={() => { setActiveChips([]); setQuery(''); }}
            className="text-xs text-white/70 hover:text-white underline"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Category Tabs */}
      {size === 'lg' && (
        <div className="flex gap-1 mb-3">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setCategory(tab.value)}
              className={cn(
                'px-4 py-2 rounded-t-lg font-semibold text-sm transition-all duration-200',
                category === tab.value
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'bg-white/20 text-white hover:bg-white/30',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div
        ref={containerRef}
        className={cn(
          'bg-white rounded-xl shadow-xl flex items-center overflow-visible relative',
          size === 'lg' ? 'h-14 md:h-16' : 'h-12',
        )}
      >
        <div className="relative flex-1">
          <div className="flex items-center px-4 h-full">
            <MapPin className="w-5 h-5 text-primary-400 flex-shrink-0 mr-2" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => {
                if (query.length >= 2) fetchSuggestions(query);
                else setShowSuggestions(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                size === 'lg'
                  ? 'Search city, locality, or try "2 BHK in Mumbai under 50L"'
                  : 'Search city, locality...'
              }
              className={cn(
                'flex-1 outline-none bg-transparent text-gray-800 placeholder-gray-400',
                size === 'lg' ? 'text-base' : 'text-sm',
              )}
              autoComplete="off"
            />
            {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin ml-2 flex-shrink-0" />}
            {query && !loading && (
              <button
                onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus(); }}
                className="w-5 h-5 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center ml-1 flex-shrink-0 transition-colors"
                aria-label="Clear search"
              >
                <span className="text-gray-500 text-xs leading-none">✕</span>
              </button>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 shadow-2xl rounded-xl mt-1 z-[100] overflow-hidden">
              {suggestions.length > 0 ? (
                <>
                  {/* Group suggestions by type */}
                  {['city', 'locality', 'project', 'builder'].map((type) => {
                    const group = suggestions.filter((s) => s.type === type);
                    if (!group.length) return null;
                    const groupLabels: Record<string, string> = {
                      city: 'Cities',
                      locality: 'Localities',
                      project: 'Projects',
                      builder: 'Builders',
                    };
                    return (
                      <div key={type}>
                        <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                          {groupLabels[type]}
                        </div>
                        {group.map((item, i) => {
                          const globalIdx = suggestions.indexOf(item);
                          return (
                            <button
                              key={`${type}-${i}`}
                              className={cn(
                                'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                                activeIndex === globalIdx ? 'bg-primary-50' : 'hover:bg-gray-50',
                              )}
                              onClick={() => handleSuggestionClick(item)}
                              onMouseEnter={() => setActiveIndex(globalIdx)}
                            >
                              <SuggestionIcon type={item.type} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{item.label}</p>
                                {item.subLabel && (
                                  <p className="text-xs text-gray-400 truncate">{item.subLabel}</p>
                                )}
                              </div>
                              {item.count !== undefined && item.count > 0 && (
                                <span className="text-xs text-gray-400 flex-shrink-0">
                                  {item.count}+ props
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              ) : query.length >= 2 && !loading ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center">
                  No suggestions. Press Enter to search.
                </div>
              ) : query.length < 2 && (popularCities.length > 0 || trendingSearches.length > 0) ? (
                <div className="py-2">
                  {/* Near Me shortcut */}
                  <button
                    onClick={() => { setShowSuggestions(false); handleNearMe(); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-primary-50 text-left transition-colors border-b border-gray-100"
                  >
                    <Navigation className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-primary-700 flex-1">Search Near Me</span>
                    <span className="text-[10px] text-primary-400">Use location</span>
                  </button>

                  {trendingSearches.length > 0 && (
                    <>
                      <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Trending Searches
                      </div>
                      {trendingSearches.map((t) => (
                        <button
                          key={t.query}
                          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left transition-colors"
                          onClick={async () => {
                            setQuery(t.query);
                            setShowSuggestions(false);
                            try {
                              const res = await smartSearchApi.parse(t.query, category || undefined);
                              setActiveChips(res.data.chips);
                              navPush(res.data.redirectUrl);
                            } catch {
                              navPush(buildSearchUrl({ keyword: t.query }));
                            }
                          }}
                        >
                          <TrendingUp className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 flex-1">{t.query}</span>
                        </button>
                      ))}
                    </>
                  )}

                  {popularCities.length > 0 && (
                    <>
                      <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Popular Cities
                      </div>
                      {popularCities.map((c) => (
                        <button
                          key={c.id}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
                          onClick={() => {
                            setQuery(c.cityName);
                            navPush(buildSearchUrl({ city: c.cityName }));
                            setShowSuggestions(false);
                          }}
                        >
                          <MapPin className="w-4 h-4 text-primary-400 flex-shrink-0" />
                          <span className="text-sm text-gray-700 flex-1">{c.cityName}</span>
                          {c.counts?.total > 0 && (
                            <span className="text-[10px] text-gray-400 flex-shrink-0">{c.counts.total} listings</span>
                          )}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Near Me button — only on large search bar */}
        {size === 'lg' && (
          <>
            <div className="h-8 w-px bg-gray-200 mx-1 flex-shrink-0" />
            <button
              onClick={handleNearMe}
              disabled={geoLoading}
              title="Search near your location"
              className="flex items-center gap-1.5 px-3 text-sm text-primary-600 hover:text-primary-800 font-medium transition-colors flex-shrink-0 disabled:opacity-60"
            >
              {geoLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
              <span className="hidden md:inline">Near Me</span>
            </button>
          </>
        )}

        <div className="h-8 w-px bg-gray-200 mx-1 flex-shrink-0" />

        <button
          onClick={() => handleSearch()}
          disabled={searching}
          className={cn(
            'bg-primary-600 hover:bg-primary-700 text-white font-semibold flex items-center gap-2 transition-colors flex-shrink-0 rounded-r-xl disabled:opacity-70',
            size === 'lg' ? 'px-6 md:px-8 h-full' : 'px-5 h-full',
          )}
          aria-label="Search properties"
        >
          {searching
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <Search className="w-5 h-5" />
          }
          <span className={cn(size === 'sm' ? 'hidden' : 'hidden sm:inline')}>
            {searching ? 'Searching...' : 'Search'}
          </span>
        </button>
      </div>
    </div>
  );
}
