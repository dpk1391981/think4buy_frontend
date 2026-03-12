'use client';

import { useEffect } from 'react';
import { ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { setSelectedCity } from '@/lib/store/slices/uiSlice';
import { fetchCitiesByState } from '@/lib/store/slices/locationsSlice';
import { propertiesApi } from '@/lib/api';
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

function CityPropertyCount({ cityName }: { cityName: string }) {
  const { data: count } = useQuery({
    queryKey: ['prop-count-city', cityName],
    queryFn: () =>
      propertiesApi
        .getAll({ city: cityName, approvalStatus: 'approved', limit: 1 })
        .then((r) => r.data?.total ?? r.data?.meta?.total ?? 0),
    staleTime: 5 * 60 * 1000,
    enabled: !!cityName,
  });
  if (!count) return <span className="text-[10px] text-gray-400">—</span>;
  return (
    <span className="text-[10px] font-semibold text-primary-600">
      {count.toLocaleString('en-IN')}+ props
    </span>
  );
}

export default function HomeLocationSelector() {
  const dispatch = useAppDispatch();

  const citiesByState = useAppSelector((s) => s.locations.citiesByState);
  const selectedState = useAppSelector((s) => s.ui.selectedState);
  const selectedStateId = useAppSelector((s) => s.ui.selectedStateId);
  const selectedCity = useAppSelector((s) => s.ui.selectedCity);

  useEffect(() => {
    if (selectedStateId && !citiesByState[selectedStateId]) {
      dispatch(fetchCitiesByState(selectedStateId) as any);
    }
  }, [dispatch, selectedStateId, citiesByState]);

  const citiesForState = selectedStateId ? (citiesByState[selectedStateId] || []) : [];

  const handleCitySelect = (id: string, name: string) => {
    if (selectedCity === name) {
      dispatch(setSelectedCity({ city: '', cityId: '' }));
    } else {
      dispatch(setSelectedCity({ city: name, cityId: id }));
    }
  };

  if (!selectedState || citiesForState.length === 0) return null;

  return (
    <section className="py-4 sm:py-12 bg-gray-50 border-b border-gray-100">
      <div className="container-max">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              {selectedCity ? `Properties in ${selectedCity}` : `Top Cities in ${selectedState}`}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {selectedCity
                ? `Showing listings in ${selectedCity}, ${selectedState}`
                : `Select a city to filter properties`}
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
              const isSelected = selectedCity === city.name;
              const gradient = CITY_GRADIENTS[i % CITY_GRADIENTS.length];
              const hasImg = !!city.imageUrl;

              return (
                <button
                  key={city.id}
                  onClick={() => handleCitySelect(city.id, city.name)}
                  className="group flex-shrink-0 snap-start flex flex-col items-center gap-2 w-[76px] sm:w-[88px] focus:outline-none"
                  aria-label={`Select ${city.name}`}
                >
                  {/* Circle */}
                  <div
                    className={`relative w-[68px] h-[68px] sm:w-[80px] sm:h-[80px] rounded-full overflow-hidden
                      transition-all duration-300 shadow-md group-hover:shadow-lg group-hover:scale-105
                      ${isSelected
                        ? 'ring-3 ring-primary-500 ring-offset-2 scale-105'
                        : 'ring-2 ring-gray-100 group-hover:ring-primary-400'
                      }`}
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
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary-600/20" />
                    )}
                  </div>

                  {/* City name */}
                  <span
                    className={`text-xs sm:text-[13px] font-semibold text-center leading-tight line-clamp-1 w-full transition-colors
                      ${isSelected ? 'text-primary-700' : 'text-gray-800'}`}
                  >
                    {city.name}
                  </span>

                  {/* Property count */}
                  <CityPropertyCount cityName={city.name} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Browse all */}
        <div className="mt-6">
          <Link
            href={`/properties?state=${encodeURIComponent(selectedState)}${selectedCity ? `&city=${encodeURIComponent(selectedCity)}` : ''}`}
            className="inline-flex items-center gap-2 text-sm text-primary-600 font-medium hover:underline"
          >
            Browse all properties in {selectedCity || selectedState}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
