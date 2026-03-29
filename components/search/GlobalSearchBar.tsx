'use client';

/**
 * GlobalSearchBar — Smart Intent-Driven Search (Hero Feature).
 *
 * Variants:
 *   hero    — shown inside homepage hero (transparent background strip)
 *   compact — slim trigger bar (sticky header / listing page / detail page)
 *
 * asSticky={true} — adds scroll-triggered fixed positioning (layout.tsx)
 *
 * Features:
 *  • Natural language parsing with instant intent-preview chips
 *  • Real-time suggestions (cities, localities, builders, projects)
 *  • Search history for logged-in users
 *  • Quick lifestyle tags (Near Metro, Parking, etc.)
 *  • "Did you mean?" city correction from backend
 *  • Trending searches + Popular cities fallback
 *  • Near-me geolocation
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search, MapPin, Loader2, X, Navigation, TrendingUp,
  Building2, Home, LocateFixed, ChevronRight, History, Sparkles,
  AlertCircle,
} from 'lucide-react';
import { locationsApi, propertiesApi, smartSearchApi, propertyConfigApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { getGeoCoords, reverseGeocode } from '@/lib/geolocation';
import { useAuth } from '@/contexts/AuthContext';
import { parseSearchHint, formatHintChips, QUICK_TAGS, SearchKeywordMapping } from '@/lib/searchParser';
import { useSearchState } from '@/contexts/SearchStateContext';
import { useCookieConsent } from '@/contexts/CookieConsentContext';

// ── Types ──────────────────────────────────────────────────────────────────────

type Variant = 'hero' | 'compact';

interface Suggestion {
  type: 'city' | 'locality' | 'builder' | 'project' | 'keyword';
  label: string;
  subLabel?: string;
  value: string;
  count?: number;
}

interface CategoryTab {
  value: string;
  label: string;
  gradient: string;
}

export interface GlobalSearchBarProps {
  variant?: Variant;
  /** When true: adds scroll-triggered fixed positioning (replaces HomeStickySearch) */
  asSticky?: boolean;
  initialCategory?: string;
  initialCity?: string;
  initialKeyword?: string;
  className?: string;
}

// ── Gradient palette cycling for dynamic categories ────────────────────────────

const GRADIENT_PALETTE = [
  'from-gray-500 to-gray-600',
  'from-blue-500 to-blue-600',
  'from-emerald-500 to-emerald-600',
  'from-purple-500 to-purple-600',
  'from-orange-500 to-orange-600',
  'from-cyan-500 to-cyan-600',
  'from-indigo-500 to-indigo-600',
  'from-amber-500 to-amber-600',
  'from-teal-500 to-teal-600',
  'from-pink-500 to-rose-600',
];

const SLUG_GRADIENT: Record<string, string> = {
  buy:             'from-blue-500 to-blue-600',
  rent:            'from-emerald-500 to-emerald-600',
  pg:              'from-purple-500 to-purple-600',
  commercial:      'from-orange-500 to-orange-600',
  industrial:      'from-amber-500 to-amber-600',
  builder_project: 'from-cyan-500 to-cyan-600',
  investment:      'from-indigo-500 to-indigo-600',
  new_projects:    'from-teal-500 to-teal-600',
};

const ALL_CATEGORY: CategoryTab = {
  value: '',
  label: 'All',
  gradient: 'from-gray-500 to-gray-600',
};

const CITY_GRADIENTS = [
  'from-blue-500 to-cyan-400', 'from-orange-500 to-red-400', 'from-green-500 to-teal-400',
  'from-purple-500 to-pink-400', 'from-yellow-500 to-orange-400', 'from-indigo-500 to-blue-400',
  'from-rose-500 to-pink-400', 'from-emerald-500 to-green-400',
];

// ── Small helpers ──────────────────────────────────────────────────────────────

