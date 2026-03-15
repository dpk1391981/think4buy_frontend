'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  SlidersHorizontal, X, ChevronDown, ChevronUp, Search,
  IndianRupee, BedDouble, Home, Maximize2, Star, Sofa,
  KeyRound, User, Building2, CheckCircle, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRICE_RANGES_BUY, PRICE_RANGES_RENT } from '@/lib/utils';
import { propertyConfigApi, propertiesApi } from '@/lib/api';

interface FilterPanelProps {
  className?: string;
}

const BEDROOM_OPTIONS = [
  { value: '1', label: '1 RK' },
  { value: '2', label: '2 BHK' },
  { value: '3', label: '3 BHK' },
  { value: '4', label: '4 BHK' },
  { value: '5', label: '5+ BHK' },
];

const AREA_RANGES = [
  { label: '< 500',      max: 500 },
  { label: '500–1000',   min: 500,  max: 1000 },
  { label: '1000–1500',  min: 1000, max: 1500 },
  { label: '1500–2000',  min: 1500, max: 2000 },
  { label: '2000–3000',  min: 2000, max: 3000 },
  { label: '3000+ sqft', min: 3000 },
];

const FURNISHING_OPTIONS = [
  { value: 'furnished',      label: 'Furnished' },
  { value: 'semi_furnished', label: 'Semi' },
  { value: 'unfurnished',    label: 'Unfurnished' },
];

const POSSESSION_OPTIONS = [
  { value: 'ready_to_move',      label: 'Ready to Move' },
  { value: 'under_construction', label: 'Under Construction' },
];

const POSTED_BY_OPTIONS = [
  { value: 'owner',   label: 'Owner' },
  { value: 'agent',   label: 'Agent' },
  { value: 'builder', label: 'Builder' },
];

const SECTION_ICONS: Record<string, React.ElementType> = {
  budget:     IndianRupee,
  bedrooms:   BedDouble,
  type:       Home,
  area:       Maximize2,
  amenities:  Sparkles,
  furnishing: Sofa,
  possession: KeyRound,
  postedBy:   User,
  builder:    Building2,
};

