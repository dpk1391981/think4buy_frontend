'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Building2, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import PropertyCard from '@/components/property/PropertyCard';
import { propertiesApi } from '@/lib/api';
import { cn } from '@/lib/utils';

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Gurgaon', 'Noida'];
const TYPES = [
  { value: '', label: 'All Types' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'plot', label: 'Plot' },
  { value: 'commercial_office', label: 'Office' },
];

export default function NewProjectsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [type, setType] = useState(searchParams.get('type') || '');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        possessionStatus: 'under_construction',
        page,
        limit: 12,
        sortBy: 'createdAt',
        sortOrder: 'DESC',
      };
      if (city) params.city = city;
      if (type) params.type = type;
      const res = await propertiesApi.getAll(params);
      setData(res.data);
    } finally {
      setLoading(false);
    }
  }, [city, type, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Hero */}
      <div className="bg-gradient-to-r from-pink-700 via-rose-600 to-pink-500 text-white py-12 px-4">
        <div className="container-max">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-6 h-6" />
            <span className="text-pink-200 text-sm font-medium uppercase tracking-wide">Under Construction</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">New Launch Projects</h1>
          <p className="text-pink-100">Book early, get the best prices. Explore upcoming residential &amp; commercial projects.</p>

          {/* City pills */}
          <div className="flex flex-wrap gap-2 mt-6">
            <button
              onClick={() => { setCity(''); setPage(1); }}
              className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-all', !city ? 'bg-white text-pink-700' : 'bg-white/20 text-white hover:bg-white/30')}
            >
              All Cities
            </button>
            {CITIES.map((c) => (
              <button
                key={c}
                onClick={() => { setCity(c); setPage(1); }}
                className={cn('px-4 py-1.5 rounded-full text-sm font-medium transition-all', city === c ? 'bg-white text-pink-700' : 'bg-white/20 text-white hover:bg-white/30')}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container-max py-8">
        {/* Filters bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-500 text-sm">
              {loading ? 'Loading…' : `${data?.meta?.total ?? 0} projects found${city ? ` in ${city}` : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={type}
              onChange={(e) => { setType(e.target.value); setPage(1); }}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white outline-none focus:ring-2 focus:ring-pink-400"
            >
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="skeleton aspect-[4/3]" />
                <div className="p-4 space-y-3">
                  <div className="skeleton h-5 w-3/4" />
                  <div className="skeleton h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : data?.data?.length ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {data.data.map((p: any) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
            {data.meta.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:border-pink-400">Prev</button>
                {Array.from({ length: Math.min(data.meta.totalPages, 5) }, (_, i) => i + 1).map((n) => (
                  <button key={n} onClick={() => setPage(n)} className={cn('w-10 h-10 rounded-lg text-sm font-medium', n === page ? 'bg-pink-600 text-white' : 'border hover:border-pink-400 text-gray-700')}>
                    {n}
                  </button>
                ))}
                <button onClick={() => setPage((p) => p + 1)} disabled={page >= data.meta.totalPages} className="px-4 py-2 border rounded-lg text-sm disabled:opacity-40 hover:border-pink-400">Next</button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
            <p className="text-5xl mb-4">🏗️</p>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No new projects found</h3>
            <p className="text-gray-500">Try a different city or property type.</p>
          </div>
        )}
      </div>
    </div>
  );
}
