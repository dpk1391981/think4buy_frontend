'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import OptimizedImage from '@/components/common/OptimizedImage';
import { Flame, TrendingUp, Eye, ArrowRight, Zap, BarChart2, MessageCircle } from 'lucide-react';
import { homeApi } from '@/lib/api';
import { formatPrice, formatArea, getPropertyArea } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useAppSelector } from '@/lib/store';

type DemandLevel = 'very_high' | 'high' | 'medium' | 'active';

const DEMAND_CONFIG: Record<DemandLevel, { label: string; bg: string; dot: string; text: string }> = {
  very_high: { label: 'Hot Deal 🔥',    bg: 'bg-red-500',    dot: 'bg-red-500',    text: 'text-white' },
  high:      { label: 'High Demand ⚡', bg: 'bg-orange-500', dot: 'bg-orange-400', text: 'text-white' },
  medium:    { label: 'Trending 📈',    bg: 'bg-purple-600', dot: 'bg-yellow-400', text: 'text-white' },
  active:    { label: 'Active 👁️',      bg: 'bg-blue-600',   dot: 'bg-blue-400',   text: 'text-white' },
};

function DemandBadge({ level }: { level: DemandLevel }) {
  const cfg = DEMAND_CONFIG[level] || DEMAND_CONFIG.active;
  return (
    <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full', cfg.bg, cfg.text)}>
      {cfg.label}
    </span>
  );
}

/** Derive demand level from backend-computed fields (isHotDeal, isTrending, inquiriesLast7d). */
function getDemandLevel(property: any): DemandLevel {
  if (property.isHotDeal)    return 'very_high';
  if (property.isTrending)   return 'medium';
  // Fall back to legacy demandLevel if present (e.g., from getTrending live-calc)
  if (property.demandLevel)  return property.demandLevel as DemandLevel;
  // Infer from activity counters
  const inq = property.inquiriesLast7d ?? property.weeklyInquiries ?? 0;
  if (inq >= 5)  return 'high';
  if (inq >= 2)  return 'medium';
  return 'active';
}

