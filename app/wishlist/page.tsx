'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Home, Trash2 } from 'lucide-react';
import PropertyCard from '@/components/property/PropertyCard';
import { savedApi, propertiesApi } from '@/lib/api';
import { useWishlist } from '@/hooks/useWishlist';

export default function WishlistPage() {
  const { getIds, toggle } = useWishlist();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try server-side saved properties first (logged-in users)
    savedApi.getSaved({ limit: 50 })
      .then((r) => {
        const d = r.data;
        const items: any[] = Array.isArray(d) ? d : d?.items ?? d?.data ?? [];
        if (items.length > 0) {
          setProperties(items);
          setLoading(false);
          return;
        }
        // No server items — fall back to localStorage IDs
        return fetchFromLocalStorage();
      })
      .catch(() => fetchFromLocalStorage())
      .finally(() => setLoading(false));

    async function fetchFromLocalStorage() {
      const ids = getIds();
      if (!ids.length) { setLoading(false); return; }
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

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12">
      <div className="container-max">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Saved Properties</h1>
            </div>
            <p className="text-gray-500 text-sm">{properties.length} saved</p>
          </div>
          {properties.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Clear All
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="skeleton aspect-[4/3]" />
                <div className="p-4 space-y-3">
                  <div className="skeleton h-5 w-3/4" />
                  <div className="skeleton h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-10 h-10 text-red-300" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No saved properties</h2>
            <p className="text-gray-500 mb-6">Tap the ❤ on any property to save it here.</p>
            <Link href="/properties" className="btn-primary">
              <Home className="w-4 h-4" /> Browse Properties
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
