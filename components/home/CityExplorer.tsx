'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { TOP_CITIES } from '@/lib/utils';

export default function CityExplorer() {
  return (
    <section className="py-10 sm:py-12 bg-gray-50">
      <div className="container-max">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 text-center mb-1">Explore Top Cities</h2>
        <p className="text-gray-500 text-center text-sm mb-6 sm:mb-8">Properties across India's major cities</p>

        {/* Mobile: horizontal scroll */}
        <div className="sm:hidden -mx-4">
          <div className="flex gap-3 overflow-x-auto no-scrollbar px-4 snap-x snap-mandatory pb-2">
            {TOP_CITIES.map((city) => (
              <Link
                key={city.name}
                href={`/properties?city=${city.name}`}
                className="group relative flex-shrink-0 w-32 h-40 snap-start overflow-hidden rounded-2xl shadow-md hover:shadow-lg transition-all duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${city.gradient} transition-transform duration-500 group-hover:scale-110`} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <div className="flex items-center gap-1 mb-0.5">
                    <MapPin className="w-3 h-3" />
                    <span className="font-bold text-sm">{city.name}</span>
                  </div>
                  <span className="text-xs text-gray-300">{city.count} properties</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Desktop: grid */}
        <div className="hidden sm:grid grid-cols-3 lg:grid-cols-6 gap-4">
          {TOP_CITIES.map((city) => (
            <Link
              key={city.name}
              href={`/properties?city=${city.name}`}
              className="group relative overflow-hidden rounded-xl aspect-[3/4] cursor-pointer shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${city.gradient} transition-transform duration-500 group-hover:scale-110`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <div className="flex items-center gap-1 mb-0.5">
                  <MapPin className="w-3 h-3" />
                  <span className="font-bold text-sm">{city.name}</span>
                </div>
                <span className="text-xs text-gray-300">{city.count} properties</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