function SuggIcon({ type }: { type: string }) {
  if (type === 'city')     return <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0" />;
  if (type === 'locality') return <MapPin className="w-4 h-4 text-blue-400 flex-shrink-0" />;
  if (type === 'builder')  return <Building2 className="w-4 h-4 text-orange-400 flex-shrink-0" />;
  if (type === 'project')  return <Home className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
  return <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />;
}

function TypeBadge({ type }: { type: string }) {
  const MAP: Record<string, [string, string]> = {
    city:     ['bg-primary-50 text-primary-600', 'City'],
    locality: ['bg-blue-50 text-blue-600', 'Locality'],
    builder:  ['bg-orange-50 text-orange-600', 'Builder'],
    project:  ['bg-emerald-50 text-emerald-600', 'Project'],
  };
  if (!MAP[type]) return null;
  const [cls, label] = MAP[type];
  return (
    <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0', cls)}>
      {label}
    </span>
  );
}

// ── Module-level keyword mapping cache (fetched once per page load) ───────────
let _kwMappingsCache: SearchKeywordMapping[] | null = null;
let _kwMappingsFetch: Promise<SearchKeywordMapping[]> | null = null;

function fetchKeywordMappings(): Promise<SearchKeywordMapping[]> {
  if (_kwMappingsCache) return Promise.resolve(_kwMappingsCache);
  if (_kwMappingsFetch) return _kwMappingsFetch;
  _kwMappingsFetch = propertyConfigApi.getSearchKeywordMappings()
    .then(({ data }) => { _kwMappingsCache = data; return data; })
    .catch(() => [] as SearchKeywordMapping[]);
  return _kwMappingsFetch;
}

function useKeywordMappings(): SearchKeywordMapping[] {
  const [mappings, setMappings] = useState<SearchKeywordMapping[]>(_kwMappingsCache ?? []);
  useEffect(() => { fetchKeywordMappings().then(setMappings).catch(() => {}); }, []);
  return mappings;
}

// ── useCategoryTabs — fetch categories from BE ────────────────────────────────

