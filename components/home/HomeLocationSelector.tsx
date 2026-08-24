'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { setSelectedCity } from '@/lib/store/slices/uiSlice';
import { fetchCitiesByState } from '@/lib/store/slices/locationsSlice';
import OptimizedImage from '@/components/common/OptimizedImage';

const CITY_GRADIENTS = [
  'from-blue-500 to-blue-700',
  'from-emerald-500 to-emerald-700',
  'from-purple-500 to-purple-700',
  'from-orange-500 to-orange-700',
  'from-pink-500 to-rose-600',
  'from-teal-500 to-teal-700',
  'from-indigo-500 to-indigo-700',
  'from-amber-500 to-amber-700',
  'from-cyan-500 to-cyan-700',
  'from-red-500 to-red-700',
  'from-violet-500 to-violet-700',
  'from-lime-500 to-lime-700',
];

function cityToSlug(c: { slug?: string; name: string }): string {
  return c.slug || c.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function CityPropertyCount({ count }: { count?: number }) {
  if (!count) return null;
  return (
    <span className="text-[10px] font-semibold text-primary-600">
      {count.toLocaleString('en-IN')}+ props
    </span>
  );
}

export default function HomeLocationSelector() {
  const dispatch = useAppDispatch();

  const citiesByState   = useAppSelector((s) => s.locations.citiesByState);
  const selectedState   = useAppSelector((s) => s.ui.selectedState);
  const selectedStateId = useAppSelector((s) => s.ui.selectedStateId);
  const selectedCity    = useAppSelector((s) => s.ui.selectedCity);

  useEffect(() => {
    if (selectedStateId && !citiesByState[selectedStateId]) {
      dispatch(fetchCitiesByState(selectedStateId) as any);
    }
  }, [dispatch, selectedStateId, citiesByState]);

  const citiesForState = selectedStateId ? (citiesByState[selectedStateId] || []) : [];

  if (!selectedState || citiesForState.length === 0) return null;

  return (
    <section className="py-7 sm:py-12 lg:py-13 bg-gray-50 border-b border-gray-100">
      <div className="container-rv">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-8">
          <div>
            <h2 className="rv-h2">
              Top Cities in {selectedState}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Click a city to view its property listings
            </p>
          </div>

          {selectedCity && (
            <button
              onClick={() => dispatch(setSelectedCity({ city: '', cityId: '' }))}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* ── City circles row ── */}
        <div className="-mx-4 sm:mx-0">
          <div className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar px-4 sm:px-0 snap-x snap-mandatory pb-3">
            {citiesForState.map((city: any, i: number) => {
              const slug = cityToSlug(city);
              const gradient = CITY_GRADIENTS[i % CITY_GRADIENTS.length];
              const hasImg = !!city.imageUrl;

              return (
                <Link
                  key={city.id}
                  href={`/properties-in-${slug}`}
                  className="group flex-shrink-0 snap-start flex flex-col items-center gap-2 w-[76px] sm:w-[88px] focus:outline-none"
                  aria-label={`Properties in ${city.name}`}
                >
                  {/* Circle */}
                  <div
                    className="relative w-[68px] h-[68px] sm:w-[80px] sm:h-[80px] rounded-full overflow-hidden
                      ring-2 ring-gray-100 group-hover:ring-primary-400
                      transition-all duration-300 shadow-md group-hover:shadow-lg group-hover:scale-105"
                  >
                    {hasImg ? (
                      <OptimizedImage
                        src={city.imageUrl}
                        alt={city.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="88px"
                      />
                    ) : (
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${gradient}
                          group-hover:scale-110 transition-transform duration-500
                          flex items-center justify-center`}
                      >
                        <span className="text-white font-bold text-lg sm:text-xl tracking-tight select-none">
                          {city.name.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {hasImg && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    )}
                  </div>

                  {/* City name */}
                  <span className="text-xs sm:text-[13px] font-semibold text-gray-800 text-center leading-tight line-clamp-1 w-full group-hover:text-primary-700 transition-colors">
                    {city.name}
                  </span>

                  <CityPropertyCount count={city.propertyCount ?? city._count?.properties} />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Browse all */}
        <div className="mt-6">
          <Link
            href={`/properties-in-${selectedState.toLowerCase().replace(/\s+/g, '-')}`}
            className="inline-flex items-center gap-2 text-sm text-primary-600 font-medium hover:underline"
          >
            Browse all properties in {selectedState}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
