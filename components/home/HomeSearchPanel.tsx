'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Loader2, ChevronDown, X, Users, Building2 } from 'lucide-react';
import { locationsApi, usersApi } from '@/lib/api';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_TABS = [
  { value: 'buy',        label: 'Buy' },
  { value: 'rent',       label: 'Rent' },
  { value: 'pg',         label: 'PG' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'agents',     label: 'Agents', icon: Users },
  { value: '',           label: 'New Projects', href: '/new-projects' },
];

const BHK_OPTIONS = [
  { value: '1', label: '1 BHK' }, { value: '2', label: '2 BHK' },
  { value: '3', label: '3 BHK' }, { value: '4', label: '4 BHK' },
  { value: '5', label: '5+ BHK' },
];

const BUDGET_OPTIONS_BUY = [
  { label: 'Under 25 Lac', min: 0, max: 2500000 },
  { label: '25 - 50 Lac', min: 2500000, max: 5000000 },
  { label: '50 Lac - 1 Cr', min: 5000000, max: 10000000 },
  { label: '1 - 2 Cr', min: 10000000, max: 20000000 },
  { label: '2 - 5 Cr', min: 20000000, max: 50000000 },
  { label: 'Above 5 Cr', min: 50000000, max: 0 },
];

const BUDGET_OPTIONS_RENT = [
  { label: 'Under ₹10K', min: 0, max: 10000 },
  { label: '₹10K - 20K', min: 10000, max: 20000 },
  { label: '₹20K - 40K', min: 20000, max: 40000 },
  { label: '₹40K - 75K', min: 40000, max: 75000 },
  { label: 'Above ₹75K', min: 75000, max: 0 },
];

const PROPERTY_TYPES_BUY = [
  { value: 'apartment', label: 'Apartment' }, { value: 'villa', label: 'Villa' },
  { value: 'plot', label: 'Plot' },           { value: 'house', label: 'House' },
  { value: 'penthouse', label: 'Penthouse' }, { value: 'studio', label: 'Studio' },
];

const PROPERTY_TYPES_COMMERCIAL = [
  { value: 'commercial_office', label: 'Office Space' },
  { value: 'commercial_shop', label: 'Shop' },
  { value: 'commercial_warehouse', label: 'Warehouse' },
];

