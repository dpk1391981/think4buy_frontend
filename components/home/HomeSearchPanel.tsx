'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  Search, MapPin, Loader2, X, Users, Building2,
  ArrowLeft, ChevronRight, SlidersHorizontal, TrendingUp,
  ChevronDown, BedDouble, IndianRupee, CheckCircle2, Sliders, LocateFixed,
} from 'lucide-react';
import { locationsApi, propertyConfigApi, smartSearchApi } from '@/lib/api';
import { cn } from '@/lib/utils';
const CITY_GRADIENTS = [
  'from-blue-500 to-cyan-400',
  'from-orange-500 to-red-400',
  'from-green-500 to-teal-400',
  'from-purple-500 to-pink-400',
  'from-yellow-500 to-orange-400',
  'from-indigo-500 to-blue-400',
  'from-rose-500 to-pink-400',
  'from-emerald-500 to-green-400',
  'from-violet-500 to-purple-400',
  'from-cyan-500 to-sky-400',
];
import { useAnalytics } from '@/hooks/useAnalytics';
import { detectLocation } from '@/lib/geolocation';

// ─── Constants ────────────────────────────────────────────────────────────────

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

const ALL_TAB: CategoryTab = { value: '', label: 'All', color: DEFAULT_COLOR };

const VIRTUAL_TABS = [
  { value: 'agents', label: 'Agents', color: SLUG_COLORS.agents },
];

interface CategoryTab { value: string; label: string; color: string; }
interface PropType     { name: string; slug: string; }

const BHK_OPTIONS = [
  { label: '1 BHK', value: '1' },
  { label: '2 BHK', value: '2' },
  { label: '3 BHK', value: '3' },
  { label: '4 BHK', value: '4' },
  { label: '5+ BHK', value: '5+' },
];

const BUDGET_BUY = [
  { label: 'Under ₹25 Lakh',    min: 0,        max: 2500000   },
  { label: '₹25 – 50 Lakh',     min: 2500000,  max: 5000000   },
  { label: '₹50 Lakh – 1 Cr',   min: 5000000,  max: 10000000  },
  { label: '₹1 Cr – 2 Cr',      min: 10000000, max: 20000000  },
  { label: '₹2 Cr – 5 Cr',      min: 20000000, max: 50000000  },
  { label: 'Above ₹5 Cr',       min: 50000000, max: 0         },
];

const BUDGET_RENT = [
  { label: 'Under ₹10,000',  min: 0,     max: 10000 },
  { label: '₹10K – ₹20K',    min: 10000, max: 20000 },
  { label: '₹20K – ₹40K',    min: 20000, max: 40000 },
  { label: '₹40K – ₹75K',    min: 40000, max: 75000 },
  { label: 'Above ₹75,000',  min: 75000, max: 0     },
];

const POSSESSION_OPTIONS = [
  { label: 'Ready to Move', value: 'ready_to_move' },
  { label: 'Under Construction', value: 'under_construction' },
];

const FURNISHING_OPTIONS = [
  { label: 'Furnished', value: 'furnished' },
  { label: 'Semi-Furnished', value: 'semi_furnished' },
  { label: 'Unfurnished', value: 'unfurnished' },
];

const POSTED_BY_OPTIONS = [
  { label: 'Owner', value: 'owner' },
  { label: 'Agent', value: 'agent' },
  { label: 'Builder', value: 'builder' },
];

// ─── Shared hook ──────────────────────────────────────────────────────────────

function useCategoryData(activeCat: string) {
  const [tabs, setTabs] = useState<CategoryTab[]>(VIRTUAL_TABS);
  const [types, setTypes] = useState<PropType[]>([]);
  const typeCache = useRef<Record<string, PropType[]>>({});

  useEffect(() => {
    propertyConfigApi.getCategories().then(({ data }) => {
      const dbTabs: CategoryTab[] = data.map((c: any) => ({
        value: c.slug, label: c.name, color: SLUG_COLORS[c.slug] ?? DEFAULT_COLOR,
      }));
      setTabs([ALL_TAB, ...dbTabs, ...VIRTUAL_TABS]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const isVirtual = !activeCat || activeCat === 'agents' || activeCat === 'new_projects';
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

// ─── Shared dropdown pill (desktop) ──────────────────────────────────────────

function DropdownPill({
  icon: Icon, label, active, activeLabel, children, onClear,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  activeLabel?: string;
  children: React.ReactNode;
  onClear?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const portalRef  = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      const inWrapper = wrapperRef.current?.contains(t) ?? false;
      const inPortal  = portalRef.current?.contains(t) ?? false;
      if (!inWrapper && !inPortal) setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', handler);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', handler);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  const toggle = () => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: r.left });
    }
    setOpen(v => !v);
  };

  return (
    <div ref={wrapperRef} className="relative flex-shrink-0">
      <button
        ref={triggerRef}
        onClick={toggle}
        className={cn(
          'flex items-center gap-2 h-10 pl-3 pr-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-150 select-none whitespace-nowrap',
          active
            ? 'border-primary-500 bg-primary-50 text-primary-700'
            : 'border-gray-200 bg-white text-gray-600 hover:border-primary-300 hover:bg-gray-50',
        )}
      >
        <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-primary-600' : 'text-gray-400')} />
        <span className={cn('max-w-[120px] truncate', active && 'text-primary-700 font-semibold')}>
          {active && activeLabel ? activeLabel : label}
        </span>
        {active && onClear ? (
          <button
            onPointerDown={e => { e.stopPropagation(); onClear(); }}
            className="w-4 h-4 rounded-full bg-primary-200 hover:bg-primary-300 flex items-center justify-center flex-shrink-0 transition-colors"
            aria-label={`Clear ${label}`}
          >
            <X className="w-2.5 h-2.5 text-primary-700" />
          </button>
        ) : (
          <ChevronDown className={cn('w-3.5 h-3.5 flex-shrink-0 transition-transform text-gray-400', open && 'rotate-180')} />
        )}
      </button>

      {open && pos && mounted && createPortal(
        <div
          ref={portalRef}
          style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999 }}
          className="bg-white rounded-2xl shadow-2xl border border-gray-100 min-w-[220px] overflow-hidden"
        >
          {children}
        </div>,
        document.body,
      )}
    </div>
  );
}

