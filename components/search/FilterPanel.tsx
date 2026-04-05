'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, CheckCircle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRICE_RANGES_BUY, PRICE_RANGES_RENT } from '@/lib/utils';
import { propertyConfigApi, propertiesApi } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilterOption  { value: string; label: string }
interface Amenity       { id: string; name: string; category: string }
interface PropType      { value: string; label: string }

interface ListingFilter {
  id: string;
  filterKey:    string;
  label:        string;
  icon:         string | null;
  widgetType:
    | 'price_range' | 'bedroom_select' | 'property_type'
    | 'area_range'  | 'option_select'  | 'amenity_picker'
    | 'text_input'  | 'toggle_boolean';
  optionsJson:  FilterOption[] | null;
  categories:   string[] | null;
  defaultOpen:  boolean;
  showOnMobile: boolean;
  isActive:     boolean;
  sortOrder:    number;
}

export interface FilterPanelProps {
  className?:       string;
  isMobile?:        boolean;
  /** Mobile only: result count to show on the apply button */
  totalCount?:      number;
  /** Mobile only: called when user taps "Show results" */
  onApply?:         () => void;
  /** Override category when URL has no ?category= (e.g. on SEO listing URLs like /new-projects-in-noida) */
  propCategory?:    string;
  propIsNewProject?: boolean;
}

// ─── Static data ──────────────────────────────────────────────────────────────

const BEDROOM_OPTIONS: FilterOption[] = [
  { value: '1', label: '1 RK' },
  { value: '2', label: '2 BHK' },
  { value: '3', label: '3 BHK' },
  { value: '4', label: '4 BHK' },
  { value: '5', label: '5+ BHK' },
];

const AREA_RANGES = [
  { label: '< 500 sqft',    min: undefined, max: 500   },
  { label: '500 – 1000',    min: 500,  max: 1000  },
  { label: '1000 – 1500',   min: 1000, max: 1500  },
  { label: '1500 – 2000',   min: 1500, max: 2000  },
  { label: '2000 – 3000',   min: 2000, max: 3000  },
  { label: '3000+ sqft',    min: 3000, max: undefined },
];

