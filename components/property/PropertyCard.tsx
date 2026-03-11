'use client';

import Link from 'next/link';
import OptimizedImage from '@/components/common/OptimizedImage';
import { BedDouble, Bath, Maximize2, MapPin, CheckCircle, Heart, Zap, Phone, Camera } from 'lucide-react';
import { Property } from '@/types/property';
import {
  formatPrice,
  formatArea,
  getCategoryLabel,
  getPropertyTypeLabel,
  getPrimaryImage,
  timeAgo,
  getFurnishingLabel,
} from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch } from '@/lib/store';
import { openAuthModal } from '@/lib/store/slices/uiSlice';

interface PropertyCardProps {
  property: Property;
  className?: string;
  listView?: boolean;
}

const CATEGORY_BADGE: Record<string, string> = {
  buy:        'bg-emerald-500 text-white',
  rent:       'bg-blue-500 text-white',
  pg:         'bg-purple-500 text-white',
  commercial: 'bg-orange-500 text-white',
  industrial: 'bg-slate-600 text-white',
};

const PLAN_BADGE: Record<string, { label: string; cls: string }> = {
  featured: { label: 'Featured', cls: 'bg-amber-400 text-amber-900' },
  premium:  { label: 'Premium',  cls: 'bg-violet-600 text-white' },
};