function TrendingCard({ property, rank }: { property: any; rank: number }) {
  const img         = property.images?.[0]?.url;
  const price       = formatPrice(property.price, property.priceUnit);
  const { area: resolvedArea, areaUnit: resolvedAreaUnit } = getPropertyArea(property);
  const area        = formatArea(resolvedArea, resolvedAreaUnit);
  const slug        = property.slug || property.id;
  const demandLevel = getDemandLevel(property);

  return (
    <Link
      href={`/properties/${slug}`}
      className="group flex-shrink-0 w-[280px] sm:w-auto relative bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-primary-200 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(37,99,235,0.12)] hover:-translate-y-1"
    >
      {/* Image */}
      <div className="relative h-44 bg-gray-100 overflow-hidden">
        <OptimizedImage
          src={img}
          alt={property.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width:640px) 280px, 320px"
        />

        {/* Rank badge */}
        <div className="absolute top-2 left-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-xs font-black text-gray-800 shadow">
          #{rank}
        </div>

        {/* Demand badge */}
        <div className="absolute top-2 right-2">
          <DemandBadge level={demandLevel} />
        </div>

        {/* Price tag */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3 pt-6 pb-2">
          <p className="text-white font-bold text-sm">{price}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-3.5">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-1 group-hover:text-primary-700 transition-colors mb-1">
          {property.title}
        </h3>
        <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
          <span>📍</span>
          <span className="line-clamp-1">{[property.locality, property.city].filter(Boolean).join(', ')}</span>
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {area && (
            <span className="flex items-center gap-0.5">
              <BarChart2 className="w-3 h-3" /> {area}
            </span>
          )}
          {property.bedrooms && <span>{property.bedrooms} BHK</span>}
          {!property.bedrooms && (property.extraDetails as any)?.furnishing && (
            <span className="truncate max-w-[80px]">{(property.extraDetails as any).furnishing}</span>
          )}

          {/* Activity indicators */}
          <div className="ml-auto flex items-center gap-2">
            {property.viewCount > 0 && (
              <span className="flex items-center gap-0.5 text-orange-500 font-medium">
                <Eye className="w-3 h-3" />
                {property.viewCount > 999 ? `${(property.viewCount / 1000).toFixed(1)}k` : property.viewCount}
              </span>
            )}
            {(property.inquiriesLast7d > 0 || property.weeklyInquiries > 0) && (
              <span className="flex items-center gap-0.5 text-green-600 font-medium">
                <MessageCircle className="w-3 h-3" />
                {property.inquiriesLast7d ?? property.weeklyInquiries}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function TrendingCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[280px] sm:w-auto bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
      <div className="h-44 bg-gray-200" />
      <div className="p-3.5 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-200 rounded w-1/2" />
        <div className="h-3 bg-gray-200 rounded w-1/3" />
      </div>
    </div>
  );
}

export default function TrendingProperties() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'buy' | 'rent'>('all');
  const selectedCity  = useAppSelector((s) => s.ui.selectedCity);
  const selectedState = useAppSelector((s) => s.ui.selectedState);

  const { data: res, isLoading } = useQuery({
    queryKey: ['home-trending', selectedCity, selectedState, activeFilter],
    queryFn: () => homeApi.getTrending({
      city:     selectedCity  || undefined,
      state:    !selectedCity && selectedState ? selectedState : undefined,
      category: activeFilter !== 'all' ? activeFilter : undefined,
      limit:    8,
    }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const properties: any[] = res?.data ?? [];
  const hasData = !isLoading && properties.length > 0;
  const locationLabel = selectedCity || selectedState || null;

  return (
    <section className="py-5 sm:py-14 bg-gradient-to-b from-gray-50 to-white">
      <div className="container-max">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-3.5 h-3.5 fill-red-500 text-red-500" />
              <span className="text-xs font-semibold text-red-500 uppercase tracking-wide">Real-Time Activity</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              Trending Now
              {locationLabel && (
                <span className="text-sm font-normal text-gray-500">in {locationLabel}</span>
              )}
            </h2>
            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              Ranked by views, inquiries &amp; recency — updated hourly
            </p>
          </div>

          {/* Filter pills — shown on all screen sizes */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs">
            {(['all', 'buy', 'rent'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-lg font-medium transition-all',
                  activeFilter === f ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700',
                )}
              >
                {f === 'all' ? 'All' : f === 'buy' ? 'For Sale' : 'For Rent'}
              </button>
            ))}
          </div>
        </div>

        {/* Demand legend */}
        <div className="hidden sm:flex items-center gap-3 mb-6 text-xs text-gray-500">
          <Zap className="w-3.5 h-3.5 text-yellow-500" />
          <span>Demand level:</span>
          {Object.entries(DEMAND_CONFIG).map(([key, cfg]) => (
            <span key={key} className="flex items-center gap-1">
              <span className={cn('w-2 h-2 rounded-full', cfg.dot)} />
              {cfg.label.replace(/[^\w\s]/g, '').trim()}
            </span>
          ))}
        </div>

        {/* Cards */}
        {isLoading ? (
          <>
            <div className="sm:hidden -mx-4 px-4">
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {Array.from({ length: 4 }).map((_, i) => <TrendingCardSkeleton key={i} />)}
              </div>
            </div>
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <TrendingCardSkeleton key={i} />)}
            </div>
          </>
        ) : !hasData ? (
          <div className="text-center py-12 text-gray-400">
            <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No trending properties available yet.</p>
            <p className="text-xs mt-1">Check back as listings accumulate views and inquiries.</p>
          </div>
        ) : (
          <>
            {/* Mobile: horizontal scroll */}
            <div className="sm:hidden -mx-4 px-4">
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
                {properties.map((p: any, i: number) => (
                  <TrendingCard key={p.id} property={p} rank={i + 1} />
                ))}
              </div>
            </div>
            {/* Desktop: grid */}
            <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4">
              {properties.map((p: any, i: number) => (
                <TrendingCard key={p.id} property={p} rank={i + 1} />
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Live data — based on real platform activity
          </p>
          <Link
            href={`/properties?sortBy=trending${selectedCity ? `&city=${selectedCity}` : ''}`}
            className="flex items-center gap-1 text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            See All Trending <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