// ─── Desktop: Property Type dropdown ─────────────────────────────────────────

function TypeDropdown({ types, value, onChange }: {
  types: PropType[]; value: string; onChange: (v: string) => void;
}) {
  const selected = types.find(t => t.slug === value);
  return (
    <DropdownPill
      icon={Building2}
      label="Property Type"
      active={!!value}
      activeLabel={selected?.name}
      onClear={() => onChange('')}
    >
      <div className="py-1.5 max-h-64 overflow-y-auto">
        <button
          onClick={() => onChange('')}
          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-500 transition-colors"
        >
          <span className="flex-1 text-left">Any Type</span>
        </button>
        {types.map(t => (
          <button
            key={t.slug}
            onClick={() => onChange(t.slug)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
              value === t.slug ? 'bg-primary-50 text-primary-700 font-semibold' : 'hover:bg-gray-50 text-gray-700',
            )}
          >
            <span className="flex-1 text-left">{t.name}</span>
            {value === t.slug && <CheckCircle2 className="w-4 h-4 text-primary-600 flex-shrink-0" />}
          </button>
        ))}
      </div>
    </DropdownPill>
  );
}

// ─── Desktop: BHK dropdown ────────────────────────────────────────────────────

function BhkDropdown({ value, onChange }: {
  value: string[]; onChange: (v: string[]) => void;
}) {
  const label = value.length === 0
    ? undefined
    : value.length === 1
    ? `${value[0]} BHK`
    : `${value.join(', ')} BHK`;

  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);

  return (
    <DropdownPill
      icon={BedDouble}
      label="BHK / Bedrooms"
      active={value.length > 0}
      activeLabel={label}
      onClear={() => onChange([])}
    >
      <div className="p-4">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
          Select BHK
        </p>
        <div className="flex flex-wrap gap-2">
          {BHK_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all',
                value.includes(opt.value)
                  ? 'border-primary-500 bg-primary-600 text-white shadow-md'
                  : 'border-gray-200 text-gray-600 hover:border-primary-300 hover:bg-primary-50',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {value.length > 0 && (
          <button
            onClick={() => onChange([])}
            className="mt-3 text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Clear selection
          </button>
        )}
      </div>
    </DropdownPill>
  );
}

// ─── Desktop: Budget dropdown ─────────────────────────────────────────────────

function BudgetDropdown({
  category, value, onChange,
}: {
  category: string;
  value: { label: string; min: number; max: number } | null;
  onChange: (v: { label: string; min: number; max: number } | null) => void;
}) {
  const budgets = (category === 'rent' || category === 'pg') ? BUDGET_RENT : BUDGET_BUY;

  return (
    <DropdownPill
      icon={IndianRupee}
      label="Budget"
      active={!!value}
      activeLabel={value?.label}
      onClear={() => onChange(null)}
    >
      <div className="py-1.5">
        <div className="px-4 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          {category === 'rent' || category === 'pg' ? 'Monthly Rent' : 'Total Budget'}
        </div>
        <button
          onClick={() => onChange(null)}
          className="w-full flex items-center px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-500 transition-colors"
        >
          Any Budget
        </button>
        {budgets.map(b => (
          <button
            key={b.label}
            onClick={() => onChange(b)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
              value?.label === b.label
                ? 'bg-primary-50 text-primary-700 font-semibold'
                : 'hover:bg-gray-50 text-gray-700',
            )}
          >
            <span className="flex-1 text-left">{b.label}</span>
            {value?.label === b.label && <CheckCircle2 className="w-4 h-4 text-primary-600 flex-shrink-0" />}
          </button>
        ))}
      </div>
    </DropdownPill>
  );
}

// ─── Desktop: More Filters dropdown ──────────────────────────────────────────

interface MoreFilters {
  possession: string;
  furnishing: string;
  postedBy: string;
}

