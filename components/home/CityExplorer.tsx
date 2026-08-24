'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { fetchCities, fetchCitiesByState } from '@/lib/store/slices/locationsSlice';
import OptimizedImage, { resolveImageSrc } from '@/components/common/OptimizedImage';

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

export default function CityExplorer() {
  const dispatch = useAppDispatch();
  const selectedState = useAppSelector((s) => s.ui.selectedState);
  const selectedStateId = useAppSelector((s) => s.ui.selectedStateId);
  const selectedCity = useAppSelector((s) => s.ui.selectedCity);
  const citiesLoaded = useAppSelector((s) => s.locations.citiesLoaded);
  const allCities = useAppSelector((s) => s.locations.cities);
  const citiesByState = useAppSelector((s) => s.locations.citiesByState);

  // Load featured cities on mount
  useEffect(() => {
    if (!citiesLoaded) dispatch(fetchCities() as any);
  }, [dispatch, citiesLoaded]);

  // Load state-specific cities when state is selected
  useEffect(() => {
    if (selectedStateId && !citiesByState[selectedStateId]) {
      dispatch(fetchCitiesByState(selectedStateId) as any);
    }
  }, [dispatch, selectedStateId, citiesByState]);

  // Decide which cities to show
  const citiesToShow: any[] = selectedStateId
    ? (citiesByState[selectedStateId] || []).slice(0, 12)
    : allCities.filter((c: any) => c.isFeatured || c.isActive).slice(0, 12);

  if (citiesToShow.length === 0) return null;

  const sectionTitle = selectedState
    ? `Top Cities in ${selectedState}`
    : 'Explore Top Cities';

  const sectionSub = selectedState
    ? `Properties available across ${selectedState}`
    : "Properties across India's major cities";

  return (
    <section className="py-10 sm:py-12 bg-gray-50">
      <div className="container-rv">
        <div className="flex items-center justify-between mb-1">
          <h2 className="rv-h2">{sectionTitle}</h2>
          {selectedState && (
            <Link
              href={`/properties?state=${encodeURIComponent(selectedState)}`}
              className="hidden sm:flex items-center gap-1.5 text-sm text-primary-600 font-medium hover:underline"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
        <p className="text-gray-500 text-center text-sm mb-6 sm:mb-8">{sectionSub}</p>

        {/* Mobile: horizontal scroll */}
        <div className="sm:hidden -mx-4">
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 snap-x snap-mandatory pb-2">
            {citiesToShow.map((city: any, i: number) => {
              const hasImg = !!city.imageUrl;
              const isSelected = selectedCity === city.name;
              return (
                <Link
                  key={city.id}
                  href={`/properties?city=${encodeURIComponent(city.name)}${selectedState ? `&state=${encodeURIComponent(selectedState)}` : ''}`}
                  className={`group relative flex-shrink-0 w-32 h-40 snap-start overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 ${isSelected ? 'ring-2 ring-primary-500 ring-offset-1' : ''}`}
                >
                  {hasImg ? (
                    <OptimizedImage
                      src={city.imageUrl}
                      alt={city.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="128px"
                    />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${CITY_GRADIENTS[i % CITY_GRADIENTS.length]} transition-transform duration-500 group-hover:scale-110`} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <div className="flex items-center gap-1 mb-0.5">
                      <MapPin className="w-3 h-3" />
                      <span className="font-bold text-sm">{city.name}</span>
                    </div>
                    {city.state?.name && (
                      <span className="text-xs text-gray-300">{city.state.name}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Desktop: grid */}
        <div className="hidden sm:grid grid-cols-3 lg:grid-cols-6 gap-4">
          {citiesToShow.map((city: any, i: number) => {
            const hasImg = !!city.imageUrl;
            const isSelected = selectedCity === city.name;
            return (
              <Link
                key={city.id}
                href={`/properties?city=${encodeURIComponent(city.name)}${selectedState ? `&state=${encodeURIComponent(selectedState)}` : ''}`}
                className={`group relative overflow-hidden rounded-xl aspect-[3/4] cursor-pointer shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`}
              >
                {hasImg ? (
                  <OptimizedImage
                    src={city.imageUrl}
                    alt={city.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width:1024px) 33vw, 16vw"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-br ${CITY_GRADIENTS[i % CITY_GRADIENTS.length]} transition-transform duration-500 group-hover:scale-110`} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <div className="flex items-center gap-1 mb-0.5">
                    <MapPin className="w-3 h-3" />
                    <span className="font-bold text-sm">{city.name}</span>
                  </div>
                  {city.state?.name && (
                    <span className="text-xs text-gray-300">{city.state.name}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* View all cities link — mobile */}
        {selectedState && (
          <div className="text-center mt-5 sm:hidden">
            <Link
              href={`/properties?state=${encodeURIComponent(selectedState)}`}
              className="inline-flex items-center gap-2 border border-primary-200 text-primary-700 text-sm font-medium px-5 py-2.5 rounded-xl hover:bg-primary-50 transition-colors"
            >
              All properties in {selectedState} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