const ALL_FILTER_KEYS = [
  'minPrice','maxPrice','bedrooms','type','furnishingStatus',
  'possessionStatus','minArea','maxArea','amenityIds',
  'listedBy','builderName','isVerified','isNewProject',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BUILDER_ONLY_CATEGORIES = new Set(['new_projects', 'builder_project']);

/** For builder/new-project categories, strip owner & agent from "Posted By" options */
function applyBuilderFilter(filter: ListingFilter, isBuilderCat: boolean): ListingFilter {
  if (!isBuilderCat || filter.filterKey !== 'listedBy') return filter;
  return {
    ...filter,
    optionsJson: (filter.optionsJson || []).filter(o => o.value !== 'owner' && o.value !== 'agent'),
  };
}

function isActive(filterKey: string, sp: URLSearchParams): boolean {
  if (filterKey === 'budget') return sp.has('minPrice') || sp.has('maxPrice');
  if (filterKey === 'area')   return sp.has('minArea')  || sp.has('maxArea');
  return sp.has(filterKey);
}

function useFilterData(category: string) {
  const [filters,    setFilters]    = useState<ListingFilter[]>([]);
  const [propTypes,  setPropTypes]  = useState<PropType[]>([]);
  const [amenities,  setAmenities]  = useState<Amenity[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.allSettled([
      propertyConfigApi.getListingFilters(category),
      propertyConfigApi.getTypesBySlug(category),
      propertiesApi.getAmenities(),
    ])
      .then(([f, t, a]) => {
        if (f.status === 'fulfilled') setFilters(f.value.data || []);
        if (t.status === 'fulfilled') setPropTypes((t.value.data || []).map((x: any) => ({ value: x.slug, label: x.name })));
        if (a.status === 'fulfilled') setAmenities(a.value.data || []);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  return { filters, propTypes, amenities, loading };
}

// ─── Desktop FilterPanel ──────────────────────────────────────────────────────

export default function FilterPanel({ className, propCategory, propIsNewProject }: FilterPanelProps) {
  const router      = useRouter();
  const sp          = useSearchParams();
  const isBuilderCat = propIsNewProject || sp.get('isNewProject') === 'true' || BUILDER_ONLY_CATEGORIES.has(propCategory || sp.get('category') || '');
  const category    = isBuilderCat && !(propCategory || sp.get('category')) ? 'new_projects' : (propCategory || sp.get('category') || 'buy');

  const { filters, propTypes, amenities, loading } = useFilterData(category);
  const [open, setOpen]             = useState<Record<string, boolean>>({});
  const [builderInput, setBuilder]  = useState(sp.get('builderName') || '');

  // Apply defaultOpen from config on first load
  useEffect(() => {
    if (!filters.length) return;
    setOpen(prev => {
      const next = { ...prev };
      filters.forEach(f => { if (!(f.filterKey in next)) next[f.filterKey] = f.defaultOpen; });
      return next;
    });
  }, [filters]);

  const get = useCallback((k: string) => sp.get(k), [sp]);

  const push = useCallback((updates: Record<string, string | undefined>) => {
    const p = new URLSearchParams(sp.toString());
    Object.entries(updates).forEach(([k, v]) => v ? p.set(k, v) : p.delete(k));
    p.set('page', '1');
    router.push(`/properties?${p.toString()}`, { scroll: false });
  }, [sp, router]);

  const set1  = (k: string, v: string | undefined) => push({ [k]: v });
  const clearAll = () => {
    const p = new URLSearchParams();
    if (get('category')) p.set('category', get('category')!);
    if (get('city'))     p.set('city',     get('city')!);
    router.push(`/properties?${p.toString()}`);
    setBuilder('');
  };

  const activeAmenityIds  = (get('amenityIds') || '').split(',').filter(Boolean);
  const activeCount       = ALL_FILTER_KEYS.filter(k => sp.has(k)).length;
  const priceRanges       = category === 'rent' ? PRICE_RANGES_RENT : PRICE_RANGES_BUY;
  const amenityGroups     = groupBy(amenities, a => a.category || 'Other');
  const sectionFilters    = filters.filter(f => f.widgetType !== 'toggle_boolean');
  const toggleFilters     = filters.filter(f => f.widgetType === 'toggle_boolean');

  return (
    <aside className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-white">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-primary-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs">🎛</span>
          </div>
          <span className="font-bold text-gray-900 text-sm">Filters</span>
          {activeCount > 0 && (
            <span className="bg-primary-600 text-white text-[10px] font-bold h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center tabular-nums">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button onClick={clearAll}
            className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50">
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {loading && <DesktopSkeleton />}

      {!loading && (
        <div>
          {sectionFilters.map(f => {
            const active = isActive(f.filterKey, sp);
            const isOpen = !!open[f.filterKey];
            return (
              <div key={f.filterKey} className={cn(
                'border-b border-gray-50 last:border-0 transition-colors',
                active && 'bg-primary-50/40',
              )}>
                <button
                  onClick={() => setOpen(p => ({ ...p, [f.filterKey]: !p[f.filterKey] }))}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50/70 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    {active && <span className="absolute left-0 w-0.5 h-6 bg-primary-600 rounded-r" />}
                    {f.icon && <span className="text-base leading-none flex-shrink-0">{f.icon}</span>}
                    <span className={cn(
                      'text-[11px] font-bold uppercase tracking-wider truncate',
                      active ? 'text-primary-700' : 'text-gray-500 group-hover:text-gray-700',
                    )}>
                      {f.label}
                    </span>
                    {active && (
                      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary-500" />
                    )}
                  </div>
                  <span className={cn(
                    'flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center transition-all',
                    isOpen ? 'bg-primary-100 rotate-0' : 'bg-gray-100',
                  )}>
                    {isOpen
                      ? <ChevronUp   className="w-3 h-3 text-primary-600" />
                      : <ChevronDown className="w-3 h-3 text-gray-400" />}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1">
                    <WidgetBody
                      filter={applyBuilderFilter(f, isBuilderCat)} get={get} push={push} set1={set1}
                      propTypes={propTypes} priceRanges={priceRanges}
                      amenityGroups={amenityGroups}
                      activeAmenityIds={activeAmenityIds}
                      builderInput={builderInput} setBuilder={setBuilder}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Quick toggles at bottom */}
          {toggleFilters.length > 0 && (
            <div className="px-4 pt-3 pb-4 bg-gray-50/50 space-y-2.5">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Quick Filters</p>
              {toggleFilters.map(f => (
                <ToggleRow key={f.filterKey} label={f.label} icon={f.icon}
                  checked={get(f.filterKey) === 'true'}
                  onChange={v => set1(f.filterKey, v ? 'true' : undefined)} />
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

function DesktopSkeleton() {
  return (
    <div className="divide-y divide-gray-50">
      {[100, 80, 120, 90].map((w, i) => (
        <div key={i} className="px-4 py-3 animate-pulse space-y-2.5">
          <div className={`h-2.5 bg-gray-200 rounded`} style={{ width: `${w}%` }} />
          <div className="flex gap-2 flex-wrap">
            {[1,2,3].map(j => <div key={j} className="h-7 bg-gray-100 rounded-xl" style={{ width: 56 }} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Filter Modal (desktop centered overlay) ──────────────────────────────────

export function FilterModal({
  open: modalOpen, onClose, totalCount, propCategory, propIsNewProject,
}: {
  open: boolean; onClose: () => void; totalCount?: number; propCategory?: string; propIsNewProject?: boolean;
}) {
  const router   = useRouter();
  const sp       = useSearchParams();
  const isBuilderCat = propIsNewProject || sp.get('isNewProject') === 'true' || BUILDER_ONLY_CATEGORIES.has(propCategory || sp.get('category') || '');
  const category = isBuilderCat && !(propCategory || sp.get('category')) ? 'new_projects' : (propCategory || sp.get('category') || 'buy');

  const { filters, propTypes, amenities, loading } = useFilterData(category);

  const [pending, setPending]     = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<string>('');
  const [builderInput, setBuilder] = useState(sp.get('builderName') || '');
  const initialised = useRef(false);

  useEffect(() => {
    if (!modalOpen) { initialised.current = false; return; }
    if (initialised.current) return;
    const snap: Record<string, string> = {};
    ALL_FILTER_KEYS.forEach(k => { const v = sp.get(k); if (v) snap[k] = v; });
    setPending(snap);
    initialised.current = true;
  }, [modalOpen, sp]);

  useEffect(() => {
    if (filters.length && !activeTab) setActiveTab(filters[0].filterKey);
  }, [filters, activeTab]);

  const get      = (k: string) => pending[k] ?? null;
  const setP     = (k: string, v: string | undefined) =>
    setPending(prev => { const n = { ...prev }; v ? (n[k] = v) : delete n[k]; return n; });
  const setMultiP = (u: Record<string, string | undefined>) =>
    setPending(prev => {
      const n = { ...prev };
      Object.entries(u).forEach(([k, v]) => v ? (n[k] = v) : delete n[k]);
      return n;
    });
  const clearAll = () => { setPending({}); setBuilder(''); };
  const applyAndClose = () => {
    const p = new URLSearchParams(sp.toString());
    ALL_FILTER_KEYS.forEach(k => p.delete(k));
    Object.entries(pending).forEach(([k, v]) => { if (v) p.set(k, v); });
    p.set('page', '1');
    router.push(`/properties?${p.toString()}`, { scroll: false });
    onClose();
  };

  const priceRanges      = category === 'rent' ? PRICE_RANGES_RENT : PRICE_RANGES_BUY;
  const amenityGroups    = groupBy(amenities, a => a.category || 'Other');
  const activeAmenityIds = (get('amenityIds') || '').split(',').filter(Boolean);
  const pendingCount     = Object.keys(pending).length;

  const allFilters     = filters;
  const sectionFilters = allFilters.filter(f => f.widgetType !== 'toggle_boolean');
  const toggleFilters  = allFilters.filter(f => f.widgetType === 'toggle_boolean');
  const allTabs        = [...sectionFilters, ...toggleFilters];
  const currentFilter  = allTabs.find(f => f.filterKey === activeTab);

  if (!modalOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal card */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center">
              <span className="text-white text-sm">🎛</span>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-base leading-tight">All Filters</h2>
              <p className="text-xs text-gray-400 leading-tight">
                {pendingCount > 0 ? `${pendingCount} filter${pendingCount > 1 ? 's' : ''} selected` : 'Select filters to narrow results'}
              </p>
            </div>
            {pendingCount > 0 && (
              <span className="bg-primary-600 text-white text-xs font-bold h-6 min-w-[24px] px-2 rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <button onClick={clearAll}
                className="text-sm font-semibold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" /> Clear all
              </button>
            )}
            <button onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
              <X className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Body — two panel */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="space-y-3 w-64">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-3 bg-gray-200 rounded animate-pulse" style={{ width: `${[100,75,90,60][i-1]}%` }} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 min-h-0">
            {/* Left nav */}
            <div className="w-[200px] flex-shrink-0 border-r border-gray-100 overflow-y-auto bg-gray-50/50">
              {allTabs.map(f => {
                const active  = isTabActive(f.filterKey, pending);
                const selected = activeTab === f.filterKey;
                return (
                  <button
                    key={f.filterKey}
                    onClick={() => setActiveTab(f.filterKey)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors relative',
                      selected
                        ? 'bg-white text-primary-700 border-r-2 border-primary-600'
                        : 'text-gray-600 hover:bg-white hover:text-gray-900',
                    )}
                  >
                    {f.icon && <span className="text-base leading-none flex-shrink-0">{f.icon}</span>}
                    <span className={cn(
                      'text-sm font-medium truncate flex-1',
                      selected ? 'font-semibold text-primary-700' : '',
                    )}>
                      {f.label}
                    </span>
                    {active && (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right panel */}
            <div className="flex-1 overflow-y-auto p-6">
              {currentFilter ? (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                        {currentFilter.icon && <span className="text-2xl">{currentFilter.icon}</span>}
                        {currentFilter.label}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {currentFilter.widgetType === 'price_range' ? 'Choose your budget range' :
                         currentFilter.widgetType === 'bedroom_select' ? 'Select number of bedrooms' :
                         currentFilter.widgetType === 'property_type' ? 'Select property type' :
                         'Select an option'}
                      </p>
                    </div>
                    {isTabActive(currentFilter.filterKey, pending) && (
                      <button
                        onClick={() => clearTab(currentFilter.filterKey, setMultiP)}
                        className="text-sm font-semibold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {currentFilter.widgetType === 'toggle_boolean' ? (
                    <ToggleRow
                      label={`Enable ${currentFilter.label}`}
                      icon={currentFilter.icon}
                      checked={get(currentFilter.filterKey) === 'true'}
                      onChange={v => setP(currentFilter.filterKey, v ? 'true' : undefined)}
                      large
                    />
                  ) : (
                    <WidgetBody
                      filter={applyBuilderFilter(currentFilter, isBuilderCat)}
                      get={get}
                      push={setMultiP as any}
                      set1={setP}
                      propTypes={propTypes}
                      priceRanges={priceRanges}
                      amenityGroups={amenityGroups}
                      activeAmenityIds={activeAmenityIds}
                      builderInput={builderInput}
                      setBuilder={setBuilder}
                    />
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  Select a filter category
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-between gap-4 px-6 py-4 border-t border-gray-100 bg-gray-50/30">
          <div className="text-sm text-gray-500">
            {pendingCount > 0
              ? <span className="text-primary-700 font-semibold">{pendingCount} filter{pendingCount > 1 ? 's' : ''} applied</span>
              : 'No filters selected'}
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose}
              className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={applyAndClose}
              className="px-7 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors shadow-sm shadow-primary-600/20 flex items-center gap-2">
              {totalCount != null
                ? `Show ${totalCount.toLocaleString('en-IN')} Properties`
                : 'Apply Filters'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Mobile Filter Sheet ──────────────────────────────────────────────────────
// Full-screen with horizontal scrollable tabs at top

export function MobileFilterSheet({
  open: sheetOpen, onClose, totalCount, propCategory, propIsNewProject,
}: {
  open: boolean; onClose: () => void; totalCount?: number; propCategory?: string; propIsNewProject?: boolean;
}) {
  const router   = useRouter();
  const sp       = useSearchParams();
  const isBuilderCat = propIsNewProject || sp.get('isNewProject') === 'true' || BUILDER_ONLY_CATEGORIES.has(propCategory || sp.get('category') || '');
  const category = isBuilderCat && !(propCategory || sp.get('category')) ? 'new_projects' : (propCategory || sp.get('category') || 'buy');

  const { filters, propTypes, amenities, loading } = useFilterData(category);

  // Local pending state — only push to URL on "Show results"
  const [pending, setPending] = useState<Record<string, string>>({});
  const initialised = useRef(false);

  // Sync pending from URL on open
  useEffect(() => {
    if (!sheetOpen) { initialised.current = false; return; }
    if (initialised.current) return;
    const snapshot: Record<string, string> = {};
    ALL_FILTER_KEYS.forEach(k => { const v = sp.get(k); if (v) snapshot[k] = v; });
    setPending(snapshot);
    initialised.current = true;
  }, [sheetOpen, sp]);

  const [activeTab, setActiveTab] = useState<string>('');

  // Set initial tab to first filter
  useEffect(() => {
    if (filters.length && !activeTab) setActiveTab(filters[0].filterKey);
  }, [filters, activeTab]);

  const [builderInput, setBuilder] = useState(sp.get('builderName') || '');

  const get   = (k: string) => pending[k] ?? null;

  const setP  = (k: string, v: string | undefined) =>
    setPending(prev => {
      const next = { ...prev };
      if (v) next[k] = v; else delete next[k];
      return next;
    });

  const setMultiP = (updates: Record<string, string | undefined>) =>
    setPending(prev => {
      const next = { ...prev };
      Object.entries(updates).forEach(([k, v]) => v ? (next[k] = v) : delete next[k]);
      return next;
    });

  const clearAll = () => {
    setPending({});
    setBuilder('');
  };

  const applyAndClose = () => {
    const p = new URLSearchParams(sp.toString());
    // Remove all filter keys first
    ALL_FILTER_KEYS.forEach(k => p.delete(k));
    // Apply pending
    Object.entries(pending).forEach(([k, v]) => { if (v) p.set(k, v); });
    p.set('page', '1');
    router.push(`/properties?${p.toString()}`, { scroll: false });
    onClose();
  };

  const activeAmenityIds = (get('amenityIds') || '').split(',').filter(Boolean);
  const priceRanges      = category === 'rent' ? PRICE_RANGES_RENT : PRICE_RANGES_BUY;
  const amenityGroups    = groupBy(amenities, a => a.category || 'Other');

  const sectionFilters  = filters.filter(f => f.showOnMobile && f.widgetType !== 'toggle_boolean');
  const toggleFilters   = filters.filter(f => f.showOnMobile && f.widgetType === 'toggle_boolean');

  const pendingCount = Object.keys(pending).length;

  const currentFilter = [...sectionFilters, ...toggleFilters].find(f => f.filterKey === activeTab);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-[60] bg-black/50 transition-opacity duration-300',
          sheetOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Full screen sheet */}
      <div className={cn(
        'fixed inset-0 z-[61] bg-white flex flex-col',
        'transition-transform duration-300 ease-out',
        sheetOpen ? 'translate-y-0' : 'translate-y-full',
      )}>
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center">
                <span className="text-white text-sm">🎛</span>
              </div>
              <span className="font-bold text-gray-900 text-base">Filters</span>
              {pendingCount > 0 && (
                <span className="bg-primary-600 text-white text-xs font-bold h-5 min-w-[20px] px-1.5 rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <button onClick={clearAll} className="text-sm font-semibold text-red-500 px-3 py-1.5 rounded-xl active:bg-red-50">
                  Clear
                </button>
              )}
              <button onClick={onClose}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 active:bg-gray-200">
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Horizontal tab bar */}
          <div className="flex overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden px-3 pb-0 gap-1">
            {[...sectionFilters, ...toggleFilters].map(f => {
              const active   = isTabActive(f.filterKey, pending);
              const selected = activeTab === f.filterKey;
              return (
                <button
                  key={f.filterKey}
                  onClick={() => setActiveTab(f.filterKey)}
                  className={cn(
                    'flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-t-xl transition-colors relative whitespace-nowrap border-b-2',
                    selected
                      ? 'bg-primary-50 text-primary-700 border-primary-600'
                      : 'text-gray-500 hover:text-gray-700 border-transparent hover:bg-gray-50',
                  )}
                >
                  {f.icon && <span className="text-sm leading-none">{f.icon}</span>}
                  {f.label}
                  {active && !selected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                  )}
                  {active && selected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-600 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content area */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="space-y-3 w-48">
              {[1,2,3].map(i => <div key={i} className="h-3 bg-gray-200 rounded animate-pulse" />)}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {currentFilter && (
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                    {currentFilter.icon && <span className="text-xl">{currentFilter.icon}</span>}
                    {currentFilter.label}
                  </h3>
                  {isTabActive(currentFilter.filterKey, pending) && (
                    <button
                      onClick={() => clearTab(currentFilter.filterKey, setMultiP)}
                      className="text-sm font-semibold text-red-500 px-3 py-1.5 rounded-xl active:bg-red-50"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {currentFilter.widgetType === 'toggle_boolean' ? (
                  <ToggleRow
                    label={`Enable ${currentFilter.label}`}
                    icon={currentFilter.icon}
                    checked={get(currentFilter.filterKey) === 'true'}
                    onChange={v => setP(currentFilter.filterKey, v ? 'true' : undefined)}
                    large
                  />
                ) : (
                  <MobileWidget
                    filter={applyBuilderFilter(currentFilter, isBuilderCat)}
                    get={get}
                    setP={setP}
                    setMultiP={setMultiP}
                    propTypes={propTypes}
                    priceRanges={priceRanges}
                    amenityGroups={amenityGroups}
                    activeAmenityIds={activeAmenityIds}
                    builderInput={builderInput}
                    setBuilder={setBuilder}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white safe-area-pb">
          <button
            onClick={applyAndClose}
            className="w-full bg-primary-600 active:bg-primary-700 text-white font-bold py-4 rounded-2xl text-sm transition-colors shadow-md shadow-primary-600/20">
            {totalCount != null
              ? `Show ${totalCount.toLocaleString('en-IN')} Properties`
              : 'Apply Filters'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Mobile Widget ────────────────────────────────────────────────────────────

function MobileWidget({
  filter, get, setP, setMultiP,
  propTypes, priceRanges, amenityGroups,
  activeAmenityIds, builderInput, setBuilder,
}: {
  filter: ListingFilter;
  get: (k: string) => string | null;
  setP: (k: string, v: string | undefined) => void;
  setMultiP: (u: Record<string, string | undefined>) => void;
  propTypes: PropType[];
  priceRanges: { label: string; min: number; max?: number }[];
  amenityGroups: Record<string, Amenity[]>;
  activeAmenityIds: string[];
  builderInput: string;
  setBuilder: (v: string) => void;
}) {
  switch (filter.widgetType) {

    case 'price_range':
      return (
        <div className="grid grid-cols-2 gap-2">
          {priceRanges.map(r => {
            const active =
              get('minPrice') === String(r.min) &&
              get('maxPrice') === String(r.max ?? '');
            return (
              <MobileChip key={r.label} active={active}
                onClick={() => active
                  ? setMultiP({ minPrice: undefined, maxPrice: undefined })
                  : setMultiP({ minPrice: String(r.min), maxPrice: r.max ? String(r.max) : undefined })
                }
              >{r.label}</MobileChip>
            );
          })}
        </div>
      );

    case 'bedroom_select':
      return (
        <div className="grid grid-cols-3 gap-2">
          {BEDROOM_OPTIONS.map(opt => {
            const active = get('bedrooms') === opt.value;
            return (
              <MobileChip key={opt.value} active={active} tall
                onClick={() => setP('bedrooms', active ? undefined : opt.value)}
              >{opt.label}</MobileChip>
            );
          })}
        </div>
      );

    case 'property_type':
      return (
        <div className="space-y-1">
          {propTypes.map(t => {
            const active = get('type') === t.value;
            return (
              <button key={t.value}
                onClick={() => setP('type', active ? undefined : t.value)}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border transition-all active:scale-[0.99]',
                  active
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-200 text-gray-700 bg-white',
                )}
              >
                <span className="text-sm font-medium">{t.label}</span>
                <span className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                  active ? 'bg-primary-600 border-primary-600' : 'border-gray-300',
                )}>
                  {active && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
              </button>
            );
          })}
        </div>
      );

    case 'area_range':
      return (
        <div className="grid grid-cols-2 gap-2">
          {AREA_RANGES.map(r => {
            const active =
              get('minArea') === String(r.min ?? '') &&
              get('maxArea') === String(r.max ?? '');
            return (
              <MobileChip key={r.label} active={active}
                onClick={() => active
                  ? setMultiP({ minArea: undefined, maxArea: undefined })
                  : setMultiP({
                      minArea: r.min != null ? String(r.min) : undefined,
                      maxArea: r.max != null ? String(r.max) : undefined,
                    })
                }
              >{r.label}</MobileChip>
            );
          })}
        </div>
      );

    case 'option_select':
      return (
        <div className="grid grid-cols-2 gap-2">
          {(filter.optionsJson || []).map(opt => {
            const active = get(filter.filterKey) === opt.value;
            return (
              <MobileChip key={opt.value} active={active} tall
                onClick={() => setP(filter.filterKey, active ? undefined : opt.value)}
              >{opt.label}</MobileChip>
            );
          })}
        </div>
      );

    case 'amenity_picker': {
      const groups = Object.entries(amenityGroups);
      if (!groups.length) return <p className="text-sm text-gray-400 italic">No amenities</p>;
      return (
        <div className="space-y-4">
          {groups.map(([group, items]) => (
            <div key={group}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2.5">{group}</p>
              <div className="flex flex-wrap gap-2">
                {items.map(a => {
                  const active = activeAmenityIds.includes(a.id);
                  const cur = (get('amenityIds') || '').split(',').filter(Boolean);
                  return (
                    <button key={a.id}
                      onClick={() => {
                        const next = active ? cur.filter(i => i !== a.id) : [...cur, a.id];
                        setP('amenityIds', next.length ? next.join(',') : undefined);
                      }}
                      className={cn(
                        'px-3 py-2 rounded-xl text-xs font-medium border transition-all active:scale-95',
                        active
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-gray-200 text-gray-600 bg-white',
                      )}
                    >{a.name}</button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }

    case 'text_input':
      return (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={builderInput}
              onChange={e => setBuilder(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') setP(filter.filterKey, builderInput || undefined);
              }}
              placeholder={`Search ${filter.label.toLowerCase()}…`}
              className="w-full pl-11 pr-4 py-3.5 border border-gray-200 rounded-2xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-gray-50"
            />
          </div>
          <button
            onClick={() => setP(filter.filterKey, builderInput || undefined)}
            className="w-full bg-primary-50 text-primary-700 font-semibold py-3.5 rounded-2xl text-sm border border-primary-100 active:bg-primary-100"
          >
            Search {filter.label}
          </button>
        </div>
      );

    default:
      return null;
  }
}

// ─── MobileChip ───────────────────────────────────────────────────────────────

function MobileChip({
  active, onClick, children, tall = false,
}: {
  active: boolean; onClick: () => void;
  children: React.ReactNode; tall?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-2xl border text-sm font-medium transition-all active:scale-95 text-center leading-tight',
        tall ? 'py-3.5 px-3' : 'py-3 px-3',
        active
          ? 'bg-primary-600 text-white border-primary-600 shadow-sm shadow-primary-200'
          : 'border-gray-200 text-gray-700 bg-white',
      )}
    >
      {children}
    </button>
  );
}

// ─── ToggleRow ────────────────────────────────────────────────────────────────

function ToggleRow({
  label, icon, checked, onChange, large = false,
}: {
  label: string; icon: string | null; checked: boolean;
  onChange: (v: boolean) => void; large?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'w-full flex items-center justify-between rounded-2xl border transition-all p-3.5 active:scale-[0.99]',
        large ? '' : '',
        checked
          ? 'border-primary-300 bg-primary-50'
          : 'border-gray-200 bg-white',
      )}
    >
      <div className="flex items-center gap-3">
        {icon && <span className="text-xl leading-none">{icon}</span>}
        <span className={cn(
          'font-medium',
          large ? 'text-sm text-gray-800' : 'text-xs text-gray-700',
          checked && 'text-primary-700',
        )}>
          {label}
        </span>
      </div>
      <div className={cn(
        'relative rounded-full transition-all duration-200 flex-shrink-0',
        large ? 'w-12 h-6' : 'w-9 h-5',
        checked ? 'bg-primary-600' : 'bg-gray-200',
      )}>
        <span className={cn(
          'absolute top-0.5 bg-white rounded-full shadow transition-all duration-200',
          large ? 'w-5 h-5' : 'w-4 h-4',
          checked
            ? large ? 'left-[26px]' : 'left-[18px]'
            : 'left-0.5',
        )} />
      </div>
    </button>
  );
}

// ─── Shared widget body (desktop) ─────────────────────────────────────────────

function WidgetBody({
  filter, get, push, set1,
  propTypes, priceRanges, amenityGroups,
  activeAmenityIds, builderInput, setBuilder,
}: {
  filter: ListingFilter;
  get:    (k: string) => string | null;
  push:   (u: Record<string, string | undefined>) => void;
  set1:   (k: string, v: string | undefined) => void;
  propTypes: PropType[];
  priceRanges: { label: string; min: number; max?: number }[];
  amenityGroups: Record<string, Amenity[]>;
  activeAmenityIds: string[];
  builderInput: string;
  setBuilder: (v: string) => void;
}) {
  switch (filter.widgetType) {

    case 'price_range':
      return (
        <div className="grid grid-cols-2 gap-1.5">
          {priceRanges.map(r => {
            const active =
              get('minPrice') === String(r.min) &&
              get('maxPrice') === String(r.max ?? '');
            return (
              <Chip key={r.label} active={active}
                onClick={() => active
                  ? push({ minPrice: undefined, maxPrice: undefined })
                  : push({ minPrice: String(r.min), maxPrice: r.max ? String(r.max) : undefined })
                }>{r.label}</Chip>
            );
          })}
        </div>
      );

    case 'bedroom_select':
      return (
        <div className="flex flex-wrap gap-1.5">
          {BEDROOM_OPTIONS.map(o => {
            const active = get('bedrooms') === o.value;
            return <Chip key={o.value} active={active}
              onClick={() => set1('bedrooms', active ? undefined : o.value)}>{o.label}</Chip>;
          })}
        </div>
      );

    case 'property_type':
      return propTypes.length === 0
        ? <p className="text-xs text-gray-400 italic">None configured</p>
        : (
          <div className="space-y-0.5 max-h-52 overflow-y-auto pr-0.5">
            {propTypes.map(t => {
              const active = get('type') === t.value;
              return (
                <button key={t.value}
                  onClick={() => set1('type', active ? undefined : t.value)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-colors',
                    active ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-50',
                  )}
                >
                  <span className={cn(
                    'w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                    active ? 'bg-primary-600 border-primary-600' : 'border-gray-300',
                  )}>
                    {active && <CheckCircle className="w-3 h-3 text-white" />}
                  </span>
                  {t.label}
                </button>
              );
            })}
          </div>
        );

    case 'area_range':
      return (
        <div className="grid grid-cols-2 gap-1.5">
          {AREA_RANGES.map(r => {
            const active =
              get('minArea') === String(r.min ?? '') &&
              get('maxArea') === String(r.max ?? '');
            return (
              <Chip key={r.label} active={active}
                onClick={() => active
                  ? push({ minArea: undefined, maxArea: undefined })
                  : push({ minArea: r.min != null ? String(r.min) : undefined, maxArea: r.max != null ? String(r.max) : undefined })
                }>{r.label}</Chip>
            );
          })}
        </div>
      );

    case 'option_select': {
      const opts = filter.optionsJson || [];
      if (opts.length >= 5) {
        // Scrollable vertical list for long option sets (e.g. possession status)
        return (
          <div className="space-y-0.5 max-h-48 overflow-y-auto pr-0.5">
            {opts.map(o => {
              const active = get(filter.filterKey) === o.value;
              return (
                <button key={o.value}
                  onClick={() => set1(filter.filterKey, active ? undefined : o.value)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-colors',
                    active ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-gray-600 hover:bg-gray-50',
                  )}
                >
                  <span className={cn(
                    'w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors',
                    active ? 'bg-primary-600 border-primary-600' : 'border-gray-300',
                  )}>
                    {active && <CheckCircle className="w-3 h-3 text-white" />}
                  </span>
                  {o.label}
                </button>
              );
            })}
          </div>
        );
      }
      return (
        <div className="flex flex-wrap gap-1.5">
          {opts.map(o => {
            const active = get(filter.filterKey) === o.value;
            return <Chip key={o.value} active={active}
              onClick={() => set1(filter.filterKey, active ? undefined : o.value)}>{o.label}</Chip>;
          })}
        </div>
      );
    }

    case 'amenity_picker': {
      const groups = Object.entries(amenityGroups);
      if (!groups.length) return <p className="text-xs text-gray-400 italic">No amenities</p>;
      return (
        <div className="space-y-3 max-h-60 overflow-y-auto pr-0.5">
          {groups.map(([group, items]) => (
            <div key={group}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">{group}</p>
              <div className="flex flex-wrap gap-1">
                {items.map(a => {
                  const active = activeAmenityIds.includes(a.id);
                  return (
                    <button key={a.id}
                      onClick={() => {
                        const cur = activeAmenityIds;
                        const next = active ? cur.filter(i => i !== a.id) : [...cur, a.id];
                        set1('amenityIds', next.length ? next.join(',') : undefined);
                      }}
                      className={cn(
                        'px-2.5 py-1.5 rounded-full text-[11px] font-medium border transition-all',
                        active
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-gray-200 text-gray-500 bg-gray-50 hover:border-primary-300 hover:text-primary-600',
                      )}
                    >{a.name}</button>
                  );
                })}
              </div>
            </div>
          ))}
          {activeAmenityIds.length > 0 && (
            <button onClick={() => set1('amenityIds', undefined)}
              className="text-[11px] text-red-500 font-medium hover:text-red-700">
              Clear amenities
            </button>
          )}
        </div>
      );
    }

    case 'text_input':
      return (
        <div className="space-y-1.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input type="text" value={builderInput}
              onChange={e => setBuilder(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && set1(filter.filterKey, builderInput || undefined)}
              placeholder={`Search ${filter.label.toLowerCase()}…`}
              className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-gray-50"
            />
          </div>
          <button onClick={() => set1(filter.filterKey, builderInput || undefined)}
            className="w-full text-xs bg-primary-50 hover:bg-primary-100 text-primary-700 font-semibold py-2.5 rounded-xl border border-primary-100 transition-colors">
            Search {filter.label}
          </button>
          {get(filter.filterKey) && (
            <button onClick={() => { set1(filter.filterKey, undefined); setBuilder(''); }}
              className="text-[11px] text-red-500 hover:text-red-700">Clear</button>
          )}
        </div>
      );

    default: return null;
  }
}

// ─── Desktop Chip ─────────────────────────────────────────────────────────────

function Chip({ active, onClick, children }: {
  active: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button onClick={onClick}
      className={cn(
        'px-3 py-2 text-xs font-medium rounded-xl border transition-all text-left leading-tight',
        active
          ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
          : 'border-gray-200 text-gray-600 bg-gray-50/80 hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50',
      )}
    >{children}</button>
  );
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function groupBy<T>(arr: T[], key: (item: T) => string): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = key(item);
    (acc[k] = acc[k] || []).push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

function isTabActive(filterKey: string, pending: Record<string, string>): boolean {
  if (filterKey === 'budget') return 'minPrice' in pending || 'maxPrice' in pending;
  if (filterKey === 'area')   return 'minArea'  in pending || 'maxArea'  in pending;
  return filterKey in pending;
}

function clearTab(filterKey: string, setMultiP: (u: Record<string, string | undefined>) => void) {
  if (filterKey === 'budget') { setMultiP({ minPrice: undefined, maxPrice: undefined }); return; }
  if (filterKey === 'area')   { setMultiP({ minArea: undefined,  maxArea: undefined });  return; }
  setMultiP({ [filterKey]: undefined });
}