export default function PropertyCard({ property, className, listView }: PropertyCardProps) {
  const { isSaved, toggle } = useWishlist();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const primaryImage = getPrimaryImage(property.images);
  const saved = isSaved(property.id);
  const plan = property.listingPlan && PLAN_BADGE[property.listingPlan];
  const pricePerSqft =
    property.area && property.price && property.priceUnit !== 'per month'
      ? Math.round(property.price / property.area)
      : null;
  const isAgent = property.owner?.role === 'agent';
  const ownerName = isAgent
    ? property.owner?.company || property.owner?.name
    : property.owner?.name;

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      dispatch(openAuthModal('login'));
      return;
    }
    toggle(property.id);
  };

  // ── List view ─────────────────────────────────────────────────────────────────
  if (listView) {
    return (
      <article className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group', className)}>
        <Link href={`/properties/${property.slug}`} className="flex">
          {/* Image */}
          <div className="relative w-56 sm:w-72 flex-shrink-0">
            <OptimizedImage
              src={primaryImage}
              alt={property.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="288px"
            />
            {/* Overlay badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide', CATEGORY_BADGE[property.category] || CATEGORY_BADGE.buy)}>
                {getCategoryLabel(property.category)}
              </span>
              {plan && (
                <span className={cn('text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1', plan.cls)}>
                  <Zap className="w-2.5 h-2.5" />{plan.label}
                </span>
              )}
            </div>
            <button
              onClick={handleWishlist}
              className={cn('absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all', saved ? 'bg-red-500' : 'bg-white/90 hover:bg-white')}
              aria-label="Save"
            >
              <Heart className={cn('w-4 h-4', saved ? 'fill-white text-white' : 'text-gray-500')} />
            </button>
            {property.images?.length > 1 && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                <Camera className="w-3 h-3" />{property.images.length}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 flex flex-col min-w-0">
            {/* Price + verified */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <p className="text-xl font-bold text-gray-900">{formatPrice(property.price, property.priceUnit)}</p>
                {pricePerSqft && <p className="text-xs text-gray-400 mt-0.5">₹{pricePerSqft.toLocaleString('en-IN')}/sqft</p>}
              </div>
              {property.isVerified && (
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex-shrink-0">
                  <CheckCircle className="w-3 h-3" /> Verified
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-2 group-hover:text-primary-600 transition-colors">
              {property.title}
            </h3>

            {/* Location */}
            <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
              <span className="line-clamp-1">{property.locality}, {property.city}</span>
            </div>

            {/* Specs */}
            <div className="flex items-center gap-0 mb-3">
              {property.bedrooms && (
                <span className="flex items-center gap-1 text-xs text-gray-600 pr-3 border-r border-gray-200">
                  <BedDouble className="w-3.5 h-3.5 text-gray-400" />{property.bedrooms} BHK
                </span>
              )}
              {property.bathrooms && (
                <span className="flex items-center gap-1 text-xs text-gray-600 px-3 border-r border-gray-200">
                  <Bath className="w-3.5 h-3.5 text-gray-400" />{property.bathrooms} Bath
                </span>
              )}
              {property.area && (
                <span className="flex items-center gap-1 text-xs text-gray-600 px-3">
                  <Maximize2 className="w-3.5 h-3.5 text-gray-400" />{formatArea(property.area, property.areaUnit)}
                </span>
              )}
            </div>

            {/* Footer: tags + owner */}
            <div className="mt-auto flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                  {getPropertyTypeLabel(property.type)}
                </span>
                {property.furnishingStatus && (
                  <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">
                    {getFurnishingLabel(property.furnishingStatus)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-400 flex-shrink-0">
                <div className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0', isAgent ? 'bg-blue-500' : 'bg-gray-400')}>
                  {ownerName?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="line-clamp-1 max-w-[100px]">{ownerName}</span>
                <span>·</span>
                <span>{timeAgo(property.createdAt)}</span>
              </div>
            </div>
          </div>
        </Link>
      </article>
    );
  }

  // ── Grid view ─────────────────────────────────────────────────────────────────
  return (
    <article className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group cursor-pointer', className)}>
      <Link href={`/properties/${property.slug}`} className="block">
        {/* Image */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '16/10' }}>
          <OptimizedImage
            src={primaryImage}
            alt={property.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex gap-1.5">
            <span className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide', CATEGORY_BADGE[property.category] || CATEGORY_BADGE.buy)}>
              {getCategoryLabel(property.category)}
            </span>
            {plan && (
              <span className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1', plan.cls)}>
                <Zap className="w-2.5 h-2.5" />{plan.label}
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            className={cn(
              'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all',
              saved ? 'bg-red-500 scale-110' : 'bg-white/90 hover:bg-white hover:scale-110',
            )}
            aria-label={saved ? 'Remove from wishlist' : 'Save'}
            onClick={handleWishlist}
          >
            <Heart className={cn('w-4 h-4', saved ? 'fill-white text-white' : 'text-gray-500')} />
          </button>

          {/* Bottom row: verified + photo count */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            {property.isVerified ? (
              <span className="flex items-center gap-1 bg-emerald-500/90 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3" /> Verified
              </span>
            ) : <span />}
            {property.images?.length > 1 && (
              <span className="flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                <Camera className="w-3 h-3" />{property.images.length}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Price */}
          <div className="flex items-start justify-between mb-1.5">
            <div>
              <p className="text-xl font-bold text-gray-900 leading-tight">
                {formatPrice(property.price, property.priceUnit)}
              </p>
              {pricePerSqft && (
                <p className="text-xs text-gray-400 mt-0.5">₹{pricePerSqft.toLocaleString('en-IN')}/sqft</p>
              )}
            </div>
            {property.isFeatured && !plan && (
              <Zap className="w-4 h-4 text-amber-400 fill-amber-300 flex-shrink-0 mt-1" />
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1.5 group-hover:text-primary-600 transition-colors">
            {property.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span className="line-clamp-1">{property.locality}, {property.city}</span>
          </div>

          {/* Specs divider row */}
          {(property.bedrooms || property.bathrooms || property.area) && (
            <div className="flex items-center py-2.5 border-y border-gray-100 mb-3">
              {property.bedrooms && (
                <div className="flex-1 flex items-center justify-center gap-1 text-xs text-gray-600 border-r border-gray-100">
                  <BedDouble className="w-3.5 h-3.5 text-gray-400" />
                  <span>{property.bedrooms} BHK</span>
                </div>
              )}
              {property.bathrooms && (
                <div className="flex-1 flex items-center justify-center gap-1 text-xs text-gray-600 border-r border-gray-100 last:border-r-0">
                  <Bath className="w-3.5 h-3.5 text-gray-400" />
                  <span>{property.bathrooms}</span>
                </div>
              )}
              {property.area && (
                <div className="flex-1 flex items-center justify-center gap-1 text-xs text-gray-600">
                  <Maximize2 className="w-3.5 h-3.5 text-gray-400" />
                  <span>{formatArea(property.area, property.areaUnit)}</span>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0', isAgent ? 'bg-blue-500' : 'bg-gray-400')}>
                {ownerName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-700 line-clamp-1">{ownerName}</p>
                <p className="text-[10px] text-gray-400">{isAgent ? 'Agent' : 'Owner'} · {timeAgo(property.createdAt)}</p>
              </div>
            </div>
            {property.furnishingStatus && (
              <span className="bg-gray-100 text-gray-500 text-[11px] px-2 py-0.5 rounded-full flex-shrink-0">
                {getFurnishingLabel(property.furnishingStatus)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