function MoreFiltersDropdown({
  value, onChange, category,
}: {
  value: MoreFilters;
  onChange: (v: MoreFilters) => void;
  category: string;
}) {
  const count = [value.possession, value.furnishing, value.postedBy].filter(Boolean).length;
  const isCommercial = category === 'commercial';

  return (
    <DropdownPill
      icon={Sliders}
      label="More Filters"
      active={count > 0}
      activeLabel={`${count} Filter${count > 1 ? 's' : ''}`}
      onClear={() => onChange({ possession: '', furnishing: '', postedBy: '' })}
    >
      <div className="p-4 w-64 space-y-4">
        {/* Possession */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Possession
          </p>
          <div className="flex flex-col gap-1">
            {POSSESSION_OPTIONS.map(opt => (
              <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                <div
                  onClick={() => onChange({ ...value, possession: value.possession === opt.value ? '' : opt.value })}
                  className={cn(
                    'w-4 h-4 rounded border-2 flex items-center justify-center transition-all cursor-pointer flex-shrink-0',
                    value.possession === opt.value
                      ? 'border-primary-600 bg-primary-600'
                      : 'border-gray-300 group-hover:border-primary-400',
                  )}
                >
                  {value.possession === opt.value && (
                    <svg viewBox="0 0 10 8" className="w-2.5 h-2 fill-white">
                      <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    </svg>
                  )}
                </div>
                <span
                  className="text-sm text-gray-700 cursor-pointer"
                  onClick={() => onChange({ ...value, possession: value.possession === opt.value ? '' : opt.value })}
                >
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Furnishing */}
        {!isCommercial && (
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              Furnishing
            </p>
            <div className="flex flex-wrap gap-1.5">
              {FURNISHING_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onChange({ ...value, furnishing: value.furnishing === opt.value ? '' : opt.value })}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                    value.furnishing === opt.value
                      ? 'border-primary-500 bg-primary-600 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-primary-300',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Posted By */}
        <div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            Posted By
          </p>
          <div className="flex flex-wrap gap-1.5">
            {POSTED_BY_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onChange({ ...value, postedBy: value.postedBy === opt.value ? '' : opt.value })}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                  value.postedBy === opt.value
                    ? 'border-primary-500 bg-primary-600 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-primary-300',
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clear all */}
        {count > 0 && (
          <button
            onClick={() => onChange({ possession: '', furnishing: '', postedBy: '' })}
            className="w-full text-xs text-center text-red-500 hover:text-red-700 pt-1 transition-colors"
          >
            Clear all filters
          </button>
        )}
      </div>
    </DropdownPill>
  );
}

// ─── Desktop: Agent search ────────────────────────────────────────────────────

function DesktopAgentSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [suggs, setSuggs] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const deb = useRef<NodeJS.Timeout>();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

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
    <div ref={ref} className="relative">
      {/* Big search input */}
      <div className="flex items-center h-14 bg-white rounded-2xl border-2 border-gray-200 focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-100 transition-all overflow-hidden">
        <div className="flex items-center flex-1 px-4">
          <MapPin className="w-5 h-5 text-primary-400 flex-shrink-0 mr-3" />
          <input
            type="text"
            value={q}
            placeholder="Search by city or state to find agents..."
            onChange={e => {
              setQ(e.target.value); setShow(true);
              clearTimeout(deb.current);
              deb.current = setTimeout(() => fetch(e.target.value), 300);
            }}
            onFocus={() => setShow(true)}
            onKeyDown={e => e.key === 'Enter' && go(q)}
            className="flex-1 text-base text-gray-800 placeholder-gray-400 outline-none bg-transparent"
          />
          {busy ? (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
          ) : q ? (
            <button onClick={() => { setQ(''); setSuggs([]); }}>
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          ) : null}
        </div>
        <button
          onClick={() => go(q)}
          className="h-full px-8 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold text-base flex items-center gap-2 transition-colors flex-shrink-0"
        >
          <Users className="w-5 h-5" />
          <span>Find Agents</span>
        </button>
      </div>

      {show && suggs.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {suggs.map((s, i) => (
            <button
              key={i}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50 text-left transition-colors"
              onClick={() => { setQ(s.locality ? `${s.locality}, ${s.city}` : s.city); go(s.city, s.state); }}
            >
              <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-primary-500" />
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">{s.locality || s.city}</div>
                {s.locality && <div className="text-xs text-gray-400">{s.city}, {s.state}</div>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Desktop: Property search (the main redesigned component) ─────────────────

function DesktopPropertySearch({
  category, types, onSearch,
}: {
  category: string; types: PropType[];
  onSearch: (params: Record<string, string>) => void;
}) {
  const router = useRouter();
  const [q, setQ]           = useState('');
  const [suggs, setSuggs]   = useState<any[]>([]);
  const [busy, setBusy]     = useState(false);
  const [showSugg, setShowSugg] = useState(false);
  const [type, setType]     = useState('');
  const [bhk, setBhk]       = useState<string[]>([]);
  const [budget, setBudget] = useState<{ label: string; min: number; max: number } | null>(null);
  const [more, setMore]     = useState({ possession: '', furnishing: '', postedBy: '' });
  const [detecting, setDetecting] = useState(false);
  const [detectErr, setDetectErr] = useState('');
  const [popularCities, setPopularCities] = useState<{ id: string; cityName: string; counts: { total: number } }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const deb = useRef<NodeJS.Timeout>();
  const suggRef = useRef<HTMLDivElement>(null);

  // Reset filters when category changes
  useEffect(() => {
    setType(''); setBhk([]); setBudget(null);
    setMore({ possession: '', furnishing: '', postedBy: '' });
  }, [category]);

  // Fetch top cities once
  useEffect(() => {
    locationsApi.getTopCities().then(r => {
      const raw = r.data;
      const arr: any[] = Array.isArray(raw) ? raw : raw?.cities ?? [];
      setPopularCities(arr.slice(0, 8));
    }).catch(() => {});
  }, []);

  // Close suggestions on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (suggRef.current && !suggRef.current.contains(e.target as Node)) setShowSugg(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const fetchLocs = async (v: string) => {
    if (!v.trim() || v.length < 2) { setSuggs([]); return; }
    setBusy(true);
    try { const { data } = await locationsApi.search(v); setSuggs(data.slice(0, 7)); }
    catch { setSuggs([]); } finally { setBusy(false); }
  };

  const buildParams = (city?: string, locality?: string): Record<string, string> => {
    const p: Record<string, string> = {};
    if (city)               p.city       = city;
    if (locality)           p.locality   = locality;
    if (type)               p.type       = type;
    if (bhk.length)         p.bedrooms   = bhk.join(',');
    if (budget?.min)        p.minPrice   = String(budget.min);
    if (budget?.max)        p.maxPrice   = String(budget.max);
    if (more.possession)    p.possessionStatus = more.possession;
    if (more.furnishing)    p.furnishingStatus  = more.furnishing;
    if (more.postedBy)      p.listedBy   = more.postedBy;
    return p;
  };

  const search = useCallback(async (city?: string, locality?: string) => {
    setShowSugg(false);
    if (city) {
      // User selected a location suggestion — city is resolved, use directly
      onSearch(buildParams(city, locality));
      return;
    }

    const rawQ = q.trim();

    // If there are UI-selected filters but no text, just search with filters
    if (!rawQ) {
      onSearch(buildParams());
      return;
    }

    // Smart backend NLP search
    try {
      const res = await smartSearchApi.parse(rawQ, category || undefined);
      const url = new URL(res.data.redirectUrl, 'http://x');

      // Inject UI-selected filters on top of NLP result
      if (bhk.length)       url.searchParams.set('bedrooms', bhk.join(','));
      if (budget?.min)      url.searchParams.set('minPrice', String(budget.min));
      if (budget?.max)      url.searchParams.set('maxPrice', String(budget.max));
      if (type)             url.searchParams.set('type', type);
      if (more.possession)  url.searchParams.set('possessionStatus', more.possession);
      if (more.furnishing)  url.searchParams.set('furnishingStatus', more.furnishing);
      if (more.postedBy)    url.searchParams.set('listedBy', more.postedBy);
      if (category && !res.data.filters?.category) url.searchParams.set('category', category);

      router.push(`/properties?${url.searchParams.toString()}`);
    } catch {
      // BE unavailable — keyword fallback (preserves UI-selected filters)
      onSearch({ ...buildParams(), keyword: rawQ });
    }
  }, [q, type, bhk, budget, more, category, onSearch, router]);

  const handleDetect = async () => {
    setDetecting(true);
    setDetectErr('');
    try {
      const loc = await detectLocation();
      const city = loc.city || loc.locality;
      if (city) {
        const locality = loc.locality && loc.locality !== city ? loc.locality : undefined;
        setQ(locality ? `${locality}, ${city}` : city);
        search(city, locality);
      } else {
        setDetectErr('City not found');
        setTimeout(() => setDetectErr(''), 3000);
      }
    } catch (e: any) {
      const msg = e?.code === 1 ? 'Location access denied' : 'Location unavailable';
      setDetectErr(msg);
      setTimeout(() => setDetectErr(''), 3000);
    } finally {
      setDetecting(false);
    }
  };

  const showBHK = category !== 'commercial' && category !== 'new_projects' && category !== 'industrial';
  const activeFilterCount = [type, bhk.length > 0, budget, more.possession, more.furnishing, more.postedBy].filter(Boolean).length;

  return (
    <div className="space-y-2.5">
      {/* ── Big Search Input ── */}
      <div ref={suggRef} className="relative">
        <div className="flex items-center h-14 md:h-[68px] bg-white rounded-2xl border-2 border-gray-200 focus-within:border-primary-400 focus-within:ring-4 focus-within:ring-primary-100 transition-all overflow-hidden shadow-lg shadow-black/10">
          <div className="flex items-center flex-1 px-4 md:px-6 h-full gap-2">
            <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={q}
              placeholder="Search city, locality, project, or builder..."
              onChange={e => {
                setQ(e.target.value);
                setShowSugg(true);
                clearTimeout(deb.current);
                deb.current = setTimeout(() => fetchLocs(e.target.value), 280);
              }}
              onFocus={() => setShowSugg(true)}
              onKeyDown={e => { if (e.key === 'Enter') search(); }}
              className="flex-1 text-base md:text-lg text-gray-800 placeholder-gray-400 outline-none bg-transparent font-medium min-w-0"
            />
            {/* GPS detect button */}
            {detecting ? (
              <div className="flex items-center gap-1.5 px-3 h-8 rounded-xl bg-primary-50 border border-primary-200 flex-shrink-0">
                <Loader2 className="w-3.5 h-3.5 text-primary-500 animate-spin" />
                <span className="hidden sm:inline text-xs font-semibold text-primary-600">Detecting…</span>
              </div>
            ) : (
              <button
                onClick={handleDetect}
                title={detectErr || 'Detect my location'}
                className={cn(
                  'flex items-center gap-1.5 px-3 h-8 rounded-xl border font-semibold text-xs flex-shrink-0 transition-all duration-150 whitespace-nowrap',
                  detectErr
                    ? 'bg-red-50 border-red-200 text-red-500'
                    : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-600',
                )}
                aria-label="Detect my location"
              >
                <LocateFixed className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">{detectErr || 'Near Me'}</span>
              </button>
            )}
            {/* Suggestion loader / clear */}
            {!detecting && busy ? (
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
            ) : !detecting && q ? (
              <button
                onClick={() => { setQ(''); setSuggs([]); inputRef.current?.focus(); }}
                className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors"
                aria-label="Clear"
              >
                <X className="w-3 h-3 text-gray-500" />
              </button>
            ) : null}
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-gray-200 flex-shrink-0" />

          {/* Search button */}
          <button
            onClick={() => search()}
            className="h-full px-6 md:px-10 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-bold text-base flex items-center gap-2 md:gap-2.5 transition-colors flex-shrink-0"
          >
            <Search className="w-5 h-5 md:w-5 md:h-5" />
            <span className="hidden sm:inline text-[15px] md:text-base">Search</span>
            {activeFilterCount > 0 && (
              <span className="bg-white/25 text-white text-xs font-bold px-1.5 py-0.5 rounded-full ml-1">
                +{activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Suggestions dropdown */}
        {showSugg && (suggs.length > 0 || (q.length < 2 && popularCities.length > 0)) && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-gray-100 z-[200] overflow-hidden">
            {suggs.length > 0 ? (
              <>
                <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50">
                  Locations
                </div>
                {suggs.map((s, i) => (
                  <button
                    key={i}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary-50 text-left transition-colors"
                    onClick={() => {
                      setQ(s.locality ? `${s.locality}, ${s.city}` : s.city);
                      setShowSugg(false);
                      search(s.city, s.locality);
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-primary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">
                        {s.locality ? `${s.locality}, ${s.city}` : s.city}
                      </div>
                      <div className="text-xs text-gray-400">{s.state}</div>
                    </div>
                    {s.propertyCount > 0 && (
                      <span className="text-xs text-gray-400 flex-shrink-0">{s.propertyCount}+ props</span>
                    )}
                  </button>
                ))}
              </>
            ) : q.length < 2 && popularCities.length > 0 ? (
              <>
                <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-50 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Popular Cities
                </div>
                {popularCities.map((c) => (
                  <button
                    key={c.id}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                    onClick={() => {
                      setQ(c.cityName);
                      setShowSugg(false);
                      search(c.cityName);
                    }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-4 h-4 text-primary-500" />
                    </div>
                    <span className="flex-1 text-sm text-gray-800 font-medium">{c.cityName}</span>
                    {c.counts?.total > 0 && (
                      <span className="text-xs text-gray-400 flex-shrink-0">{c.counts.total} listings</span>
                    )}
                  </button>
                ))}
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* ── Filter Pill Row ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Property Type */}
        {types.length > 0 && (
          <TypeDropdown types={types} value={type} onChange={setType} />
        )}

        {/* BHK */}
        {showBHK && (
          <BhkDropdown value={bhk} onChange={setBhk} />
        )}

        {/* Budget */}
        <BudgetDropdown category={category} value={budget} onChange={setBudget} />

        {/* More Filters */}
        <MoreFiltersDropdown value={more} onChange={setMore} category={category} />

        {/* Active filter summary chips */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1.5 ml-1">
            {type && (
              <ActivePill label={types.find(t => t.slug === type)?.name || type} onRemove={() => setType('')} />
            )}
            {bhk.map(b => (
              <ActivePill key={b} label={`${b} BHK`} onRemove={() => setBhk(p => p.filter(x => x !== b))} />
            ))}
            {budget && (
              <ActivePill label={budget.label} onRemove={() => setBudget(null)} />
            )}
            {more.possession && (
              <ActivePill
                label={POSSESSION_OPTIONS.find(o => o.value === more.possession)?.label || more.possession}
                onRemove={() => setMore(m => ({ ...m, possession: '' }))}
              />
            )}
            {more.furnishing && (
              <ActivePill
                label={FURNISHING_OPTIONS.find(o => o.value === more.furnishing)?.label || more.furnishing}
                onRemove={() => setMore(m => ({ ...m, furnishing: '' }))}
              />
            )}
            {more.postedBy && (
              <ActivePill
                label={POSTED_BY_OPTIONS.find(o => o.value === more.postedBy)?.label || more.postedBy}
                onRemove={() => setMore(m => ({ ...m, postedBy: '' }))}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mobile full-screen search ────────────────────────────────────────────────

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
  const [detecting, setDetecting] = useState(false);
  const [detectErr, setDetectErr] = useState('');
  const [topCities, setTopCities] = useState<{ id: string; cityName: string; counts: { total: number } }[]>([]);

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
  const budgets      = (cat === 'rent' || cat === 'pg') ? BUDGET_RENT : BUDGET_BUY;
  const types        = localTypes;
  const showBHK      = !isAgent && !isNewProject && cat !== 'commercial';
  const filterCount  = [type, bhk.length > 0, budget].filter(Boolean).length;

  useEffect(() => {
    window.history.pushState({ msearch: true }, '');
    const pop = () => onClose();
    window.addEventListener('popstate', pop);
    return () => window.removeEventListener('popstate', pop);
  }, [onClose]);

  useEffect(() => {
    locationsApi.getTopCities().then(r => {
      const raw = r.data;
      const arr: any[] = Array.isArray(raw) ? raw : raw?.cities ?? [];
      setTopCities(arr.slice(0, 10));
    }).catch(() => {});
  }, []);

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

  const go = async (city?: string, locality?: string, state?: string) => {
    onClose();

    if (isAgent) {
      const p = new URLSearchParams();
      if (city)  p.set('city', city || '');
      if (state) p.set('state', state);
      router.push(`/agents?${p}`);
      return;
    }

    // If city came from a suggestion click, skip smart search
    if (city) {
      const p = new URLSearchParams();
      if (isNewProject) p.set('isNewProject', 'true'); else if (cat) p.set('category', cat);
      p.set('city', city);
      if (locality)     p.set('locality', locality);
      if (bhk.length)   p.set('bedrooms', bhk.join(','));
      if (budget?.min)  p.set('minPrice', String(budget.min));
      if (budget?.max)  p.set('maxPrice', String(budget.max));
      if (type)         p.set('type', type);
      router.push(`/properties?${p}`);
      return;
    }

    // Free-text: use smart search API
    const rawQ = query.trim();

    // Only skip straight to /properties when there is truly NOTHING selected
    if (!rawQ && !bhk.length && !type && !budget) {
      const p = new URLSearchParams();
      if (isNewProject) p.set('isNewProject', 'true'); else if (cat) p.set('category', cat);
      router.push(`/properties?${p}`);
      return;
    }

    if (rawQ) {
      try {
        const res = await smartSearchApi.parse(rawQ, isNewProject ? undefined : cat || undefined);
        const url = new URL(res.data.redirectUrl, 'http://x');
        if (isNewProject)  url.searchParams.set('isNewProject', 'true');
        else if (cat && !res.data.filters?.category) url.searchParams.set('category', cat);
        // UI-selected filters override parsed ones
        if (bhk.length)   url.searchParams.set('bedrooms', bhk.join(','));
        if (budget?.min)  url.searchParams.set('minPrice', String(budget.min));
        if (budget?.max)  url.searchParams.set('maxPrice', String(budget.max));
        if (type)         url.searchParams.set('type', type);
        router.push(`/properties?${url.searchParams.toString()}`);
        return;
      } catch {
        // BE unavailable — keyword fallback (keep UI-selected filters)
        const p = new URLSearchParams();
        if (isNewProject) p.set('isNewProject', 'true'); else if (cat) p.set('category', cat);
        if (bhk.length)  p.set('bedrooms', bhk.join(','));
        if (budget?.min) p.set('minPrice', String(budget.min));
        if (budget?.max) p.set('maxPrice', String(budget.max));
        if (type)        p.set('type', type);
        p.set('keyword', rawQ);
        router.push(`/properties?${p}`);
      }
    } else {
      // No text but filters (BHK/type/budget) are selected
      const p = new URLSearchParams();
      if (isNewProject) p.set('isNewProject', 'true'); else if (cat) p.set('category', cat);
      if (bhk.length)  p.set('bedrooms', bhk.join(','));
      if (budget?.min) p.set('minPrice', String(budget.min));
      if (budget?.max) p.set('maxPrice', String(budget.max));
      if (type)        p.set('type', type);
      router.push(`/properties?${p}`);
    }
  };

  const handleDetect = async () => {
    setDetecting(true);
    setDetectErr('');
    try {
      const loc = await detectLocation();
      const city = loc.city || loc.locality;
      if (city) {
        const locality = loc.locality && loc.locality !== city ? loc.locality : undefined;
        go(city, locality);
      } else {
        setDetectErr('City not found');
        setTimeout(() => setDetectErr(''), 4000);
      }
    } catch (e: any) {
      const msg = e?.code === 1 ? 'Access denied' : 'Unavailable';
      setDetectErr(msg);
      setTimeout(() => setDetectErr(''), 4000);
    } finally {
      setDetecting(false);
    }
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const panel = (
    <div className="fixed inset-0 flex flex-col" style={{ zIndex: 9999, height: '100dvh', background: '#f8fafc' }}>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-gradient-to-b from-slate-900 to-primary-900 px-4 pt-safe-top pb-0">

        {/* Top row: Back + title + GPS */}
        <div className="flex items-center gap-3 pt-4 pb-3">
          <button
            onClick={close}
            className="w-10 h-10 rounded-2xl bg-white/10 active:bg-white/20 flex items-center justify-center flex-shrink-0 transition-colors"
            aria-label="Close"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base leading-tight">
              {isAgent ? 'Find Agents' : isNewProject ? 'New Projects' : 'Search Properties'}
            </p>
            <p className="text-white/50 text-xs mt-0.5">
              {isAgent ? 'Find agents by city or state' : 'City, locality or project name'}
            </p>
          </div>
          <button
            onClick={handleDetect}
            disabled={detecting}
            className={cn(
              'flex items-center gap-1.5 h-9 px-3 rounded-2xl border text-xs font-bold flex-shrink-0 transition-all active:scale-95',
              detectErr
                ? 'bg-red-900/30 border-red-500/40 text-red-300'
                : detecting
                ? 'bg-white/10 border-white/20 text-white/70'
                : 'bg-white/10 border-white/20 text-white active:bg-white/20',
            )}
          >
            {detecting
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <LocateFixed className="w-3.5 h-3.5" />
            }
            <span>{detecting ? '…' : detectErr ? 'Retry' : 'Near Me'}</span>
          </button>
        </div>

        {/* Search input */}
        <div className="flex items-center bg-white rounded-2xl pl-4 pr-2 shadow-2xl shadow-black/30" style={{ height: 52 }}>
          {busy
            ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0 mr-2" />
            : <Search className="w-4 h-4 text-primary-500 flex-shrink-0 mr-2" />
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
            placeholder={isAgent ? 'City or state...' : 'City, locality, project...'}
            onChange={e => {
              setQuery(e.target.value);
              clearTimeout(debRef.current);
              debRef.current = setTimeout(() => fetchLocs(e.target.value), 250);
            }}
            onKeyDown={e => e.key === 'Enter' && go()}
            className="flex-1 text-[15px] font-medium text-gray-900 outline-none placeholder-gray-400 min-w-0"
            style={{ background: 'transparent', border: 'none', WebkitAppearance: 'none' }}
          />
          {query ? (
            <button
              onClick={() => { setQuery(''); setSuggs([]); inputRef.current?.focus(); }}
              className="w-8 h-8 rounded-full bg-gray-100 active:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors"
              aria-label="Clear"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          ) : (
            <div className="w-2 flex-shrink-0" />
          )}
        </div>

        {/* Category tabs — pill row */}
        <div className="flex gap-1.5 py-3 overflow-x-auto no-scrollbar">
          {allTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => changeCat(tab.value)}
              className={cn(
                'flex-shrink-0 h-8 px-4 rounded-full text-xs font-bold transition-all active:scale-95',
                cat === tab.value
                  ? 'bg-white text-gray-900 shadow-lg'
                  : 'bg-white/12 text-white/70 active:bg-white/20',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ minHeight: 0 }}>

        {/* Location suggestions when typing */}
        {query.length >= 2 ? (
          <div className="bg-white">
            {suggs.length > 0 ? (
              <>
                <SectionHeader icon={<MapPin className="w-3.5 h-3.5" />} label="Locations" />
                {suggs.map((s, i) => (
                  <LocationRow
                    key={i}
                    primary={s.locality || s.city}
                    secondary={s.locality ? `${s.city}, ${s.state}` : s.state}
                    onTap={() => go(s.city, s.locality, s.state)}
                    count={s.propertyCount > 0 ? `${s.propertyCount}+ props` : undefined}
                  />
                ))}
              </>
            ) : !busy ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <MapPin className="w-10 h-10 mb-3 text-gray-200" />
                <p className="text-sm font-medium">No locations found</p>
                <p className="text-xs mt-1">Try a city or area name</p>
              </div>
            ) : null}
          </div>
        ) : (
          <>
            {/* GPS detect + Popular Cities */}
            <div className="bg-white">
              <button
                onClick={handleDetect}
                disabled={detecting}
                className={cn(
                  'w-full flex items-center gap-4 px-5 py-4 border-b transition-colors',
                  detectErr ? 'border-red-100 active:bg-red-50' : 'border-gray-100 active:bg-blue-50',
                )}
              >
                <div className={cn(
                  'w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm',
                  detectErr ? 'bg-red-50' : 'bg-gradient-to-br from-blue-500 to-primary-600',
                )}>
                  {detecting
                    ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                    : detectErr
                    ? <LocateFixed className="w-5 h-5 text-red-400" />
                    : <LocateFixed className="w-5 h-5 text-white" />
                  }
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className={cn('text-sm font-bold leading-tight', detectErr ? 'text-red-500' : 'text-primary-600')}>
                    {detecting ? 'Detecting your location…' : detectErr ? `Failed: ${detectErr}` : 'Use my current location'}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {detecting ? 'Please wait' : detectErr ? 'Tap to try again' : 'Auto-detect city & locality'}
                  </div>
                </div>
                {!detecting && (
                  <ChevronRight className={cn('w-4 h-4 flex-shrink-0', detectErr ? 'text-red-300' : 'text-gray-300')} />
                )}
              </button>

              <SectionHeader icon={<TrendingUp className="w-3.5 h-3.5" />} label="Popular Cities" />
              {topCities.length > 0
                ? topCities.map((city, idx) => (
                    <LocationRow
                      key={city.id}
                      primary={city.cityName}
                      secondary={`${city.counts?.total ?? 0} active listings`}
                      onTap={() => go(city.cityName)}
                      dot={CITY_GRADIENTS[idx % CITY_GRADIENTS.length]}
                    />
                  ))
                : null
              }

            </div>

            {/* ── Filters section — always visible ───────────────────── */}
            {!isAgent && !isNewProject && (
              <div className="mt-2">
                <div className="flex items-center gap-2 px-5 pt-4 pb-3 bg-white">
                  <SlidersHorizontal className="w-4 h-4 text-primary-500" />
                  <span className="text-sm font-bold text-gray-800">Quick Filters</span>
                  {filterCount > 0 && (
                    <span className="bg-primary-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ml-0.5">
                      {filterCount}
                    </span>
                  )}
                </div>

                {/* Property Type */}
                {types.length > 0 && (
                  <div className="bg-white px-5 pb-4">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Property Type</p>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                      {types.map(t => (
                        <FilterChip
                          key={t.slug}
                          label={t.name}
                          active={type === t.slug}
                          onTap={() => setType(type === t.slug ? '' : t.slug)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* BHK */}
                {showBHK && (
                  <div className="bg-white mt-px px-5 pb-4 pt-3">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">BHK / Bedrooms</p>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                      {BHK_OPTIONS.map(b => (
                        <FilterChip
                          key={b.value}
                          label={b.label}
                          active={bhk.includes(b.value)}
                          onTap={() => setBhk(p => p.includes(b.value) ? p.filter(x => x !== b.value) : [...p, b.value])}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Budget */}
                <div className="bg-white mt-px px-5 pb-5 pt-3">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Budget</p>
                  <div className="grid grid-cols-2 gap-2">
                    {budgets.map(b => (
                      <button
                        key={b.label}
                        onClick={() => setBudget(budget?.label === b.label ? null : b)}
                        className={cn(
                          'px-3 py-3.5 rounded-2xl text-sm font-semibold border-2 text-left transition-all active:scale-[0.97]',
                          budget?.label === b.label
                            ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-sm shadow-primary-200'
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
            <div className="h-4" />
          </>
        )}
      </div>

      {/* ── Sticky footer ───────────────────────────────────────────────── */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 px-4 pt-3 pb-safe-bottom" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 16px)' }}>
        {filterCount > 0 && (
          <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
            {type && <ActivePill label={types.find(t => t.slug === type)?.name || type} onRemove={() => setType('')} />}
            {bhk.map(b => <ActivePill key={b} label={`${b} BHK`} onRemove={() => setBhk(p => p.filter(x => x !== b))} />)}
            {budget && <ActivePill label={budget.label} onRemove={() => setBudget(null)} />}
          </div>
        )}
        <button
          onClick={() => go()}
          className={cn(
            'w-full h-14 rounded-2xl font-bold text-white text-base flex items-center justify-center gap-2.5',
            'bg-gradient-to-r from-primary-600 to-primary-700',
            'shadow-lg shadow-primary-600/40 active:scale-[0.98] transition-transform',
          )}
        >
          {isAgent
            ? <Users className="w-5 h-5 flex-shrink-0" />
            : <Search className="w-5 h-5 flex-shrink-0" />
          }
          <span className="truncate">
            {query
              ? (isAgent ? `Find Agents — ${query}` : `Search in ${query}`)
              : (isAgent ? 'Find Agents' : 'Search Properties')
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

// ─── Tiny shared atoms ────────────────────────────────────────────────────────

function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 px-5 pt-4 pb-2">
      <span className="text-gray-400">{icon}</span>
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function LocationRow({ primary, secondary, onTap, dot, count }: {
  primary: string; secondary?: string; onTap: () => void; dot?: string; count?: string;
}) {
  return (
    <button
      onClick={onTap}
      className="w-full flex items-center gap-4 px-5 py-3.5 active:bg-gray-50 transition-colors text-left"
    >
      <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0', dot ? `bg-gradient-to-br ${dot}` : 'bg-primary-50')}>
        <MapPin className={cn('w-4 h-4', dot ? 'text-white' : 'text-primary-500')} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-900 truncate">{primary}</div>
        {secondary && <div className="text-xs text-gray-400 mt-0.5 truncate">{secondary}</div>}
      </div>
      {count && <span className="text-xs text-gray-400 flex-shrink-0">{count}</span>}
      <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 ml-1" />
    </button>
  );
}

function FilterChip({ label, active, onTap }: { label: string; active: boolean; onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      className={cn(
        'flex-shrink-0 h-9 px-4 rounded-xl text-sm font-semibold border-2 transition-all active:scale-95 whitespace-nowrap',
        active ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-100 bg-gray-50 text-gray-600',
      )}
    >
      {label}
    </button>
  );
}

function ActivePill({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex-shrink-0 flex items-center gap-1.5 bg-primary-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
      {label}
      <button onPointerDown={e => { e.stopPropagation(); onRemove(); }} aria-label={`Remove ${label}`}>
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function HomeSearchPanel() {
  const router  = useRouter();
  const { trackSearch } = useAnalytics();
  const [cat, setCat]   = useState('');
  const [open, setOpen] = useState(false);

  const { tabs, types } = useCategoryData(cat);

  const isAgent      = cat === 'agents';
  const isNewProject = cat === 'new_projects';
  const catInfo = tabs.find(c => c.value === cat) ?? { value: cat, label: cat, color: DEFAULT_COLOR };

  const handleSearch = useCallback((params: Record<string, string>) => {
    // Track the search event (fire-and-forget)
    trackSearch(params.search || params.keyword || '', {
      city:         params.city   || undefined,
      state:        params.state  || undefined,
      propertyType: params.type   || undefined,
      source:       'home_page',
      metadata:     { category: isAgent ? 'agents' : cat, ...params },
    });

    if (isAgent) {
      const p = new URLSearchParams(params);
      router.push(`/agents?${p}`);
    } else if (isNewProject) {
      const p = new URLSearchParams({ isNewProject: 'true', ...params });
      router.push(`/properties?${p}`);
    } else {
      const p = new URLSearchParams(params);
      if (cat) p.set('category', cat);
      router.push(`/properties?${p}`);
    }
  }, [cat, isAgent, isNewProject, router, trackSearch]);

  return (
    <div className="w-full">

      {/* ══════════════════════════════════
          MOBILE — trigger card
          ══════════════════════════════════ */}
      <div className="sm:hidden w-full">

        {/* Category tabs row */}
        <div className="flex items-center gap-1.5 mb-3 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setCat(tab.value)}
              className={cn(
                'flex-shrink-0 h-8 px-4 rounded-full text-xs font-bold transition-all active:scale-95',
                cat === tab.value ? 'bg-white text-gray-900 shadow-md' : 'bg-white/15 text-white/80',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Native-style search bar */}
        <button
          onClick={() => setOpen(true)}
          className="w-full flex items-center gap-3 bg-white rounded-2xl shadow-xl shadow-black/20 px-4 active:scale-[0.98] transition-transform"
          style={{ height: 52 }}
        >
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br shadow-sm', catInfo.color)}>
            {isAgent ? <Users className="w-4 h-4 text-white" /> : <Search className="w-4 h-4 text-white" />}
          </div>
          <span className="flex-1 text-left text-[14px] text-gray-400 font-medium truncate">
            {isAgent
              ? 'Find agents by city or state…'
              : isNewProject
              ? 'City, locality or builder…'
              : `${catInfo.label} — city, locality, project…`
            }
          </span>
          <div className="flex-shrink-0 flex items-center gap-1.5">
            <div className="w-px h-5 bg-gray-200" />
            <LocateFixed className="w-4 h-4 text-primary-400" />
          </div>
        </button>

        {open && (
          <MobileSearch initialCat={cat} onClose={() => setOpen(false)} allTabs={tabs} allTypes={types} />
        )}
      </div>

      {/* ══════════════════════════════════
          DESKTOP — full inline panel
          ══════════════════════════════════ */}
      <div className="hidden sm:block">
        {/* Category tabs */}
        <div className="flex gap-0.5 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setCat(tab.value)}
              className={cn(
                'flex-shrink-0 flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-t-xl transition-all',
                cat === tab.value
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'bg-white/20 text-white hover:bg-white/30',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Panel body */}
        <div className="bg-white rounded-b-2xl rounded-tr-2xl shadow-2xl p-4 md:p-6">
          {isAgent
            ? <DesktopAgentSearch />
            : <DesktopPropertySearch category={cat} types={types} onSearch={handleSearch} />
          }
        </div>
      </div>
    </div>
  );
}
