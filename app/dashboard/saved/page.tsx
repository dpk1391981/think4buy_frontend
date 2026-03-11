'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { savedApi } from '@/lib/api';
import { formatPrice, timeAgo } from '@/lib/utils';

interface SavedProperty {
  id: string;
  title: string;
  slug: string;
  price: number;
  city: string;
  locality?: string;
  state?: string;
  category: string;
  propertyType: string;
  bedrooms?: number;
  area?: number;
  isActive: boolean;
  isBoosted: boolean;
  createdAt: string;
  images?: { url: string; isPrimary: boolean; alt?: string }[];
}

function PropertyCard({ property, onUnsave }: { property: SavedProperty; onUnsave: (id: string) => void }) {
  const thumb = property.images?.find((i) => i.isPrimary)?.url || property.images?.[0]?.url;
  const [unsaving, setUnsaving] = useState(false);

  async function handleUnsave(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setUnsaving(true);
    try {
      await savedApi.unsave(property.id);
      onUnsave(property.id);
    } catch (err) {
      console.error(err);
    } finally {
      setUnsaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow group">
      {/* Image */}
      <Link href={`/properties/${property.slug}`} className="block relative">
        <div className="relative h-44 bg-gray-100">
          {thumb ? (
            <img
              src={thumb}
              alt={property.images?.find((i) => i.isPrimary)?.alt || property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">🏠</div>
          )}
          {property.isBoosted && (
            <span className="absolute top-2 left-2 px-2 py-0.5 bg-purple-600 text-white text-xs font-medium rounded-full">
              🚀 Featured
            </span>
          )}
          <span className="absolute top-2 right-2 px-2 py-0.5 bg-white text-gray-700 text-xs font-medium rounded-full capitalize shadow-sm">
            {property.category}
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link href={`/properties/${property.slug}`}>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight hover:text-blue-600 transition-colors line-clamp-2 mb-1">
            {property.title}
          </h3>
        </Link>
        <div className="text-xs text-gray-500 mb-3">
          📍 {[property.locality, property.city].filter(Boolean).join(', ')}
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          {property.bedrooms && <span>🛏 {property.bedrooms} BHK</span>}
          {property.area && <span>📐 {property.area.toLocaleString()} sq.ft</span>}
          <span className="capitalize">{property.propertyType?.replace(/_/g, ' ')}</span>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="font-bold text-blue-600 text-base">{formatPrice(property.price)}</div>
          <button
            onClick={handleUnsave}
            disabled={unsaving}
            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            {unsaving ? '...' : '♥ Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SavedPropertiesPage() {
  const [properties, setProperties] = useState<SavedProperty[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await savedApi.getSaved({ page, limit: 12 });
      const data = r.data;
      setProperties(data?.items || []);
      setTotal(data?.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  function handleUnsave(propertyId: string) {
    setProperties((prev) => prev.filter((p) => p.id !== propertyId));
    setTotal((prev) => Math.max(0, prev - 1));
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Properties</h1>
          <p className="text-gray-500 text-sm mt-1">{total} properties saved</p>
        </div>
        <Link
          href="/properties"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          🔍 Browse More
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="h-44 bg-gray-200 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                <div className="h-5 bg-gray-200 rounded animate-pulse w-1/2 mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : properties.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center">
          <div className="text-6xl mb-4">❤️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No saved properties</h2>
          <p className="text-gray-500 text-sm mb-6">
            Click the heart icon on any property to save it here for easy access.
          </p>
          <Link
            href="/properties"
            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Browse Properties
          </Link>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} onUnsave={handleUnsave} />
            ))}
          </div>

          {total > 12 && (
            <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm">
              <span className="text-sm text-gray-500">
                Showing {(page - 1) * 12 + 1}–{Math.min(page * 12, total)} of {total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page * 12 >= total}
                  className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
