'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  BedDouble, Maximize2, MapPin, CheckCircle, Phone,
  MessageSquare, Heart, Share2, ChevronLeft, ChevronRight,
  Building, Calendar, ArrowLeft, Eye, X, Pencil,
  Building2, Star, Shield, Clock, Zap, Send,
  Layers, Home, Award, ExternalLink,
  ChevronDown, ChevronUp, UserCircle, Lock, AlertTriangle,
} from 'lucide-react';
import { Property } from '@/types/property';
import {
  formatPrice, formatArea, getPropertyTypeLabel, getCategoryLabel,
  getFurnishingLabel, getPrimaryImage, timeAgo,
} from '@/lib/utils';
import { resolveImageUrl } from '@/lib/imageUtils';
import { cn } from '@/lib/utils';
import { inquiriesApi, propertiesApi, savedApi } from '@/lib/api';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useLazyComponent } from '@/hooks/useLazyComponent';
import { PropertyGridSkeleton } from '@/components/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch } from '@/lib/store';
import { openAuthModal } from '@/lib/store/slices/uiSlice';
import OptimizedImage from '@/components/common/OptimizedImage';

const PropertyCard = dynamic(() => import('@/components/property/PropertyCard'), { ssr: false });

// ── Amenity icons ─────────────────────────────────────────────────────────────
const AMENITY_ICONS: Record<string, string> = {
  gym: '🏋️', swimming: '🏊', pool: '🏊', security: '🔒', lift: '🛗',
  elevator: '🛗', parking: '🚗', garden: '🌳', park: '🌳',
  playground: '🛝', club: '🏛️', clubhouse: '🏛️', power: '⚡',
  backup: '⚡', 'power backup': '⚡', wifi: '📶', internet: '📶',
  sports: '⚽', tennis: '🎾', basketball: '🏀', jogging: '🏃',
  cctv: '📷', intercom: '📞', waterfall: '💧', rainwater: '💧',
  solar: '☀️', meditation: '🧘', yoga: '🧘', library: '📚',
  concierge: '🛎️', valet: '🚗', 'fire safety': '🚒', pet: '🐾',
  temple: '🛕', atm: '🏧', mall: '🏬', hospital: '🏥',
};

function getAmenityIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(AMENITY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '✓';
}

