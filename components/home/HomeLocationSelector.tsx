'use client';

import { useEffect } from 'react';
import { MapPin, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import {
  setSelectedCity,
} from '@/lib/store/slices/uiSlice';
import {
  fetchCitiesByState,
} from '@/lib/store/slices/locationsSlice';
import { propertiesApi } from '@/lib/api';

// City property count badge
function CityPropertyCount({ cityName }: { cityName: string }) {
  const { data: count } = useQuery({
    queryKey: ['prop-count-city', cityName],
    queryFn: () =>
      propertiesApi
        .getAll({ city: cityName, approvalStatus: 'approved', limit: 1 })
        .then((r) => r.data?.total ?? 0),
    staleTime: 5 * 60 * 1000,
    enabled: !!cityName,
  });
  if (count === undefined) return null;
  return <span className="text-[11px] text-gray-400">{count.toLocaleString('en-IN')}</span>;
}


export default function HomeLocationSelector() {
  const dispatch = useAppDispatch();

  const citiesByState = useAppSelector((s) => s.locations.citiesByState);

  const selectedState = useAppSelector((s) => s.ui.selectedState);
  const selectedStateId = useAppSelector((s) => s.ui.selectedStateId);
  const selectedCity = useAppSelector((s) => s.ui.selectedCity);

  // Load cities when state is selected
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

  // Only render when a state is selected and has cities
  if (!selectedState || citiesForState.length === 0) return null;

  return (
    <section className="py-8 sm:py-12 bg-white border-b border-gray-100">
      <div className="container-max">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 sm:mb-7">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              {selectedCity ? `Properties in ${selectedCity}` : `Explore Cities in ${selectedState}`}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {selectedCity
                ? `Showing listings in ${selectedCity}, ${selectedState}`
                : `Select a city in ${selectedState} to filter listings`}
            </p>
          </div>

          {/* Clear city filter */}
          {selectedCity && (
            <button
              onClick={() => dispatch(setSelectedCity({ city: '', cityId: '' }))}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear City
            </button>
          )}
        </div>

        {/* ── Cities grid ── */}
        <div className="flex flex-wrap gap-2 mb-4">
          {citiesForState.map((c: any) => (
            <button
              key={c.id}
              onClick={() => handleCitySelect(c.id, c.name)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                selectedCity === c.name
                  ? 'bg-primary-600 text-white border-primary-600 shadow-md'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-primary-300 hover:bg-primary-50'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              {c.name}
              <CityPropertyCount cityName={c.name} />
            </button>
          ))}
        </div>

        {/* Browse all link */}
        <Link
          href={`/properties?state=${encodeURIComponent(selectedState)}${selectedCity ? `&city=${encodeURIComponent(selectedCity)}` : ''}`}
          className="inline-flex items-center gap-2 text-sm text-primary-600 font-medium hover:underline"
        >
          Browse all properties in {selectedCity || selectedState}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
