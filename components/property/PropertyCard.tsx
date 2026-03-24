'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import OptimizedImage from '@/components/common/OptimizedImage';
import {
  BedDouble, Bath, Maximize2, MapPin, CheckCircle, Heart, Zap,
  Camera, Phone, Mail, Eye, Building2,
  Star, TrendingDown, Shield, Car, Award, Clock,
  ChevronLeft, ChevronRight, Layers,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/common/PhoneRevealButton';
import { Property } from '@/types/property';
import {
  formatPrice, formatArea, getPropertyArea, getCategoryLabel,
  getPropertyTypeLabel, getPrimaryImage, timeAgo, getFurnishingLabel,
} from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch } from '@/lib/store';
import { openAuthModal, addToast } from '@/lib/store/slices/uiSlice';
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

const STATUS_OVERLAY: Record<string, { label: string; cls: string } | undefined> = {
  under_deal: { label: '🤝 Under Deal', cls: 'bg-orange-500 text-white' },
  sold:       { label: '✅ Sold',        cls: 'bg-red-600 text-white' },
  rented:     { label: '🔑 Rented',     cls: 'bg-blue-600 text-white' },
  inactive:   { label: '⏸ Inactive',   cls: 'bg-gray-600 text-white' },
};

function getImageUrls(images: any[], fallback: string): string[] {
  if (!images?.length) return fallback ? [fallback] : [];
  const urls = images
    .map((img: any) =>
      typeof img === 'string' ? img : (img?.url || img?.src || img?.path || img?.imageUrl || ''),
    )
    .filter(Boolean);
  return urls.length ? urls : (fallback ? [fallback] : []);
}

