'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import OptimizedImage from '@/components/common/OptimizedImage';
import {
  GitCompare, X, Check, Minus, ChevronDown, ArrowRight, Plus, CheckCircle2,
} from 'lucide-react';
import { homeApi, propertiesApi } from '@/lib/api';
import { formatPrice, formatArea } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/lib/store';

const MAX_COMPARE = 3;

// Row definitions for the comparison table
const COMPARE_ROWS: { key: string; label: string }[] = [
  { key: 'price',           label: 'Price'          },
  { key: 'pricePerSqft',    label: '₹ / sqft'       },
  { key: 'area',            label: 'Area'            },
  { key: 'bedrooms',        label: 'Bedrooms'        },
  { key: 'bathrooms',       label: 'Bathrooms'       },
  { key: 'type',            label: 'Property Type'   },
  { key: 'furnishingStatus',label: 'Furnishing'      },
  { key: 'possessionStatus',label: 'Possession'      },
  { key: 'amenitiesCount',  label: 'Amenities'       },
  { key: 'locality',        label: 'Locality'        },
  { key: 'viewCount',       label: 'Views'           },
];

function getCellValue(p: any, key: string): string | null {
  switch (key) {
    case 'price':
      return formatPrice(p.price, p.priceUnit);
    case 'pricePerSqft':
      return p.pricePerSqft ? `₹${p.pricePerSqft.toLocaleString('en-IN')}/sqft` : null;
    case 'area':
      return p.area ? formatArea(p.area, p.areaUnit) : null;
    case 'bedrooms':
      return p.bedrooms ? `${p.bedrooms} BHK` : null;
    case 'bathrooms':
      return p.bathrooms ? `${p.bathrooms}` : null;
    case 'type':
      return p.type ? p.type.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : null;
    case 'furnishingStatus':
      return p.furnishingStatus ? p.furnishingStatus.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : null;
    case 'possessionStatus':
      return p.possessionStatus === 'ready_to_move' ? 'Ready to Move' : p.possessionStatus ? 'Under Construction' : null;
    case 'amenitiesCount':
      return p.amenitiesCount != null ? `${p.amenitiesCount} amenities` : null;
    case 'locality':
      return p.locality || null;
    case 'viewCount':
      return p.viewCount != null ? `${p.viewCount.toLocaleString('en-IN')} views` : null;
    default:
      return null;
  }
}

// Determine which property has the "best" value for a key
function getBestIds(properties: any[], key: string): string[] {
  if (properties.length < 2) return [];
  if (key === 'price' || key === 'pricePerSqft') {
    const min = Math.min(...properties.filter(p => p[key] != null).map(p => Number(p[key])));
    return properties.filter(p => Number(p[key]) === min).map(p => p.id);
  }
  if (key === 'area') {
    const max = Math.max(...properties.filter(p => p.area != null).map(p => Number(p.area)));
    return properties.filter(p => Number(p.area) === max).map(p => p.id);
  }
  if (key === 'amenitiesCount') {
    const max = Math.max(...properties.filter(p => p.amenitiesCount != null).map(p => Number(p.amenitiesCount)));
    return properties.filter(p => Number(p.amenitiesCount) === max).map(p => p.id);
  }
  return [];
}

function PropertyPickerCard({ property, isSelected, onToggle }: {
  property: any;
  isSelected: boolean;
  onToggle: (p: any) => void;
}) {
  const img = property.images?.[0]?.url;
  return (
    <button
      onClick={() => onToggle(property)}
      className={cn(
        'relative w-full text-left rounded-xl border-2 p-3 transition-all duration-200 flex items-center gap-3',
        isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-primary-200 hover:bg-gray-50',
      )}
    >
      <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
        <OptimizedImage src={img} alt={property.title} width={56} height={56} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-900 line-clamp-1">{property.title}</p>
        <p className="text-[11px] text-gray-500 line-clamp-1">{[property.locality, property.city].filter(Boolean).join(', ')}</p>
        <p className="text-xs font-bold text-primary-700 mt-0.5">{formatPrice(property.price, property.priceUnit)}</p>
      </div>
      <div className={cn(
        'w-5 h-5 rounded-full flex-shrink-0 border-2 flex items-center justify-center transition-all',
        isSelected ? 'border-primary-500 bg-primary-500' : 'border-gray-300',
      )}>
        {isSelected && <Check className="w-3 h-3 text-white" />}
      </div>
    </button>
  );
}

