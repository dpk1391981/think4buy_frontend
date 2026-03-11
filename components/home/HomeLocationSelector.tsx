'use client';

import { useEffect } from 'react';
import { MapPin, Globe, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import {
  setSelectedLocation,
  setSelectedCity,
  setSelectedCountry,
  clearLocationFilter,
} from '@/lib/store/slices/uiSlice';
import {
  fetchStates,
  fetchCountries,
  fetchCitiesByState,
} from '@/lib/store/slices/locationsSlice';
import { propertiesApi } from '@/lib/api';

// Property count badge per state — fetched in background
function StatePropertyCount({ stateName }: { stateName: string }) {
  const { data: count } = useQuery({
    queryKey: ['prop-count-state', stateName],
    queryFn: () =>
      propertiesApi
        .getAll({ state: stateName, approvalStatus: 'approved', limit: 1 })
        .then((r) => r.data?.total ?? 0),
    staleTime: 5 * 60 * 1000,
    enabled: !!stateName,
  });
  if (count === undefined) return <span className="text-xs text-gray-400">—</span>;
  return <span className="text-xs text-gray-500">{count.toLocaleString('en-IN')} properties</span>;
}

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

const STATE_GRADIENTS = [
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

export default function HomeLocationSelector() {
  const dispatch = useAppDispatch();

  const countries = useAppSelector((s) => s.locations.countries);
  const countriesLoaded = useAppSelector((s) => s.locations.countriesLoaded);
  const states = useAppSelector((s) => s.locations.states);
  const statesLoaded = useAppSelector((s) => s.locations.statesLoaded);
  const citiesByState = useAppSelector((s) => s.locations.citiesByState);

  const selectedCountry = useAppSelector((s) => s.ui.selectedCountry);
  const selectedCountryId = useAppSelector((s) => s.ui.selectedCountryId);
  const selectedState = useAppSelector((s) => s.ui.selectedState);
  const selectedStateId = useAppSelector((s) => s.ui.selectedStateId);
  const selectedCity = useAppSelector((s) => s.ui.selectedCity);

  // Load countries + states on mount
  useEffect(() => {
    if (!countriesLoaded) dispatch(fetchCountries() as any);
    if (!statesLoaded) dispatch(fetchStates() as any);
  }, [dispatch, countriesLoaded, statesLoaded]);

  // Load cities when state is selected
  useEffect(() => {
    if (selectedStateId && !citiesByState[selectedStateId]) {
      dispatch(fetchCitiesByState(selectedStateId) as any);
    }
  }, [dispatch, selectedStateId, citiesByState]);

  const citiesForState = selectedStateId ? (citiesByState[selectedStateId] || []) : [];

  // Filter states by selected country if applicable
  const visibleStates = states.filter((s: any) => {
    if (!selectedCountryId) return true;
    return s.countryId === selectedCountryId || s.country?.id === selectedCountryId;
  }).slice(0, 12);

  const handleCountrySelect = (id: string, name: string) => {
    if (selectedCountryId === id) {
      dispatch(clearLocationFilter());
    } else {
      dispatch(setSelectedCountry({ country: name, countryId: id }));
    }
  };

  const handleStateSelect = (id: string, name: string) => {
    if (selectedStateId === id) {
      // Deselect — go back to country-level
      dispatch(setSelectedLocation({ state: '', stateId: '' }));
    } else {
      dispatch(setSelectedLocation({ state: name, stateId: id }));
    }
  };

  const handleCitySelect = (id: string, name: string) => {
    if (selectedCity === name) {
      dispatch(setSelectedCity({ city: '', cityId: '' }));
    } else {
      dispatch(setSelectedCity({ city: name, cityId: id }));
    }
  };

  return (
    <section className="py-8 sm:py-12 bg-white border-b border-gray-100">
      <div className="container-max">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 sm:mb-7">
          <div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
              {selectedState
                ? `Properties in ${selectedState}`
                : selectedCountry
                ? `Explore ${selectedCountry}`
                : 'Explore by Location'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {selectedCity
                ? `Showing listings in ${selectedCity}, ${selectedState}`
                : selectedState
                ? `Browse cities in ${selectedState}`
                : 'Select a country, state or city to filter listings'}
            </p>
          </div>

          {/* Clear filter */}
          {(selectedState || selectedCountry) && (
            <button
              onClick={() => dispatch(clearLocationFilter())}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 px-3 py-1.5 rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* ── Country selector ── */}
        {countries.length > 1 && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" /> Country
            </p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => dispatch(clearLocationFilter())}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  !selectedCountryId
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                }`}
              >
                🌏 All Countries
              </button>
              {countries.map((c: any) => (
                <button
                  key={c.id}
                  onClick={() => handleCountrySelect(c.id, c.name)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    selectedCountryId === c.id
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                  }`}
                >
                  {c.flag && <span>{c.flag}</span>} {c.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── States grid (shown when no state selected, or country selected) ── */}
        {!selectedState && visibleStates.length > 0 && (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Top States
            </p>

            {/* Mobile: horizontal scroll */}
            <div className="sm:hidden -mx-4">
              <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 snap-x snap-mandatory pb-2">
                {visibleStates.map((s: any, i: number) => (
                  <button
                    key={s.id}
                    onClick={() => handleStateSelect(s.id, s.name)}
                    className={`flex-shrink-0 snap-start w-32 relative rounded-2xl overflow-hidden h-36 group ${
                      selectedStateId === s.id ? 'ring-2 ring-primary-500 ring-offset-2' : ''
                    }`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${STATE_GRADIENTS[i % STATE_GRADIENTS.length]} transition-transform duration-300 group-hover:scale-105`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2.5 text-left">
                      <p className="font-bold text-white text-sm leading-tight">{s.name}</p>
                      <StatePropertyCount stateName={s.name} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop: grid */}
            <div className="hidden sm:grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {visibleStates.map((s: any, i: number) => (
                <button
                  key={s.id}
                  onClick={() => handleStateSelect(s.id, s.name)}
                  className={`relative rounded-2xl overflow-hidden aspect-[3/4] group cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                    selectedStateId === s.id ? 'ring-2 ring-primary-500 ring-offset-2' : ''
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${STATE_GRADIENTS[i % STATE_GRADIENTS.length]} transition-transform duration-500 group-hover:scale-110`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
                    <p className="font-bold text-white text-sm leading-tight mb-0.5">{s.name}</p>
                    <StatePropertyCount stateName={s.name} />
                  </div>
                  {selectedStateId === s.id && (
                    <div className="absolute top-2 right-2 bg-primary-500 text-white rounded-full p-0.5">
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Cities grid (shown after state is selected) ── */}
        {selectedState && citiesForState.length > 0 && (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Cities in {selectedState}
            </p>

            {/* Back to states */}
            <button
              onClick={() => dispatch(setSelectedLocation({ state: '', stateId: '' }))}
              className="flex items-center gap-1.5 text-sm text-primary-600 mb-4 hover:underline"
            >
              ← All States
            </button>

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

            {/* Browse all properties in this state */}
            <Link
              href={`/properties?state=${encodeURIComponent(selectedState)}${selectedCity ? `&city=${encodeURIComponent(selectedCity)}` : ''}`}
              className="inline-flex items-center gap-2 text-sm text-primary-600 font-medium hover:underline"
            >
              Browse all properties in {selectedCity || selectedState}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </>
        )}

        {/* ── No states / empty state ── */}
        {!selectedState && visibleStates.length === 0 && statesLoaded && (
          <p className="text-center text-gray-400 py-8 text-sm">No locations found.</p>
        )}
      </div>
    </section>
  );
}