function useCategoryTabs() {
  const [tabs, setTabs] = useState<CategoryTab[]>([ALL_CATEGORY]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    propertyConfigApi.getCategories().then(({ data }) => {
      const dbTabs: CategoryTab[] = data.map((c: any, idx: number) => ({
        value: c.slug,
        label: c.name,
        gradient: SLUG_GRADIENT[c.slug] ?? GRADIENT_PALETTE[(idx + 1) % GRADIENT_PALETTE.length],
      }));
      setTabs([ALL_CATEGORY, ...dbTabs]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return { tabs, loading };
}

// ── Intent Preview Strip ───────────────────────────────────────────────────────
// Shows parsed understanding of the user's natural language query in real time.

function IntentPreview({ query }: { query: string }) {
  const kwMappings = useKeywordMappings();
  const chips = useMemo(() => {
    if (!query || query.length < 4) return [];
    return formatHintChips(parseSearchHint(query, { dynamicMappings: kwMappings }), kwMappings);
  }, [query, kwMappings]);

  if (chips.length === 0) return null;

  return (
    <div className="px-5 pt-1 pb-3 flex items-start gap-2">
      <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-primary-400" />
        <span className="text-[10px] font-bold text-primary-400 uppercase tracking-wide">Detected</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((chip, i) => (
          <span
            key={i}
            className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-50 border border-primary-100 text-primary-700 text-xs font-semibold"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Quick Tags Row ─────────────────────────────────────────────────────────────
// Lifestyle tags the user can tap to quickly append to their query.

function QuickTagsRow({
  query,
  onTagClick,
}: {
  query: string;
  onTagClick: (append: string) => void;
}) {
  // Filter out tags already present in the query
  const visibleTags = QUICK_TAGS.filter(t => !query.toLowerCase().includes(t.append));
  if (visibleTags.length === 0) return null;

  return (
    <div className="px-5 pb-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Filters</p>
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
        {visibleTags.map(tag => (
          <button
            key={tag.label}
            onClick={() => onTagClick(tag.append)}
            className="flex-shrink-0 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-semibold text-gray-600 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 transition-all"
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Suggestions list ───────────────────────────────────────────────────────────

function SuggestionsList({
  suggestions, popularCities, trendingSearches, recentSearches, query, loading,
  onSuggClick, onCityClick, onTrendingClick, onHistoryClick, onNearMe, geoLoading,
  didYouMean, onDidYouMeanClick,
}: {
  suggestions: Suggestion[];
  popularCities: any[];
  trendingSearches: any[];
  recentSearches: string[];
  query: string;
  loading: boolean;
  onSuggClick: (s: Suggestion) => void;
  onCityClick: (cityName: string) => void;
  onTrendingClick: (q: string) => void;
  onHistoryClick: (q: string) => void;
  onNearMe: () => void;
  geoLoading: boolean;
  didYouMean?: string;
  onDidYouMeanClick: (city: string) => void;
}) {
  if (suggestions.length > 0) {
    const groups = ['city', 'locality', 'project', 'builder'] as const;
    const GROUP_LABELS = { city: 'Cities', locality: 'Localities', project: 'Projects', builder: 'Builders' };
    return (
      <>
        {/* Did you mean */}
        {didYouMean && (
          <button
            onClick={() => onDidYouMeanClick(didYouMean)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 border-b border-amber-100 text-left hover:bg-amber-100 transition-colors"
          >
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="text-sm text-gray-700">
              Did you mean <span className="font-semibold text-primary-600">{didYouMean}</span>?
            </span>
          </button>
        )}
        {groups.map(gType => {
          const grp = suggestions.filter(s => s.type === gType);
          if (!grp.length) return null;
          return (
            <div key={gType}>
              <div className="px-4 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                {GROUP_LABELS[gType]}
              </div>
              {grp.map((item, i) => (
                <button
                  key={i}
                  onClick={() => onSuggClick(item)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary-50 active:bg-primary-100 transition-colors border-b border-gray-50"
                >
                  <SuggIcon type={item.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.label}</p>
                    {item.subLabel && <p className="text-xs text-gray-400 truncate">{item.subLabel}</p>}
                  </div>
                  <TypeBadge type={item.type} />
                  {item.count !== undefined && item.count > 0 && (
                    <span className="text-xs text-gray-400 flex-shrink-0">{item.count}+</span>
                  )}
                </button>
              ))}
            </div>
          );
        })}
      </>
    );
  }

  if (query.length >= 2 && !loading) {
    return (
      <div className="px-4 py-5 text-sm text-gray-500 text-center">
        No suggestions — press Search or Enter to search.
      </div>
    );
  }

  // Empty state
  return (
    <>
      {/* Near Me */}
      <button
        onClick={onNearMe}
        className="w-full flex items-center gap-4 px-5 py-3.5 border-b border-gray-100 hover:bg-primary-50 active:bg-primary-100 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0">
          {geoLoading
            ? <Loader2 className="w-4 h-4 text-primary-500 animate-spin" />
            : <LocateFixed className="w-4 h-4 text-primary-500" />
          }
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">Search Near Me</div>
          <div className="text-xs text-gray-400">Use your current location</div>
        </div>
      </button>

      {/* Recent searches (logged-in users) */}
      {recentSearches.length > 0 && (
        <>
          <div className="px-5 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Recent Searches</span>
          </div>
          {recentSearches.map((q, idx) => (
            <button
              key={idx}
              onClick={() => onHistoryClick(q)}
              className="w-full flex items-center gap-4 px-5 py-3 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100 text-left transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                <History className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <span className="text-sm text-gray-700 flex-1 truncate">{q}</span>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </>
      )}

      {/* Trending searches */}
      {trendingSearches.length > 0 && (
        <>
          <div className="px-5 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trending Searches</span>
          </div>
          {trendingSearches.map((t, idx) => (
            <button
              key={idx}
              onClick={() => onTrendingClick(t.query)}
              className="w-full flex items-center gap-4 px-5 py-3 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100 text-left transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <span className="text-sm text-gray-700 flex-1">{t.query}</span>
            </button>
          ))}
        </>
      )}

      {/* Popular cities */}
      {popularCities.length > 0 && (
        <>
          <div className="px-5 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-primary-400" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Popular Cities</span>
          </div>
          {popularCities.map((c: any, idx: number) => (
            <button
              key={c.id ?? idx}
              onClick={() => onCityClick(c.cityName)}
              className="w-full flex items-center gap-4 px-5 py-3.5 border-b border-gray-50 hover:bg-gray-50 active:bg-gray-100 text-left transition-colors"
            >
              <div className={cn('w-10 h-10 rounded-2xl bg-gradient-to-br flex items-center justify-center flex-shrink-0', CITY_GRADIENTS[idx % CITY_GRADIENTS.length])}>
                <MapPin className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900">{c.cityName}</div>
                {c.counts?.total > 0 && (
                  <div className="text-xs text-gray-400">{c.counts.total.toLocaleString('en-IN')} listings</div>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </>
      )}
    </>
  );
}

// ── Premium Search Modal ───────────────────────────────────────────────────────
// Desktop: floating centered card with backdrop blur
// Mobile:  slide-up bottom sheet

function SearchModal({
  initialCategory = '',
  initialKeyword = '',
  onClose,
}: {
  initialCategory?: string;
  initialKeyword?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { preferences } = useCookieConsent();
  const { trackCategorySelect, trackSearchPerform } = useSearchState();
  const inputRef = useRef<HTMLInputElement>(null);
  const debRef   = useRef<NodeJS.Timeout>();
  const [mounted, setMounted]     = useState(false);
  const [visible, setVisible]     = useState(false); // drives enter animation

  const { tabs: categoryTabs, loading: catsLoading } = useCategoryTabs();

  const [category, setCategory]           = useState(initialCategory);
  const [query, setQuery]                 = useState(initialKeyword);
  const [suggestions, setSuggestions]     = useState<Suggestion[]>([]);
  const [loadingSugg, setLoadingSugg]     = useState(false);
  const [searching, setSearching]         = useState(false);
  const [popularCities, setPopularCities] = useState<any[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<any[]>([]);
  const [recentSearches, setRecentSearches]     = useState<string[]>([]);
  const [geoLoading, setGeoLoading]       = useState(false);
  const [didYouMean, setDidYouMean]       = useState<string | undefined>();

  // Mount + animate in
  useEffect(() => {
    setMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 220);
  }, [onClose]);

  // Lock scroll + Escape + back gesture
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    setTimeout(() => inputRef.current?.focus(), 160);
    window.history.pushState({ gsModal: true }, '');
    const onPop = () => handleClose();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('keydown', onKey);
    };
  }, [handleClose]);

  // Fetch trending + history — re-run when category changes so results are relevant
  useEffect(() => {
    locationsApi.getTopCities().then(r => {
      const raw = r.data;
      setPopularCities((Array.isArray(raw) ? raw : raw?.cities ?? []).slice(0, 8));
    }).catch(() => {});

    // Pass active category so trending reflects what users search in this category
    smartSearchApi.getTrending(5, category || undefined).then(r => {
      if (Array.isArray(r?.data)) setTrendingSearches(r.data);
    }).catch(() => {});

    // Search history — only for logged-in users with personalization consent
    if (user && preferences.personalization) {
      smartSearchApi.getHistory(category || undefined).then(r => {
        const logs: any[] = Array.isArray(r?.data) ? r.data : [];
        const seen = new Set<string>();
        const queries = logs.map((l: any) => l.searchQuery as string).filter(q => q && !seen.has(q) && seen.add(q)).slice(0, 5);
        setRecentSearches(queries);
      }).catch(() => {});
    } else {
      setRecentSearches([]);
    }
  }, [user, category, preferences.personalization]); // re-fetch whenever any of these change

  const fetchSugg = useCallback(async (val: string) => {
    if (!val.trim() || val.length < 2) { setSuggestions([]); return; }
    setLoadingSugg(true);
    try {
      const [sRes, lRes] = await Promise.allSettled([
        propertiesApi.getSearchSuggestions(val, category || undefined),
        locationsApi.search(val),
      ]);
      const suggs: Suggestion[] = [];
      if (sRes.status === 'fulfilled') {
        for (const s of sRes.value.data)
          suggs.push({ type: s.type, label: s.label, subLabel: s.subLabel, value: s.value, count: s.count });
      }
      if (lRes.status === 'fulfilled' && suggs.length < 5) {
        for (const item of lRes.value.data.slice(0, 4)) {
          const dup = suggs.some(s => s.type === 'city' && s.label.toLowerCase() === item.city?.toLowerCase());
          if (!dup) suggs.push({
            type: item.locality ? 'locality' : 'city',
            label: item.locality ? `${item.locality}, ${item.city}` : item.city,
            subLabel: item.state,
            value: item.locality ? `${item.locality}|${item.city}` : item.city,
            count: item.propertyCount,
          });
        }
      }
      setSuggestions(suggs.slice(0, 8));
    } catch { setSuggestions([]); }
    finally { setLoadingSugg(false); }
  }, [category]);

  const handleChange = (val: string) => {
    setQuery(val);
    setDidYouMean(undefined);
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => fetchSugg(val), 260);
  };

  const buildAndGo = useCallback(async () => {
    setSearching(true);
    handleClose();
    try {
      const q = query.trim();
      if (!q) {
        router.push(category ? `/properties?category=${category}` : '/properties');
        return;
      }
      const res = await smartSearchApi.parse(q, category || undefined);
      // Surface "did you mean" (though modal is closing, it fires for analytics)
      if (res.data.didYouMean) setDidYouMean(res.data.didYouMean);
      const url = new URL(res.data.redirectUrl, 'http://x');
      // UI-selected category always wins unless smart search returned one
      if (category && !res.data.filters?.category) url.searchParams.set('category', category);

      // NLP detected "near me" intent — get real GPS coords
      if (res.data.nearbySearch) {
        try {
          const { lat, lng } = await getGeoCoords();
          url.searchParams.set('lat', String(lat));
          url.searchParams.set('lng', String(lng));
          url.searchParams.set('radius', '5');
          url.searchParams.delete('city');
          url.searchParams.delete('locality');
        } catch { /* geolocation denied — proceed without geo */ }
      }

      // Track the search
      trackSearchPerform(q, {
        category: url.searchParams.get('category') || category || undefined,
        city: url.searchParams.get('city') || undefined,
        propertyType: url.searchParams.get('type') || undefined,
      });
      router.push(`/properties?${url.searchParams.toString()}`);
    } catch {
      // BE unavailable — keyword fallback
      const p = new URLSearchParams();
      if (category) p.set('category', category);
      p.set('keyword', query.trim());
      trackSearchPerform(query.trim(), { category: category || undefined });
      router.push(`/properties?${p.toString()}`);
    } finally { setSearching(false); }
  }, [query, category, router, handleClose, trackSearchPerform]);

  const go = (url: string) => { handleClose(); router.push(url); };

  const handleSuggClick = (item: Suggestion) => {
    const p = new URLSearchParams();
    if (category) p.set('category', category);
    if (item.type === 'city') {
      p.set('city', item.value);
    } else if (item.type === 'locality') {
      const [locality, city] = item.value.split('|');
      p.set('city', city); p.set('locality', locality);
    } else if (item.type === 'builder') {
      p.set('builderName', item.value);
    } else {
      p.set('search', item.value);
    }
    go(`/properties?${p.toString()}`);
  };

  const handleNearMe = async () => {
    setGeoLoading(true);
    try {
      const { lat, lng } = await getGeoCoords();
      const p = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: '5' });
      if (category) p.set('category', category);
      // Fire reverse geocode in background to show label — navigation happens immediately
      reverseGeocode(lat, lng).then(geo => {
        const label = geo.locality && geo.city
          ? `${geo.locality}, ${geo.city}`
          : geo.city || geo.locality || 'Near Me';
        setQuery(label);
      }).catch(() => setQuery('Near Me'));
      go(`/properties?${p.toString()}`);
    } catch (e: any) {
      // Silently ignore — user denied or no GPS
    } finally { setGeoLoading(false); }
  };

  const handleTrending = async (tq: string) => {
    setQuery(tq);
    handleClose();
    try {
      const res = await smartSearchApi.parse(tq, category || undefined);
      const url = new URL(res.data.redirectUrl, 'http://x');
      if (category) url.searchParams.set('category', category);
      router.push(`/properties?${url.searchParams.toString()}`);
    } catch {
      const p = new URLSearchParams();
      if (category) p.set('category', category);
      p.set('keyword', tq);
      router.push(`/properties?${p.toString()}`);
    }
  };

  const handleQuickTag = (append: string) => {
    const newQuery = query.trim() ? `${query.trim()} ${append}` : append;
    setQuery(newQuery);
    inputRef.current?.focus();
    clearTimeout(debRef.current);
    debRef.current = setTimeout(() => fetchSugg(newQuery), 260);
  };

  const handleDidYouMean = (city: string) => {
    setDidYouMean(undefined);
    const p = new URLSearchParams();
    if (category) p.set('category', category);
    p.set('city', city);
    go(`/properties?${p.toString()}`);
  };

  if (!mounted) return null;

  return createPortal(
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={handleClose}
        className={cn(
          'fixed inset-0 z-[199] transition-all duration-250',
          visible ? 'bg-primary-950/60 backdrop-blur-md' : 'bg-transparent backdrop-blur-none',
        )}
        style={{ '--tw-bg-opacity': '1' } as React.CSSProperties}
      />

      {/* ── Modal card ─────────────────────────────────────────────────────── */}
      {/*   Desktop: centered, drops in from top-center                        */}
      {/*   Mobile:  bottom sheet slides up                                    */}
      <div
        className={cn(
          'fixed z-[200] left-0 right-0 mx-auto w-full',
          // Desktop sizing & position
          'sm:max-w-2xl sm:bottom-auto sm:top-[8vh]',
          // Mobile: bottom sheet
          'bottom-0',
          // Shape — top rounded on mobile, fully rounded on desktop
          'rounded-t-3xl sm:rounded-3xl overflow-hidden',
          // Animation
          'transition-all duration-[230ms] ease-out will-change-transform',
          visible
            ? 'translate-y-0 opacity-100 sm:scale-100'
            : 'translate-y-full opacity-0 sm:translate-y-[-16px] sm:scale-[0.97]',
        )}
        style={{ maxHeight: '90vh', boxShadow: '0 32px 80px -8px rgba(30,58,138,0.28), 0 0 0 1px rgba(37,99,235,0.08)' }}
      >

        {/* ══════════════════════════════════════════════════
            TOP — brand blue gradient header
            Holds: drag handle (mobile), label, category tabs
            ══════════════════════════════════════════════════ */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">

          {/* Subtle dot-grid texture overlay */}
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          {/* Glow orb */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

          {/* Mobile drag handle */}
          <div className="sm:hidden flex justify-center pt-3">
            <div className="w-10 h-1 rounded-full bg-white/30" />
          </div>

          {/* Title row */}
          <div className="flex items-start justify-between px-6 pt-5 pb-1 sm:pt-6">
            <div>
              <p className="text-primary-200 text-[10px] font-bold uppercase tracking-[0.18em] mb-1">
                Smart Search
              </p>
              <h2 className="text-white text-xl font-bold leading-snug">
                Where do you want<br className="hidden sm:block" /> to search?
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center flex-shrink-0 transition-colors mt-0.5"
              aria-label="Close"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>

          {/* Category tabs */}
          <div className="flex gap-2 px-6 pt-4 pb-5 overflow-x-auto no-scrollbar">
            {catsLoading
              ? [1,2,3,4].map(i => (
                  <div key={i} className="h-8 w-16 rounded-full bg-white/20 animate-pulse flex-shrink-0" />
                ))
              : categoryTabs.map(c => (
                  <button
                    key={c.value}
                    onClick={() => {
                      setCategory(c.value);
                      if (c.value) trackCategorySelect(c.value, c.label);
                    }}
                    className={cn(
                      'flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all duration-150 border',
                      category === c.value
                        ? 'bg-white text-primary-700 border-white shadow-lg shadow-primary-900/30'
                        : 'bg-white/10 text-white/90 border-white/20 hover:bg-white/20',
                    )}
                  >
                    {c.label}
                  </button>
                ))
            }
          </div>
        </div>

        {/* ══════════════════════════════════════════════════
            BOTTOM — white body: input, actions, suggestions
            ══════════════════════════════════════════════════ */}
        <div className="bg-white flex flex-col" style={{ maxHeight: 'calc(90vh - 160px)' }}>

          {/* Search input */}
          <div className="px-5 pt-5 pb-2">
            <div className={cn(
              'flex items-center gap-3 bg-gray-50 rounded-2xl border-2 transition-all duration-150 px-4',
              'focus-within:bg-white focus-within:border-primary-500 focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.10)]',
              query ? 'border-primary-300' : 'border-gray-200',
            )}>
              <MapPin className="w-4.5 h-4.5 text-primary-500 flex-shrink-0 w-[18px] h-[18px]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => handleChange(e.target.value)}
                onFocus={() => { if (query.length >= 2) fetchSugg(query); }}
                onKeyDown={e => { if (e.key === 'Enter') buildAndGo(); }}
                placeholder='Try "2BHK in Noida under 60L near metro"…'
                className="flex-1 py-4 text-[15px] text-gray-800 outline-none bg-transparent placeholder-gray-400 font-medium min-w-0"
                autoComplete="off"
              />
              {loadingSugg
                ? <Loader2 className="w-4 h-4 text-primary-400 animate-spin flex-shrink-0" />
                : query
                  ? <button
                      onClick={() => { setQuery(''); setSuggestions([]); setDidYouMean(undefined); inputRef.current?.focus(); }}
                      className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center flex-shrink-0 transition-colors"
                    ><X className="w-3.5 h-3.5 text-gray-500" /></button>
                  : null
              }
            </div>
          </div>

          {/* Intent preview — shows parsed chips when user types NL query */}
          <IntentPreview query={query} />

          {/* Action buttons */}
          <div className="flex gap-2.5 px-5 pb-3">
            <button
              onClick={handleNearMe}
              disabled={geoLoading}
              className="flex items-center gap-2 px-4 h-11 rounded-xl border-2 border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 active:scale-95 transition-all flex-shrink-0 disabled:opacity-50"
            >
              {geoLoading
                ? <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                : <Navigation className="w-4 h-4" />
              }
              Near Me
            </button>
            <button
              onClick={buildAndGo}
              disabled={searching}
              className="flex-1 h-11 rounded-xl font-bold text-[15px] text-white flex items-center justify-center gap-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 active:scale-[0.98] transition-all disabled:opacity-70 shadow-lg shadow-primary-600/30"
            >
              {searching
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching…</>
                : <><Search className="w-4 h-4" /> Search Properties</>
              }
            </button>
          </div>

          {/* Quick lifestyle tags */}
          {!query && (
            <QuickTagsRow query={query} onTagClick={handleQuickTag} />
          )}

          {/* Divider */}
          <div className="h-px bg-gray-100" />

          {/* Suggestions scroll */}
          <div className="overflow-y-auto overscroll-contain flex-1">
            <SuggestionsList
              suggestions={suggestions}
              popularCities={popularCities}
              trendingSearches={trendingSearches}
              recentSearches={recentSearches}
              query={query}
              loading={loadingSugg}
              onSuggClick={handleSuggClick}
              onCityClick={name => handleSuggClick({ type: 'city', label: name, value: name })}
              onTrendingClick={handleTrending}
              onHistoryClick={q => { setQuery(q); inputRef.current?.focus(); fetchSugg(q); }}
              onNearMe={handleNearMe}
              geoLoading={geoLoading}
              didYouMean={didYouMean}
              onDidYouMeanClick={handleDidYouMean}
            />
          </div>

          {/* Mobile safe-area spacer */}
          <div className="sm:hidden" style={{ height: 'env(safe-area-inset-bottom, 12px)' }} />
        </div>
      </div>
    </>,
    document.body,
  );
}

// ── Hidden path prefixes (GlobalSearchBar not shown on these routes) ──────────
const HIDDEN_PATH_PREFIXES = ['/admin', '/dashboard', '/buyer', '/owner', '/agent'];

// ── Main GlobalSearchBar export ───────────────────────────────────────────────

export default function GlobalSearchBar({
  variant = 'compact',
  asSticky = false,
  initialCategory = '',
  initialCity = '',
  initialKeyword = '',
  className,
}: GlobalSearchBarProps) {
  const pathname = usePathname();
  const [modalOpen, setModalOpen] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);

  const hidden = HIDDEN_PATH_PREFIXES.some(prefix => pathname?.startsWith(prefix));

  // Sticky scroll listener
  useEffect(() => {
    if (!asSticky) return;
    const onScroll = () => setStickyVisible(window.scrollY > 220);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [asSticky]);

  if (hidden) return null;

  const stickyClasses = asSticky
    ? cn(
        'fixed left-0 right-0 z-40 transition-all duration-200',
        'top-[56px] lg:top-[64px]',
        stickyVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none',
      )
    : '';

  const displayText = initialKeyword || initialCity || (initialCategory ? `${initialCategory.charAt(0).toUpperCase() + initialCategory.slice(1)} Properties` : '');

  return (
    <>
      {/* ── Trigger bar ─────────────────────────────────────────────────────── */}
      <div
        className={cn(
          stickyClasses,
          'bg-white border-b border-gray-100 shadow-sm',
          className,
        )}
      >
        <div className={cn(
          variant === 'hero' ? 'w-full px-0' : 'max-w-7xl mx-auto px-3 sm:px-4 lg:px-8',
          'py-2',
        )}>
          <button
            onClick={() => setModalOpen(true)}
            className={cn(
              'w-full flex items-center gap-3 bg-gray-50 border-2 border-gray-200 rounded-2xl',
              'hover:bg-white hover:border-primary-300 hover:shadow-md active:scale-[0.99]',
              'transition-all duration-150 text-left',
              variant === 'hero' ? 'h-14 md:h-[68px] px-5' : 'h-11 px-4',
              'max-w-3xl',
            )}
            aria-label="Open search"
          >
            <MapPin className={cn(
              'flex-shrink-0',
              variant === 'hero' ? 'w-5 h-5 text-primary-500' : 'w-4 h-4 text-primary-400',
            )} />
            <span className={cn(
              'flex-1 min-w-0 truncate font-medium',
              displayText ? 'text-gray-800' : 'text-gray-400',
              variant === 'hero' ? 'text-base md:text-lg' : 'text-sm',
            )}>
              {displayText || (variant === 'hero'
                ? 'Try "2BHK in Noida under 60L near metro"…'
                : 'Search city, locality, project...'
              )}
            </span>
            <div className={cn(
              'flex-shrink-0 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold',
              variant === 'hero' ? 'h-10 px-5 gap-2 text-base' : 'h-8 px-3 gap-1.5 text-sm',
            )}>
              <Search className={variant === 'hero' ? 'w-5 h-5' : 'w-4 h-4'} />
              <span className={variant === 'hero' ? 'hidden sm:inline' : 'hidden md:inline'}>
                Search
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ── Search Modal ─────────────────────────────────────────────────────── */}
      {modalOpen && (
        <SearchModal
          initialCategory={initialCategory}
          initialKeyword={initialKeyword || initialCity}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