/** Build a public agent profile slug: firstname-lastname-in-city-{uuidNoHyphens} */
function buildAgentSlug(name: string, city: string, id: string): string {
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${slug(name)}-in-${slug(city)}-${id.replace(/-/g, '')}`;
}

// ── Inquiry type ─────────────────────────────────────────────────────────────
type InquiryType = 'general' | 'site_visit' | 'price_negotiation';

interface Props { property: Property }

// ── Main Component ────────────────────────────────────────────────────────────
export default function PropertyDetailClient({ property }: Props) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { trackPropertyView, trackPropertyInquiry } = useAnalytics();

  // Gallery state
  const [activeImage, setActiveImage]     = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Contact / inquiry state
  const [showPhone, setShowPhone]             = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryType, setInquiryType]         = useState<InquiryType>('general');
  const [inquiryForm, setInquiryForm]       = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting]         = useState(false);
  const [submitted, setSubmitted]           = useState(false);
  const [inquiryError, setInquiryError]     = useState('');

  // Save & share
  const [isSaved, setIsSaved]       = useState(false);
  const [shareToast, setShareToast] = useState('');

  // FAQ expand
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Desc expand
  const [descExpanded, setDescExpanded] = useState(false);

  console.log('[PropertyDetailClient] property.images raw:', property.images);
  const images = property.images?.length
    ? property.images.map((img) => ({ ...img, url: resolveImageUrl(img.url) }))
    : [{ url: getPrimaryImage([]), alt: property.title, id: '0', isPrimary: true, sortOrder: 0 }];
  console.log('[PropertyDetailClient] resolved images:', images);

  // Pre-fill form from logged-in user
  useEffect(() => {
    if (user) {
      setInquiryForm(f => ({
        ...f,
        name:  f.name  || (user as any).name  || '',
        email: f.email || (user as any).email || '',
        phone: f.phone || (user as any).phone || '',
      }));
    }
  }, [user]);

  // Track view
  useEffect(() => {
    trackPropertyView(property.id, {
      propertyType: property.type,
      city:  property.city  || undefined,
      state: property.state || undefined,
      source: 'direct',
    });
    // Check saved state
    savedApi.getSavedIds()
      .then(r => {
        const ids: string[] = Array.isArray(r.data) ? r.data : (r.data?.ids ?? []);
        setIsSaved(ids.includes(property.id));
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property.id]);

  // Lazy load similar + map + owner listings
  const [similarRef, similarVisible]     = useLazyComponent<HTMLDivElement>({ rootMargin: '400px' });
  const [mapRef, mapVisible]             = useLazyComponent<HTMLDivElement>({ rootMargin: '300px' });
  const [ownerPropsRef, ownerPropsVisible] = useLazyComponent<HTMLDivElement>({ rootMargin: '500px' });

  const isInactiveListing = property.status !== 'active';

  const { data: similar, isLoading: similarLoading } = useQuery({
    queryKey: ['similar', property.id],
    queryFn: () => propertiesApi.getSimilar(property.id).then(r => r.data),
    // Load immediately for inactive listings (shown near top), lazily otherwise
    enabled: isInactiveListing || similarVisible,
    staleTime: 5 * 60 * 1000,
  });

  const { data: ownerPropsData, isLoading: ownerPropsLoading } = useQuery({
    queryKey: ['ownerProps', property.owner?.id],
    queryFn: () =>
      propertiesApi.getAll({ agentId: property.owner?.id, limit: 5, page: 1 })
        .then(r => {
          const items: Property[] = Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : [];
          return items.filter((p) => p.id !== property.id).slice(0, 4);
        }),
    enabled: ownerPropsVisible && !!property.owner?.id,
    staleTime: 5 * 60 * 1000,
  });

  // ── Gallery swipe ────────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setActiveImage(i => Math.min(images.length - 1, i + 1));
      else           setActiveImage(i => Math.max(0, i - 1));
    }
    touchStartX.current = null;
  };

  // ── Save toggle ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!user) { dispatch(openAuthModal({ mode: 'login' })); return; }
    try {
      if (isSaved) {
        await savedApi.unsave(property.id);
        setIsSaved(false);
      } else {
        await savedApi.save(property.id);
        setIsSaved(true);
      }
    } catch { /* optimistic handled */ }
  };

  // ── Share ────────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `${property.title} – ${formatPrice(property.price)} in ${property.city}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: property.title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareToast('Link copied!');
        setTimeout(() => setShareToast(''), 2500);
      }
    } catch {}
  };

  // ── Inquiry submit ────────────────────────────────────────────────────────────
  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setInquiryError('');
    try {
      await inquiriesApi.create(property.id, { ...inquiryForm, type: inquiryType });
      setSubmitted(true);
      trackPropertyInquiry(property.id, { city: property.city || undefined });
    } catch (err: any) {
      const status  = err?.response?.status;
      const message = err?.response?.data?.message || err?.message;
      if (status === 401) {
        setShowInquiryModal(false);
        dispatch(openAuthModal({ mode: 'login' }));
        setInquiryError('Please log in to send an inquiry.');
      } else {
        setInquiryError(Array.isArray(message) ? message.join(', ') : (message || 'Failed to send inquiry.'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openInquiryModal = (type: InquiryType = 'general') => {
    setInquiryType(type);
    setShowInquiryModal(true);
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const isAgent  = property.listedBy === 'agent';
  const owner    = property.owner;
  const phone    = owner?.phone;
  const waNumber = phone?.replace(/\D/g, '').replace(/^0/, '91');
  const waLink   = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent(`Hi, I'm interested in ${property.title} - ${typeof window !== 'undefined' ? window.location.href : ''}`)}`
    : null;

  const pricePerSqft = property.area && property.price
    ? Math.round(Number(property.price) / Number(property.area))
    : null;

  // Quick highlights
  const highlights: string[] = [
    property.possessionStatus === 'ready_to_move' ? 'Ready to Move' : 'Under Construction',
    property.isVerified ? 'Verified Property' : '',
    property.reraNumber ? `RERA Registered` : '',
    property.isPremium  ? 'Premium Listing' : '',
    property.isNewProject ? 'New Project' : '',
    property.furnishingStatus === 'furnished' ? 'Fully Furnished' :
      property.furnishingStatus === 'semi_furnished' ? 'Semi Furnished' : '',
    property.parkingSpots ? `${property.parkingSpots} Parking` : '',
    property.balconies ? `${property.balconies} Balcony` : '',
    property.society ? property.society : '',
  ].filter(Boolean);

  // Specs
  const specs = [
    { label: 'Bedrooms',    value: property.bedrooms  ? `${property.bedrooms} BHK`                 : null },
    { label: 'Bathrooms',   value: property.bathrooms ? `${property.bathrooms}`                     : null },
    { label: 'Area',        value: property.area      ? formatArea(property.area, property.areaUnit) : null },
    { label: 'Floor',       value: property.floorNumber != null ? `${property.floorNumber}${property.totalFloors ? ' of ' + property.totalFloors : ''}` : null },
    { label: 'Balconies',   value: property.balconies ? `${property.balconies}` : null },
    { label: 'Parking',     value: property.parkingSpots ? `${property.parkingSpots} spot${property.parkingSpots > 1 ? 's' : ''}` : null },
    { label: 'Furnishing',  value: getFurnishingLabel(property.furnishingStatus)                     },
    { label: 'Possession',  value: property.possessionStatus === 'ready_to_move' ? 'Ready to Move' : 'Under Construction' },
    { label: 'Property Age', value: property.propertyAge ? `${property.propertyAge} yr${property.propertyAge > 1 ? 's' : ''}` : null },
    { label: 'Property Type', value: getPropertyTypeLabel(property.type) },
    { label: 'Category',    value: getCategoryLabel(property.category) },
    { label: 'RERA No.',    value: property.reraNumber || null },
  ].filter(s => s.value);

  // FAQ
  const faqs = [
    { q: `What is the price of ${property.title}?`, a: `The asking price is ${formatPrice(property.price, property.priceUnit)}${pricePerSqft ? ` (₹${pricePerSqft.toLocaleString('en-IN')}/sqft)` : ''}. Contact the ${isAgent ? 'agent' : 'owner'} directly for the best deal.` },
    { q: `Who is the listing ${isAgent ? 'agent' : 'owner'} of this property?`, a: `This property is listed by ${owner?.name || (isAgent ? 'a verified agent' : 'the property owner')}${owner?.company ? ` from ${owner.company}` : ''}. They are ${owner?.isVerified ? 'a verified member' : 'registered'} on Think4BuySale.` },
    { q: 'Is this property RERA registered?', a: property.reraNumber ? `Yes, this property is RERA registered with number ${property.reraNumber}.` : 'RERA registration details are not available. Please verify with the builder or owner directly.' },
    { q: 'What amenities are available in this property?', a: property.amenities?.length ? `This property offers: ${property.amenities.slice(0, 8).map(a => a.name).join(', ')}${property.amenities.length > 8 ? ', and more.' : '.'}` : 'Please contact the listing party for detailed amenities information.' },
    { q: `What is the area of this property?`, a: property.area ? `The property covers ${formatArea(property.area, property.areaUnit)}.${pricePerSqft ? ` The rate comes to ₹${pricePerSqft.toLocaleString('en-IN')} per sqft.` : ''}` : 'Area details are available on request.' },
    { q: 'Is the property ready to move in?', a: property.possessionStatus === 'ready_to_move' ? 'Yes, this property is ready to move in immediately.' : `This property is currently under construction. ${property.possessionDate ? `Expected possession: ${new Date(property.possessionDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}.` : 'Contact the owner for possession timeline.'}` },
    { q: `How can I schedule a site visit?`, a: `You can schedule a site visit by clicking "Schedule Visit" or calling/WhatsApp-ing the ${isAgent ? 'agent' : 'owner'} directly from this page. They will confirm the timing with you.` },
  ];

  // ── Contact form (render fn — NOT a component to avoid remount on each render) ─
  const renderInquiryForm = ({ onClose }: { onClose?: () => void } = {}) => {
    // ── Guest gate ────────────────────────────────────────────────────────────
    if (!user) return (
      <div className="text-center py-6">
        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <Lock className="w-7 h-7 text-blue-500" />
        </div>
        <p className="font-bold text-gray-900 text-base mb-1">Login to Contact {isAgent ? 'Agent' : 'Owner'}</p>
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          Sign in to send an inquiry, schedule a visit, or negotiate directly.
        </p>
        <button
          type="button"
          onClick={() => { dispatch(openAuthModal({ mode: 'login' })); if (onClose) onClose(); }}
          className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors mb-2"
        >
          Login / Sign Up — It's Free
        </button>
        <p className="text-xs text-gray-400">Your contact details will be auto-filled after login.</p>
      </div>
    );

    // ── Submitted state ───────────────────────────────────────────────────────
    if (submitted) return (
      <div className="text-center py-8">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <p className="font-bold text-gray-900 text-lg mb-1">Inquiry Sent!</p>
        <p className="text-sm text-gray-500">The {isAgent ? 'agent' : 'owner'} will contact you shortly.</p>
        {onClose && (
          <button onClick={onClose} className="mt-5 px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
            Done
          </button>
        )}
      </div>
    );

    // ── Inquiry form (logged-in users, auto-filled) ───────────────────────────
    const isAutoFilled = !!(user as any)?.name && !!(user as any)?.phone;
    return (
      <form onSubmit={handleInquiry} className="space-y-3">
        {/* Auto-fill notice */}
        {isAutoFilled && (
          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
            Details auto-filled from your profile
          </div>
        )}

        {/* Inquiry type tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
          {(['general', 'site_visit', 'price_negotiation'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setInquiryType(t)}
              className={cn(
                'flex-1 py-1.5 rounded-lg transition-colors',
                inquiryType === t ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700',
              )}
            >
              {t === 'general' ? 'General' : t === 'site_visit' ? '📅 Visit' : '💬 Negotiate'}
            </button>
          ))}
        </div>

        <input
          type="text" placeholder="Your Name *" required
          value={inquiryForm.name}
          onChange={e => setInquiryForm(f => ({ ...f, name: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <input
          type="email" placeholder="Email Address"
          value={inquiryForm.email}
          onChange={e => setInquiryForm(f => ({ ...f, email: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <input
          type="tel" placeholder="Phone Number *" required
          value={inquiryForm.phone}
          onChange={e => setInquiryForm(f => ({ ...f, phone: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <textarea
          placeholder={
            inquiryType === 'site_visit'
              ? 'Preferred date & time for site visit...'
              : inquiryType === 'price_negotiation'
              ? 'Your offer or budget...'
              : 'Your message (optional)...'
          }
          rows={2}
          value={inquiryForm.message}
          onChange={e => setInquiryForm(f => ({ ...f, message: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white"
        />
        {inquiryError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{inquiryError}</p>
        )}
        <button
          type="submit" disabled={submitting}
          className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {submitting
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
            : <><Send className="w-4 h-4" /> {inquiryType === 'site_visit' ? 'Request Site Visit' : inquiryType === 'price_negotiation' ? 'Send Offer' : 'Send Inquiry'}</>
          }
        </button>
        <p className="text-xs text-gray-400 text-center">By submitting, you agree to our Privacy Policy.</p>
      </form>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-24 md:pb-0">

      {/* ── Fullscreen gallery modal ─────────────────────────────────────────── */}
      {showFullscreen && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
            <span className="text-white text-sm font-medium">{activeImage + 1} / {images.length}</span>
            <button
              onClick={() => setShowFullscreen(false)}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center relative"
            onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
          >
            <div className="relative w-full h-full">
              <Image
                src={images[activeImage]?.url}
                alt={images[activeImage]?.alt || property.title}
                fill className="object-contain"
                sizes="100vw"
              />
            </div>
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImage(i => Math.max(0, i - 1))}
                  disabled={activeImage === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveImage(i => Math.min(images.length - 1, i + 1))}
                  disabled={activeImage === images.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-1.5 justify-center p-3 overflow-x-auto flex-shrink-0">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={cn(
                    'relative w-14 h-10 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all',
                    activeImage === i ? 'border-blue-400' : 'border-transparent opacity-50',
                  )}
                >
                  <Image src={img.url} alt="" fill className="object-cover" sizes="56px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Share toast ──────────────────────────────────────────────────────── */}
      {shareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-xl">
          {shareToast}
        </div>
      )}

      <div className="container-max py-3 md:py-6">

        {/* ── Breadcrumb / back ────────────────────────────────────────────── */}
        <div className="md:hidden flex items-center gap-3 mb-3">
          <Link href="/properties" className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 truncate">{property.city} · {getCategoryLabel(property.category)}</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{property.title}</p>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-1.5 text-sm text-gray-500 mb-4 flex-wrap">
          <Link href="/" className="hover:text-blue-600">Home</Link><span>/</span>
          <Link href="/properties" className="hover:text-blue-600">Properties</Link><span>/</span>
          <Link href={`/properties?city=${property.city}`} className="hover:text-blue-600">{property.city}</Link><span>/</span>
          {property.locality && <><Link href={`/properties?city=${property.city}&locality=${property.locality}`} className="hover:text-blue-600">{property.locality}</Link><span>/</span></>}
          <span className="text-gray-800 line-clamp-1">{property.title}</span>
        </nav>

        {/* ── Status Banner (SOLD / RENTED / INACTIVE) ─────────────────────── */}
        {property.status !== 'active' && (
          <div className={cn(
            'mb-4 rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center gap-3',
            property.status === 'sold'
              ? 'bg-red-50 border-red-200 text-red-800'
              : property.status === 'rented'
              ? 'bg-orange-50 border-orange-200 text-orange-800'
              : 'bg-gray-50 border-gray-200 text-gray-700',
          )}>
            <div className="flex items-center gap-2.5 flex-1">
              <AlertTriangle className={cn(
                'w-5 h-5 flex-shrink-0',
                property.status === 'sold' ? 'text-red-500' :
                property.status === 'rented' ? 'text-orange-500' : 'text-gray-400',
              )} />
              <div>
                <p className="font-bold text-base leading-tight">
                  {property.status === 'sold' && 'This property has been SOLD'}
                  {property.status === 'rented' && 'This property has been RENTED'}
                  {(property.status === 'inactive' || property.status === 'pending') && 'This listing is currently inactive'}
                </p>
                <p className="text-sm mt-0.5 opacity-80">
                  {property.status === 'sold' && 'The listing is no longer available. Browse similar properties below.'}
                  {property.status === 'rented' && 'This rental is no longer available. Browse similar rentals below.'}
                  {(property.status === 'inactive' || property.status === 'pending') && 'This listing has been taken off the market temporarily.'}
                </p>
              </div>
            </div>
            <Link
              href={`/properties?city=${property.city}&type=${property.type}&category=${property.category}`}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-colors',
                property.status === 'sold'
                  ? 'bg-red-100 hover:bg-red-200 text-red-800'
                  : property.status === 'rented'
                  ? 'bg-orange-100 hover:bg-orange-200 text-orange-800'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800',
              )}
            >
              Browse Similar →
            </Link>
          </div>
        )}

        <div className="flex gap-6">
          {/* ── Main Content ──────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* ── Image Gallery ──────────────────────────────────────────── */}
            <div className="bg-black rounded-2xl overflow-hidden mb-4 shadow-sm">
              <div
                className="relative aspect-[16/9] md:aspect-[21/9] cursor-pointer select-none"
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                onClick={() => setShowFullscreen(true)}
              >
                <OptimizedImage
                  src={images[activeImage]?.url}
                  alt={images[activeImage]?.alt || property.title}
                  fill className="object-cover"
                  priority sizes="(max-width: 768px) 100vw, 70vw"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                {/* Nav arrows (desktop only) */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={e => { e.stopPropagation(); setActiveImage(i => Math.max(0, i - 1)); }}
                      disabled={activeImage === 0}
                      className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full items-center justify-center text-white disabled:opacity-30 hover:bg-black/70 transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setActiveImage(i => Math.min(images.length - 1, i + 1)); }}
                      disabled={activeImage === images.length - 1}
                      className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full items-center justify-center text-white disabled:opacity-30 hover:bg-black/70 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Counter + fullscreen hint */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                    {activeImage + 1} / {images.length} 📷
                  </span>
                </div>

                {/* Badges top-left */}
                <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap pointer-events-none">
                  {property.isVerified && (
                    <span className="flex items-center gap-1 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  )}
                  {property.isPremium && (
                    <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">Premium</span>
                  )}
                  {property.isNewProject && (
                    <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">New Project</span>
                  )}
                  {property.reraNumber && (
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">RERA ✓</span>
                  )}
                </div>

                {/* Save + Share top-right */}
                <div className="absolute top-3 right-3 flex gap-2 pointer-events-auto">
                  <button
                    onClick={e => { e.stopPropagation(); handleSave(); }}
                    className={cn(
                      'w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all hover:scale-105',
                      isSaved ? 'bg-red-500' : 'bg-white',
                    )}
                  >
                    <Heart className={cn('w-4 h-4', isSaved ? 'fill-white text-white' : 'text-gray-500')} />
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); handleShare(); }}
                    className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-all"
                  >
                    <Share2 className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto bg-black/90">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={cn(
                        'relative w-16 h-12 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all',
                        activeImage === i ? 'border-blue-400 opacity-100' : 'border-transparent opacity-50 hover:opacity-75',
                      )}
                    >
                      <Image src={img.url} alt="" fill className="object-cover" sizes="64px" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Price + Title ──────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl p-5 md:p-6 mb-4 shadow-sm border border-gray-100">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wide">{getCategoryLabel(property.category)}</span>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full uppercase tracking-wide">{getPropertyTypeLabel(property.type)}</span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 leading-tight">
                    {property.title}
                  </h1>
                  <div className="flex items-start gap-1.5 text-gray-500 text-sm">
                    <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>{[property.society, property.locality, property.city, property.state].filter(Boolean).join(', ')}{property.pincode ? ` – ${property.pincode}` : ''}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl md:text-3xl font-black text-gray-900">
                    {formatPrice(property.price, property.priceUnit)}
                  </p>
                  {pricePerSqft && (
                    <p className="text-sm text-gray-500 mt-0.5">₹{pricePerSqft.toLocaleString('en-IN')}/sqft</p>
                  )}
                  {property.brokerage && (
                    <p className="text-xs text-orange-600 font-medium mt-0.5">Brokerage: {property.brokerage}</p>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 text-xs text-gray-500 pt-3 border-t border-gray-100 flex-wrap">
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {property.viewCount} views</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {timeAgo(property.createdAt)}</span>
                {property.reraNumber && <span className="text-green-600 font-semibold flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> RERA: {property.reraNumber}</span>}
                <span className="text-gray-300">|</span>
                <span className="text-gray-400">Property ID: {property.id.slice(0, 8).toUpperCase()}</span>
                {user && ((user as any).id === owner?.id || (user as any).role === 'admin') && (
                  <Link
                    href={`/post-property?edit=${property.id}`}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-xs font-semibold hover:bg-blue-100 border border-blue-100"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit Listing
                  </Link>
                )}
              </div>
            </div>

            {/* ── Prominent Similar Properties (non-active listings only) ─── */}
            {property.status !== 'active' && (
              <div className="mb-4">
                {similarLoading ? (
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="h-6 w-56 bg-gray-200 rounded animate-pulse mb-4" />
                    <PropertyGridSkeleton count={4} />
                  </div>
                ) : similar && similar.length > 0 ? (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 md:p-6 border border-blue-100 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                      <Building className="w-5 h-5 text-blue-500" />
                      Available Similar Properties
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                      This listing is no longer active — here are similar options in {property.city}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {similar.slice(0, 4).map((p: Property) => (
                        <PropertyCard key={p.id} property={p} />
                      ))}
                    </div>
                    <div className="mt-4 text-center">
                      <Link
                        href={`/properties?city=${property.city}&type=${property.type}&category=${property.category}`}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                      >
                        View All {property.city} {getPropertyTypeLabel(property.type)}s
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* ── Quick Highlights ────────────────────────────────────────── */}
            {highlights.length > 0 && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mb-4 border border-blue-100">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" /> Quick Highlights
                </p>
                <div className="flex flex-wrap gap-2">
                  {highlights.map((h, i) => (
                    <span key={i} className="flex items-center gap-1.5 bg-white text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-blue-100 shadow-sm">
                      <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ── Mobile Contact Buttons ────────────────────────────────── */}
            {!isInactiveListing && (
              <div className="md:hidden bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Contact {isAgent ? 'Agent' : 'Owner'}</p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={phone ? `tel:${phone}` : '#'}
                    onClick={() => trackPropertyInquiry(property.id, { city: property.city || undefined })}
                    className="flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all"
                  >
                    <Phone className="w-4 h-4" /> Call Now
                  </a>
                  {waLink ? (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 active:scale-95 transition-all"
                    >
                      <MessageSquare className="w-4 h-4" /> WhatsApp
                    </a>
                  ) : (
                    <button
                      onClick={() => openInquiryModal('general')}
                      className="flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700"
                    >
                      <MessageSquare className="w-4 h-4" /> Message
                    </button>
                  )}
                  <button
                    onClick={() => openInquiryModal('site_visit')}
                    className="flex items-center justify-center gap-2 py-2.5 border-2 border-blue-500 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-50 active:scale-95 transition-all"
                  >
                    <Calendar className="w-4 h-4" /> Schedule Visit
                  </button>
                  <button
                    onClick={() => openInquiryModal('general')}
                    className="flex items-center justify-center gap-2 py-2.5 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    <Send className="w-4 h-4" /> Send Inquiry
                  </button>
                </div>
              </div>
            )}

            {/* ── Property Details ──────────────────────────────────────── */}
            {specs.length > 0 && (
              <div className="bg-white rounded-2xl p-5 md:p-6 mb-4 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Home className="w-5 h-5 text-blue-500" /> Property Details
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {specs.map(({ label, value }) => (
                    <div key={label} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</p>
                      <p className="font-bold text-gray-900 text-sm">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Description ──────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl p-5 md:p-6 mb-4 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-500" /> About This Property
              </h2>
              <div className={cn('text-gray-600 leading-relaxed text-sm md:text-base whitespace-pre-line', !descExpanded && 'line-clamp-6')}>
                {property.description}
              </div>
              {property.description?.length > 400 && (
                <button
                  onClick={() => setDescExpanded(v => !v)}
                  className="mt-2 text-blue-600 text-sm font-semibold flex items-center gap-1 hover:text-blue-700"
                >
                  {descExpanded ? <><ChevronUp className="w-4 h-4" /> Show less</> : <><ChevronDown className="w-4 h-4" /> Read more</>}
                </button>
              )}
            </div>

            {/* ── Amenities ────────────────────────────────────────────── */}
            {property.amenities?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 md:p-6 mb-4 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-500" /> Amenities
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {property.amenities.map((a) => (
                    <div key={a.id} className="flex items-center gap-2.5 p-3 bg-green-50 rounded-xl border border-green-100">
                      <span className="text-base flex-shrink-0">{getAmenityIcon(a.name)}</span>
                      <span className="text-sm text-gray-700 font-medium leading-tight">{a.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Agent / Owner Card ────────────────────────────────────── */}
            <div className="bg-white rounded-2xl p-5 md:p-6 mb-4 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                {isAgent ? <Building2 className="w-5 h-5 text-blue-500" /> : <Shield className="w-5 h-5 text-blue-500" />}
                {isAgent ? 'Listed by Agent' : 'Listed by Owner'}
              </h2>
              <div className="flex items-start gap-4">
                <div className="relative w-14 h-14 flex-shrink-0">
                  {owner?.avatar ? (
                    <Image src={owner.avatar} alt={owner.name} fill className="object-cover rounded-2xl" sizes="56px" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                      {owner?.name?.charAt(0) || (isAgent ? 'A' : 'O')}
                    </div>
                  )}
                  {owner?.isVerified && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white">
                      <CheckCircle className="w-3 h-3 text-white fill-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h3 className="font-bold text-gray-900">{owner?.name || (isAgent ? 'Agent' : 'Owner')}</h3>
                    {owner?.isVerified && (
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        ✓ Verified {isAgent ? 'Agent' : 'Owner'}
                      </span>
                    )}
                  </div>
                  {owner?.company && <p className="text-sm text-gray-500">{owner.company}</p>}
                  {isAgent && (owner as any)?.agentExperience && (
                    <p className="text-xs text-gray-400 mt-0.5">{(owner as any).agentExperience} years experience</p>
                  )}
                  {isAgent && (owner as any)?.agentRating > 0 && (
                    <p className="text-xs text-amber-600 font-semibold mt-0.5 flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {Number((owner as any).agentRating).toFixed(1)} rating
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call
                      </a>
                    )}
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    )}
                    {isAgent && owner?.id && (
                      <Link
                        href={`/agents/${buildAgentSlug(owner.name, property.city, owner.id)}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-lg text-xs font-bold hover:bg-violet-100 transition-colors"
                      >
                        <UserCircle className="w-3.5 h-3.5" /> View Profile
                      </Link>
                    )}
                    <Link
                      href={`/properties?agentId=${owner?.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors"
                    >
                      <Building className="w-3.5 h-3.5" /> All Listings
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Location ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl p-5 md:p-6 mb-4 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" /> Location
              </h2>
              <div className="flex items-start gap-2 text-gray-600 text-sm mb-4">
                <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <span>{[property.address, property.locality, property.city, property.state, property.pincode].filter(Boolean).join(', ')}</span>
              </div>
              {/* Nearby (placeholder) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {[
                  { icon: '🏫', label: 'Schools', note: 'Nearby' },
                  { icon: '🏥', label: 'Hospitals', note: 'Nearby' },
                  { icon: '🚇', label: 'Metro', note: 'Check map' },
                  { icon: '🛒', label: 'Shopping', note: 'Nearby' },
                ].map(item => (
                  <div key={item.label} className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-2xl mb-1">{item.icon}</div>
                    <div className="text-xs font-semibold text-gray-700">{item.label}</div>
                    <div className="text-[10px] text-gray-400">{item.note}</div>
                  </div>
                ))}
              </div>
              {/* Map */}
              <div ref={mapRef} className="rounded-xl h-52 md:h-72 bg-gray-100 overflow-hidden flex items-center justify-center">
                {mapVisible && property.latitude && property.longitude ? (
                  <iframe
                    title="Property location"
                    loading="lazy"
                    src={`https://maps.google.com/maps?q=${property.latitude},${property.longitude}&z=15&output=embed`}
                    className="w-full h-full border-0"
                    allowFullScreen
                  />
                ) : (
                  <div className="text-center text-gray-400">
                    <MapPin className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">
                      {property.locality}, {property.city}
                    </p>
                    {property.latitude && property.longitude && (
                      <a
                        href={`https://maps.google.com/?q=${property.latitude},${property.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" /> Open in Google Maps
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Similar Properties ────────────────────────────────────── */}
            <div ref={similarRef} className="mb-4">
              {similarLoading ? (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
                  <PropertyGridSkeleton count={4} />
                </div>
              ) : similar?.length > 0 ? (
                <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-500" /> Similar Properties
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {similar.slice(0, 4).map((p: Property) => (
                      <PropertyCard key={p.id} property={p} />
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <Link
                      href={`/properties?city=${property.city}&type=${property.type}&category=${property.category}`}
                      className="inline-flex items-center gap-2 px-6 py-2.5 border-2 border-blue-500 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors"
                    >
                      View All {property.city} {getPropertyTypeLabel(property.type)}s
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

            {/* ── More by this Agent / Owner ──────────────────────────── */}
            <div ref={ownerPropsRef} className="mb-4">
              {ownerPropsLoading ? (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="h-6 w-56 bg-gray-200 rounded animate-pulse mb-4" />
                  <PropertyGridSkeleton count={3} />
                </div>
              ) : ownerPropsData && ownerPropsData.length > 0 ? (
                <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      {isAgent
                        ? <><Building2 className="w-5 h-5 text-violet-500" /> More by {owner?.name || 'this Agent'}</>
                        : <><Home className="w-5 h-5 text-emerald-500" /> More from {owner?.name || 'this Owner'}</>
                      }
                    </h2>
                    <Link
                      href={`/properties?agentId=${owner?.id}`}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      See all <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ownerPropsData.map((p: Property) => (
                      <PropertyCard key={p.id} property={p} />
                    ))}
                  </div>
                  {isAgent && owner?.id && (
                    <div className="mt-4 text-center">
                      <Link
                        href={`/agents/${buildAgentSlug(owner.name, property.city, owner.id)}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-xl text-sm font-bold hover:bg-violet-100 transition-colors"
                      >
                        <UserCircle className="w-4 h-4" /> View {owner.name}'s Full Profile
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* ── FAQ Section ──────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl p-5 md:p-6 mb-4 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <div className="space-y-2">
                {faqs.map((faq, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-sm font-semibold text-gray-800 pr-4">{faq.q}</span>
                      {expandedFaq === i
                        ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                    </button>
                    {expandedFaq === i && (
                      <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── SEO Content Block ─────────────────────────────────────── */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 md:p-6 mb-4 border border-blue-100">
              <h2 className="text-base font-bold text-gray-900 mb-2">
                {property.bedrooms ? `${property.bedrooms} BHK ` : ''}{getPropertyTypeLabel(property.type)} for {property.category === 'buy' ? 'Sale' : property.category === 'rent' ? 'Rent' : getCategoryLabel(property.category)} in {property.locality}, {property.city}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {property.city} is one of the most sought-after real estate destinations, offering excellent connectivity, infrastructure, and quality of life.
                This {property.bedrooms ? `${property.bedrooms} BHK ` : ''}{getPropertyTypeLabel(property.type).toLowerCase()}
                {property.area ? ` of ${formatArea(property.area, property.areaUnit)} ` : ' '}
                located in {property.locality} is priced at {formatPrice(property.price, property.priceUnit)}.
                {property.possessionStatus === 'ready_to_move' ? ' The property is ready to move in immediately.' : ''}
                {property.amenities?.length ? ` It comes with premium amenities including ${property.amenities.slice(0, 3).map(a => a.name).join(', ')}.` : ''}
                {' '}Contact the listing {isAgent ? 'agent' : 'owner'} now for the best deal.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  `${property.category === 'buy' ? 'Buy' : 'Rent'} property in ${property.city}`,
                  `${property.bedrooms ? property.bedrooms + ' BHK ' : ''}${getPropertyTypeLabel(property.type)} ${property.city}`,
                  `${getPropertyTypeLabel(property.type)} in ${property.locality}`,
                  `Real estate ${property.city}`,
                ].map((tag, i) => (
                  <Link
                    key={i}
                    href={`/properties?city=${property.city}&type=${property.type}&category=${property.category}`}
                    className="text-xs bg-white text-blue-700 px-3 py-1 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors font-medium"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

          </div>

          {/* ── Desktop Sticky Sidebar ────────────────────────────────────── */}
          <div className="hidden md:block w-[340px] flex-shrink-0 self-start sticky top-[88px]">
            <div className="space-y-4 max-h-[calc(100vh-100px)] overflow-y-auto scrollbar-hide pb-4">

              {/* Price quick summary */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-xl">
                <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide mb-1">Asking Price</p>
                <p className="text-3xl font-black mb-0.5">{formatPrice(property.price, property.priceUnit)}</p>
                {pricePerSqft && <p className="text-blue-200 text-sm">₹{pricePerSqft.toLocaleString('en-IN')}/sqft</p>}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/20 text-sm">
                  {property.bedrooms && <span className="flex items-center gap-1"><BedDouble className="w-4 h-4 text-blue-300" />{property.bedrooms} BHK</span>}
                  {property.area    && <span className="flex items-center gap-1"><Maximize2 className="w-4 h-4 text-blue-300" />{formatArea(property.area, property.areaUnit)}</span>}
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleSave}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all',
                      isSaved ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30',
                    )}
                  >
                    <Heart className={cn('w-4 h-4', isSaved ? 'fill-white text-white' : '')} />
                    {isSaved ? 'Saved' : 'Save'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-all"
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>
              </div>

              {/* Contact buttons — hidden for inactive/sold/rented listings */}
              {isInactiveListing ? (
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 text-center">
                  <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="font-bold text-gray-700 mb-1">
                    {property.status === 'sold' ? 'Property Sold' : property.status === 'rented' ? 'Property Rented' : 'Listing Unavailable'}
                  </p>
                  <p className="text-xs text-gray-500 mb-4">This listing is no longer accepting inquiries.</p>
                  <Link
                    href={`/properties?city=${property.city}&type=${property.type}&category=${property.category}`}
                    className="block w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                  >
                    Browse Similar Properties
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      {owner?.avatar ? (
                        <Image src={owner.avatar} alt={owner.name || ''} fill className="object-cover rounded-xl" sizes="48px" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                          {owner?.name?.charAt(0) || (isAgent ? 'A' : 'O')}
                        </div>
                      )}
                      {owner?.isVerified && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white">
                          <CheckCircle className="w-2.5 h-2.5 text-white fill-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{owner?.name || (isAgent ? 'Agent' : 'Owner')}</p>
                      {owner?.company && <p className="text-xs text-gray-500 truncate">{owner.company}</p>}
                      {owner?.isVerified && <p className="text-xs text-green-600 font-semibold flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Verified {isAgent ? 'Agent' : 'Owner'}</p>}
                      {isAgent && owner?.id && (
                        <Link
                          href={`/agents/${buildAgentSlug(owner.name, property.city, owner.id)}`}
                          className="inline-flex items-center gap-1 mt-1 text-xs text-violet-600 font-semibold hover:text-violet-700"
                        >
                          <UserCircle className="w-3 h-3" /> View Profile →
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {phone ? (
                      <a
                        href={`tel:${phone}`}
                        onClick={() => setShowPhone(true)}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        {showPhone ? phone : 'Show Phone Number'}
                      </a>
                    ) : (
                      <button
                        onClick={() => setShowPhone(v => !v)}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        {showPhone ? 'No phone available' : 'Show Phone Number'}
                      </button>
                    )}
                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" /> WhatsApp
                      </a>
                    )}
                    <button
                      onClick={() => openInquiryModal('site_visit')}
                      className="flex items-center justify-center gap-2 w-full py-3 border-2 border-blue-500 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-50 transition-colors"
                    >
                      <Calendar className="w-4 h-4" /> Schedule a Visit
                    </button>
                  </div>
                </div>
              )}

              {/* Desktop inquiry form — only for active listings */}
              {!isInactiveListing && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4 text-sm flex items-center gap-2">
                    <Send className="w-4 h-4 text-blue-500" /> Send Inquiry
                  </h3>
                  {renderInquiryForm()}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile Sticky Bottom Bar ─────────────────────────────────────────── */}
      {!isInactiveListing && <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl safe-bottom">
        <div className="flex items-center gap-2 px-3 py-3">
          {phone ? (
            <a
              href={`tel:${phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all"
            >
              <Phone className="w-4 h-4" /> Call
            </a>
          ) : null}
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 active:scale-95 transition-all"
            >
              <MessageSquare className="w-4 h-4" /> WhatsApp
            </a>
          )}
          <button
            onClick={() => openInquiryModal('general')}
            className={cn(
              'flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold active:scale-95 transition-all',
              (!phone && !waLink) ? 'flex-1 bg-blue-600 text-white' : 'px-4 border-2 border-gray-200 text-gray-700',
            )}
          >
            <Send className="w-4 h-4" /> {(!phone && !waLink) ? 'Send Inquiry' : 'Inquire'}
          </button>
        </div>
      </div>}

      {/* ── Inquiry Modal (works on all screen sizes) ──────────────────────── */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center md:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={() => setShowInquiryModal(false)}
          />
          <div className="relative bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full md:max-w-lg max-h-[92dvh] flex flex-col">
            {/* Drag handle (mobile only) */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0 md:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="font-bold text-gray-900">
                  {inquiryType === 'site_visit' ? '📅 Schedule a Visit' : inquiryType === 'price_negotiation' ? '💬 Negotiate Price' : `Contact ${isAgent ? 'Agent' : 'Owner'}`}
                </h3>
                <p className="text-xs text-gray-500">{owner?.name} · {property.title.slice(0, 40)}</p>
              </div>
              <button
                onClick={() => setShowInquiryModal(false)}
                className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 py-4">
              {renderInquiryForm({ onClose: () => setShowInquiryModal(false) })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
