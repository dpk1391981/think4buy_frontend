'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Building2, MapPin, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { propertiesApi } from '@/lib/api';
import OptimizedImage from '@/components/common/OptimizedImage';

interface Property {
  id: string;
  slug: string;
  title: string;
  price: number;
  category: string;
  type: string;
  city?: string;
  locality?: string;
  bedrooms?: number;
  isFeatured?: boolean;
  viewCount?: number;
  images?: { url: string }[];
}

const CATEGORIES = [
  { key: '', label: 'All' },
  { key: 'buy', label: 'Buy' },
  { key: 'rent', label: 'Rent' },
  { key: 'commercial', label: 'Commercial' },
  { key: 'pg', label: 'PG / Co-living' },
];

const LIMIT = 9;

function formatPrice(price: number): string {
  if (price >= 10000000) return `₹${(price / 10000000).toFixed(1)} Cr`;
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)} L`;
  return `₹${price.toLocaleString('en-IN')}`;
}

function SkeletonCard() {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden animate-pulse">
      <div className="w-full h-36 bg-gray-200" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-1/3" />
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-4 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  );
}

export default function AgentListings({ agentId, agentName, initialTotal = 0 }: { agentId: string; agentName: string; initialTotal?: number }) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        agentId,
        approvalStatus: 'approved',
        status: 'active',
        page,
        limit: LIMIT,
      };
      if (category) params.category = category;

      const { data } = await propertiesApi.getAll(params);
      const items = data?.data || data?.properties || data?.items || [];
      const t = data?.total ?? items.length;
      setProperties(items);
      setTotal(t);
    } catch {
      setProperties([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [agentId, page, category]);

  useEffect(() => { load(); }, [load]);

  // Reset page when category changes
  const handleCategory = (cat: string) => {
    setCategory(cat);
    setPage(1);
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary-600" />
          Active Listings
          {total > 0 && !loading && (
            <span className="text-xs font-normal text-gray-400 ml-1">({total})</span>
          )}
        </h2>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 mb-5">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleCategory(key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              category === key
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: LIMIT }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-sm">
            {category
              ? `No ${category} listings at the moment.`
              : 'No active listings at the moment.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {properties.map((p) => (
              <Link
                key={p.id}
                href={`/properties/${p.slug}`}
                className="group block border border-gray-100 rounded-xl overflow-hidden hover:border-primary-200 hover:shadow-md transition-all duration-200"
              >
                {/* Image */}
                <div className="relative w-full h-36 bg-gray-100 overflow-hidden">
                  <OptimizedImage
                    src={p.images?.[0]?.url}
                    alt={p.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width:640px) 72vw, 33vw"
                  />
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-primary-600 text-white px-2 py-0.5 rounded-md">
                      {p.category}
                    </span>
                  </div>
                  {p.isFeatured && (
                    <div className="absolute top-2 right-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-500 text-white px-2 py-0.5 rounded-md">
                        Featured
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <div className="text-[10px] text-primary-600 font-semibold uppercase tracking-wide mb-1">
                    {p.type?.replace(/_/g, ' ')}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                    {p.title}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="line-clamp-1">
                      {[p.locality, p.city].filter(Boolean).join(', ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-sm font-bold text-primary-700">{formatPrice(p.price)}</div>
                    {p.bedrooms && (
                      <div className="text-xs text-gray-400">{p.bedrooms} BHK</div>
                    )}
                  </div>
                  {(p.viewCount ?? 0) > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                      <Eye className="w-3 h-3" />{p.viewCount} views
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-40 hover:border-primary-400 transition-colors bg-white"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium disabled:opacity-40 hover:border-primary-400 transition-colors bg-white"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
