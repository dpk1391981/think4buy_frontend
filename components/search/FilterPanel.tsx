'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRICE_RANGES_BUY, PRICE_RANGES_RENT } from '@/lib/utils';
import { propertyConfigApi } from '@/lib/api';

interface FilterPanelProps {
  className?: string;
}

const BEDROOM_OPTIONS = ['1', '2', '3', '4', '5+'];

const FURNISHING_OPTIONS = [
  { value: 'furnished', label: 'Furnished' },
  { value: 'semi_furnished', label: 'Semi-Furnished' },
  { value: 'unfurnished', label: 'Unfurnished' },
];

const POSSESSION_OPTIONS = [
  { value: 'ready_to_move', label: 'Ready to Move' },
  { value: 'under_construction', label: 'Under Construction' },
];

interface FilterSection {
  title: string;
  key: string;
  defaultOpen?: boolean;
}

export default function FilterPanel({ className }: FilterPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get('category') || 'buy';

  const [propTypes, setPropTypes] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    propertyConfigApi.getTypesBySlug(category).then(({ data }) => {
      setPropTypes(data.map((t: any) => ({ value: t.slug, label: t.name })));
    }).catch(() => setPropTypes([]));
  }, [category]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    budget: true,
    bedrooms: true,
    type: false,
    furnishing: false,
    possession: false,
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

  const clearAll = () => {
    const params = new URLSearchParams();
    if (searchParams.get('category')) params.set('category', searchParams.get('category')!);
    if (searchParams.get('city')) params.set('city', searchParams.get('city')!);
    router.push(`/properties?${params.toString()}`);
  };

  const priceRanges = category === 'rent' ? PRICE_RANGES_RENT : PRICE_RANGES_BUY;

  const hasActiveFilters = ['minPrice', 'maxPrice', 'bedrooms', 'type', 'furnishingStatus', 'possessionStatus'].some(
    (k) => searchParams.has(k),
  );

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
        <FilterSection
          title="Budget"
          open={openSections.budget}
          onToggle={() => toggle('budget')}
        >
          <div className="space-y-2">
            {priceRanges.map((range) => {
              const isActive =
                current('minPrice') === String(range.min) &&
                current('maxPrice') === String(range.max ?? '');
              return (
                <button
                  key={range.label}
                  onClick={() => {
                    if (isActive) {
                      applyFilter('minPrice', undefined);
                      applyFilter('maxPrice', undefined);
                    } else {
                      applyFilter('minPrice', String(range.min));
                      applyFilter('maxPrice', range.max ? String(range.max) : undefined);
                    }
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50',
                  )}
                >
                  {range.label}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* Bedrooms (only for buy/rent) */}
        {category !== 'commercial' && (
          <FilterSection
            title="BHK / Bedrooms"
            open={openSections.bedrooms}
            onToggle={() => toggle('bedrooms')}
          >
            <div className="flex flex-wrap gap-2">
              {BEDROOM_OPTIONS.map((bed) => {
                const isActive = current('bedrooms') === bed;
                return (
                  <button
                    key={bed}
                    onClick={() => applyFilter('bedrooms', isActive ? undefined : bed)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
                      isActive
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'border-gray-200 text-gray-600 hover:border-primary-400',
                    )}
                  >
                    {bed} BHK
                  </button>
                );
              })}
            </div>
          </FilterSection>
        )}

        {/* Property Type */}
        <FilterSection
          title="Property Type"
          open={openSections.type}
          onToggle={() => toggle('type')}
        >
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

        {/* Furnishing */}
        {category !== 'commercial' && (
          <FilterSection
            title="Furnishing Status"
            open={openSections.furnishing}
            onToggle={() => toggle('furnishing')}
          >
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
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </FilterSection>
        )}

        {/* Possession */}
        <FilterSection
          title="Possession Status"
          open={openSections.possession}
          onToggle={() => toggle('possession')}
        >
          <div className="space-y-1.5">
            {POSSESSION_OPTIONS.map((opt) => {
              const isActive = current('possessionStatus') === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() =>
                    applyFilter('possessionStatus', isActive ? undefined : opt.value)
                  }
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                    isActive
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50',
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* Verified Only */}
        <div className="px-4 py-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={current('isVerified') === 'true'}
              onChange={(e) => applyFilter('isVerified', e.target.checked ? 'true' : undefined)}
              className="w-4 h-4 rounded text-primary-600 accent-primary-600"
            />
            <span className="text-sm font-medium text-gray-700">Verified Properties Only</span>
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
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && children}
    </div>
  );
}
