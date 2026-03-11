'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, MapPin, Loader2, X, Users, Building2,
  ArrowLeft, ChevronRight, SlidersHorizontal,
} from 'lucide-react';
import { locationsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_TABS = [
  { value: 'buy',        label: 'Buy',         emoji: '🏠' },
  { value: 'rent',       label: 'Rent',        emoji: '🔑' },
  { value: 'pg',         label: 'PG',          emoji: '🛏️' },
  { value: 'commercial', label: 'Commercial',  emoji: '🏢' },
  { value: 'agents',     label: 'Agents',      emoji: '👤' },
];

const BHK_OPTIONS = [
  { value: '1', label: '1 BHK' }, { value: '2', label: '2 BHK' },
  { value: '3', label: '3 BHK' }, { value: '4', label: '4 BHK' },
  { value: '5', label: '5+ BHK' },
];

const BUDGET_OPTIONS_BUY = [
  { label: 'Under 25L',    min: 0,        max: 2500000  },
  { label: '25L – 50L',   min: 2500000,  max: 5000000  },
  { label: '50L – 1Cr',   min: 5000000,  max: 10000000 },
  { label: '1Cr – 2Cr',   min: 10000000, max: 20000000 },
  { label: '2Cr – 5Cr',   min: 20000000, max: 50000000 },
  { label: 'Above 5Cr',   min: 50000000, max: 0        },
];

const BUDGET_OPTIONS_RENT = [
  { label: 'Under ₹10K',  min: 0,     max: 10000 },
  { label: '₹10K – 20K', min: 10000, max: 20000  },
  { label: '₹20K – 40K', min: 20000, max: 40000  },
  { label: '₹40K – 75K', min: 40000, max: 75000  },
  { label: 'Above ₹75K', min: 75000, max: 0      },
];

const PROPERTY_TYPES_BUY = [
  { value: 'apartment', label: 'Apartment' }, { value: 'villa',     label: 'Villa'   },
  { value: 'plot',      label: 'Plot'      }, { value: 'house',     label: 'House'   },
  { value: 'penthouse', label: 'Penthouse' }, { value: 'studio',    label: 'Studio'  },
];

const PROPERTY_TYPES_COMMERCIAL = [
  { value: 'commercial_office',    label: 'Office Space' },
  { value: 'commercial_shop',      label: 'Shop'         },
  { value: 'commercial_warehouse', label: 'Warehouse'    },
];

const POPULAR_SEARCHES = [
  '2 BHK in Mumbai', 'Villa in Goa', 'Office Space Delhi',
  'PG in Bangalore', 'Plots in Hyderabad', 'Flat in Pune',
];

// ─── Mobile Full-Screen Search ────────────────────────────────────────────────

interface MobileFullSearchProps {
  initialCategory: string;
  onClose: () => void;
}

function MobileFullSearch({ initialCategory, onClose }: MobileFullSearchProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBHK, setSelectedBHK] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<{ min: number; max: number; label: string } | null>(null);
  const [selectedType, setSelectedType] = useState('');
  const [mounted, setMounted] = useState(false);

  const isAgentMode = category === 'agents';
  const budgetOptions = category === 'rent' || category === 'pg' ? BUDGET_OPTIONS_RENT : BUDGET_OPTIONS_BUY;
  const typeOptions = category === 'commercial' ? PROPERTY_TYPES_COMMERCIAL : PROPERTY_TYPES_BUY;
  const showBHK = !isAgentMode && category !== 'commercial';

  // Slide-up animation on mount
  useEffect(() => {
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    // Small delay to trigger CSS transition
    const t = setTimeout(() => setMounted(true), 10);
    // Focus input
    const f = setTimeout(() => inputRef.current?.focus(), 150);
    return () => {
      clearTimeout(t);
      clearTimeout(f);
      document.body.style.overflow = '';
    };
  }, []);

  // Hardware back button / swipe-back support
  useEffect(() => {
    const handlePop = () => onClose();
    window.history.pushState({ searchOverlay: true }, '');
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [onClose]);

  const fetchSuggestions = async (val: string) => {
    if (!val.trim() || val.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const { data } = await locationsApi.search(val);
      setSuggestions(data.slice(0, 7));
    } catch { setSuggestions([]); }
    finally { setLoading(false); }
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    setSelectedBHK([]);
    setSelectedBudget(null);
    setSelectedType('');
  };

  const handleClose = () => {
    // Pop the history state we pushed
    if (window.history.state?.searchOverlay) window.history.back();
    else onClose();
  };

  const handleSearch = (city?: string, locality?: string, state?: string) => {
    const c = city || query;
    if (isAgentMode) {
      const params = new URLSearchParams();
      if (c) params.set('city', c);
      if (state) params.set('state', state);
      router.push(`/agents?${params.toString()}`);
    } else {
      const params = new URLSearchParams();
      params.set('category', category);
      if (c) params.set('city', c);
      if (locality) params.set('locality', locality);
      if (selectedBHK.length > 0) params.set('bedrooms', selectedBHK.join(','));
      if (selectedBudget) {
        if (selectedBudget.min) params.set('minPrice', String(selectedBudget.min));
        if (selectedBudget.max) params.set('maxPrice', String(selectedBudget.max));
      }
      if (selectedType) params.set('type', selectedType);
      router.push(`/properties?${params.toString()}`);
    }
    onClose();
  };

  const activeFiltersCount = [
    selectedType,
    selectedBHK.length > 0,
    selectedBudget,
  ].filter(Boolean).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/40 z-[299] transition-opacity duration-300',
          mounted ? 'opacity-100' : 'opacity-0'
        )}
        onClick={handleClose}
      />

      {/* Full-screen panel — slides up */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-[300] bg-white flex flex-col transition-transform duration-300 ease-out',
          'rounded-t-3xl shadow-2xl',
          mounted ? 'translate-y-0' : 'translate-y-full'
        )}
        style={{ height: '92dvh', maxHeight: '92vh' }}
      >
        {/* ── Top bar (always visible, keyboard-safe) ── */}
        <div className="flex-shrink-0 px-4 pt-4 pb-3">
          {/* Drag handle */}
          <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

          {/* Header row */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 active:bg-gray-200 transition-colors"
              aria-label="Close"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>

            {/* Search input — always at top */}
            <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-400 transition-all">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                placeholder={isAgentMode ? 'City or state...' : 'City, locality, society...'}
                onChange={(e) => {
                  setQuery(e.target.value);
                  clearTimeout(debounceRef.current);
                  debounceRef.current = setTimeout(() => fetchSuggestions(e.target.value), 280);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 outline-none text-sm bg-transparent text-gray-900 placeholder-gray-400"
              />
              {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />}
              {query && !loading && (
                <button
                  onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus(); }}
                  className="flex-shrink-0"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Category chips */}
          <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar pb-1">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => handleCategoryChange(tab.value)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all active:scale-95',
                  category === tab.value
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/30'
                    : 'bg-gray-100 text-gray-600'
                )}
              >
                <span className="text-base leading-none">{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Location suggestions (when typing) */}
          {query && suggestions.length > 0 && (
            <div className="px-4 pb-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Suggestions</p>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 text-left transition-colors border-b border-gray-50 last:border-0"
                    onClick={() => {
                      const display = s.locality ? `${s.locality}, ${s.city}` : s.city;
                      setQuery(display);
                      setSuggestions([]);
                      handleSearch(s.city, s.locality, s.state);
                    }}
                  >
                    <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">{s.locality || s.city}</div>
                      {s.locality && <div className="text-xs text-gray-400">{s.city}, {s.state}</div>}
                      {!s.locality && s.state && <div className="text-xs text-gray-400">{s.state}</div>}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular searches (when input is empty) */}
          {!query && (
            <div className="px-4 pb-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Popular Searches</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((s) => (
                  <button
                    key={s}
                    onClick={() => { setQuery(s); handleSearch(s); }}
                    className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 active:bg-gray-200 text-gray-700 text-sm font-medium px-3 py-2 rounded-xl transition-colors"
                  >
                    <Search className="w-3 h-3 text-gray-400" />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Filters section */}
          {!isAgentMode && (
            <div className="px-4 pb-6 space-y-5">
              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-100" />
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <SlidersHorizontal className="w-3 h-3" />
                  Filters
                </div>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2.5">Property Type</label>
                <div className="flex flex-wrap gap-2">
                  {typeOptions.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setSelectedType(selectedType === t.value ? '' : t.value)}
                      className={cn(
                        'px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95',
                        selectedType === t.value
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-600 bg-white'
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* BHK */}
              {showBHK && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2.5">BHK</label>
                  <div className="flex gap-2 flex-wrap">
                    {BHK_OPTIONS.map((bhk) => (
                      <button
                        key={bhk.value}
                        onClick={() => setSelectedBHK(prev =>
                          prev.includes(bhk.value) ? prev.filter(b => b !== bhk.value) : [...prev, bhk.value]
                        )}
                        className={cn(
                          'px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95',
                          selectedBHK.includes(bhk.value)
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 text-gray-600 bg-white'
                        )}
                      >
                        {bhk.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Budget */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2.5">Budget</label>
                <div className="grid grid-cols-2 gap-2">
                  {budgetOptions.map((b) => (
                    <button
                      key={b.label}
                      onClick={() => setSelectedBudget(selectedBudget?.label === b.label ? null : { ...b })}
                      className={cn(
                        'px-3 py-3 rounded-xl text-sm font-semibold border-2 transition-all text-left active:scale-95',
                        selectedBudget?.label === b.label
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 text-gray-700 bg-white'
                      )}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Agent mode — extra padding at bottom */}
          {isAgentMode && <div className="h-6" />}
        </div>

        {/* ── Bottom search button (always visible) ── */}
        <div className="flex-shrink-0 px-4 pb-6 pt-3 bg-white border-t border-gray-100">
          {/* Active filter summary */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {selectedType && (
                <span className="flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {typeOptions.find(t => t.value === selectedType)?.label}
                  <button onClick={() => setSelectedType('')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedBHK.map(b => (
                <span key={b} className="flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {b} BHK
                  <button onClick={() => setSelectedBHK(p => p.filter(x => x !== b))}><X className="w-3 h-3" /></button>
                </span>
              ))}
              {selectedBudget && (
                <span className="flex items-center gap-1 bg-primary-50 text-primary-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                  {selectedBudget.label}
                  <button onClick={() => setSelectedBudget(null)}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}

          <button
            onClick={() => handleSearch()}
            className="w-full py-4 bg-primary-600 active:bg-primary-700 text-white rounded-2xl font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 shadow-lg shadow-primary-600/30"
          >
            {isAgentMode ? <Users className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            {isAgentMode
              ? (query ? `Find Agents in ${query}` : 'Find All Agents')
              : (query ? `Search in ${query}` : 'Search Properties')
            }
            {activeFiltersCount > 0 && (
              <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                +{activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Desktop: Agent Search Panel ─────────────────────────────────────────────

function AgentSearchPanel() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSug, setShowSug] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  const fetchSuggestions = async (val: string) => {
    if (!val.trim() || val.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const { data } = await locationsApi.search(val);
      setSuggestions(data.slice(0, 6));
    } catch { setSuggestions([]); }
    finally { setLoading(false); }
  };

  const handleSearch = (city?: string, state?: string) => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (state) params.set('state', state);
    router.push(`/agents?${params.toString()}`);
    setShowSug(false);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-[250px]">
        <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 bg-white">
          <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0 mr-2" />
          <input
            type="text"
            placeholder="Search by city, locality or state..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSug(true);
              clearTimeout(debounceRef.current);
              debounceRef.current = setTimeout(() => fetchSuggestions(e.target.value), 300);
            }}
            onFocus={() => setShowSug(true)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
            className="flex-1 outline-none text-sm bg-transparent"
          />
          {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
          {query && !loading && (
            <button onClick={() => { setQuery(''); setSuggestions([]); }}>
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
        {showSug && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            {suggestions.map((s, i) => (
              <button key={i}
                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
                onClick={() => {
                  setQuery(s.locality ? `${s.locality}, ${s.city}` : s.city);
                  handleSearch(s.city, s.state);
                }}
              >
                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium">{s.locality || s.city}</div>
                  {s.locality && <div className="text-xs text-gray-400">{s.city}, {s.state}</div>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={() => handleSearch(query)}
        className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-primary-600/30 flex-shrink-0"
      >
        <Users className="w-4 h-4" />
        Find Agents
      </button>
    </div>
  );
}

// ─── Desktop: Property Search Panel ──────────────────────────────────────────

interface PropertySearchPanelProps {
  category: string;
  onSearch: (city: string, locality?: string) => void;
}

function PropertySearchPanel({ category, onSearch }: PropertySearchPanelProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedBHK, setSelectedBHK] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<{ min: number; max: number; label: string } | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [showBudgetDropdown, setShowBudgetDropdown] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  const budgetRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedBHK([]); setSelectedBudget(null); setSelectedType('');
  }, [category]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (budgetRef.current && !budgetRef.current.contains(e.target as Node)) setShowBudgetDropdown(false);
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) setShowTypeDropdown(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const fetchSuggestions = async (val: string) => {
    if (!val.trim() || val.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const { data } = await locationsApi.search(val);
      setSuggestions(data.slice(0, 6));
    } catch { setSuggestions([]); }
    finally { setLoading(false); }
  };

  const buildAndSearch = useCallback((overrideCity?: string, overrideLocality?: string) => {
    onSearch(overrideCity || query, overrideLocality);
    setShowSuggestions(false);
  }, [query, onSearch]);

  const budgetOptions = category === 'rent' || category === 'pg' ? BUDGET_OPTIONS_RENT : BUDGET_OPTIONS_BUY;
  const typeOptions = category === 'commercial' ? PROPERTY_TYPES_COMMERCIAL : PROPERTY_TYPES_BUY;
  const showBHK = category !== 'commercial';

  return (
    <div className="flex flex-wrap gap-2">
      {/* Property Type */}
      <div ref={typeRef} className="relative">
        <button
          onClick={() => { setShowTypeDropdown(p => !p); setShowBudgetDropdown(false); }}
          className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm hover:border-primary-400 transition-colors min-w-[140px] bg-white"
        >
          <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className={selectedType ? 'text-primary-700 font-medium' : 'text-gray-500'}>
            {typeOptions.find(t => t.value === selectedType)?.label || 'Property Type'}
          </span>
          <X className={cn('w-3 h-3 text-gray-400 ml-auto transition-transform', showTypeDropdown ? 'rotate-0' : 'rotate-45')} />
        </button>
        {showTypeDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 min-w-[180px] overflow-hidden">
            <div className="p-1">
              <button onClick={() => { setSelectedType(''); setShowTypeDropdown(false); }}
                className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg">Any Type</button>
              {typeOptions.map((t) => (
                <button key={t.value} onClick={() => { setSelectedType(t.value); setShowTypeDropdown(false); }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${selectedType === t.value ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-gray-50'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BHK */}
      {showBHK && (
        <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-3 py-2.5 bg-white">
          {BHK_OPTIONS.slice(0, 4).map((bhk) => (
            <button key={bhk.value}
              onClick={() => setSelectedBHK(prev => prev.includes(bhk.value) ? prev.filter(b => b !== bhk.value) : [...prev, bhk.value])}
              className={`text-xs px-2 py-1 rounded-lg font-medium transition-all ${selectedBHK.includes(bhk.value) ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {bhk.label}
            </button>
          ))}
        </div>
      )}

      {/* Budget */}
      <div ref={budgetRef} className="relative">
        <button
          onClick={() => { setShowBudgetDropdown(p => !p); setShowTypeDropdown(false); }}
          className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm hover:border-primary-400 transition-colors min-w-[130px] bg-white"
        >
          <span className={selectedBudget ? 'text-primary-700 font-medium' : 'text-gray-500'}>
            {selectedBudget?.label || 'Budget'}
          </span>
          <X className={cn('w-3 h-3 text-gray-400 ml-auto', showBudgetDropdown ? 'rotate-0' : 'rotate-45')} />
        </button>
        {showBudgetDropdown && (
          <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 min-w-[200px] overflow-hidden">
            <div className="p-1">
              <button onClick={() => { setSelectedBudget(null); setShowBudgetDropdown(false); }}
                className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg">Any Budget</button>
              {budgetOptions.map((b) => (
                <button key={b.label} onClick={() => { setSelectedBudget(b); setShowBudgetDropdown(false); }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${selectedBudget?.label === b.label ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-gray-50'}`}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Location */}
      <div className="relative flex-1 min-w-[200px]">
        <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 bg-white">
          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mr-2" />
          <input ref={inputRef} type="text"
            placeholder="City, locality, society..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value); setShowSuggestions(true);
              clearTimeout(debounceRef.current);
              debounceRef.current = setTimeout(() => fetchSuggestions(e.target.value), 300);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => e.key === 'Enter' && buildAndSearch()}
            className="flex-1 outline-none text-sm bg-transparent"
          />
          {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
          {query && !loading && (
            <button onClick={() => { setQuery(''); setSuggestions([]); }}>
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            {suggestions.map((s, i) => (
              <button key={i} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
                onClick={() => {
                  const display = s.locality ? `${s.locality}, ${s.city}` : s.city;
                  setQuery(display); setShowSuggestions(false);
                  buildAndSearch(s.city, s.locality);
                }}>
                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium">{s.locality || s.city}</div>
                  {s.locality && <div className="text-xs text-gray-400">{s.city}, {s.state}</div>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search */}
      <button
        onClick={() => buildAndSearch()}
        className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-colors shadow-lg shadow-primary-600/30 flex-shrink-0"
      >
        <Search className="w-4 h-4" />
        Search
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function HomeSearchPanel() {
  const router = useRouter();
  const [category, setCategory] = useState('buy');
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const isAgentMode = category === 'agents';

  const handlePropertySearch = useCallback((city: string, locality?: string) => {
    const params = new URLSearchParams();
    params.set('category', category);
    if (city) params.set('city', city);
    if (locality) params.set('locality', locality);
    router.push(`/properties?${params.toString()}`);
  }, [category, router]);

  const activeCat = CATEGORY_TABS.find(t => t.value === category);

  return (
    <div className="w-full max-w-5xl mx-auto">

      {/* ── Mobile: single compact trigger ── */}
      <div className="sm:hidden">
        {/* One-tap search trigger */}
        <button
          onClick={() => setShowMobileSearch(true)}
          className="w-full flex items-center gap-3 bg-white rounded-2xl shadow-2xl shadow-black/20 px-4 py-4 text-left active:scale-[0.98] transition-transform"
        >
          {/* Search icon */}
          <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Search className="w-5 h-5 text-primary-600" />
          </div>

          {/* Placeholder text */}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-gray-800">
              {isAgentMode ? 'Find Agents' : 'Search Properties'}
            </div>
            <div className="text-xs text-gray-400 truncate">
              {isAgentMode ? 'City, locality or state...' : 'City, locality, society...'}
            </div>
          </div>

          {/* Active category chip */}
          <span className={cn(
            'flex-shrink-0 flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full',
            'bg-primary-600 text-white'
          )}>
            <span>{activeCat?.emoji}</span>
            {activeCat?.label}
          </span>
        </button>

        {/* Category quick-select row */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto no-scrollbar pb-1">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setCategory(tab.value)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95',
                category === tab.value
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'bg-white/20 text-white'
              )}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        {/* Full-screen search overlay */}
        {showMobileSearch && (
          <MobileFullSearch
            initialCategory={category}
            onClose={() => setShowMobileSearch(false)}
          />
        )}
      </div>

      {/* ── Desktop ── */}
      <div className="hidden sm:block">
        {/* Category tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {[...CATEGORY_TABS, { value: '', label: 'New Projects', emoji: '🏗️' }].map((tab) => (
            <button
              key={tab.label}
              onClick={() => {
                if (!tab.value) { router.push('/new-projects'); return; }
                setCategory(tab.value);
              }}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all',
                category === tab.value && tab.value
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'bg-white/20 text-white hover:bg-white/30'
              )}
            >
              {tab.emoji} {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-b-2xl rounded-tr-2xl shadow-2xl p-3">
          {isAgentMode ? (
            <AgentSearchPanel />
          ) : (
            <PropertySearchPanel category={category} onSearch={handlePropertySearch} />
          )}
        </div>
      </div>
    </div>
  );
}
