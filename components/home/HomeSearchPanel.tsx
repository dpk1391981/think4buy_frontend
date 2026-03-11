'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Search, MapPin, Loader2, X, Users, Building2,
  ArrowLeft, ChevronRight, SlidersHorizontal, TrendingUp,
} from 'lucide-react';
import { locationsApi, propertyConfigApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { TOP_CITIES } from '@/lib/utils';

// ─── Data ─────────────────────────────────────────────────────────────────────

// Color palette per slug (fallback for unknown slugs)
const SLUG_COLORS: Record<string, string> = {
  buy:             'from-blue-500 to-blue-600',
  rent:            'from-emerald-500 to-emerald-600',
  pg:              'from-purple-500 to-purple-600',
  commercial:      'from-orange-500 to-orange-600',
  industrial:      'from-amber-500 to-amber-600',
  builder_project: 'from-cyan-500 to-cyan-600',
  investment:      'from-indigo-500 to-indigo-600',
  new_projects:    'from-teal-500 to-teal-600',
  agents:          'from-pink-500 to-rose-600',
};
const DEFAULT_COLOR = 'from-gray-500 to-gray-600';

// Virtual tabs appended after DB categories
const VIRTUAL_TABS = [
  // { value: 'new_projects', label: 'New Projects', color: SLUG_COLORS.new_projects },
  { value: 'agents',       label: 'Agents',       color: SLUG_COLORS.agents },
];

interface CategoryTab { value: string; label: string; color: string; }
interface PropType     { name: string; slug: string; }

const BHK_OPTIONS = ['1 BHK', '2 BHK', '3 BHK', '4 BHK', '5+ BHK'];

const BUDGET_BUY = [
  { label: 'Under 25L',  min: 0,        max: 2500000  },
  { label: '25L–50L',    min: 2500000,  max: 5000000  },
  { label: '50L–1Cr',    min: 5000000,  max: 10000000 },
  { label: '1Cr–2Cr',    min: 10000000, max: 20000000 },
  { label: '2Cr–5Cr',    min: 20000000, max: 50000000 },
  { label: 'Above 5Cr',  min: 50000000, max: 0        },
];

const BUDGET_RENT = [
  { label: 'Under ₹10K', min: 0,     max: 10000 },
  { label: '₹10–20K',    min: 10000, max: 20000 },
  { label: '₹20–40K',    min: 20000, max: 40000 },
  { label: '₹40–75K',    min: 40000, max: 75000 },
  { label: 'Above ₹75K', min: 75000, max: 0     },
];

// ─── Shared hook: fetch categories + types ────────────────────────────────────

function useCategoryData(activeCat: string) {
  const [tabs, setTabs] = useState<CategoryTab[]>(VIRTUAL_TABS);
  const [types, setTypes] = useState<PropType[]>([]);
  const typeCache = useRef<Record<string, PropType[]>>({});

  // Load categories once
  useEffect(() => {
    propertyConfigApi.getCategories().then(({ data }) => {
      const dbTabs: CategoryTab[] = data.map((c: any) => ({
        value: c.slug,
        label: c.name,
        color: SLUG_COLORS[c.slug] ?? DEFAULT_COLOR,
      }));
      setTabs([...dbTabs, ...VIRTUAL_TABS]);
    }).catch(() => {});
  }, []);

  // Load types when active category changes
  useEffect(() => {
    const isVirtual = activeCat === 'agents' || activeCat === 'new_projects';
    if (isVirtual) { setTypes([]); return; }
    if (typeCache.current[activeCat]) { setTypes(typeCache.current[activeCat]); return; }
    propertyConfigApi.getTypesBySlug(activeCat).then(({ data }) => {
      const mapped: PropType[] = data.map((t: any) => ({ name: t.name, slug: t.slug }));
      typeCache.current[activeCat] = mapped;
      setTypes(mapped);
    }).catch(() => setTypes([]));
  }, [activeCat]);

  return { tabs, types };
}

// ─── Mobile Full-Screen Search ────────────────────────────────────────────────

function MobileSearch({
  initialCat, onClose, allTabs, allTypes,
}: {
  initialCat: string; onClose: () => void;
  allTabs: CategoryTab[]; allTypes: PropType[];
}) {
  const router   = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debRef   = useRef<NodeJS.Timeout>();

  const [cat, setCat]       = useState(initialCat);
  const [query, setQuery]   = useState('');
  const [suggs, setSuggs]   = useState<any[]>([]);
  const [busy, setBusy]     = useState(false);
  const [bhk, setBhk]       = useState<string[]>([]);
  const [budget, setBudget] = useState<(typeof BUDGET_BUY)[0] | null>(null);
  const [type, setType]     = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch types for the currently selected cat inside MobileSearch
  const [localTypes, setLocalTypes] = useState<PropType[]>(allTypes);
  const typeCache = useRef<Record<string, PropType[]>>({});
  useEffect(() => {
    const isVirtual = cat === 'agents' || cat === 'new_projects';
    if (isVirtual) { setLocalTypes([]); return; }
    if (typeCache.current[cat]) { setLocalTypes(typeCache.current[cat]); return; }
    propertyConfigApi.getTypesBySlug(cat).then(({ data }) => {
      const mapped: PropType[] = data.map((t: any) => ({ name: t.name, slug: t.slug }));
      typeCache.current[cat] = mapped;
      setLocalTypes(mapped);
    }).catch(() => setLocalTypes([]));
  }, [cat]);

  const isAgent      = cat === 'agents';
  const isNewProject = cat === 'new_projects';
  const budgets    = (cat === 'rent' || cat === 'pg') ? BUDGET_RENT : BUDGET_BUY;
  const types      = localTypes;
  const showBHK    = !isAgent && !isNewProject && cat !== 'commercial';
  const filterCount = [type, bhk.length > 0, budget].filter(Boolean).length;

  // Android hardware-back support — no body-overflow manipulation (breaks iOS)
  useEffect(() => {
    window.history.pushState({ msearch: true }, '');
    const pop = () => onClose();
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, [onClose]);

  const close = () => {
    if (window.history.state?.msearch) window.history.back();
    else onClose();
  };

  const fetchLocs = async (v: string) => {
    if (!v.trim() || v.length < 2) { setSuggs([]); return; }
    setBusy(true);
    try { const { data } = await locationsApi.search(v); setSuggs(data.slice(0, 8)); }
    catch { setSuggs([]); } finally { setBusy(false); }
  };

  const changeCat = (v: string) => {
    setCat(v); setBhk([]); setBudget(null); setType('');
  };

  const go = (city?: string, locality?: string, state?: string) => {
    const c = city || query.trim();
    if (isAgent) {
      const p = new URLSearchParams();
      if (c) p.set('city', c);
      if (state) p.set('state', state);
      router.push(`/agents?${p}`);
    } else if (isNewProject) {
      const p = new URLSearchParams({ isNewProject: 'true' });
      if (c)        p.set('city', c);
      if (locality) p.set('locality', locality);
      if (budget?.min) p.set('minPrice', String(budget.min));
      if (budget?.max) p.set('maxPrice', String(budget.max));
      if (type) p.set('type', type);
      router.push(`/properties?${p}`);
    } else {
      const p = new URLSearchParams({ category: cat });
      if (c)        p.set('city', c);
      if (locality) p.set('locality', locality);
      if (bhk.length) p.set('bedrooms', bhk.map(b => b[0]).join(','));
      if (budget?.min) p.set('minPrice', String(budget.min));
      if (budget?.max) p.set('maxPrice', String(budget.max));
      if (type) p.set('type', type);
      router.push(`/properties?${p}`);
    }
    onClose();
  };

  // Portal ensures the overlay renders at document.body level,
  // bypassing any parent stacking context (transforms, opacity, etc.)
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const panel = (
    <div
      className="fixed inset-0 bg-white flex flex-col"
      style={{ zIndex: 9999, height: '100dvh' }}
    >

      {/* ── TOP BAR — flex-shrink-0 ensures it's ALWAYS on screen ───────── */}
      <div className="flex-shrink-0 bg-white px-4 pt-5 pb-3 border-b border-gray-100">

        {/* Row: back arrow + search input */}
        <div className="flex items-center gap-3">

          {/* Back button */}
          <button
            onClick={close}
            className="w-11 h-11 rounded-2xl bg-gray-100 active:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors"
            aria-label="Close search"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          {/* Search input — white bg + border so it's always visible on any device */}
          <div className="flex-1 flex items-center gap-3 bg-white border-2 border-gray-200 rounded-2xl px-4"
            style={{ height: 52 }}>
            {busy
              ? <Loader2 className="w-5 h-5 text-gray-400 animate-spin flex-shrink-0" />
              : <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            }
            <input
              ref={inputRef}
              autoFocus
              type="text"
              inputMode="search"
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck={false}
              value={query}
              placeholder={isAgent ? 'City or state...' : isNewProject ? 'Search city or locality...' : 'City, locality, project...'}
              onChange={e => {
                setQuery(e.target.value);
                clearTimeout(debRef.current);
                debRef.current = setTimeout(() => fetchLocs(e.target.value), 250);
              }}
              onKeyDown={e => e.key === 'Enter' && go()}
              /* text-base = 16px — CRITICAL: iOS auto-zooms any input < 16px */
              className="flex-1 text-base text-gray-900 outline-none placeholder-gray-400"
              style={{ background: 'transparent', border: 'none', WebkitAppearance: 'none' }}
            />
            {query && (
              <button
                onClick={() => { setQuery(''); setSuggs([]); inputRef.current?.focus(); }}
                className="w-7 h-7 rounded-full bg-gray-200 active:bg-gray-300 flex items-center justify-center flex-shrink-0 transition-colors"
                aria-label="Clear"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            )}
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
          {allTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => changeCat(tab.value)}
              className={cn(
                'flex-shrink-0 h-9 px-4 rounded-full text-sm font-bold transition-all active:scale-95',
                cat === tab.value
                  ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                  : 'bg-gray-100 text-gray-500',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SCROLLABLE BODY — min-h-0 prevents Safari flexbox overflow bug ── */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ minHeight: 0 }}>

          {/* ── STATE A: Suggestions while typing ── */}
          {query.length >= 2 && (
            <div>
              {suggs.length > 0 ? (
                <>
                  <SectionHeader icon={<MapPin className="w-3.5 h-3.5" />} label="Locations" />
                  {suggs.map((s, i) => (
                    <LocationRow
                      key={i}
                      primary={s.locality || s.city}
                      secondary={s.locality ? `${s.city}, ${s.state}` : s.state}
                      onTap={() => go(s.city, s.locality, s.state)}
                    />
                  ))}
                </>
              ) : !busy && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <MapPin className="w-10 h-10 mb-3 text-gray-200" />
                  <p className="text-sm font-medium">No locations found</p>
                  <p className="text-xs mt-1">Try a city or area name</p>
                </div>
              )}
            </div>
          )}

          {/* ── STATE B: Default — popular cities + filters ── */}
          {query.length < 2 && (
            <>
              {/* Popular cities */}
              <SectionHeader icon={<TrendingUp className="w-3.5 h-3.5" />} label="Popular Cities" />
              {TOP_CITIES.map(city => (
                <LocationRow
                  key={city.name}
                  primary={city.name}
                  secondary={`${city.count} properties`}
                  onTap={() => go(city.name)}
                  dot={city.gradient}
                />
              ))}

              {/* Filters — only for property search */}
              {!isAgent && !isNewProject && (
                <>
                  {/* Filter toggle header */}
                  <button
                    onClick={() => setShowFilters(v => !v)}
                    className="w-full flex items-center justify-between px-5 py-3.5 mt-1"
                  >
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-bold text-gray-700">Filters</span>
                      {filterCount > 0 && (
                        <span className="bg-primary-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {filterCount}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-primary-600 font-semibold">
                      {showFilters ? 'Hide' : 'Show'}
                    </span>
                  </button>

                  {showFilters && (
                    <div className="px-4 pb-4 space-y-4">
                      {/* Property Type */}
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Property Type</p>
                        <div className="flex flex-wrap gap-2">
                          {types.map(t => (
                            <FilterChip
                              key={t.slug} label={t.name}
                              active={type === t.slug}
                              onTap={() => setType(type === t.slug ? '' : t.slug)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* BHK */}
                      {showBHK && (
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">BHK</p>
                          <div className="flex flex-wrap gap-2">
                            {BHK_OPTIONS.map(b => (
                              <FilterChip
                                key={b} label={b}
                                active={bhk.includes(b)}
                                onTap={() => setBhk(p => p.includes(b) ? p.filter(x => x !== b) : [...p, b])}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Budget */}
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Budget</p>
                        <div className="grid grid-cols-2 gap-2">
                          {budgets.map(b => (
                            <button
                              key={b.label}
                              onClick={() => setBudget(budget?.label === b.label ? null : b)}
                              className={cn(
                                'px-3 py-3 rounded-xl text-sm font-semibold border-2 text-left transition-all active:scale-95',
                                budget?.label === b.label
                                  ? 'border-primary-500 bg-primary-50 text-primary-700'
                                  : 'border-gray-100 bg-gray-50 text-gray-700',
                              )}
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Extra scroll breathing room */}
          <div className="h-4" />
        </div>

        {/* ── BOTTOM BUTTON — always visible ────────────────────────────── */}
        <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 py-4">
          {/* Active filter pills */}
          {filterCount > 0 && (
            <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
              {type && (
                <ActivePill label={types.find(t => t.slug === type)?.name || type} onRemove={() => setType('')} />
              )}
              {bhk.map(b => (
                <ActivePill key={b} label={b} onRemove={() => setBhk(p => p.filter(x => x !== b))} />
              ))}
              {budget && (
                <ActivePill label={budget.label} onRemove={() => setBudget(null)} />
              )}
            </div>
          )}

          <button
            onClick={() => go()}
            className={cn(
              'w-full h-14 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-3',
              'bg-gradient-to-r', `from-primary-600 to-primary-700`,
              'shadow-lg shadow-primary-600/40 active:scale-[0.98] transition-transform',
            )}
          >
            {isAgent
              ? <Users className="w-5 h-5 flex-shrink-0" />
              : <Search className="w-5 h-5 flex-shrink-0" />
            }
            <span className="truncate">
              {query
                ? (isAgent ? `Find Agents — ${query}` : isNewProject ? `New Projects in ${query}` : `Search in ${query}`)
                : (isAgent ? 'Find Agents' : isNewProject ? 'Search New Projects' : 'Search Properties')
              }
            </span>
            {filterCount > 0 && (
              <span className="bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                +{filterCount}
              </span>
            )}
          </button>
        </div>
    </div>
  );

  return createPortal(panel, document.body);
}

// ─── Small reusable pieces ────────────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-5 pt-4 pb-2">
      <span className="text-gray-400">{icon}</span>
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function LocationRow({
  primary, secondary, onTap, dot,
}: {
  primary: string; secondary?: string; onTap: () => void; dot?: string;
}) {
  return (
    <button
      onClick={onTap}
      className="w-full flex items-center gap-4 px-5 py-3.5 active:bg-gray-50 transition-colors text-left"
    >
      <div className={cn(
        'w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0',
        dot ? `bg-gradient-to-br ${dot}` : 'bg-primary-50',
      )}>
        <MapPin className={cn('w-4 h-4', dot ? 'text-white' : 'text-primary-500')} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-900 truncate">{primary}</div>
        {secondary && <div className="text-xs text-gray-400 mt-0.5 truncate">{secondary}</div>}
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
    </button>
  );
}

function FilterChip({ label, active, onTap }: { label: string; active: boolean; onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      className={cn(
        'h-9 px-4 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95',
        active
          ? 'border-primary-500 bg-primary-50 text-primary-700'
          : 'border-gray-100 bg-gray-50 text-gray-600',
      )}
    >
      {label}
    </button>
  );
}

function ActivePill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex-shrink-0 flex items-center gap-1.5 bg-primary-50 text-primary-700 text-xs font-bold px-3 py-1.5 rounded-full">
      {label}
      <button onPointerDown={e => { e.stopPropagation(); onRemove(); }}>
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ─── Desktop panels (unchanged) ───────────────────────────────────────────────

function DesktopAgentSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [suggs, setSuggs] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const deb = useRef<NodeJS.Timeout>();

  const fetch = async (v: string) => {
    if (!v.trim() || v.length < 2) { setSuggs([]); return; }
    setBusy(true);
    try { const { data } = await locationsApi.search(v); setSuggs(data.slice(0, 6)); }
    catch { setSuggs([]); } finally { setBusy(false); }
  };

  const go = (city?: string, state?: string) => {
    const p = new URLSearchParams();
    if (city) p.set('city', city);
    if (state) p.set('state', state);
    router.push(`/agents?${p}`);
    setShow(false);
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-[250px]">
        <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 bg-white">
          <MapPin className="w-4 h-4 text-primary-500 mr-2 flex-shrink-0" />
          <input type="text" placeholder="City, locality or state..." value={q}
            onChange={e => { setQ(e.target.value); setShow(true); clearTimeout(deb.current); deb.current = setTimeout(() => fetch(e.target.value), 300); }}
            onFocus={() => setShow(true)}
            onKeyDown={e => e.key === 'Enter' && go(q)}
            className="flex-1 outline-none text-sm bg-transparent" />
          {busy ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" /> : q && <button onClick={() => { setQ(''); setSuggs([]); }}><X className="w-4 h-4 text-gray-400" /></button>}
        </div>
        {show && suggs.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            {suggs.map((s, i) => (
              <button key={i} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-left"
                onClick={() => { setQ(s.locality ? `${s.locality}, ${s.city}` : s.city); go(s.city, s.state); }}>
                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <div><div className="text-sm font-medium">{s.locality || s.city}</div>{s.locality && <div className="text-xs text-gray-400">{s.city}, {s.state}</div>}</div>
              </button>
            ))}
          </div>
        )}
      </div>
      <button onClick={() => go(q)} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary-600/30">
        <Users className="w-4 h-4" /> Find Agents
      </button>
    </div>
  );
}

function DesktopPropertySearch({
  category, types, onSearch,
}: {
  category: string; types: PropType[]; onSearch: (city: string, locality?: string) => void;
}) {
  const [q, setQ] = useState('');
  const [suggs, setSuggs] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [showS, setShowS] = useState(false);
  const [bhk, setBhk] = useState<string[]>([]);
  const [budget, setBudget] = useState<any>(null);
  const [type, setType] = useState('');
  const [showBud, setShowBud] = useState(false);
  const [showType, setShowType] = useState(false);
  const deb = useRef<NodeJS.Timeout>();
  const budRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setBhk([]); setBudget(null); setType(''); }, [category]);
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (budRef.current && !budRef.current.contains(e.target as Node)) setShowBud(false);
      if (typeRef.current && !typeRef.current.contains(e.target as Node)) setShowType(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const fetchLocs = async (v: string) => {
    if (!v.trim() || v.length < 2) { setSuggs([]); return; }
    setBusy(true);
    try { const { data } = await locationsApi.search(v); setSuggs(data.slice(0, 6)); }
    catch { setSuggs([]); } finally { setBusy(false); }
  };

  const search = useCallback((city?: string, loc?: string) => { onSearch(city || q, loc); setShowS(false); }, [q, onSearch]);

  const budgets = (category === 'rent' || category === 'pg') ? BUDGET_RENT : BUDGET_BUY;
  const showBHK = category !== 'commercial' && category !== 'new_projects' && category !== 'industrial';
  const selectedTypeName = types.find(t => t.slug === type)?.name;

  return (
    <div className="flex flex-wrap gap-2">
      {/* Type dropdown */}
      {types.length > 0 && (
        <div ref={typeRef} className="relative">
          <button onClick={() => { setShowType(p => !p); setShowBud(false); }}
            className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm hover:border-primary-400 min-w-[140px] bg-white">
            <Building2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className={type ? 'text-primary-700 font-medium' : 'text-gray-500'}>{selectedTypeName || 'Property Type'}</span>
            <ChevronRight className={cn('w-3.5 h-3.5 text-gray-400 ml-auto transition-transform', showType && 'rotate-90')} />
          </button>
          {showType && (
            <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 min-w-[180px] overflow-hidden">
              <div className="p-1">
                <button onClick={() => { setType(''); setShowType(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg">Any Type</button>
                {types.map(t => (
                  <button key={t.slug} onClick={() => { setType(t.slug); setShowType(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${type === t.slug ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-gray-50'}`}>{t.name}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* BHK */}
      {showBHK && (
        <div className="flex items-center gap-1 border border-gray-200 rounded-xl px-3 py-2.5 bg-white">
          {BHK_OPTIONS.slice(0, 4).map(b => (
            <button key={b} onClick={() => setBhk(p => p.includes(b) ? p.filter(x => x !== b) : [...p, b])}
              className={`text-xs px-2 py-1 rounded-lg font-medium transition-all ${bhk.includes(b) ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              {b}
            </button>
          ))}
        </div>
      )}

      {/* Budget dropdown */}
      <div ref={budRef} className="relative">
        <button onClick={() => { setShowBud(p => !p); setShowType(false); }}
          className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm hover:border-primary-400 min-w-[130px] bg-white">
          <span className={budget ? 'text-primary-700 font-medium' : 'text-gray-500'}>{budget?.label || 'Budget'}</span>
          <ChevronRight className={cn('w-3.5 h-3.5 text-gray-400 ml-auto transition-transform', showBud && 'rotate-90')} />
        </button>
        {showBud && (
          <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 min-w-[200px] overflow-hidden">
            <div className="p-1">
              <button onClick={() => { setBudget(null); setShowBud(false); }} className="w-full text-left px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg">Any Budget</button>
              {budgets.map(b => (
                <button key={b.label} onClick={() => { setBudget(b); setShowBud(false); }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${budget?.label === b.label ? 'bg-primary-50 text-primary-700 font-medium' : 'hover:bg-gray-50'}`}>{b.label}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Location */}
      <div className="relative flex-1 min-w-[200px]">
        <div className="flex items-center border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 bg-white">
          <MapPin className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
          <input type="text" placeholder="City, locality, society..." value={q}
            onChange={e => { setQ(e.target.value); setShowS(true); clearTimeout(deb.current); deb.current = setTimeout(() => fetchLocs(e.target.value), 300); }}
            onFocus={() => setShowS(true)}
            onKeyDown={e => e.key === 'Enter' && search()}
            className="flex-1 outline-none text-sm bg-transparent" />
          {busy ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" /> : q && <button onClick={() => { setQ(''); setSuggs([]); }}><X className="w-4 h-4 text-gray-400" /></button>}
        </div>
        {showS && suggs.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
            {suggs.map((s, i) => (
              <button key={i} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 text-left"
                onClick={() => { setQ(s.locality ? `${s.locality}, ${s.city}` : s.city); setShowS(false); search(s.city, s.locality); }}>
                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <div><div className="text-sm font-medium">{s.locality || s.city}</div>{s.locality && <div className="text-xs text-gray-400">{s.city}, {s.state}</div>}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search button */}
      <button onClick={() => search()} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 shadow-lg shadow-primary-600/30">
        <Search className="w-4 h-4" /> Search
      </button>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function HomeSearchPanel() {
  const router  = useRouter();
  const [cat, setCat]   = useState('buy');
  const [open, setOpen] = useState(false);

  const { tabs, types } = useCategoryData(cat);

  const isAgent      = cat === 'agents';
  const isNewProject = cat === 'new_projects';
  const catInfo = tabs.find(c => c.value === cat) ?? { value: cat, label: cat, color: DEFAULT_COLOR };

  const handleSearch = useCallback((city: string, locality?: string) => {
    if (isNewProject) {
      const p = new URLSearchParams({ isNewProject: 'true' });
      if (city)     p.set('city', city);
      if (locality) p.set('locality', locality);
      router.push(`/properties?${p}`);
    } else {
      const p = new URLSearchParams({ category: cat });
      if (city)     p.set('city', city);
      if (locality) p.set('locality', locality);
      router.push(`/properties?${p}`);
    }
  }, [cat, isNewProject, router]);

  return (
    <div className="w-full max-w-5xl mx-auto">

      {/* ════════════════════════════════════
          MOBILE  — single search trigger
          ════════════════════════════════════ */}
      <div className="sm:hidden w-full">

        {/* Trigger card */}
        <button
          onClick={() => setOpen(true)}
          className="w-full bg-white rounded-2xl shadow-2xl shadow-black/25 p-4 flex items-center gap-3 active:scale-[0.97] transition-transform"
        >
          {/* Icon */}
          <div className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br',
            catInfo.color,
          )}>
            {isAgent
              ? <Users className="w-5 h-5 text-white" />
              : <Search className="w-5 h-5 text-white" />
            }
          </div>

          {/* Text */}
          <div className="flex-1 text-left min-w-0">
            <div className="text-[13px] font-semibold text-gray-800">
              {isAgent ? 'Find Agents' : isNewProject ? 'Search New Projects' : `${catInfo.label} a Property`}
            </div>
            <div className="text-xs text-gray-400 mt-0.5 truncate">
              {isAgent ? 'Search by city or state' : 'City, locality, project...'}
            </div>
          </div>

          {/* Category badge */}
          <div className={cn(
            'flex-shrink-0 flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl text-white bg-gradient-to-r',
            catInfo.color,
          )}>
            {catInfo.label}
          </div>
        </button>

        {/* Category strip below trigger */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setCat(tab.value)}
              className={cn(
                'flex-shrink-0 h-8 px-4 rounded-full text-xs font-bold transition-all active:scale-95',
                cat === tab.value
                  ? 'bg-white text-gray-900 shadow-md'
                  : 'bg-white/15 text-white/80',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Full-screen search overlay */}
        {open && (
          <MobileSearch initialCat={cat} onClose={() => setOpen(false)} allTabs={tabs} allTypes={types} />
        )}
      </div>

      {/* ════════════════════════════════════
          DESKTOP  — full inline search bar
          ════════════════════════════════════ */}
      <div className="hidden sm:block">
        {/* Category tabs */}
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setCat(tab.value)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all',
                cat === tab.value
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'bg-white/20 text-white hover:bg-white/30',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search panel body */}
        <div className="bg-white rounded-b-2xl rounded-tr-2xl shadow-2xl p-3">
          {isAgent
            ? <DesktopAgentSearch />
            : <DesktopPropertySearch category={cat} types={types} onSearch={handleSearch} />
          }
        </div>
      </div>
    </div>
  );
}
