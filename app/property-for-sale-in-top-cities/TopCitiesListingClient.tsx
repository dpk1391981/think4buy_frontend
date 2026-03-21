'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';
import { locationsApi, propertiesApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import PropertyCard from '@/components/property/PropertyCard';

function toSlug(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

export default function TopCitiesListingClient() {
  const [activeCity, setActiveCity] = useState<string>('');

  // Fetch top cities (only cities with active listings)
  const { data: topCities = [] } = useQuery({
    queryKey: ['top-cities'],
    queryFn: () => locationsApi.getTopCities().then(r => {
      const raw = r.data;
      return Array.isArray(raw) ? raw : raw?.cities ?? [];
    }),
    staleTime: 60 * 60 * 1000,
  });

  // Build city filter — empty = all top cities
  const cityFilter = activeCity || undefined;

  // Fetch properties for the selected city (or all if none selected)
  const { data: propsData, isLoading } = useQuery({
    queryKey: ['top-cities-listings', activeCity],
    queryFn: () =>
      propertiesApi.getAll({
        status: 'active',
        approvalStatus: 'approved',
        city: cityFilter,
        limit: 24,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
    enabled: topCities.length > 0 || activeCity !== undefined,
  });

  const properties: any[] = propsData?.data ?? propsData?.items ?? [];
  const total: number = propsData?.total ?? properties.length;

  return (
    <div className="min-h-screen bg-gray-50 pt-4 pb-16">
      <div className="container-max">

        {/* City filter tabs */}
        {topCities.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-6">
            <button
              onClick={() => setActiveCity('')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                activeCity === ''
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600',
              )}
            >
              All Cities
              <span className="text-xs opacity-75">({total})</span>
            </button>

            {topCities.map((city: any) => (
              <button
                key={city.id}
                onClick={() => setActiveCity(city.cityName)}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-all',
                  activeCity === city.cityName
                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300 hover:text-primary-600',
                )}
              >
                <MapPin className="w-3.5 h-3.5" />
                {city.cityName}
                <span className="text-xs opacity-75">({city.counts.total})</span>
              </button>
            ))}
          </div>
        )}

        {/* Results summary */}
        {!isLoading && (
          <p className="text-sm text-gray-500 mb-4">
            {total > 0
              ? `${total} active ${total === 1 ? 'listing' : 'listings'}${activeCity ? ` in ${activeCity}` : ' across top cities'}`
              : 'No listings found'}
          </p>
        )}

        {/* Property grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-gray-600">No listings in {activeCity || 'top cities'} yet</p>
            <p className="text-sm mt-1">Check back as new properties are listed</p>
            <Link
              href="/post-property"
              className="inline-flex items-center gap-2 mt-5 bg-primary-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-colors"
            >
              Post your property <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {properties.map((p: any) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}

        {/* City quick links */}
        {topCities.length > 0 && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Browse by City</h2>
            <div className="flex flex-wrap gap-3">
              {topCities.map((city: any) => (
                <Link
                  key={city.id}
                  href={`/property-in-${city.slug || toSlug(city.cityName)}`}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-primary-300 hover:text-primary-600 transition-all"
                >
                  <MapPin className="w-3.5 h-3.5 text-primary-500" />
                  {city.cityName}
                  <span className="text-xs text-gray-400">{city.counts.total} listings</span>
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
