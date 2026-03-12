'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRICE_RANGES_BUY, PRICE_RANGES_RENT } from '@/lib/utils';
import { propertyConfigApi, propertiesApi } from '@/lib/api';

interface FilterPanelProps {
  className?: string;
}

const BEDROOM_OPTIONS = [
  { value: '1', label: '1 BHK' },
  { value: '2', label: '2 BHK' },
  { value: '3', label: '3 BHK' },
  { value: '4', label: '4 BHK' },
  { value: '5+', label: '5+ BHK' },
];

const AREA_RANGES = [
  { label: 'Up to 500 sqft', max: 500 },
  { label: '500 – 1000 sqft', min: 500, max: 1000 },
  { label: '1000 – 1500 sqft', min: 1000, max: 1500 },
  { label: '1500 – 2000 sqft', min: 1500, max: 2000 },
  { label: '2000 – 3000 sqft', min: 2000, max: 3000 },
  { label: '3000+ sqft', min: 3000 },
];

const FURNISHING_OPTIONS = [
  { value: 'furnished', label: 'Furnished' },
  { value: 'semi_furnished', label: 'Semi-Furnished' },
  { value: 'unfurnished', label: 'Unfurnished' },
];

const POSSESSION_OPTIONS = [
  { value: 'ready_to_move', label: 'Ready to Move' },
  { value: 'under_construction', label: 'Under Construction' },
];

const POSTED_BY_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'agent', label: 'Agent' },
  { value: 'builder', label: 'Builder' },
];

