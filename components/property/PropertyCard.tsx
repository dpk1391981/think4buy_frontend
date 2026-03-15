'use client';

import { useState } from 'react';
import Link from 'next/link';
import OptimizedImage from '@/components/common/OptimizedImage';
import {
  BedDouble, Bath, Maximize2, MapPin, CheckCircle, Heart, Zap,
  Camera, Phone, MessageCircle, Mail, Eye, Calendar, Building2,
  Star, TrendingDown, Shield, Car, Layers, Compass, Home, Clock,
  Award, ChevronRight,
} from 'lucide-react';
import { Property } from '@/types/property';
import {
  formatPrice, formatArea, getCategoryLabel,
  getPropertyTypeLabel, getPrimaryImage, timeAgo, getFurnishingLabel,
} from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch } from '@/lib/store';
import { openAuthModal } from '@/lib/store/slices/uiSlice';
import { useAnalytics } from '@/hooks/useAnalytics';

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

function getHighlights(property: Property): { label: string; icon: React.ElementType; color: string }[] {
  const chips: { label: string; icon: React.ElementType; color: string }[] = [];
  if (property.possessionStatus === 'ready_to_move') {
    chips.push({ label: 'Ready to Move', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' });
  } else if (property.possessionStatus === 'under_construction') {
    chips.push({ label: 'Under Construction', icon: Building2, color: 'text-orange-600 bg-orange-50 border-orange-200' });
  }
  if (property.reraNumber) {
    chips.push({ label: 'RERA Certified', icon: Shield, color: 'text-blue-600 bg-blue-50 border-blue-200' });
  }
  if (property.parkingSpots && property.parkingSpots > 0) {
    chips.push({ label: `${property.parkingSpots} Parking`, icon: Car, color: 'text-gray-600 bg-gray-50 border-gray-200' });
  }
  if (property.isNewProject) {
    chips.push({ label: 'New Project', icon: Star, color: 'text-purple-600 bg-purple-50 border-purple-200' });
  }
  if (property.society) {
    chips.push({ label: 'Gated Society', icon: Award, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' });
  }
  return chips.slice(0, 4);
}

export default function PropertyCard({ property, className, listView }: PropertyCardProps) {
  const { isSaved, toggle } = useWishlist();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { trackPropertyClick, trackPropertySave } = useAnalytics();
  const [showPhone, setShowPhone] = useState(false);

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
  const highlights = getHighlights(property);

  const handleCardClick = () => {
    trackPropertyClick(property.id, {
      city:  property.city  || undefined,
      state: property.state || undefined,
      metadata: { propertyType: property.type },
    });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      dispatch(openAuthModal({ mode: 'login', reason: 'wishlist' }));
      return;
    }
    toggle(property.id);
    if (!saved) {
      trackPropertySave(property.id, {
        city:  property.city  || undefined,
        state: property.state || undefined,
      });
    }
  };

  // ── Rich List View ──────────────────────────────────────────────────────────────
  if (listView) {
    const phone = property.owner?.phone;
    const whatsappMsg = encodeURIComponent(`Hi, I'm interested in ${property.title} in ${property.locality}, ${property.city}. Please share more details.`);
    const whatsappUrl = phone ? `https://wa.me/91${phone.replace(/\D/g, '')}?text=${whatsappMsg}` : `/properties/${property.slug}`;

    return (
      <article
        className={cn(
          'bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-primary-200 transition-all duration-200 overflow-hidden group',
          property.isBoosted && 'ring-1 ring-purple-200 border-purple-100',
          plan?.label === 'Featured' && !property.isBoosted && 'ring-1 ring-amber-200 border-amber-100',
          className,
        )}
      >
        <div className="flex flex-col sm:flex-row">

          {/* ── IMAGE SECTION ─────────────────────────────────── */}
          <div className="relative sm:w-64 lg:w-72 xl:w-80 flex-shrink-0">
            <Link
              href={`/properties/${property.slug}`}
              onClick={handleCardClick}
              className="block relative overflow-hidden"
              style={{ aspectRatio: '4/3' }}
            >
              <OptimizedImage
                src={primaryImage}
                alt={property.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                sizes="(max-width:640px) 100vw, 320px"
              />
              {/* Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

              {/* Top-left: category + plan badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                <span className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide', CATEGORY_BADGE[property.category] || CATEGORY_BADGE.buy)}>
                  {getCategoryLabel(property.category)}
                </span>
                {property.isBoosted ? (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 bg-purple-600 text-white">
                    <Zap className="w-2.5 h-2.5" />Boosted
                  </span>
                ) : plan && (
                  <span className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1', plan.cls)}>
                    <Zap className="w-2.5 h-2.5" />{plan.label}
                  </span>
                )}
                {property.isNewProject && (
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-500 text-white">
                    New Project
                  </span>
                )}
              </div>

              {/* Top-right: wishlist */}
              <button
                onClick={handleWishlist}
                className={cn(
                  'absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all active:scale-90',
                  saved ? 'bg-red-500' : 'bg-white/90 hover:bg-white',
                )}
                aria-label={saved ? 'Remove from saved' : 'Save property'}
              >
                <Heart className={cn('w-4 h-4', saved ? 'fill-white text-white' : 'text-gray-600')} />
              </button>

              {/* Bottom-left: verified */}
              {property.isVerified && (
                <div className="absolute bottom-3 left-3">
                  <span className="flex items-center gap-1 bg-emerald-500/90 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                    <CheckCircle className="w-3 h-3" /> Verified
                  </span>
                </div>
              )}

              {/* Bottom-right: photo count */}
              {property.images?.length > 1 && (
                <div className="absolute bottom-3 right-3">
                  <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                    <Camera className="w-3 h-3" />{property.images.length}
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* ── CONTENT + PRICE ───────────────────────────────── */}
          <div className="flex-1 flex flex-col sm:flex-row min-w-0">

            {/* Center: all info */}
            <Link
              href={`/properties/${property.slug}`}
              onClick={handleCardClick}
              className="flex-1 p-4 sm:p-5 flex flex-col gap-2 min-w-0"
            >
              {/* Title row */}
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">
                  {property.title}
                </h3>
                <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {timeAgo(property.createdAt)}
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-primary-500" />
                <span className="line-clamp-1">
                  {[property.society, property.locality, property.city].filter(Boolean).join(', ')}
                </span>
              </div>

              {/* Specs bar */}
              <div className="flex flex-wrap items-center gap-0 text-sm text-gray-700">
                {property.bedrooms && (
                  <span className="flex items-center gap-1.5 pr-3 mr-3 border-r border-gray-200">
                    <BedDouble className="w-3.5 h-3.5 text-gray-400" />
                    <span className="font-semibold">{property.bedrooms} BHK</span>
                  </span>
                )}
                {property.bathrooms && (
                  <span className="flex items-center gap-1.5 pr-3 mr-3 border-r border-gray-200">
                    <Bath className="w-3.5 h-3.5 text-gray-400" />
                    <span>{property.bathrooms} Bath</span>
                  </span>
                )}
                {property.area && (
                  <span className="flex items-center gap-1.5 pr-3 mr-3 border-r border-gray-200 last:border-r-0 last:pr-0 last:mr-0">
                    <Maximize2 className="w-3.5 h-3.5 text-gray-400" />
                    <span>{formatArea(property.area, property.areaUnit)}</span>
                  </span>
                )}
                {property.floorNumber != null && property.totalFloors && (
                  <span className="flex items-center gap-1.5 pr-3 mr-3 border-r border-gray-200 last:border-r-0 last:pr-0 last:mr-0">
                    <Layers className="w-3.5 h-3.5 text-gray-400" />
                    <span>Floor {property.floorNumber}/{property.totalFloors}</span>
                  </span>
                )}
                {property.furnishingStatus && (
                  <span className="flex items-center gap-1.5 last:pr-0 last:mr-0">
                    <Home className="w-3.5 h-3.5 text-gray-400" />
                    <span>{getFurnishingLabel(property.furnishingStatus)}</span>
                  </span>
                )}
              </div>

              {/* Type + property age row */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium">
                  {getPropertyTypeLabel(property.type)}
                </span>
                {property.propertyAge != null && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {property.propertyAge === 0 ? 'New Construction' : `${property.propertyAge} yr${property.propertyAge > 1 ? 's' : ''} old`}
                  </span>
                )}
                {property.reraNumber && (
                  <span className="flex items-center gap-1 text-blue-600">
                    <Shield className="w-3 h-3" />
                    RERA: {property.reraNumber}
                  </span>
                )}
              </div>

              {/* Highlights chips */}
              {highlights.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {highlights.map((h, i) => {
                    const Icon = h.icon;
                    return (
                      <span key={i} className={cn('flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium', h.color)}>
                        <Icon className="w-3 h-3" />
                        {h.label}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Agent / Owner row */}
              <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Avatar */}
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 overflow-hidden',
                    isAgent ? 'bg-blue-500' : 'bg-gray-400',
                  )}>
                    {property.owner?.avatar ? (
                      <OptimizedImage src={property.owner.avatar} alt={ownerName || ''} fill className="object-cover" sizes="28px" />
                    ) : (
                      ownerName?.[0]?.toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-gray-700 truncate max-w-[140px]">{ownerName}</span>
                      {property.owner?.isVerified && (
                        <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400">
                      {isAgent ? 'Verified Agent' : 'Property Owner'}
                    </span>
                  </div>
                </div>

                {/* Engagement signals */}
                {property.viewCount > 0 && (
                  <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                    <Eye className="w-3.5 h-3.5" />
                    {property.viewCount >= 1000
                      ? `${(property.viewCount / 1000).toFixed(1)}k`
                      : property.viewCount} views
                  </div>
                )}
              </div>
            </Link>

            {/* Right: Price + CTA — desktop */}
            <div className="hidden sm:flex flex-col items-end justify-between p-4 sm:p-5 border-l border-gray-100 sm:w-44 lg:w-48 flex-shrink-0">
              {/* Price */}
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900 leading-tight">
                  {formatPrice(property.price, property.priceUnit)}
                </p>
                {pricePerSqft && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    ₹{pricePerSqft.toLocaleString('en-IN')}/sqft
                  </p>
                )}
                {property.brokerage === '0' && (
                  <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                    <TrendingDown className="w-3 h-3" />Zero Brokerage
                  </span>
                )}
              </div>

              {/* CTA buttons */}
              <div className="flex flex-col gap-2 w-full mt-4">
                {/* Contact */}
                <Link
                  href={`/properties/${property.slug}`}
                  onClick={handleCardClick}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-all active:scale-[0.98] shadow-sm"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Contact
                </Link>

                {/* Call */}
                {showPhone && phone ? (
                  <a
                    href={`tel:${phone}`}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all active:scale-[0.98]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {phone}
                  </a>
                ) : (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (!user) { dispatch(openAuthModal({ mode: 'login', reason: 'contact' })); return; }
                      setShowPhone(true);
                    }}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 border border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold rounded-xl transition-all active:scale-[0.98]"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call Now
                  </button>
                )}

                {/* WhatsApp */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!user && phone) { e.preventDefault(); dispatch(openAuthModal({ mode: 'login', reason: 'contact' })); }
                  }}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 text-xs font-bold rounded-xl transition-all active:scale-[0.98]"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── MOBILE BOTTOM SECTION ──────────────────────────── */}
        <div className="sm:hidden px-4 pb-4">
          {/* Price row */}
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-xl font-bold text-gray-900">
                {formatPrice(property.price, property.priceUnit)}
              </span>
              {pricePerSqft && (
                <span className="text-xs text-gray-400 ml-2">
                  ₹{pricePerSqft.toLocaleString('en-IN')}/sqft
                </span>
              )}
            </div>
            {property.brokerage === '0' && (
              <span className="text-[11px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                Zero Brokerage
              </span>
            )}
          </div>

          {/* Mobile CTA strip */}
          <div className="grid grid-cols-3 gap-2">
            {showPhone && phone ? (
              <a
                href={`tel:${phone}`}
                className="flex items-center justify-center gap-1 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl active:scale-[0.98]"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="w-3.5 h-3.5" />
                {phone.slice(0, 10)}
              </a>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (!user) { dispatch(openAuthModal({ mode: 'login', reason: 'contact' })); return; }
                  setShowPhone(true);
                }}
                className="flex items-center justify-center gap-1 py-2.5 border border-emerald-300 text-emerald-700 bg-emerald-50 text-xs font-bold rounded-xl active:scale-[0.98]"
              >
                <Phone className="w-3.5 h-3.5" />
                Call
              </button>
            )}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                if (!user && phone) { e.preventDefault(); dispatch(openAuthModal({ mode: 'login', reason: 'contact' })); }
              }}
              className="flex items-center justify-center gap-1 py-2.5 border border-green-300 text-green-700 bg-green-50 text-xs font-bold rounded-xl active:scale-[0.98]"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </a>
            <Link
              href={`/properties/${property.slug}`}
              onClick={handleCardClick}
              className="flex items-center justify-center gap-1 py-2.5 bg-primary-600 text-white text-xs font-bold rounded-xl active:scale-[0.98]"
            >
              <Mail className="w-3.5 h-3.5" />
              Contact
            </Link>
          </div>
        </div>
      </article>
    );
  }

  // ── Grid view ─────────────────────────────────────────────────────────────────
  return (
    <article className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden group cursor-pointer', className)}>
      <Link href={`/properties/${property.slug}`} className="block" onClick={handleCardClick}>
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
            {property.isBoosted ? (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 bg-purple-600 text-white">
                <Zap className="w-2.5 h-2.5" />Boosted
              </span>
            ) : plan && (
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