function getHighlights(property: Property) {
  const chips: { label: string; icon: React.ElementType; color: string }[] = [];
  if (property.possessionStatus === 'ready_to_move')
    chips.push({ label: 'Ready to Move', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' });
  else if (property.possessionStatus === 'under_construction')
    chips.push({ label: 'Under Construction', icon: Building2, color: 'text-orange-600 bg-orange-50 border-orange-200' });
  if (property.reraNumber)
    chips.push({ label: 'RERA', icon: Shield, color: 'text-blue-600 bg-blue-50 border-blue-200' });
  if (property.parkingSpots && property.parkingSpots > 0)
    chips.push({ label: `${property.parkingSpots} Parking`, icon: Car, color: 'text-gray-600 bg-gray-50 border-gray-200' });
  if (property.isNewProject)
    chips.push({ label: 'New Project', icon: Star, color: 'text-purple-600 bg-purple-50 border-purple-200' });
  if (property.society)
    chips.push({ label: 'Gated Society', icon: Award, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' });
  return chips.slice(0, 4);
}

// ── Auto-cycling Image Carousel ────────────────────────────────────────────────

interface CarouselProps {
  urls: string[];
  title: string;
  sizes: string;
}

function ImageCarousel({ urls, title, sizes }: CarouselProps) {
  const [idx, setIdx] = useState(0);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (urls.length <= 1 || hovered) return;
    timerRef.current = setInterval(
      () => setIdx(i => (i + 1) % urls.length),
      3500,
    );
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [urls.length, hovered]);

  const go = (e: React.MouseEvent, dir: 1 | -1) => {
    e.preventDefault(); e.stopPropagation();
    setIdx(i => (i + dir + urls.length) % urls.length);
  };
  const gotoDot = (e: React.MouseEvent, i: number) => {
    e.preventDefault(); e.stopPropagation(); setIdx(i);
  };

  if (!urls.length) return null;

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-gray-200"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Slides */}
      {urls.map((url, i) => (
        <div
          key={i}
          className={cn(
            'absolute inset-0 transition-opacity duration-500',
            i === idx ? 'opacity-100 z-[1]' : 'opacity-0 z-0',
          )}
        >
          <OptimizedImage
            src={url}
            alt={i === 0 ? title : `${title} photo ${i + 1}`}
            fill
            className="object-cover"
            sizes={sizes}
          />
        </div>
      ))}

      {/* Prev / Next arrows — on hover, desktop */}
      {urls.length > 1 && hovered && (
        <>
          <button
            onClick={e => go(e, -1)}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center shadow transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={e => go(e, 1)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center shadow transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {urls.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 z-10 flex items-center justify-center gap-1">
          {urls.slice(0, 6).map((_, i) => (
            <button
              key={i}
              onClick={e => gotoDot(e, i)}
              className={cn(
                'rounded-full transition-all duration-300',
                i === idx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/55 hover:bg-white/80',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── PropertyCard ──────────────────────────────────────────────────────────────

export default function PropertyCard({ property, className, listView }: PropertyCardProps) {
  const { isSaved, toggle } = useWishlist();
  const { user }            = useAuth();
  const dispatch            = useAppDispatch();
  const { trackPropertyClick, trackPropertySave } = useAnalytics();
  const [showPhone, setShowPhone] = useState(false);
  const [heartAnim, setHeartAnim] = useState(false);

  const primaryImage   = getPrimaryImage(property.images);
  const imageUrls      = getImageUrls(property.images, primaryImage);
  const saved          = isSaved(property.id);
  const plan           = property.listingPlan && PLAN_BADGE[property.listingPlan];
  const statusOverlay  = STATUS_OVERLAY[property.status];
  const { area: resolvedArea } = getPropertyArea(property);
  const pricePerSqft =
    resolvedArea && property.price && property.priceUnit !== 'per month'
      ? Math.round(property.price / resolvedArea) : null;
  const isAgent   = property.owner?.role === 'agent';
  const ownerName = isAgent
    ? property.owner?.company || property.owner?.name
    : property.owner?.name;
  const highlights = getHighlights(property);
  const phone      = property.owner?.phone;
  const whatsappMsg = encodeURIComponent(
    `Hi, I'm interested in "${property.title}" in ${property.locality || ''}, ${property.city || ''}. Please share more details.`,
  );
  const whatsappUrl = phone
    ? `https://wa.me/91${phone.replace(/\D/g, '')}?text=${whatsappMsg}`
    : `/properties/${property.slug}`;

  const handleCardClick = () =>
    trackPropertyClick(property.id, {
      city: property.city || undefined, state: property.state || undefined,
      metadata: { propertyType: property.type },
    });

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { dispatch(openAuthModal({ mode: 'login', reason: 'wishlist' })); return; }
    setHeartAnim(true);
    setTimeout(() => setHeartAnim(false), 450);
    toggle(property.id);
    dispatch(addToast({
      message: saved ? 'Removed from saved' : '❤ Saved to wishlist',
      type: saved ? 'info' : 'success',
    }));
    if (!saved)
      trackPropertySave(property.id, { city: property.city || undefined, state: property.state || undefined });
  };

  const handleRevealPhone = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!user) { dispatch(openAuthModal({ mode: 'login', reason: 'contact' })); return; }
    setShowPhone(true);
  };

  const handleWAClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user && phone) { e.preventDefault(); dispatch(openAuthModal({ mode: 'login', reason: 'contact' })); }
  };

  // ── LIST VIEW (desktop) ───────────────────────────────────────────────────

  if (listView) {
    return (
      <article className={cn(
        'bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg hover:border-primary-200 transition-all duration-200 group',
        property.isBoosted && 'ring-1 ring-purple-200',
        plan?.label === 'Featured' && !property.isBoosted && 'ring-1 ring-amber-200',
        className,
      )}>
        <div className="flex" style={{ minHeight: '176px' }}>

          {/* ── IMAGE ─────────────────────────────────── */}
          <div className="relative w-[190px] sm:w-[230px] lg:w-[270px] flex-shrink-0">
            <Link href={`/properties/${property.slug}`} onClick={handleCardClick} className="block absolute inset-0">
              <ImageCarousel
                urls={imageUrls}
                title={property.title}
                sizes="(max-width:640px) 190px, (max-width:1024px) 230px, 270px"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none z-[2]" />

              {/* Top: category + plan badges */}
              <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-[3]">
                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shadow-sm', CATEGORY_BADGE[property.category] || CATEGORY_BADGE.buy)}>
                  {getCategoryLabel(property.category)}
                </span>
                {property.isBoosted ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 bg-purple-600 text-white shadow-sm">
                    <Zap className="w-2.5 h-2.5" /> Boosted
                  </span>
                ) : plan && (
                  <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm', plan.cls)}>
                    {plan.label}
                  </span>
                )}
                {(property as any).isTrending && !property.isBoosted && !plan && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 bg-orange-500 text-white shadow-sm">
                    🔥 Trending
                  </span>
                )}
              </div>

              {/* Wishlist */}
              <button
                onClick={handleWishlist}
                aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
                className={cn(
                  'absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center z-[3]',
                  'transition-all duration-200 hover:scale-110 active:scale-125',
                  'shadow-md ring-1',
                  saved
                    ? 'bg-red-500 ring-red-400/40 shadow-red-200'
                    : 'bg-white ring-white/60 shadow-gray-400/40 hover:ring-red-200',
                )}
              >
                <Heart className={cn(
                  'w-3.5 h-3.5 transition-all duration-200',
                  heartAnim && 'heart-pop',
                  saved ? 'fill-white text-white' : 'text-gray-500 group-hover:text-red-400',
                )} />
              </button>

              {/* Status overlay (under_deal / sold / rented / inactive) */}
              {statusOverlay && (
                <div className={cn('absolute inset-x-0 bottom-0 z-[4] text-center text-[11px] font-black py-1 tracking-wide', statusOverlay.cls)}>
                  {statusOverlay.label}
                </div>
              )}

              {/* Bottom: verified + photo count */}
              <div className="absolute bottom-8 left-2.5 right-2.5 flex items-center justify-between z-[3]">
                {property.isVerified && (
                  <span className="flex items-center gap-0.5 bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                    <CheckCircle className="w-2.5 h-2.5" /> Verified
                  </span>
                )}
                {imageUrls.length > 1 && (
                  <span className="ml-auto flex items-center gap-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    <Camera className="w-2.5 h-2.5" /> {imageUrls.length}
                  </span>
                )}
              </div>
            </Link>
          </div>

          {/* ── CONTENT ──────────────────────────────── */}
          <Link
            href={`/properties/${property.slug}`}
            onClick={handleCardClick}
            className="flex-1 px-4 py-3.5 flex flex-col justify-between min-w-0 overflow-hidden"
          >
            <div className="space-y-1.5">

              {/* Price + time ago */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center bg-emerald-600 text-white text-lg sm:text-xl font-black leading-none px-3 py-1 rounded-lg shadow-sm whitespace-nowrap">
                      {formatPrice(property.price, property.priceUnit)}
                    </span>
                    {isAgent && property.brokerage === 'no_brokerage' && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full">
                        <TrendingDown className="w-2.5 h-2.5" /> Zero Brokerage
                      </span>
                    )}
                  </div>
                  {pricePerSqft && (
                    <span className="text-xs text-gray-400 font-medium pl-1">
                      ₹{pricePerSqft.toLocaleString('en-IN')}/sqft
                    </span>
                  )}
                </div>
                <span className="flex items-center gap-1 text-[11px] text-gray-400 flex-shrink-0 mt-0.5">
                  <Clock className="w-3 h-3" />{timeAgo(property.createdAt)}
                </span>
              </div>

              {/* Title */}
              <h2 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                {property.title}
              </h2>

              {/* Location */}
              <p className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin className="w-3 h-3 text-primary-400 flex-shrink-0" />
                <span className="line-clamp-1">
                  {[property.society, property.locality, property.city, property.state].filter(Boolean).join(', ')}
                </span>
              </p>

              {/* Specs */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-600">
                {property.bedrooms && (
                  <span className="flex items-center gap-1 font-semibold">
                    <BedDouble className="w-3.5 h-3.5 text-gray-400" />{property.bedrooms} BHK
                  </span>
                )}
                {property.bathrooms && (
                  <span className="flex items-center gap-1 text-gray-500">
                    <Bath className="w-3.5 h-3.5 text-gray-400" />{property.bathrooms} Bath
                  </span>
                )}
                {(() => { const { area: a, areaUnit: u } = getPropertyArea(property); return a ? <span className="flex items-center gap-1 text-gray-500"><Maximize2 className="w-3.5 h-3.5 text-gray-400" />{formatArea(a, u)}</span> : null; })()}
                {(() => {
                  const floorNum = property.floorNumber ?? (property.extraDetails as any)?.floor_number ?? null;
                  const totalF = property.totalFloors || (property.extraDetails as any)?.floor || null;
                  return floorNum != null ? (
                    <span className="flex items-center gap-1 text-gray-400">
                      <Layers className="w-3.5 h-3.5" />Floor {floorNum}{totalF ? `/${totalF}` : ''}
                    </span>
                  ) : null;
                })()}
                {(() => {
                  const fur = property.furnishingStatus
                    ? getFurnishingLabel(property.furnishingStatus)
                    : (property.extraDetails as any)?.furnishing || null;
                  return fur ? <span className="text-gray-400">{fur}</span> : null;
                })()}
              </div>

              {/* Highlight tags */}
              <div className="flex flex-wrap gap-1">
                <span className="text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md font-medium">
                  {getPropertyTypeLabel(property.type)}
                </span>
                {highlights.map((h, i) => {
                  const Icon = h.icon;
                  return (
                    <span key={i} className={cn('text-[11px] flex items-center gap-0.5 px-2 py-0.5 rounded-md border font-medium', h.color)}>
                      <Icon className="w-2.5 h-2.5" />{h.label}
                    </span>
                  );
                })}
              </div>

              {/* Description snippet */}
              {property.description && (
                <div className="hidden sm:block">
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {property.description}
                  </p>
                  {property.description.length > 100 && (
                    <span className="text-[11px] text-primary-500 font-medium hover:text-primary-600 cursor-pointer">
                      View more →
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Owner row */}
            <div className="flex items-center justify-between pt-2 mt-1.5 border-t border-gray-100">
              <div className="flex items-center gap-2 min-w-0">
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0',
                  isAgent ? 'bg-blue-500' : 'bg-primary-500',
                )}>
                  {ownerName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate max-w-[130px] flex items-center gap-1">
                    {ownerName}
                    {property.owner?.isVerified && (
                      <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    )}
                  </p>
                  <p className="text-[10px] text-gray-400">{isAgent ? 'Real Estate Agency' : 'Owner'}</p>
                </div>
              </div>
              {property.viewCount > 0 && (
                <span className="hidden sm:flex items-center gap-1 text-[11px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  <Eye className="w-3.5 h-3.5 text-primary-400" />
                  {property.viewCount >= 1000
                    ? `${(property.viewCount / 1000).toFixed(1)}k` : property.viewCount} views
                </span>
              )}
            </div>

          </Link>

          {/* ── RIGHT CONTACT PANEL — desktop only ──── */}
          <div className="hidden sm:flex flex-col w-[176px] flex-shrink-0 border-l border-gray-100">

            {/* Posted by header */}
            <div className="px-4 pt-4 pb-3 border-b border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Posted by</p>
              <div className="flex items-center gap-2.5">
                <div className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0 shadow-sm',
                  isAgent
                    ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                    : 'bg-gradient-to-br from-primary-400 to-primary-600',
                )}>
                  {ownerName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate flex items-center gap-1 leading-tight">
                    <span className="truncate">{ownerName}</span>
                    {property.owner?.isVerified && (
                      <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    )}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {isAgent ? 'Registered Agency' : 'Property Owner'}
                  </p>
                  {isAgent && property.brokerage === 'no_brokerage' && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full mt-1">
                      <TrendingDown className="w-2 h-2" /> Zero Brokerage
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="px-4 py-3 flex flex-col gap-2">
              <Link
                href={`/properties/${property.slug}`}
                onClick={handleCardClick}
                className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95"
              >
                <Mail className="w-3.5 h-3.5" /> Contact Owner
              </Link>

              {showPhone && phone ? (
                <a
                  href={`tel:${phone}`}
                  onClick={e => e.stopPropagation()}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {phone.replace(/(\d{5})(\d{5})/, '$1 $2')}
                </a>
              ) : (
                <button
                  onClick={handleRevealPhone}
                  className="flex items-center justify-center gap-1.5 w-full py-2.5 border border-emerald-400 text-emerald-700 hover:bg-emerald-50 bg-emerald-50/50 text-xs font-bold rounded-xl transition-all active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5" /> View Phone No.
                </button>
              )}

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleWAClick}
                className="flex items-center justify-center gap-1.5 w-full py-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-bold rounded-xl transition-all active:scale-95"
              >
                <WhatsAppIcon className="w-3.5 h-3.5" /> WhatsApp
              </a>
            </div>

          </div>

        </div>
      </article>
    );
  }

  // ── GRID VIEW — full width single column (99acres mobile style) ─────────

  return (
    <article className={cn(
      'bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden group',
      property.isBoosted && 'ring-1 ring-purple-200',
      plan?.label === 'Featured' && !property.isBoosted && 'ring-1 ring-amber-200',
      className,
    )}>

      {/* ── Image ── */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <Link href={`/properties/${property.slug}`} onClick={handleCardClick} className="block absolute inset-0">
          <ImageCarousel urls={imageUrls} title={property.title} sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none z-[2]" />

          {/* Top row: category + plan + wishlist */}
          <div className="absolute top-3 left-3 flex gap-1.5 z-[3]">
            <span className={cn('text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide shadow', CATEGORY_BADGE[property.category] || CATEGORY_BADGE.buy)}>
              {getCategoryLabel(property.category)}
            </span>
            {property.isBoosted ? (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 bg-purple-600 text-white shadow">
                <Zap className="w-3 h-3" /> Boosted
              </span>
            ) : plan && (
              <span className={cn('text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow', plan.cls)}>
                {plan.label}
              </span>
            )}
            {(property as any).isTrending && !property.isBoosted && !plan && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 bg-orange-500 text-white shadow">
                🔥 Trending
              </span>
            )}
          </div>
          <button
            onClick={handleWishlist}
            aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
            className={cn(
              'absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center z-[3]',
              'transition-all duration-200 hover:scale-110 active:scale-125',
              'shadow-lg ring-1',
              saved
                ? 'bg-red-500 ring-red-400/50 shadow-red-300/60'
                : 'bg-white ring-white/70 shadow-gray-500/30 hover:shadow-red-200/60 hover:ring-red-200',
            )}
          >
            <Heart className={cn(
              'w-4 h-4 transition-all duration-200',
              heartAnim && 'heart-pop',
              saved ? 'fill-white text-white' : 'text-gray-500 hover:text-red-400',
            )} />
          </button>

          {/* Status overlay */}
          {statusOverlay && (
            <div className={cn('absolute inset-x-0 bottom-0 z-[4] text-center text-xs font-black py-1.5 tracking-wide', statusOverlay.cls)}>
              {statusOverlay.label}
            </div>
          )}

          {/* Bottom row: verified + views + photo count */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1.5 z-[3]">
            {property.isVerified && (
              <span className="flex items-center gap-1 bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                <CheckCircle className="w-3 h-3" /> Verified
              </span>
            )}
            {property.viewCount > 0 && (
              <span className="flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                <Eye className="w-3 h-3 text-sky-300" />
                {property.viewCount >= 1000
                  ? `${(property.viewCount / 1000).toFixed(1)}k`
                  : property.viewCount}
              </span>
            )}
            {imageUrls.length > 1 && (
              <span className="ml-auto flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
                <Camera className="w-3 h-3" /> {imageUrls.length}
              </span>
            )}
          </div>
        </Link>
      </div>

      {/* ── Content ── */}
      <Link href={`/properties/${property.slug}`} onClick={handleCardClick} className="block px-3 pt-2.5 pb-2">

        {/* Price + time */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center bg-emerald-600 text-white text-base font-black leading-none px-2.5 py-1 rounded-lg shadow-sm whitespace-nowrap">
                {formatPrice(property.price, property.priceUnit)}
              </span>
              {isAgent && property.brokerage === 'no_brokerage' && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                  <TrendingDown className="w-2.5 h-2.5" /> 0 Brokerage
                </span>
              )}
            </div>
            {pricePerSqft && (
              <span className="text-[11px] text-gray-400 font-medium pl-0.5">
                ₹{pricePerSqft.toLocaleString('en-IN')}/sqft
              </span>
            )}
          </div>
          <span className="text-[11px] text-gray-400 flex-shrink-0 mt-1">{timeAgo(property.createdAt)}</span>
        </div>

        {/* Title + Agent/Owner pill on same row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h2 className="text-sm font-bold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors flex-1 min-w-0">
            {property.title}
          </h2>
          <span className={cn(
            'flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap',
            isAgent
              ? 'bg-blue-50 text-blue-600 border-blue-200'
              : 'bg-amber-50 text-amber-700 border-amber-200',
          )}>
            {isAgent ? '🏢 Agent' : '👤 Owner'}
          </span>
        </div>

        {/* Location */}
        <p className="flex items-center gap-1 text-xs text-gray-500 mb-2">
          <MapPin className="w-3 h-3 flex-shrink-0 text-primary-400" />
          <span className="line-clamp-1">{[property.locality, property.city].filter(Boolean).join(', ')}</span>
        </p>

        {/* Specs row */}
        <div className="flex items-center gap-x-2 text-xs text-gray-600 border-t border-gray-100 pt-2">
          {property.bedrooms && (
            <span className="flex items-center gap-1 font-semibold whitespace-nowrap">
              <BedDouble className="w-3.5 h-3.5 text-gray-400" />{property.bedrooms} BHK
            </span>
          )}
          {property.bathrooms && (
            <>
              <span className="text-gray-300">·</span>
              <span className="flex items-center gap-1 text-gray-500 whitespace-nowrap">
                <Bath className="w-3.5 h-3.5 text-gray-400" />{property.bathrooms}
              </span>
            </>
          )}
          {(() => {
            const { area: a, areaUnit: u } = getPropertyArea(property);
            return a ? (
              <>
                <span className="text-gray-300">·</span>
                <span className="flex items-center gap-1 text-gray-500 whitespace-nowrap">
                  <Maximize2 className="w-3.5 h-3.5 text-gray-400" />{formatArea(a, u)}
                </span>
              </>
            ) : null;
          })()}
          {(() => {
            const fur = property.furnishingStatus
              ? getFurnishingLabel(property.furnishingStatus)
              : (property.extraDetails as any)?.furnishing || null;
            return fur ? (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-gray-500 whitespace-nowrap truncate">{fur}</span>
              </>
            ) : null;
          })()}
        </div>
      </Link>

      {/* ── CTA Buttons ── */}
      <div className="grid grid-cols-3 gap-1.5 px-3 pb-3">
        <Link
          href={`/properties/${property.slug}`}
          onClick={handleCardClick}
          className="col-span-1 flex items-center justify-center gap-1 py-2.5 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-xs font-bold rounded-lg transition-all active:scale-[0.97] shadow-sm"
        >
          <Eye className="w-3.5 h-3.5" /> Details
        </Link>

        {showPhone && phone ? (
          <a
            href={`tel:${phone}`}
            onClick={e => e.stopPropagation()}
            className="flex items-center justify-center gap-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-all active:scale-[0.97]"
          >
            <Phone className="w-3.5 h-3.5" />
            <span className="truncate">{phone.slice(-5)}</span>
          </a>
        ) : (
          <button
            onClick={handleRevealPhone}
            className="flex items-center justify-center gap-1 py-2.5 border border-gray-200 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-700 text-gray-600 text-xs font-semibold rounded-lg transition-all active:scale-[0.97]"
          >
            <Phone className="w-3.5 h-3.5" /> Call
          </button>
        )}

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWAClick}
          className="flex items-center justify-center gap-1 py-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white text-xs font-bold rounded-lg transition-all active:scale-[0.97]"
        >
          <WhatsAppIcon className="w-3.5 h-3.5" /> Chat
        </a>
      </div>

    </article>
  );
}