function ComparisonTable({ properties, liveData }: { properties: any[]; liveData: any[] }) {
  // Merge live API enrichment (pricePerSqft, amenitiesCount) into selected list
  const enriched = properties.map(p => {
    const live = liveData.find(d => d.id === p.id);
    return live ? { ...p, ...live } : p;
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left text-xs text-gray-400 font-medium pb-4 w-28 sm:w-36">Feature</th>
            {enriched.map((p) => (
              <th key={p.id} className="pb-4 px-3 text-center min-w-[160px]">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 mx-auto">
                    <OptimizedImage src={p.images?.[0]?.url} alt={p.title} width={48} height={48} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-tight">{p.title}</p>
                  <Link href={`/properties/${p.slug || p.id}`} className="text-[10px] text-primary-600 hover:underline">
                    View Details →
                  </Link>
                </div>
              </th>
            ))}
            {Array.from({ length: MAX_COMPARE - enriched.length }).map((_, i) => (
              <th key={`empty-${i}`} className="pb-4 px-3 min-w-[160px]" />
            ))}
          </tr>
        </thead>
        <tbody>
          {COMPARE_ROWS.map((row, rowIdx) => {
            const bestIds = getBestIds(enriched, row.key);
            return (
              <tr key={row.key} className={cn('border-t border-gray-50', rowIdx === 0 && 'bg-primary-50/50')}>
                <td className="py-3 pr-4 text-xs text-gray-500 font-medium align-middle">{row.label}</td>
                {enriched.map((p) => {
                  const val    = getCellValue(p, row.key);
                  const isBest = bestIds.includes(p.id);
                  return (
                    <td key={p.id} className="py-3 px-3 text-center align-middle">
                      {val ? (
                        <span className={cn(
                          'text-xs font-semibold',
                          isBest && row.key === 'price'      ? 'text-green-600' : '',
                          isBest && row.key === 'pricePerSqft' ? 'text-green-600' : '',
                          isBest && row.key === 'area'       ? 'text-blue-600'  : '',
                          !isBest ? 'text-gray-900' : '',
                        )}>
                          {val}
                          {isBest && (row.key === 'price' || row.key === 'pricePerSqft') && (
                            <span className="ml-1 text-[9px] bg-green-100 text-green-700 px-1 py-0.5 rounded-full">Best</span>
                          )}
                          {isBest && row.key === 'area' && (
                            <span className="ml-1 text-[9px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded-full">Largest</span>
                          )}
                        </span>
                      ) : (
                        <Minus className="w-3 h-3 text-gray-300 mx-auto" />
                      )}
                    </td>
                  );
                })}
                {Array.from({ length: MAX_COMPARE - enriched.length }).map((_, i) => (
                  <td key={`empty-${i}`} className="py-3 px-3" />
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function PropertyComparison() {
  const [selected, setSelected]   = useState<any[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [showTable,  setShowTable]  = useState(false);
  const selectedCity = useAppSelector((s) => s.ui.selectedCity);

  // Pool of properties to pick from
  const { data: poolRes } = useQuery({
    queryKey: ['compare-pool', selectedCity],
    queryFn: () => propertiesApi.getAll({
      limit: 12,
      approvalStatus: 'approved',
      ...(selectedCity ? { city: selectedCity } : {}),
    }).then(r => {
      const d = r.data;
      return Array.isArray(d?.data) ? d.data : Array.isArray(d) ? d : [];
    }),
    staleTime: 5 * 60 * 1000,
  });
  const pool: any[] = poolRes || [];

  // Live enriched comparison data from backend
  const selectedIds = selected.map(p => p.id);
  const { data: liveRes, isFetching: loadingLive } = useQuery({
    queryKey: ['compare-live', selectedIds.join(',')],
    queryFn: () => homeApi.compare(selectedIds).then(r => r.data?.data ?? []),
    enabled:  selectedIds.length >= 2,
    staleTime: 60 * 1000,
  });
  const liveData: any[] = liveRes || [];

  const toggle = useCallback((p: any) => {
    setSelected(prev => {
      if (prev.some(x => x.id === p.id)) return prev.filter(x => x.id !== p.id);
      if (prev.length >= MAX_COMPARE) return [...prev.slice(1), p];
      return [...prev, p];
    });
  }, []);

  const isSelected = (p: any) => selected.some(x => x.id === p.id);

  return (
    <section className="py-5 sm:py-14 bg-white">
      <div className="container-max">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GitCompare className="w-4 h-4 text-primary-600" />
              <span className="text-xs font-semibold text-primary-600 uppercase tracking-wide">Smart Tool</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Compare Properties</h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              Select up to {MAX_COMPARE} properties — we&apos;ll compare price, area, amenities &amp; more
            </p>
          </div>
          {selected.length >= 2 && (
            <button
              onClick={() => setShowTable(true)}
              className="hidden sm:flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all hover:shadow-lg"
            >
              <GitCompare className="w-4 h-4" /> Compare Now
            </button>
          )}
        </div>

        {/* Selection slots */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-8">
          {Array.from({ length: MAX_COMPARE }).map((_, i) => {
            const p = selected[i];
            return (
              <div
                key={i}
                onClick={() => !p && setShowPicker(true)}
                className={cn(
                  'relative rounded-2xl border-2 border-dashed transition-all duration-200',
                  p ? 'border-primary-300 bg-primary-50/30' : 'border-gray-200 bg-gray-50/50 cursor-pointer hover:border-primary-200',
                )}
              >
                {p ? (
                  <div className="p-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggle(p); }}
                      className="absolute top-2 right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors z-10"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <div className="flex flex-col gap-2">
                      <div className="w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <OptimizedImage src={p.images?.[0]?.url} alt={p.title} width={200} height={112} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="text-[11px] sm:text-xs font-semibold text-gray-900 line-clamp-2 leading-tight">{p.title}</p>
                        <p className="text-[10px] text-primary-700 font-bold mt-0.5">{formatPrice(p.price, p.priceUnit)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-10 gap-2 text-gray-400">
                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] sm:text-xs font-medium text-center leading-tight">
                      {i === 0 ? 'Select 1st property' : i === 1 ? 'Select 2nd property' : 'Add 3rd (optional)'}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="flex items-center gap-2 border border-primary-200 hover:bg-primary-50 text-primary-700 text-sm font-medium px-5 py-2.5 rounded-xl transition-all"
          >
            <Plus className="w-4 h-4" />
            {showPicker ? 'Close Picker' : 'Browse & Select Properties'}
            <ChevronDown className={cn('w-4 h-4 transition-transform', showPicker && 'rotate-180')} />
          </button>

          {selected.length >= 2 && (
            <button
              onClick={() => setShowTable(!showTable)}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all hover:shadow-lg"
            >
              <GitCompare className="w-4 h-4" />
              {showTable ? 'Hide Comparison' : 'Compare Now'}
              {loadingLive && <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            </button>
          )}
        </div>

        {/* Property picker */}
        {showPicker && (
          <div className="mt-6 border border-gray-100 rounded-2xl p-4 bg-gray-50/50">
            <p className="text-xs text-gray-500 font-medium mb-3">
              Select up to {MAX_COMPARE} properties ({selected.length}/{MAX_COMPARE} selected)
              {selectedCity && ` · Showing properties in ${selectedCity}`}
            </p>
            {!pool.length ? (
              <div className="flex items-center justify-center py-8 gap-2 text-gray-400 text-sm">
                <span className="w-4 h-4 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
                Loading properties…
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pool.map((p: any) => (
                  <PropertyPickerCard
                    key={p.id}
                    property={p}
                    isSelected={isSelected(p)}
                    onToggle={toggle}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Comparison table */}
        {showTable && selected.length >= 2 && (
          <div className="mt-8 rounded-2xl border border-gray-100 overflow-hidden shadow-card">
            <div className="bg-gray-50 px-5 py-3.5 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-bold text-gray-900">
                  Comparing {selected.length} propert{selected.length === 1 ? 'y' : 'ies'}
                </span>
                {loadingLive && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <span className="w-3 h-3 border-2 border-gray-300 border-t-primary-500 rounded-full animate-spin" />
                    Loading live data…
                  </span>
                )}
              </div>
              <button onClick={() => setShowTable(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <ComparisonTable properties={selected} liveData={liveData} />
            </div>
            <div className="bg-gray-50 px-5 py-3.5 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                🟢 Best price &nbsp;·&nbsp; 🔵 Largest area
              </p>
              <Link
                href={`/properties`}
                className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700 text-xs font-medium"
              >
                View all properties <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