// ─── Agent Search Panel ───────────────────────────────────────────────────────

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
      {/* Location Input */}
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
              <button
                key={i}
                className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-left transition-colors"
                onClick={() => {
                  const display = s.locality ? `${s.locality}, ${s.city}` : s.city;
                  setQuery(display);
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

      {/* Search Button */}
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

// ─── Property Search Panel ────────────────────────────────────────────────────

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

  // Reset filters when category changes
  useEffect(() => {
    setSelectedBHK([]);
    setSelectedBudget(null);
    setSelectedType('');
  }, [category]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (budgetRef.current && !budgetRef.current.contains(e.target as Node)) setShowBudgetDropdown(false);
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) setShowTypeDropdown(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
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
      {/* 1. Property Type */}
      <div ref={typeRef} className="relative">
        <button
          onClick={() => { setShowTypeDropdown(p => !p); setShowBudgetDropdown(false); }}
          className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm hover:border-primary-400 transition-colors min-w-[140px] bg-white"
        >
          <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className={selectedType ? 'text-primary-700 font-medium' : 'text-gray-500'}>
            {typeOptions.find(t => t.value === selectedType)?.label || 'Property Type'}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
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

      {/* 2. BHK */}
      {showBHK && (
        <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-3 py-2.5 bg-white">
          {BHK_OPTIONS.slice(0, 4).map((bhk) => (
            <button key={bhk.value}
              onClick={() => setSelectedBHK(prev => prev.includes(bhk.value) ? prev.filter(b => b !== bhk.value) : [...prev, bhk.value])}
              className={`text-xs px-2 py-1 rounded-lg font-medium transition-all ${
                selectedBHK.includes(bhk.value) ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}>{bhk.label}
            </button>
          ))}
        </div>
      )}

      {/* 3. Budget */}
      <div ref={budgetRef} className="relative">
        <button
          onClick={() => { setShowBudgetDropdown(p => !p); setShowTypeDropdown(false); }}
          className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm hover:border-primary-400 transition-colors min-w-[130px] bg-white"
        >
          <span className={selectedBudget ? 'text-primary-700 font-medium' : 'text-gray-500'}>
            {selectedBudget?.label || 'Budget'}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
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

      {/* 4. Location (last — user decides location after property criteria) */}
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

      {/* 5. Search Button */}
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

// ─── Mobile Search Drawer ─────────────────────────────────────────────────────

interface MobileSearchDrawerProps {
  category: string;
  setCategory: (c: string) => void;
  onClose: () => void;
}

function MobileSearchDrawer({ category, setCategory, onClose }: MobileSearchDrawerProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSug, setShowSug] = useState(false);
  const [selectedBHK, setSelectedBHK] = useState<string[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<{ min: number; max: number; label: string } | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const debounceRef = useRef<NodeJS.Timeout>();

  const isAgentMode = category === 'agents';
  const budgetOptions = category === 'rent' || category === 'pg' ? BUDGET_OPTIONS_RENT : BUDGET_OPTIONS_BUY;
  const typeOptions = category === 'commercial' ? PROPERTY_TYPES_COMMERCIAL : PROPERTY_TYPES_BUY;
  const showBHK = !isAgentMode && category !== 'commercial';

  const fetchSuggestions = async (val: string) => {
    if (!val.trim() || val.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    try {
      const { data } = await locationsApi.search(val);
      setSuggestions(data.slice(0, 6));
    } catch { setSuggestions([]); }
    finally { setLoading(false); }
  };

  const handleSearch = (city?: string, locality?: string, state?: string) => {
    if (isAgentMode) {
      const params = new URLSearchParams();
      if (city) params.set('city', city);
      if (state) params.set('state', state);
      router.push(`/agents?${params.toString()}`);
    } else {
      const params = new URLSearchParams();
      params.set('category', category);
      const c = city || query;
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

  return (
    <div className="fixed inset-0 bg-white z-[200] flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100 flex-shrink-0">
        <button onClick={onClose}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 flex-shrink-0">
          <X className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="font-bold text-gray-900 text-lg">
          {isAgentMode ? 'Find Agents' : 'Find Your Property'}
        </h2>
      </div>

      {/* Category pills */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-gray-100 flex-shrink-0" style={{ scrollbarWidth: 'none' }}>
        {CATEGORY_TABS.filter(t => !t.href).map((tab) => (
          <button key={tab.value}
            onClick={() => { setCategory(tab.value); setSelectedBHK([]); setSelectedBudget(null); setSelectedType(''); }}
            className={`flex-shrink-0 flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              category === tab.value ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Scrollable form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Property Type (if not agents) */}
        {!isAgentMode && (
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Property Type</label>
            <div className="flex gap-2 flex-wrap">
              {typeOptions.map((t) => (
                <button key={t.value}
                  onClick={() => setSelectedType(selectedType === t.value ? '' : t.value)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                    selectedType === t.value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600'
                  }`}>{t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* BHK */}
        {showBHK && (
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">BHK</label>
            <div className="flex gap-2 flex-wrap">
              {BHK_OPTIONS.map((bhk) => (
                <button key={bhk.value}
                  onClick={() => setSelectedBHK(prev => prev.includes(bhk.value) ? prev.filter(b => b !== bhk.value) : [...prev, bhk.value])}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                    selectedBHK.includes(bhk.value) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>{bhk.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Budget (if not agents) */}
        {!isAgentMode && (
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Budget</label>
            <div className="grid grid-cols-2 gap-2">
              {budgetOptions.map((b) => (
                <button key={b.label}
                  onClick={() => setSelectedBudget(selectedBudget?.label === b.label ? null : { ...b })}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium border-2 transition-all text-left ${
                    selectedBudget?.label === b.label ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-700'
                  }`}>{b.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Location (always last) */}
        <div>
          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
            {isAgentMode ? 'Location (City / State)' : 'Location'}
          </label>
          <div className="relative">
            <div className="flex items-center border-2 border-gray-200 rounded-2xl px-4 py-3 focus-within:border-primary-400">
              <MapPin className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
              <input type="text"
                placeholder={isAgentMode ? 'City or state name...' : 'City, locality, society...'}
                value={query} autoFocus
                onChange={(e) => {
                  setQuery(e.target.value); setShowSug(true);
                  clearTimeout(debounceRef.current);
                  debounceRef.current = setTimeout(() => fetchSuggestions(e.target.value), 300);
                }}
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
                      const display = s.locality ? `${s.locality}, ${s.city}` : s.city;
                      setQuery(display); setShowSug(false);
                      handleSearch(s.city, s.locality, s.state);
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
        </div>
      </div>

      {/* Bottom search button */}
      <div className="p-4 border-t border-gray-100 bg-white flex-shrink-0">
        <button
          onClick={() => handleSearch()}
          className="w-full py-4 bg-primary-600 text-white rounded-2xl font-bold text-base hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-primary-600/30"
        >
          {isAgentMode ? <Users className="w-5 h-5" /> : <Search className="w-5 h-5" />}
          {isAgentMode ? 'Find Agents' : 'Search Properties'}
        </button>
      </div>
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

  const CategoryPills = () => (
    <div className="flex gap-1">
      {CATEGORY_TABS.map((tab) => (
        <button
          key={tab.label}
          onClick={() => {
            if (tab.href) { router.push(tab.href); return; }
            setCategory(tab.value);
          }}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all ${
            category === tab.value && !tab.href
              ? 'bg-white text-primary-700 shadow-sm'
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* ── Mobile ──────────────────────────────────────── */}
      <div className="sm:hidden">
        {/* Category pills */}
        <div className="flex gap-1 overflow-x-auto pb-0" style={{ scrollbarWidth: 'none' }}>
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => {
                if (tab.href) { router.push(tab.href); return; }
                setCategory(tab.value);
              }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all ${
                category === tab.value && !tab.href
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {tab.icon && <tab.icon className="w-3.5 h-3.5" />}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-b-2xl rounded-tr-2xl shadow-2xl p-3">
          <button
            onClick={() => setShowMobileSearch(true)}
            className="w-full flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 text-left"
          >
            {isAgentMode
              ? <Users className="w-4 h-4 text-primary-500 flex-shrink-0" />
              : <Search className="w-4 h-4 text-primary-500 flex-shrink-0" />
            }
            <span className="text-gray-400 text-sm flex-1">
              {isAgentMode ? 'Search agents by city or state...' : 'Search city, locality, society...'}
            </span>
            <span className="text-xs text-primary-600 font-semibold bg-primary-50 px-2 py-1 rounded-lg flex-shrink-0">
              {isAgentMode ? 'Find' : 'Search'}
            </span>
          </button>
        </div>

        {showMobileSearch && (
          <MobileSearchDrawer
            category={category}
            setCategory={setCategory}
            onClose={() => setShowMobileSearch(false)}
          />
        )}
      </div>

      {/* ── Desktop ─────────────────────────────────────── */}
      <div className="hidden sm:block">
        <CategoryPills />
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