export default function FilterPanel({ className }: FilterPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || 'buy';

  const [propTypes, setPropTypes] = useState<{ value: string; label: string }[]>([]);
  const [amenities, setAmenities] = useState<{ id: string; name: string; category: string }[]>([]);
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
    budget: true,
    bedrooms: true,
    type: false,
    area: false,
    amenities: false,
    furnishing: false,
    possession: false,
    postedBy: false,
    builder: false,
  });

  const toggle = (key: string) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const current = (key: string) => searchParams.get(key);

  const applyFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    router.push(`/properties?${params.toString()}`, { scroll: false });
  };

  const applyMultiFilter = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.set('page', '1');
    router.push(`/properties?${params.toString()}`, { scroll: false });
  };

  const toggleAmenity = (amenityId: string) => {
    const currentIds = current('amenityIds')?.split(',').filter(Boolean) || [];
    const newIds = currentIds.includes(amenityId)
      ? currentIds.filter((id) => id !== amenityId)
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
  ];
  const hasActiveFilters = FILTER_KEYS.some((k) => searchParams.has(k));

  // Group amenities by category
  const amenityGroups = amenities.reduce((acc, a) => {
    const cat = a.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(a);
    return acc;
  }, {} as Record<string, typeof amenities>);

  return (
    <aside className={cn('bg-white rounded-xl border border-gray-100 shadow-sm', className)}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 font-semibold text-gray-800">
          <SlidersHorizontal className="w-4 h-4 text-primary-600" />
          Filters
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-primary-600 hover:underline flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      <div className="divide-y divide-gray-100">
        {/* Budget */}
        <FilterSection title="Budget" open={openSections.budget} onToggle={() => toggle('budget')}>
          <div className="space-y-1.5">
            {priceRanges.map((range) => {
              const isActive =
                current('minPrice') === String(range.min) &&
                current('maxPrice') === String(range.max ?? '');
              return (
                <button
                  key={range.label}
                  onClick={() => {
                    if (isActive) {
                      applyMultiFilter({ minPrice: undefined, maxPrice: undefined });
                    } else {
                      applyMultiFilter({
                        minPrice: String(range.min),
                        maxPrice: range.max ? String(range.max) : undefined,
                      });
                    }
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50',
                  )}
                >
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary-600 inline-block mr-2" />}
                  {range.label}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* Bedrooms (only for buy/rent) */}
        {category !== 'commercial' && (
          <FilterSection title="BHK / Bedrooms" open={openSections.bedrooms} onToggle={() => toggle('bedrooms')}>
            <div className="flex flex-wrap gap-2">
              {BEDROOM_OPTIONS.map((bed) => {
                const isActive = current('bedrooms') === bed.value;
                return (
                  <button
                    key={bed.value}
                    onClick={() => applyFilter('bedrooms', isActive ? undefined : bed.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                      isActive
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-600',
                    )}
                  >
                    {bed.label}
                  </button>
                );
              })}
            </div>
          </FilterSection>
        )}

        {/* Property Type */}
        <FilterSection title="Property Type" open={openSections.type} onToggle={() => toggle('type')}>
          <div className="space-y-1.5">
            {propTypes.map((type) => {
              const isActive = current('type') === type.value;
              return (
                <button
                  key={type.value}
                  onClick={() => applyFilter('type', isActive ? undefined : type.value)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50',
                  )}
                >
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary-600 flex-shrink-0" />}
                  {type.label}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* Area */}
        <FilterSection title="Area (sqft)" open={openSections.area} onToggle={() => toggle('area')}>
          <div className="space-y-1.5">
            {AREA_RANGES.map((range) => {
              const isActive =
                current('minArea') === String(range.min ?? '') &&
                current('maxArea') === String(range.max ?? '');
              return (
                <button
                  key={range.label}
                  onClick={() => {
                    if (isActive) {
                      applyMultiFilter({ minArea: undefined, maxArea: undefined });
                    } else {
                      applyMultiFilter({
                        minArea: range.min != null ? String(range.min) : undefined,
                        maxArea: range.max != null ? String(range.max) : undefined,
                      });
                    }
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50',
                  )}
                >
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary-600 inline-block mr-2" />}
                  {range.label}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* Amenities */}
        {amenities.length > 0 && (
          <FilterSection title="Amenities" open={openSections.amenities} onToggle={() => toggle('amenities')}>
            <div className="space-y-3">
              {Object.entries(amenityGroups).slice(0, 3).map(([group, items]) => (
                <div key={group}>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">{group}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((a) => {
                      const isActive = activeAmenityIds.includes(a.id);
                      return (
                        <button
                          key={a.id}
                          onClick={() => toggleAmenity(a.id)}
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                            isActive
                              ? 'bg-primary-600 text-white border-primary-600'
                              : 'border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-600',
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
                  className="text-xs text-red-500 hover:text-red-700 mt-1"
                >
                  Clear amenities
                </button>
              )}
            </div>
          </FilterSection>
        )}

        {/* Furnishing */}
        {category !== 'commercial' && (
          <FilterSection title="Furnishing" open={openSections.furnishing} onToggle={() => toggle('furnishing')}>
            <div className="space-y-1.5">
              {FURNISHING_OPTIONS.map((opt) => {
                const isActive = current('furnishingStatus') === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => applyFilter('furnishingStatus', isActive ? undefined : opt.value)}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50',
                    )}
                  >
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary-600 inline-block mr-2" />}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </FilterSection>
        )}

        {/* Possession */}
        <FilterSection title="Possession Status" open={openSections.possession} onToggle={() => toggle('possession')}>
          <div className="space-y-1.5">
            {POSSESSION_OPTIONS.map((opt) => {
              const isActive = current('possessionStatus') === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => applyFilter('possessionStatus', isActive ? undefined : opt.value)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50',
                  )}
                >
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-primary-600 inline-block mr-2" />}
                  {opt.label}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* Posted By */}
        <FilterSection title="Posted By" open={openSections.postedBy} onToggle={() => toggle('postedBy')}>
          <div className="flex flex-wrap gap-2">
            {POSTED_BY_OPTIONS.map((opt) => {
              const isActive = current('listedBy') === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => applyFilter('listedBy', isActive ? undefined : opt.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                    isActive
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-gray-200 text-gray-600 hover:border-primary-400 hover:text-primary-600',
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* Builder / Developer */}
        <FilterSection title="Builder / Developer" open={openSections.builder} onToggle={() => toggle('builder')}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              value={builderInput}
              onChange={(e) => setBuilderInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applyFilter('builderName', builderInput || undefined);
              }}
              placeholder="e.g. DLF, Sobha, Godrej"
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400"
            />
          </div>
          <button
            onClick={() => applyFilter('builderName', builderInput || undefined)}
            className="mt-2 w-full text-sm bg-gray-50 hover:bg-gray-100 text-gray-700 py-1.5 rounded-lg transition-colors"
          >
            Apply
          </button>
          {current('builderName') && (
            <button
              onClick={() => { applyFilter('builderName', undefined); setBuilderInput(''); }}
              className="mt-1 text-xs text-red-500 hover:text-red-700"
            >
              Clear builder filter
            </button>
          )}
        </FilterSection>

        {/* Verified Only */}
        <div className="px-4 py-3 space-y-2.5">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={current('isVerified') === 'true'}
              onChange={(e) => applyFilter('isVerified', e.target.checked ? 'true' : undefined)}
              className="w-4 h-4 rounded text-primary-600 accent-primary-600"
            />
            <span className="text-sm font-medium text-gray-700">Verified Properties Only</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={current('isNewProject') === 'true'}
              onChange={(e) => applyFilter('isNewProject', e.target.checked ? 'true' : undefined)}
              className="w-4 h-4 rounded text-primary-600 accent-primary-600"
            />
            <span className="text-sm font-medium text-gray-700">New Projects Only</span>
          </label>
        </div>
      </div>
    </aside>
  );
}

function FilterSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3">
      <button
        className="w-full flex items-center justify-between text-sm font-semibold text-gray-800 mb-2"
        onClick={onToggle}
      >
        {title}
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open && children}
    </div>
  );
}