export default function FilterPanel({ className }: FilterPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || 'buy';

  const [propTypes, setPropTypes]   = useState<{ value: string; label: string }[]>([]);
  const [amenities, setAmenities]   = useState<{ id: string; name: string; category: string }[]>([]);
  const [builderInput, setBuilderInput] = useState(searchParams.get('builderName') || '');

  useEffect(() => {
    propertyConfigApi.getTypesBySlug(category)
      .then(({ data }) => setPropTypes(data.map((t: any) => ({ value: t.slug, label: t.name }))))
      .catch(() => setPropTypes([]));
    propertiesApi.getAmenities()
      .then(({ data }) => setAmenities(data))
      .catch(() => setAmenities([]));
  }, [category]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    budget:     true,
    bedrooms:   true,
    type:       true,
    area:       false,
    amenities:  false,
    furnishing: false,
    possession: false,
    postedBy:   false,
    builder:    false,
  });

  const toggle = (key: string) =>
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));

  const current = (key: string) => searchParams.get(key);

  const applyFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.set('page', '1');
    router.push(`/properties?${params.toString()}`, { scroll: false });
  };

  const applyMultiFilter = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value); else params.delete(key);
    }
    params.set('page', '1');
    router.push(`/properties?${params.toString()}`, { scroll: false });
  };

  const toggleAmenity = (amenityId: string) => {
    const currentIds = current('amenityIds')?.split(',').filter(Boolean) || [];
    const newIds = currentIds.includes(amenityId)
      ? currentIds.filter(id => id !== amenityId)
      : [...currentIds, amenityId];
    applyFilter('amenityIds', newIds.length > 0 ? newIds.join(',') : undefined);
  };

  const clearAll = () => {
    const params = new URLSearchParams();
    if (searchParams.get('category')) params.set('category', searchParams.get('category')!);
    if (searchParams.get('city')) params.set('city', searchParams.get('city')!);
    router.push(`/properties?${params.toString()}`);
    setBuilderInput('');
  };

  const priceRanges = category === 'rent' ? PRICE_RANGES_RENT : PRICE_RANGES_BUY;
  const activeAmenityIds = current('amenityIds')?.split(',').filter(Boolean) || [];

  const FILTER_KEYS = [
    'minPrice', 'maxPrice', 'bedrooms', 'type', 'furnishingStatus',
    'possessionStatus', 'minArea', 'maxArea', 'amenityIds', 'listedBy', 'builderName',
    'isVerified', 'isNewProject',
  ];
  const hasActiveFilters = FILTER_KEYS.some(k => searchParams.has(k));
  const activeCount = FILTER_KEYS.filter(k => searchParams.has(k)).length;

  const amenityGroups = amenities.reduce((acc, a) => {
    const cat = a.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {} as Record<string, typeof amenities>);

  return (
    <aside className={cn(
      'bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden',
      className,
    )}>
      {/* ── Header ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-white" />
          <span className="font-bold text-white text-sm">Filters</span>
          {activeCount > 0 && (
            <span className="bg-white text-primary-700 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="flex items-center gap-1 text-xs text-white/80 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Reset
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-50">

        {/* ── Budget ─────────────────────────────────────── */}
        <Section
          title="Budget"
          sectionKey="budget"
          open={openSections.budget}
          onToggle={() => toggle('budget')}
          active={!!(current('minPrice') || current('maxPrice'))}
        >
          <div className="grid grid-cols-2 gap-1.5">
            {priceRanges.map(range => {
              const isActive =
                current('minPrice') === String(range.min) &&
                current('maxPrice') === String(range.max ?? '');
              return (
                <button
                  key={range.label}
                  onClick={() =>
                    isActive
                      ? applyMultiFilter({ minPrice: undefined, maxPrice: undefined })
                      : applyMultiFilter({
                          minPrice: String(range.min),
                          maxPrice: range.max ? String(range.max) : undefined,
                        })
                  }
                  className={cn(
                    'px-2 py-2 rounded-lg text-xs font-medium transition-all text-left leading-tight border',
                    isActive
                      ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-600 bg-gray-50',
                  )}
                >
                  {range.label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── BHK ────────────────────────────────────────── */}
        {category !== 'commercial' && (
          <Section
            title="BHK / Bedrooms"
            sectionKey="bedrooms"
            open={openSections.bedrooms}
            onToggle={() => toggle('bedrooms')}
            active={!!current('bedrooms')}
          >
            <div className="flex flex-wrap gap-1.5">
              {BEDROOM_OPTIONS.map(bed => {
                const isActive = current('bedrooms') === bed.value;
                return (
                  <button
                    key={bed.value}
                    onClick={() => applyFilter('bedrooms', isActive ? undefined : bed.value)}
                    className={cn(
                      'px-3 py-2 rounded-xl text-xs font-bold border transition-all',
                      isActive
                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                        : 'border-gray-200 text-gray-600 bg-gray-50 hover:border-primary-400 hover:text-primary-600',
                    )}
                  >
                    {bed.label}
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── Property Type ───────────────────────────────── */}
        <Section
          title="Property Type"
          sectionKey="type"
          open={openSections.type}
          onToggle={() => toggle('type')}
          active={!!current('type')}
        >
          <div className="space-y-1">
            {propTypes.map(type => {
              const isActive = current('type') === type.value;
              return (
                <button
                  key={type.value}
                  onClick={() => applyFilter('type', isActive ? undefined : type.value)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50',
                  )}
                >
                  <span className={cn(
                    'w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all',
                    isActive ? 'bg-primary-600 border-primary-600' : 'border-gray-300',
                  )}>
                    {isActive && <CheckCircle className="w-3 h-3 text-white" />}
                  </span>
                  {type.label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Area ────────────────────────────────────────── */}
        <Section
          title="Area (sqft)"
          sectionKey="area"
          open={openSections.area}
          onToggle={() => toggle('area')}
          active={!!(current('minArea') || current('maxArea'))}
        >
          <div className="grid grid-cols-2 gap-1.5">
            {AREA_RANGES.map(range => {
              const isActive =
                current('minArea') === String(range.min ?? '') &&
                current('maxArea') === String(range.max ?? '');
              return (
                <button
                  key={range.label}
                  onClick={() =>
                    isActive
                      ? applyMultiFilter({ minArea: undefined, maxArea: undefined })
                      : applyMultiFilter({
                          minArea: range.min != null ? String(range.min) : undefined,
                          maxArea: range.max != null ? String(range.max) : undefined,
                        })
                  }
                  className={cn(
                    'px-2 py-2 rounded-lg text-xs font-medium transition-all text-left leading-tight border',
                    isActive
                      ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-600 bg-gray-50',
                  )}
                >
                  {range.label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Furnishing ──────────────────────────────────── */}
        {category !== 'commercial' && (
          <Section
            title="Furnishing"
            sectionKey="furnishing"
            open={openSections.furnishing}
            onToggle={() => toggle('furnishing')}
            active={!!current('furnishingStatus')}
          >
            <div className="flex flex-wrap gap-1.5">
              {FURNISHING_OPTIONS.map(opt => {
                const isActive = current('furnishingStatus') === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => applyFilter('furnishingStatus', isActive ? undefined : opt.value)}
                    className={cn(
                      'px-3 py-2 rounded-xl text-xs font-medium border transition-all',
                      isActive
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-gray-200 text-gray-600 bg-gray-50 hover:border-primary-400 hover:text-primary-600',
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── Possession ──────────────────────────────────── */}
        <Section
          title="Possession"
          sectionKey="possession"
          open={openSections.possession}
          onToggle={() => toggle('possession')}
          active={!!current('possessionStatus')}
        >
          <div className="space-y-1.5">
            {POSSESSION_OPTIONS.map(opt => {
              const isActive = current('possessionStatus') === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => applyFilter('possessionStatus', isActive ? undefined : opt.value)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'text-gray-600 hover:bg-gray-50',
                  )}
                >
                  <span className={cn(
                    'w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all',
                    isActive ? 'bg-primary-600 border-primary-600' : 'border-gray-300',
                  )}>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Posted By ───────────────────────────────────── */}
        <Section
          title="Posted By"
          sectionKey="postedBy"
          open={openSections.postedBy}
          onToggle={() => toggle('postedBy')}
          active={!!current('listedBy')}
        >
          <div className="flex flex-wrap gap-1.5">
            {POSTED_BY_OPTIONS.map(opt => {
              const isActive = current('listedBy') === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => applyFilter('listedBy', isActive ? undefined : opt.value)}
                  className={cn(
                    'px-3 py-2 rounded-xl text-xs font-medium border transition-all',
                    isActive
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-gray-200 text-gray-600 bg-gray-50 hover:border-primary-400 hover:text-primary-600',
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Amenities ───────────────────────────────────── */}
        {amenities.length > 0 && (
          <Section
            title="Amenities"
            sectionKey="amenities"
            open={openSections.amenities}
            onToggle={() => toggle('amenities')}
            active={activeAmenityIds.length > 0}
          >
            <div className="space-y-2.5">
              {Object.entries(amenityGroups).slice(0, 3).map(([group, items]) => (
                <div key={group}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{group}</p>
                  <div className="flex flex-wrap gap-1">
                    {items.map(a => {
                      const isActive = activeAmenityIds.includes(a.id);
                      return (
                        <button
                          key={a.id}
                          onClick={() => toggleAmenity(a.id)}
                          className={cn(
                            'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all',
                            isActive
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'border-gray-200 text-gray-500 bg-gray-50 hover:border-primary-300 hover:text-primary-600',
                          )}
                        >
                          {a.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {activeAmenityIds.length > 0 && (
                <button
                  onClick={() => applyFilter('amenityIds', undefined)}
                  className="text-[11px] text-red-500 hover:text-red-700 font-medium"
                >
                  Clear amenities
                </button>
              )}
            </div>
          </Section>
        )}

        {/* ── Builder ─────────────────────────────────────── */}
        <Section
          title="Builder / Developer"
          sectionKey="builder"
          open={openSections.builder}
          onToggle={() => toggle('builder')}
          active={!!current('builderName')}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={builderInput}
              onChange={e => setBuilderInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') applyFilter('builderName', builderInput || undefined);
              }}
              placeholder="e.g. DLF, Sobha, Godrej"
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-xl text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-gray-50"
            />
          </div>
          <button
            onClick={() => applyFilter('builderName', builderInput || undefined)}
            className="mt-1.5 w-full text-xs bg-primary-50 hover:bg-primary-100 text-primary-700 font-semibold py-2 rounded-xl transition-colors border border-primary-100"
          >
            Search Builder
          </button>
          {current('builderName') && (
            <button
              onClick={() => { applyFilter('builderName', undefined); setBuilderInput(''); }}
              className="mt-1 text-[11px] text-red-500 hover:text-red-700"
            >
              Clear builder filter
            </button>
          )}
        </Section>

        {/* ── Quick Toggles ────────────────────────────────── */}
        <div className="px-4 py-3 space-y-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Quick Filters</p>
          <ToggleRow
            label="Verified Only"
            icon={<CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
            checked={current('isVerified') === 'true'}
            onChange={v => applyFilter('isVerified', v ? 'true' : undefined)}
          />
          <ToggleRow
            label="New Projects"
            icon={<Star className="w-3.5 h-3.5 text-amber-500" />}
            checked={current('isNewProject') === 'true'}
            onChange={v => applyFilter('isNewProject', v ? 'true' : undefined)}
          />
        </div>

      </div>
    </aside>
  );
}

// ── Section component ─────────────────────────────────────────────────────────
function Section({
  title, sectionKey, open, onToggle, active, children,
}: {
  title: string;
  sectionKey: string;
  open: boolean;
  onToggle: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  const Icon = SECTION_ICONS[sectionKey];
  return (
    <div className="px-4 py-3">
      <button
        className="w-full flex items-center justify-between mb-0 group"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className={cn('w-3.5 h-3.5', active ? 'text-primary-600' : 'text-gray-400')} />}
          <span className={cn('text-xs font-bold uppercase tracking-wide', active ? 'text-primary-700' : 'text-gray-600')}>
            {title}
          </span>
          {active && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
          )}
        </div>
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
          : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
      </button>
      {open && <div className="mt-2.5">{children}</div>}
    </div>
  );
}

// ── Toggle row ─────────────────────────────────────────────────────────────
function ToggleRow({
  label, icon, checked, onChange,
}: {
  label: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer group py-0.5">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-gray-700 group-hover:text-primary-700 transition-colors">
          {label}
        </span>
      </div>
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-9 h-5 rounded-full transition-all duration-200 flex-shrink-0',
          checked ? 'bg-primary-600' : 'bg-gray-200',
        )}
      >
        <span className={cn(
          'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-200',
          checked ? 'left-[18px]' : 'left-0.5',
        )} />
      </div>
    </label>
  );
}
