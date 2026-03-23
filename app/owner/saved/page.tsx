'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Home, Trash2, Search } from 'lucide-react';
import PropertyCard from '@/components/property/PropertyCard';
import { savedApi, propertiesApi } from '@/lib/api';
import { useWishlist } from '@/hooks/useWishlist';

export default function OwnerSavedPage() {
  const { getIds, toggle } = useWishlist();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    savedApi.getSaved({ limit: 50 })
      .then((r) => {
        const d = r.data;
        const items: any[] = Array.isArray(d) ? d : d?.items ?? d?.data ?? [];
        if (items.length > 0) { setProperties(items); return; }
        return fetchFromLocal();
      })
      .catch(() => fetchFromLocal())
      .finally(() => setLoading(false));

    async function fetchFromLocal() {
      const ids = getIds();
      if (!ids.length) return;
      const results = await Promise.allSettled(
        ids.map((id: string) => propertiesApi.getAll({ id }).then((r: any) => r.data?.data?.[0])),
      );
      const loaded = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled' && r.value)
        .map((r) => r.value);
      setProperties(loaded);
    }
  }, []); // eslint-disable-line

  const clearAll = () => {
    properties.forEach((p) => toggle(p.id));
    setProperties([]);
  };

  /* ── Skeletons ── */
  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <div className="h-7 bg-gray-100 rounded-lg w-40 mb-4 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="aspect-[16/9] bg-gray-100 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                <div className="h-6 bg-gray-100 rounded-lg animate-pulse w-1/3 mt-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Empty state ── */
  if (properties.length === 0) {
    return (
      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <h1 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
          Saved Properties
        </h1>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-9 h-9 text-red-300" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">No saved properties yet</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-xs">
            Tap the ❤ on any property while browsing to save it here for quick access.
          </p>
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse Properties
          </Link>
        </div>
      </div>
    );
  }

  /* ── Property grid ── */
  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500 fill-red-500" />
          Saved Properties
          <span className="ml-1 text-sm font-semibold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {properties.length}
          </span>
        </h1>
        <button
          onClick={clearAll}
          className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-semibold transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
      </div>
    </div>
  );
}
