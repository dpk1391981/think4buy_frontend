'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  BedDouble, Maximize2, MapPin, CheckCircle, Phone,
  Heart, Share2, ChevronLeft, ChevronRight,
  Building, Calendar, ArrowLeft, Eye, X, Pencil,
  Building2, Star, Shield, Clock, Zap, Send,
  Layers, Home, Award, ExternalLink,
  ChevronDown, ChevronUp, UserCircle, Lock, AlertTriangle,
  Bath, Layers as FloorIcon, Car, Wind,
} from 'lucide-react';
import { Property } from '@/types/property';
import {
  formatPrice, formatArea, getPropertyTypeLabel, getCategoryLabel,
  getFurnishingLabel, getPrimaryImage, timeAgo,
} from '@/lib/utils';
import { resolveImageUrl } from '@/lib/imageUtils';
import { cn } from '@/lib/utils';
import { inquiriesApi, leadsApi, propertiesApi, savedApi } from '@/lib/api';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useLazyComponent } from '@/hooks/useLazyComponent';
import { PropertyGridSkeleton } from '@/components/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch } from '@/lib/store';
import { openAuthModal } from '@/lib/store/slices/uiSlice';
import OptimizedImage from '@/components/common/OptimizedImage';

const PropertyCard = dynamic(() => import('@/components/property/PropertyCard'), { ssr: false });

// ── WhatsApp SVG icon ─────────────────────────────────────────────────────────
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ── Amenity icons ─────────────────────────────────────────────────────────────
const AMENITY_ICONS: Record<string, string> = {
  gym: '🏋️', swimming: '🏊', pool: '🏊', security: '🔒', lift: '🛗',
  elevator: '🛗', parking: '🚗', garden: '🌳', park: '🌳',
  playground: '🛝', club: '🏛️', clubhouse: '🏛️', power: '⚡',
  backup: '⚡', 'power backup': '⚡', wifi: '📶', internet: '📶',
  sports: '⚽', tennis: '🎾', basketball: '🏀', jogging: '🏃',
  cctv: '📷', intercom: '📞', rainwater: '💧', solar: '☀️',
  meditation: '🧘', yoga: '🧘', library: '📚', concierge: '🛎️',
  valet: '🚗', 'fire safety': '🚒', pet: '🐾', temple: '🛕',
  atm: '🏧', mall: '🏬', hospital: '🏥',
};
function getAmenityIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(AMENITY_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return '✓';
}

function buildAgentSlug(name: string, city: string, _id: string): string {
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return city ? `${slug(name)}/${slug(city)}` : slug(name);
}

type InquiryType = 'general' | 'site_visit' | 'price_negotiation';
interface Props { property: Property }

// ── Spec chip ─────────────────────────────────────────────────────────────────
function SpecChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-3 bg-white rounded-xl border border-gray-100 shadow-sm min-w-[90px]">
      <div className="text-primary-600">{icon}</div>
      <p className="text-xs font-bold text-gray-900">{value}</p>
      <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function PropertyDetailClient({ property }: Props) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const { trackPropertyView, trackPropertyInquiry } = useAnalytics();

  // Gallery
  const [activeImage, setActiveImage] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const touchStartX = useRef<number | null>(null);

  // Contact
  const [showPhone, setShowPhone] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryType, setInquiryType] = useState<InquiryType>('general');
  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [inquiryError, setInquiryError] = useState('');

  // Save & share
  const [isSaved, setIsSaved] = useState(false);
  const [shareToast, setShareToast] = useState('');

  // Expand toggles
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [descExpanded, setDescExpanded] = useState(false);
  const [amenitiesExpanded, setAmenitiesExpanded] = useState(false);

  // Agent/Property detail tab
  const [activeTab, setActiveTab] = useState<'property' | 'agent'>('property');

  const images = property.images?.length
    ? property.images.map((img) => ({ ...img, url: resolveImageUrl(img.url) }))
    : [{ url: getPrimaryImage([]), alt: property.title, id: '0', isPrimary: true, sortOrder: 0 }];

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

  // Track view + check saved
  useEffect(() => {
    trackPropertyView(property.id, {
      propertyType: property.type,
      city:  property.city  || undefined,
      state: property.state || undefined,
      source: 'direct',
    });
    savedApi.getSavedIds()
      .then(r => {
        const ids: string[] = Array.isArray(r.data) ? r.data : (r.data?.ids ?? []);
        setIsSaved(ids.includes(property.id));
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property.id]);

  // Lazy sections
  const [similarRef, similarVisible]       = useLazyComponent<HTMLDivElement>({ rootMargin: '400px' });
  const [mapRef, mapVisible]               = useLazyComponent<HTMLDivElement>({ rootMargin: '300px' });
  const [ownerPropsRef, ownerPropsVisible] = useLazyComponent<HTMLDivElement>({ rootMargin: '500px' });

  const isInactiveListing = property.status !== 'active' && property.status !== 'under_deal';

  const { data: similar, isLoading: similarLoading } = useQuery({
    queryKey: ['similar', property.id],
    queryFn: () => propertiesApi.getSimilar(property.id).then(r => r.data),
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

  // Gallery swipe
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) setActiveImage(i => Math.min(images.length - 1, i + 1));
      else           setActiveImage(i => Math.max(0, i - 1));
    }
    touchStartX.current = null;
  };

  // Save
  const handleSave = async () => {
    if (!user) { dispatch(openAuthModal({ mode: 'login' })); return; }
    try {
      if (isSaved) { await savedApi.unsave(property.id); setIsSaved(false); }
      else          { await savedApi.save(property.id);   setIsSaved(true); }
    } catch { /* optimistic */ }
  };

  // Share
  const handleShare = async () => {
    const url  = typeof window !== 'undefined' ? window.location.href : '';
    const text = `${property.title} – ${formatPrice(property.price)} in ${property.city}`;
    try {
      if (navigator.share) await navigator.share({ title: property.title, text, url });
      else {
        await navigator.clipboard.writeText(url);
        setShareToast('Link copied!');
        setTimeout(() => setShareToast(''), 2500);
      }
    } catch {}
  };

  // ── Lead capture helper ─────────────────────────────────────────────────────
  const captureContactLead = (
    source: 'call' | 'whatsapp' | 'enquiry' | 'schedule_visit',
    overrides: { contactName?: string; contactPhone?: string; contactEmail?: string } = {},
  ) => {
    const name  = overrides.contactName  ?? (user as any)?.name  ?? '';
    const phone = overrides.contactPhone ?? (user as any)?.phone ?? '';
    if (!phone) return; // don't capture if no phone available
    leadsApi.capturePublic({
      source,
      propertyId: property.id,
      contactName:  name  || 'Unknown',
      contactPhone: phone,
      contactEmail: overrides.contactEmail ?? (user as any)?.email ?? undefined,
      contactUserId: (user as any)?.id ?? undefined,
      city:  property.city  ?? undefined,
      state: property.state ?? undefined,
    }).catch(() => {}); // fire-and-forget; never block UI
  };

  // Inquiry
  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setInquiryError('');
    try {
      await inquiriesApi.create(property.id, { ...inquiryForm, type: inquiryType });
      setSubmitted(true);
      trackPropertyInquiry(property.id, { city: property.city || undefined });
      // Also create a lead for CRM tracking
      captureContactLead(
        inquiryType === 'site_visit' ? 'schedule_visit' : 'enquiry',
        {
          contactName:  inquiryForm.name,
          contactPhone: inquiryForm.phone,
          contactEmail: inquiryForm.email,
        },
      );
    } catch (err: any) {
      const status  = err?.response?.status;
      const message = err?.response?.data?.message || err?.message;
      if (status === 401) {
        setShowInquiryModal(false);
        dispatch(openAuthModal({ mode: 'login' }));
      } else {
        setInquiryError(Array.isArray(message) ? message.join(', ') : (message || 'Failed to send inquiry.'));
      }
    } finally { setSubmitting(false); }
  };

  const openInquiryModal = (type: InquiryType = 'general') => {
    setInquiryType(type); setShowInquiryModal(true);
  };

  // ── Derived values ──────────────────────────────────────────────────────────
  const isAgent  = property.listedBy === 'agent';
  const owner    = property.owner;
  const phone    = owner?.phone;
  const waNumber = phone?.replace(/\D/g, '').replace(/^0/, '91');
  const waText   = encodeURIComponent(`Hi, I'm interested in "${property.title}" listed on Think4BuySale. Please share more details.`);
  const waLink   = waNumber ? `https://wa.me/${waNumber}?text=${waText}` : null;

  const pricePerSqft = property.area && property.price
    ? Math.round(Number(property.price) / Number(property.area))
    : null;

  // Key overview specs
  const overviewSpecs = [
    property.bedrooms    && { icon: <BedDouble className="w-5 h-5" />,  label: 'Bedrooms',   value: `${property.bedrooms} BHK` },
    property.bathrooms   && { icon: <Bath className="w-5 h-5" />,       label: 'Bathrooms',  value: `${property.bathrooms}` },
    property.area        && { icon: <Maximize2 className="w-5 h-5" />,  label: 'Area',       value: formatArea(property.area, property.areaUnit) },
    property.floorNumber != null && { icon: <FloorIcon className="w-5 h-5" />, label: 'Floor', value: `${property.floorNumber}${property.totalFloors ? '/' + property.totalFloors : ''}` },
    property.parkingSpots && { icon: <Car className="w-5 h-5" />,       label: 'Parking',    value: `${property.parkingSpots}` },
    property.furnishingStatus && { icon: <Wind className="w-5 h-5" />,  label: 'Furnishing', value: getFurnishingLabel(property.furnishingStatus) },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string }[];

  // Full specs table
  const specs = [
    { label: 'Bedrooms',      value: property.bedrooms   ? `${property.bedrooms} BHK`                    : null },
    { label: 'Bathrooms',     value: property.bathrooms  ? `${property.bathrooms}`                       : null },
    { label: 'Carpet Area',   value: property.area       ? formatArea(property.area, property.areaUnit)  : null },
    { label: 'Floor',         value: property.floorNumber != null ? `${property.floorNumber}${property.totalFloors ? ' of ' + property.totalFloors : ''}` : null },
    { label: 'Balconies',     value: property.balconies  ? `${property.balconies}` : null },
    { label: 'Parking',       value: property.parkingSpots ? `${property.parkingSpots} spot${property.parkingSpots > 1 ? 's' : ''}` : null },
    { label: 'Furnishing',    value: getFurnishingLabel(property.furnishingStatus) },
    { label: 'Possession',    value: property.possessionStatus === 'ready_to_move' ? 'Ready to Move' : 'Under Construction' },
    { label: 'Property Age',  value: property.propertyAge ? `${property.propertyAge} yr${property.propertyAge > 1 ? 's' : ''}` : null },
    { label: 'Property Type', value: getPropertyTypeLabel(property.type) },
    { label: 'Listed By',     value: isAgent ? 'Agent / Broker' : 'Owner' },
    { label: 'RERA No.',      value: property.reraNumber || null },
  ].filter(s => s.value);

  // FAQ
  const faqs = [
    { q: `What is the price of ${property.title}?`, a: `The asking price is ${formatPrice(property.price, property.priceUnit)}${pricePerSqft ? ` (₹${pricePerSqft.toLocaleString('en-IN')}/sqft)` : ''}. Contact the ${isAgent ? 'agent' : 'owner'} for best deal.` },
    { q: `Is this property ready to move in?`, a: property.possessionStatus === 'ready_to_move' ? 'Yes, this property is ready to move in immediately.' : `Under construction.${property.possessionDate ? ` Expected possession: ${new Date(property.possessionDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}.` : ''}` },
    { q: `What amenities are available?`, a: property.amenities?.length ? `This property offers: ${property.amenities.slice(0, 8).map(a => a.name).join(', ')}.` : 'Contact the listing party for detailed amenity info.' },
    { q: `Is the property RERA registered?`, a: property.reraNumber ? `Yes, RERA No: ${property.reraNumber}.` : 'RERA details not available. Verify with the owner/builder.' },
    { q: `How to schedule a site visit?`, a: `Click "Schedule Visit" or WhatsApp/call the ${isAgent ? 'agent' : 'owner'} directly from this page.` },
  ];

  // ── Inquiry Form render ─────────────────────────────────────────────────────
  const renderInquiryForm = ({ onClose }: { onClose?: () => void } = {}) => {
    if (!user) return (
      <div className="text-center py-4">
        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <Lock className="w-6 h-6 text-blue-500" />
        </div>
        <p className="font-bold text-gray-900 mb-1">Login to Contact {isAgent ? 'Agent' : 'Owner'}</p>
        <p className="text-sm text-gray-500 mb-4">Sign in to send inquiry, schedule visit or negotiate price.</p>
        <button type="button"
          onClick={() => { dispatch(openAuthModal({ mode: 'login' })); if (onClose) onClose(); }}
          className="w-full py-3 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors">
          Login / Sign Up — It's Free
        </button>
        <p className="text-xs text-gray-400 mt-2">Details auto-filled after login.</p>
      </div>
    );

    if (submitted) return (
      <div className="text-center py-6">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-7 h-7 text-green-600" />
        </div>
        <p className="font-bold text-gray-900 text-lg mb-1">Inquiry Sent!</p>
        <p className="text-sm text-gray-500">The {isAgent ? 'agent' : 'owner'} will contact you shortly.</p>
        {onClose && (
          <button onClick={onClose} className="mt-4 px-8 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold">Done</button>
        )}
      </div>
    );

    const isAutoFilled = !!(user as any)?.name && !!(user as any)?.phone;
    return (
      <form onSubmit={handleInquiry} className="space-y-3">
        {isAutoFilled && (
          <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> Details auto-filled from your profile
          </div>
        )}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
          {(['general', 'site_visit', 'price_negotiation'] as const).map(t => (
            <button key={t} type="button" onClick={() => setInquiryType(t)}
              className={cn('flex-1 py-1.5 rounded-lg transition-colors',
                inquiryType === t ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              {t === 'general' ? 'General' : t === 'site_visit' ? '📅 Visit' : '💬 Negotiate'}
            </button>
          ))}
        </div>
        <input type="text" placeholder="Your Name *" required value={inquiryForm.name}
          onChange={e => setInquiryForm(f => ({ ...f, name: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400 bg-white" />
        <input type="tel" placeholder="Phone Number *" required value={inquiryForm.phone}
          onChange={e => setInquiryForm(f => ({ ...f, phone: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400 bg-white" />
        <input type="email" placeholder="Email (optional)" value={inquiryForm.email}
          onChange={e => setInquiryForm(f => ({ ...f, email: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400 bg-white" />
        <textarea placeholder={
            inquiryType === 'site_visit' ? 'Preferred date & time for site visit…'
            : inquiryType === 'price_negotiation' ? 'Your offer or budget…'
            : 'Your message (optional)…'}
          rows={2} value={inquiryForm.message}
          onChange={e => setInquiryForm(f => ({ ...f, message: e.target.value }))}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary-400 resize-none bg-white" />
        {inquiryError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{inquiryError}</p>
        )}
        <button type="submit" disabled={submitting}
          className="w-full py-3 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
          {submitting
            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending…</>
            : <><Send className="w-4 h-4" /> {inquiryType === 'site_visit' ? 'Request Site Visit' : inquiryType === 'price_negotiation' ? 'Send Offer' : 'Send Inquiry'}</>
          }
        </button>
        <p className="text-[10px] text-gray-400 text-center">By submitting you agree to our Privacy Policy.</p>
      </form>
    );
  };

  // ── RENDER ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-24 md:pb-0">

      {/* ── Fullscreen Gallery ─────────────────────────────────────────────── */}
      {showFullscreen && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
            <span className="text-white text-sm font-medium">{activeImage + 1} / {images.length}</span>
            <button onClick={() => setShowFullscreen(false)}
              className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center relative" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div className="relative w-full h-full">
              <Image src={images[activeImage]?.url} alt={images[activeImage]?.alt || property.title}
                fill className="object-contain" sizes="100vw" />
            </div>
            {images.length > 1 && (
              <>
                <button onClick={() => setActiveImage(i => Math.max(0, i - 1))} disabled={activeImage === 0}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/70">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setActiveImage(i => Math.min(images.length - 1, i + 1))} disabled={activeImage === images.length - 1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white disabled:opacity-30 hover:bg-black/70">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-1.5 justify-center p-3 overflow-x-auto flex-shrink-0">
              {images.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)}
                  className={cn('relative w-14 h-10 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all',
                    activeImage === i ? 'border-primary-400' : 'border-transparent opacity-50')}>
                  <Image src={img.url} alt="" fill className="object-cover" sizes="56px" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Share toast ───────────────────────────────────────────────────────── */}
      {shareToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-xl">
          {shareToast}
        </div>
      )}

      <div className="container-max py-3 md:py-6">

        {/* ── Mobile back + title ───────────────────────────────────────────── */}
        <div className="md:hidden flex items-center gap-3 mb-3">
          <Link href="/properties" className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm flex-shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 truncate">{property.city} · {getCategoryLabel(property.category)}</p>
            <p className="text-sm font-semibold text-gray-900 truncate">{property.title}</p>
          </div>
        </div>

        {/* ── Desktop breadcrumb ────────────────────────────────────────────── */}
        <nav className="hidden md:flex items-center gap-1.5 text-sm text-gray-500 mb-4 flex-wrap">
          <Link href="/" className="hover:text-primary-600">Home</Link><span>/</span>
          <Link href="/properties" className="hover:text-primary-600">Properties</Link><span>/</span>
          <Link href={`/properties?city=${property.city}`} className="hover:text-primary-600">{property.city}</Link><span>/</span>
          {property.locality && <><Link href={`/properties?city=${property.city}&locality=${property.locality}`} className="hover:text-primary-600">{property.locality}</Link><span>/</span></>}
          <span className="text-gray-800 line-clamp-1">{property.title}</span>
        </nav>

        {/* ── Status Banner ─────────────────────────────────────────────────── */}
        {property.status !== 'active' && (
          <div className={cn('mb-4 rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center gap-3',
            property.status === 'sold'        ? 'bg-red-50 border-red-200 text-red-800'
            : property.status === 'rented'    ? 'bg-orange-50 border-orange-200 text-orange-800'
            : property.status === 'under_deal'? 'bg-amber-50 border-amber-200 text-amber-800'
            : 'bg-gray-50 border-gray-200 text-gray-700')}>
            <div className="flex items-center gap-2.5 flex-1">
              <AlertTriangle className={cn('w-5 h-5 flex-shrink-0',
                property.status === 'sold' ? 'text-red-500' : property.status === 'rented' ? 'text-orange-500'
                : property.status === 'under_deal' ? 'text-amber-500' : 'text-gray-400')} />
              <div>
                <p className="font-bold text-base leading-tight">
                  {property.status === 'sold'        && 'This property has been SOLD'}
                  {property.status === 'rented'      && 'This property has been RENTED'}
                  {property.status === 'under_deal'  && '🤝 Deal in Progress'}
                  {(property.status === 'inactive' || property.status === 'pending') && 'This listing is currently inactive'}
                </p>
                <p className="text-sm mt-0.5 opacity-80">
                  {property.status === 'sold'       && 'No longer available. Browse similar properties below.'}
                  {property.status === 'rented'     && 'This rental is no longer available.'}
                  {property.status === 'under_deal' && 'A deal is in progress. You may still enquire.'}
                  {(property.status === 'inactive' || property.status === 'pending') && 'Listing taken off market temporarily.'}
                </p>
              </div>
            </div>
            <Link href={`/properties?city=${property.city}&type=${property.type}&category=${property.category}`}
              className={cn('flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-colors',
                property.status === 'sold' ? 'bg-red-100 hover:bg-red-200 text-red-800'
                : property.status === 'rented' ? 'bg-orange-100 hover:bg-orange-200 text-orange-800'
                : property.status === 'under_deal' ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800')}>
              Browse Similar →
            </Link>
          </div>
        )}

        <div className="flex gap-6 items-start">

          {/* ── LEFT: Main Content ─────────────────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* ── 99acres-style Gallery ──────────────────────────────────── */}
            <div className="bg-black rounded-2xl overflow-hidden shadow-sm">
              {/* Mobile: simple carousel */}
              <div className="md:hidden">
                <div className="relative aspect-[4/3] cursor-pointer select-none"
                  onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
                  onClick={() => setShowFullscreen(true)}>
                  <OptimizedImage src={images[activeImage]?.url} alt={images[activeImage]?.alt || property.title}
                    fill className="object-cover" priority sizes="100vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap pointer-events-none">
                    {property.isVerified && (
                      <span className="flex items-center gap-1 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Verified
                      </span>
                    )}
                    {property.isPremium && <span className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">Premium</span>}
                    {property.reraNumber && <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full">RERA ✓</span>}
                  </div>
                  {/* Save/Share */}
                  <div className="absolute top-3 right-3 flex gap-2 pointer-events-auto">
                    <button onClick={e => { e.stopPropagation(); handleSave(); }}
                      className={cn('w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all',
                        isSaved ? 'bg-red-500' : 'bg-white')}>
                      <Heart className={cn('w-4 h-4', isSaved ? 'fill-white text-white' : 'text-gray-500')} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); handleShare(); }}
                      className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md">
                      <Share2 className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  {/* Counter */}
                  <div className="absolute bottom-3 right-3">
                    <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                      {activeImage + 1}/{images.length} 📷
                    </span>
                  </div>
                  {/* Nav arrows */}
                  {images.length > 1 && (
                    <>
                      <button onClick={e => { e.stopPropagation(); setActiveImage(i => Math.max(0, i - 1)); }}
                        disabled={activeImage === 0}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 rounded-full flex items-center justify-center text-white disabled:opacity-30">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setActiveImage(i => Math.min(images.length - 1, i + 1)); }}
                        disabled={activeImage === images.length - 1}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/50 rounded-full flex items-center justify-center text-white disabled:opacity-30">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Desktop: 99acres grid (main + 4 thumbs) */}
              <div className="hidden md:block relative">
                <div className={cn('grid gap-1', images.length >= 3 ? 'grid-cols-[1fr_220px]' : 'grid-cols-1')}>
                  {/* Main image */}
                  <div className="relative aspect-[16/10] cursor-pointer group"
                    onClick={() => setShowFullscreen(true)}>
                    <OptimizedImage src={images[0]?.url} alt={images[0]?.alt || property.title}
                      fill className="object-cover" priority sizes="(max-width: 1280px) 65vw, 800px" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                      {property.isVerified && (
                        <span className="flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                          <CheckCircle className="w-3.5 h-3.5" /> Verified
                        </span>
                      )}
                      {property.isPremium && <span className="bg-purple-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">⭐ Premium</span>}
                      {property.isNewProject && <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">New Project</span>}
                      {property.reraNumber && <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">RERA ✓</span>}
                    </div>
                    {/* Save/Share */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button onClick={e => { e.stopPropagation(); handleSave(); }}
                        className={cn('w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105',
                          isSaved ? 'bg-red-500' : 'bg-white')}>
                        <Heart className={cn('w-4 h-4', isSaved ? 'fill-white text-white' : 'text-gray-500')} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleShare(); }}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-all">
                        <Share2 className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail grid (right column) */}
                  {images.length >= 3 && (
                    <div className="grid grid-rows-4 gap-1 h-full" style={{ aspectRatio: '220/400' }}>
                      {[1, 2, 3, 4].map(i => {
                        const img = images[i];
                        const isLast = i === 4;
                        const remaining = images.length - 4;
                        if (!img) return <div key={i} className="bg-gray-900" />;
                        return (
                          <div key={i}
                            className="relative cursor-pointer group overflow-hidden"
                            onClick={() => { setActiveImage(i); setShowFullscreen(true); }}>
                            <Image src={img.url} alt={img.alt || ''} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="220px" />
                            {isLast && remaining > 0 && (
                              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                                <span className="text-white font-black text-2xl">+{remaining}</span>
                                <span className="text-white/80 text-xs font-medium">more photos</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* View all photos bar */}
                <button onClick={() => setShowFullscreen(true)}
                  className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/70 hover:bg-black/80 text-white text-sm font-semibold px-4 py-2 rounded-full backdrop-blur-sm transition-colors">
                  📷 View all {images.length} photos
                </button>

                {/* Edit listing (owner/admin) */}
                {user && ((user as any).id === owner?.id || (user as any).role === 'admin') && (
                  <Link href={`/post-property?edit=${property.id}`}
                    className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-2 bg-white text-gray-800 rounded-full text-xs font-semibold hover:bg-gray-100 shadow-lg">
                    <Pencil className="w-3.5 h-3.5" /> Edit Listing
                  </Link>
                )}
              </div>
            </div>

            {/* ── Price + Title block ────────────────────────────────────── */}
            <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Category + type badges */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-[10px] font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {getCategoryLabel(property.category)}
                    </span>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {getPropertyTypeLabel(property.type)}
                    </span>
                    {property.possessionStatus === 'ready_to_move' && (
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        ✓ Ready to Move
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 leading-tight">{property.title}</h1>
                  <div className="flex items-start gap-1.5 text-gray-500 text-sm">
                    <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                    <span>{[property.society, property.locality, property.city, property.state].filter(Boolean).join(', ')}{property.pincode ? ` – ${property.pincode}` : ''}</span>
                  </div>
                </div>
                {/* Price */}
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl md:text-3xl font-black text-gray-900">
                    {formatPrice(property.price, property.priceUnit)}
                  </p>
                  {pricePerSqft && <p className="text-sm text-gray-400 mt-0.5">₹{pricePerSqft.toLocaleString('en-IN')}/sqft</p>}
                  {isAgent && property.brokerage && (
                    <p className="text-xs text-orange-600 font-medium mt-0.5">Brokerage: {property.brokerage}</p>
                  )}
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 text-xs text-gray-400 pt-3 mt-3 border-t border-gray-100 flex-wrap">
                <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {property.viewCount} views</span>
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {timeAgo(property.createdAt)}</span>
                {property.reraNumber && (
                  <span className="text-green-600 font-semibold flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> RERA: {property.reraNumber}
                  </span>
                )}
                <span className="text-gray-300">|</span>
                <span className="text-gray-300">ID: {property.id.slice(0, 8).toUpperCase()}</span>
              </div>
            </div>

            {/* ── Overview Specs (chip row) ─────────────────────────────── */}
            {overviewSpecs.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary-500" /> Overview
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                  {overviewSpecs.map(s => (
                    <SpecChip key={s.label} icon={s.icon} label={s.label} value={s.value} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Mobile Contact Buttons ────────────────────────────────── */}
            {!isInactiveListing && (
              <div className="md:hidden bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                  Contact {isAgent ? 'Agent' : 'Owner'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {/* Call */}
                  {user ? (
                    <a href={phone ? `tel:${phone}` : '#'}
                      onClick={() => {
                        trackPropertyInquiry(property.id, { city: property.city || undefined });
                        captureContactLead('call');
                      }}
                      className="flex items-center justify-center gap-2 py-3 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 active:scale-95 transition-all">
                      <Phone className="w-4 h-4" /> Call Now
                    </a>
                  ) : (
                    <button onClick={() => dispatch(openAuthModal({ mode: 'login' }))}
                      className="flex items-center justify-center gap-2 py-3 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 active:scale-95 transition-all">
                      <Lock className="w-4 h-4" /> Call Now
                    </button>
                  )}
                  {/* WhatsApp */}
                  {waLink && user ? (
                    <a href={waLink} target="_blank" rel="noopener noreferrer"
                      onClick={() => captureContactLead('whatsapp')}
                      className="flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-xl text-sm font-bold hover:bg-[#1ebe5d] active:scale-95 transition-all">
                      <WhatsAppIcon className="w-4 h-4" /> WhatsApp
                    </a>
                  ) : (
                    <button onClick={() => dispatch(openAuthModal({ mode: 'login' }))}
                      className="flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-xl text-sm font-bold hover:bg-[#1ebe5d] active:scale-95 transition-all">
                      <WhatsAppIcon className="w-4 h-4" /> WhatsApp
                    </button>
                  )}
                  <button onClick={() => openInquiryModal('site_visit')}
                    className="flex items-center justify-center gap-2 py-2.5 border-2 border-primary-500 text-primary-600 rounded-xl text-sm font-bold hover:bg-primary-50 active:scale-95 transition-all">
                    <Calendar className="w-4 h-4" /> Schedule Visit
                  </button>
                  <button onClick={() => openInquiryModal('general')}
                    className="flex items-center justify-center gap-2 py-2.5 border-2 border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 active:scale-95 transition-all">
                    <Send className="w-4 h-4" /> Send Inquiry
                  </button>
                </div>
              </div>
            )}


            {/* ── Description ──────────────────────────────────────────── */}
            {property.description && (
              <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary-500" /> About This Property
                </h2>
                <div className={cn('text-gray-600 leading-relaxed text-sm md:text-base whitespace-pre-line', !descExpanded && 'line-clamp-5')}>
                  {property.description}
                </div>
                {property.description?.length > 300 && (
                  <button onClick={() => setDescExpanded(v => !v)}
                    className="mt-2 text-primary-600 text-sm font-semibold flex items-center gap-1 hover:text-primary-700">
                    {descExpanded ? <><ChevronUp className="w-4 h-4" /> Read less</> : <><ChevronDown className="w-4 h-4" /> Read more</>}
                  </button>
                )}
              </div>
            )}

            {/* ── Amenities ─────────────────────────────────────────────── */}
            {property.amenities?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary-500" /> Amenities & Features
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(amenitiesExpanded ? property.amenities : property.amenities.slice(0, 9)).map(a => (
                    <div key={a.id} className="flex items-center gap-2.5 p-3 bg-green-50 rounded-xl border border-green-100">
                      <span className="text-base flex-shrink-0">{getAmenityIcon(a.name)}</span>
                      <span className="text-sm text-gray-700 font-medium leading-tight">{a.name}</span>
                    </div>
                  ))}
                </div>
                {property.amenities.length > 9 && (
                  <button onClick={() => setAmenitiesExpanded(v => !v)}
                    className="mt-3 text-primary-600 text-sm font-semibold flex items-center gap-1 hover:text-primary-700">
                    {amenitiesExpanded
                      ? <><ChevronUp className="w-4 h-4" /> Show less</>
                      : <><ChevronDown className="w-4 h-4" /> View all {property.amenities.length} amenities</>}
                  </button>
                )}
              </div>
            )}

            {/* ── Property Details / Agent Details Tabs ─────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Tab header */}
              <div className="flex border-b border-gray-100">
                <button
                  type="button"
                  onClick={() => setActiveTab('property')}
                  className={cn(
                    'flex-1 py-3.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2',
                    activeTab === 'property'
                      ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
                  )}
                >
                  <Home className="w-4 h-4" /> Property Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('agent')}
                  className={cn(
                    'flex-1 py-3.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2',
                    activeTab === 'agent'
                      ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
                  )}
                >
                  {isAgent ? <Building2 className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                  {isAgent ? 'Agent Details' : 'Owner Details'}
                </button>
              </div>

              {/* Property Details Tab */}
              {activeTab === 'property' && specs.length > 0 && (
                <div className="p-5 md:p-6">
                  <div className="divide-y divide-gray-50">
                    {specs.map(({ label, value }, i) => (
                      <div key={label} className={cn('flex items-center justify-between py-2.5 text-sm',
                        i % 2 === 0 ? '' : 'bg-gray-50/50 rounded-lg px-2')}>
                        <span className="text-gray-500 font-medium">{label}</span>
                        <span className="font-semibold text-gray-900 text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agent/Owner Details Tab */}
              {activeTab === 'agent' && (
                <div className="p-5 md:p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative w-16 h-16 flex-shrink-0">
                      {owner?.avatar ? (
                        <img src={resolveImageUrl(owner.avatar)} alt={owner.name} className="w-16 h-16 object-cover rounded-2xl" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-2xl">
                          {owner?.name?.charAt(0) || (isAgent ? 'A' : 'O')}
                        </div>
                      )}
                      {owner?.isVerified && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white">
                          <CheckCircle className="w-3.5 h-3.5 text-white fill-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg leading-tight">
                        {isAgent ? (owner?.company || owner?.name) : (owner?.name || 'Owner')}
                      </h3>
                      {isAgent && owner?.company && <p className="text-sm text-gray-500 mt-0.5">{owner.name}</p>}
                      {owner?.isVerified && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full mt-1">
                          <CheckCircle className="w-3 h-3" /> Verified {isAgent ? 'Agent' : 'Owner'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Agent stats grid */}
                  {isAgent && (
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {(owner as any)?.agentExperience && (
                        <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                          <p className="text-lg font-black text-gray-900">{(owner as any).agentExperience}</p>
                          <p className="text-[10px] text-gray-500 font-medium mt-0.5">Yrs Exp</p>
                        </div>
                      )}
                      {(owner as any)?.agentRating > 0 && (
                        <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                          <p className="text-lg font-black text-amber-700 flex items-center justify-center gap-1">
                            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                            {Number((owner as any).agentRating).toFixed(1)}
                          </p>
                          <p className="text-[10px] text-gray-500 font-medium mt-0.5">Rating</p>
                        </div>
                      )}
                      {(owner as any)?.agentUsedQuota > 0 && (
                        <div className="bg-primary-50 rounded-xl p-3 text-center border border-primary-100">
                          <p className="text-lg font-black text-primary-700">{(owner as any).agentUsedQuota}</p>
                          <p className="text-[10px] text-gray-500 font-medium mt-0.5">Listings</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bio */}
                  {isAgent && (owner as any)?.agentBio && (
                    <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3 border border-gray-100 mb-4">
                      {(owner as any).agentBio}
                    </p>
                  )}

                  {/* License */}
                  {isAgent && (owner as any)?.agentLicense && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 bg-green-50 border border-green-100 rounded-xl p-3">
                      <Shield className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>License: <strong className="text-gray-800">{(owner as any).agentLicense}</strong></span>
                    </div>
                  )}

                  {/* Contact actions */}
                  <div className="flex flex-wrap gap-2">
                    {phone && (
                      user ? (
                        <a href={`tel:${phone}`} onClick={() => captureContactLead('call')}
                          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors">
                          <Phone className="w-4 h-4" /> Call Now
                        </a>
                      ) : (
                        <button onClick={() => dispatch(openAuthModal({ mode: 'login' }))}
                          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors">
                          <Lock className="w-4 h-4" /> Call Now
                        </button>
                      )
                    )}
                    {waLink && (
                      user ? (
                        <a href={waLink} target="_blank" rel="noopener noreferrer" onClick={() => captureContactLead('whatsapp')}
                          className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-xl text-sm font-bold hover:bg-[#1ebe5d] transition-colors">
                          <WhatsAppIcon className="w-4 h-4" /> WhatsApp
                        </a>
                      ) : (
                        <button onClick={() => dispatch(openAuthModal({ mode: 'login' }))}
                          className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] text-white rounded-xl text-sm font-bold hover:bg-[#1ebe5d] transition-colors">
                          <WhatsAppIcon className="w-4 h-4" /> WhatsApp
                        </button>
                      )
                    )}
                    {isAgent && owner?.id && (
                      <Link href={`/agents/${buildAgentSlug(owner.name, property.city, owner.id)}`}
                        className="flex items-center gap-2 px-4 py-2.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-xl text-sm font-bold hover:bg-violet-100 transition-colors">
                        <UserCircle className="w-4 h-4" /> Full Profile
                      </Link>
                    )}
                    <Link href={`/properties?agentId=${owner?.id}`}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-sm font-bold hover:bg-gray-100 transition-colors">
                      <Building className="w-4 h-4" /> All Listings
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* ── Agent / Owner Card ────────────────────────────────────── */}
            <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                {isAgent ? <Building2 className="w-5 h-5 text-primary-500" /> : <Shield className="w-5 h-5 text-primary-500" />}
                {isAgent ? 'Listed by Agent' : 'Listed by Owner'}
              </h2>
              <div className="flex items-start gap-4">
                <div className="relative w-14 h-14 flex-shrink-0">
                  {owner?.avatar ? (
                    <img src={resolveImageUrl(owner.avatar)} alt={owner.name} className="w-14 h-14 object-cover rounded-2xl" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-xl">
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
                    <h3 className="font-bold text-gray-900">{isAgent ? (owner?.company || owner?.name) : (owner?.name || 'Owner')}</h3>
                    {owner?.isVerified && (
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">✓ Verified</span>
                    )}
                  </div>
                  {isAgent && owner?.company && <p className="text-sm text-gray-500">{owner.name}</p>}
                  {isAgent && (owner as any)?.agentExperience && (
                    <p className="text-xs text-gray-400 mt-0.5">{(owner as any).agentExperience} yrs experience</p>
                  )}
                  {isAgent && (owner as any)?.agentRating > 0 && (
                    <p className="text-xs text-amber-600 font-semibold mt-0.5 flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {Number((owner as any).agentRating).toFixed(1)} rating
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {phone && (
                      user ? (
                        <a href={`tel:${phone}`}
                          onClick={() => captureContactLead('call')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 transition-colors">
                          <Phone className="w-3.5 h-3.5" /> Call
                        </a>
                      ) : (
                        <button onClick={() => dispatch(openAuthModal({ mode: 'login' }))}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 transition-colors">
                          <Lock className="w-3.5 h-3.5" /> Call
                        </button>
                      )
                    )}
                    {waLink && (
                      user ? (
                        <a href={waLink} target="_blank" rel="noopener noreferrer"
                          onClick={() => captureContactLead('whatsapp')}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white rounded-lg text-xs font-bold hover:bg-[#1ebe5d] transition-colors">
                          <WhatsAppIcon className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      ) : (
                        <button onClick={() => dispatch(openAuthModal({ mode: 'login' }))}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white rounded-lg text-xs font-bold hover:bg-[#1ebe5d] transition-colors">
                          <WhatsAppIcon className="w-3.5 h-3.5" /> WhatsApp
                        </button>
                      )
                    )}
                    {isAgent && owner?.id && (
                      <Link href={`/agents/${buildAgentSlug(owner.name, property.city, owner.id)}`}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-lg text-xs font-bold hover:bg-violet-100 transition-colors">
                        <UserCircle className="w-3.5 h-3.5" /> View Profile
                      </Link>
                    )}
                    <Link href={`/properties?agentId=${owner?.id}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors">
                      <Building className="w-3.5 h-3.5" /> All Listings
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Location ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary-500" /> Location
              </h2>
              <div className="flex items-start gap-2 text-gray-600 text-sm mb-4">
                <MapPin className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                <span>{[property.address, property.locality, property.city, property.state, property.pincode].filter(Boolean).join(', ')}</span>
              </div>
              {/* Nearby chips */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[{ icon: '🏫', label: 'Schools' }, { icon: '🏥', label: 'Hospitals' }, { icon: '🚇', label: 'Metro' }, { icon: '🛒', label: 'Shopping' }].map(item => (
                  <div key={item.label} className="text-center p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="text-xl mb-1">{item.icon}</div>
                    <div className="text-xs font-semibold text-gray-700">{item.label}</div>
                    <div className="text-[10px] text-gray-400">Nearby</div>
                  </div>
                ))}
              </div>
              {/* Map */}
              <div ref={mapRef} className="rounded-xl h-56 md:h-72 bg-gray-100 overflow-hidden flex items-center justify-center">
                {mapVisible && property.latitude && property.longitude ? (
                  <iframe title="Property location" loading="lazy"
                    src={`https://maps.google.com/maps?q=${property.latitude},${property.longitude}&z=15&output=embed`}
                    className="w-full h-full border-0" allowFullScreen />
                ) : (
                  <div className="text-center text-gray-400">
                    <MapPin className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">{property.locality}, {property.city}</p>
                    {property.latitude && property.longitude && (
                      <a href={`https://maps.google.com/?q=${property.latitude},${property.longitude}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-primary-600 hover:underline">
                        <ExternalLink className="w-3 h-3" /> Open in Google Maps
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Similar Properties (non-active listings — shown prominently) */}
            {property.status !== 'active' && (
              <div className="mb-0">
                {similarLoading ? (
                  <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="h-6 w-56 bg-gray-200 rounded animate-pulse mb-4" />
                    <PropertyGridSkeleton count={4} />
                  </div>
                ) : similar && similar.length > 0 ? (
                  <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-5 md:p-6 border border-primary-100 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                      <Building className="w-5 h-5 text-primary-500" /> Available Similar Properties
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">This listing is no longer active — similar options in {property.city}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {similar.slice(0, 4).map((p: Property) => <PropertyCard key={p.id} property={p} />)}
                    </div>
                    <div className="mt-4 text-center">
                      <Link href={`/properties?city=${property.city}&type=${property.type}&category=${property.category}`}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors">
                        View All {property.city} {getPropertyTypeLabel(property.type)}s <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* ── Recommended / Similar ─────────────────────────────────── */}
            <div ref={similarRef}>
              {similarLoading ? (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
                  <PropertyGridSkeleton count={4} />
                </div>
              ) : similar?.length > 0 && property.status === 'active' ? (
                <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Building className="w-5 h-5 text-primary-500" /> Recommended Properties
                    </h2>
                    <Link href={`/properties?city=${property.city}&type=${property.type}&category=${property.category}`}
                      className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                      See all <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {similar.slice(0, 4).map((p: Property) => <PropertyCard key={p.id} property={p} />)}
                  </div>
                </div>
              ) : null}
            </div>

            {/* ── More by this Agent / Owner ────────────────────────────── */}
            <div ref={ownerPropsRef}>
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
                        ? <><Building2 className="w-5 h-5 text-violet-500" /> More by {owner?.company || owner?.name || 'this Agent'}</>
                        : <><Home className="w-5 h-5 text-emerald-500" /> More from {owner?.name || 'this Owner'}</>}
                    </h2>
                    <Link href={`/properties?agentId=${owner?.id}`}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                      See all <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ownerPropsData.map((p: Property) => <PropertyCard key={p.id} property={p} />)}
                  </div>
                  {isAgent && owner?.id && (
                    <div className="mt-4 text-center">
                      <Link href={`/agents/${buildAgentSlug(owner.name, property.city, owner.id)}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-xl text-sm font-bold hover:bg-violet-100 transition-colors">
                        <UserCircle className="w-4 h-4" /> View {owner.company || owner.name}'s Full Profile <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* ── FAQ ──────────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <div className="space-y-2">
                {faqs.map((faq, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl overflow-hidden">
                    <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors">
                      <span className="text-sm font-semibold text-gray-800 pr-4">{faq.q}</span>
                      {expandedFaq === i ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                    </button>
                    {expandedFaq === i && (
                      <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">{faq.a}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── SEO content ──────────────────────────────────────────── */}
            <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl p-5 md:p-6 border border-primary-100">
              <h2 className="text-base font-bold text-gray-900 mb-2">
                {property.bedrooms ? `${property.bedrooms} BHK ` : ''}{getPropertyTypeLabel(property.type)} for {property.category === 'buy' ? 'Sale' : property.category === 'rent' ? 'Rent' : getCategoryLabel(property.category)} in {property.locality}, {property.city}
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {property.city} is one of the most sought-after real estate destinations.
                This {property.bedrooms ? `${property.bedrooms} BHK ` : ''}{getPropertyTypeLabel(property.type).toLowerCase()}
                {property.area ? ` of ${formatArea(property.area, property.areaUnit)} ` : ' '}
                in {property.locality} is priced at {formatPrice(property.price, property.priceUnit)}.
                {property.possessionStatus === 'ready_to_move' ? ' Ready to move in immediately.' : ''}
                {property.amenities?.length ? ` Premium amenities: ${property.amenities.slice(0, 3).map(a => a.name).join(', ')}.` : ''}
                {' '}Contact the {isAgent ? 'agent' : 'owner'} now for the best deal.
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  `${property.category === 'buy' ? 'Buy' : 'Rent'} property in ${property.city}`,
                  `${property.bedrooms ? property.bedrooms + ' BHK ' : ''}${getPropertyTypeLabel(property.type)} ${property.city}`,
                  `${getPropertyTypeLabel(property.type)} in ${property.locality}`,
                  `Real estate ${property.city}`,
                ].map((tag, i) => (
                  <Link key={i}
                    href={`/properties?city=${property.city}&type=${property.type}&category=${property.category}`}
                    className="text-xs bg-white text-primary-700 px-3 py-1 rounded-full border border-primary-200 hover:bg-primary-50 transition-colors font-medium">
                    {tag}
                  </Link>
                ))}
              </div>
            </div>

          </div>{/* end left column */}

          {/* ── RIGHT: Desktop Sticky Sidebar ──────────────────────────── */}
          <div className="hidden md:block w-[340px] flex-shrink-0 self-start sticky top-[88px]">
            <div className="space-y-4 max-h-[calc(100vh-100px)] overflow-y-auto scrollbar-hide pb-4">

              {/* Price summary */}
              <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-5 text-white shadow-xl">
                <p className="text-primary-200 text-xs font-semibold uppercase tracking-wide mb-1">Asking Price</p>
                <p className="text-3xl font-black mb-0.5">{formatPrice(property.price, property.priceUnit)}</p>
                {pricePerSqft && <p className="text-primary-200 text-sm">₹{pricePerSqft.toLocaleString('en-IN')}/sqft</p>}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/20 text-sm flex-wrap">
                  {property.bedrooms && <span className="flex items-center gap-1"><BedDouble className="w-4 h-4 text-primary-300" />{property.bedrooms} BHK</span>}
                  {property.area    && <span className="flex items-center gap-1"><Maximize2 className="w-4 h-4 text-primary-300" />{formatArea(property.area, property.areaUnit)}</span>}
                  {property.furnishingStatus && <span className="text-primary-200 text-xs">{getFurnishingLabel(property.furnishingStatus)}</span>}
                </div>
                <div className="flex gap-2 mt-4">
                  <button onClick={handleSave}
                    className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all',
                      isSaved ? 'bg-red-500 hover:bg-red-600' : 'bg-white/20 hover:bg-white/30')}>
                    <Heart className={cn('w-4 h-4', isSaved ? 'fill-white text-white' : '')} />
                    {isSaved ? 'Saved' : 'Save'}
                  </button>
                  <button onClick={handleShare}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl text-sm font-bold transition-all">
                    <Share2 className="w-4 h-4" /> Share
                  </button>
                </div>
              </div>

              {/* Contact card */}
              {isInactiveListing ? (
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 text-center">
                  <AlertTriangle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="font-bold text-gray-700 mb-1">
                    {property.status === 'sold' ? 'Property Sold' : property.status === 'rented' ? 'Property Rented' : 'Listing Unavailable'}
                  </p>
                  <p className="text-xs text-gray-500 mb-4">This listing is no longer accepting inquiries.</p>
                  <Link href={`/properties?city=${property.city}&type=${property.type}&category=${property.category}`}
                    className="block w-full py-3 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors">
                    Browse Similar Properties
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Owner header */}
                  <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      {owner?.avatar ? (
                        <img src={resolveImageUrl(owner.avatar)} alt={owner.name || ''} className="w-12 h-12 object-cover rounded-xl" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg">
                          {owner?.name?.charAt(0) || (isAgent ? 'A' : 'O')}
                        </div>
                      )}
                      {owner?.isVerified && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white">
                          <CheckCircle className="w-2.5 h-2.5 text-white fill-white" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-gray-900 text-sm truncate">{isAgent ? (owner?.company || owner?.name) : (owner?.name || 'Owner')}</p>
                      {isAgent && owner?.company && <p className="text-xs text-gray-500 truncate">{owner.name}</p>}
                      {owner?.isVerified && (
                        <p className="text-xs text-green-600 font-semibold flex items-center gap-1 mt-0.5">
                          <CheckCircle className="w-3 h-3" /> Verified {isAgent ? 'Agent' : 'Owner'}
                        </p>
                      )}
                    </div>
                    {isAgent && owner?.id && (
                      <Link href={`/agents/${buildAgentSlug(owner.name, property.city, owner.id)}`}
                        className="text-xs text-violet-600 font-semibold hover:text-violet-700 flex items-center gap-1 flex-shrink-0">
                        <UserCircle className="w-3.5 h-3.5" /> Profile
                      </Link>
                    )}
                  </div>

                  {/* Contact buttons */}
                  <div className="p-4 space-y-3">
                    {/* Phone */}
                    {!user ? (
                      <button onClick={() => dispatch(openAuthModal({ mode: 'login' }))}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors">
                        <Lock className="w-4 h-4" /> Login to View Phone Number
                      </button>
                    ) : phone ? (
                      <a href={showPhone ? `tel:${phone}` : undefined}
                        onClick={() => { setShowPhone(true); captureContactLead('call'); }}
                        className="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors cursor-pointer">
                        <Phone className="w-4 h-4" />
                        {showPhone ? phone : `${phone.slice(0, 5)}XXXXX — Tap to Reveal`}
                      </a>
                    ) : (
                      <button disabled className="flex items-center justify-center gap-2 w-full py-3 bg-gray-300 text-white rounded-xl text-sm font-bold cursor-not-allowed">
                        <Phone className="w-4 h-4" /> Phone not available
                      </button>
                    )}

                    {/* WhatsApp — prominent green */}
                    {waLink ? (
                      user ? (
                        <a href={waLink} target="_blank" rel="noopener noreferrer"
                          onClick={() => captureContactLead('whatsapp')}
                          className="flex items-center justify-center gap-2.5 w-full py-3 bg-[#25D366] text-white rounded-xl text-sm font-bold hover:bg-[#1ebe5d] transition-colors shadow-md shadow-green-200">
                          <WhatsAppIcon className="w-5 h-5" /> Chat on WhatsApp
                        </a>
                      ) : (
                        <button onClick={() => dispatch(openAuthModal({ mode: 'login' }))}
                          className="flex items-center justify-center gap-2.5 w-full py-3 bg-[#25D366] text-white rounded-xl text-sm font-bold hover:bg-[#1ebe5d] transition-colors shadow-md shadow-green-200">
                          <WhatsAppIcon className="w-5 h-5" /> Chat on WhatsApp
                        </button>
                      )
                    ) : null}

                    {/* Schedule Visit */}
                    <button onClick={() => openInquiryModal('site_visit')}
                      className="flex items-center justify-center gap-2 w-full py-3 border-2 border-primary-500 text-primary-600 rounded-xl text-sm font-bold hover:bg-primary-50 transition-colors">
                      <Calendar className="w-4 h-4" /> Schedule a Site Visit
                    </button>
                  </div>

                  {/* Inline inquiry form */}
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                      <Send className="w-3.5 h-3.5" /> Send a Message
                    </p>
                    {renderInquiryForm()}
                  </div>
                </div>
              )}

            </div>
          </div>

        </div>{/* end flex row */}
      </div>

      {/* ── Mobile Sticky Bottom Bar ──────────────────────────────────────────── */}
      {!isInactiveListing && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl safe-bottom">
          <div className="flex items-center gap-2 px-3 py-3">
            {/* Call */}
            {user ? (
              <a href={phone ? `tel:${phone}` : '#'}
                onClick={() => {
                  if (phone) {
                    trackPropertyInquiry(property.id, { city: property.city || undefined });
                    captureContactLead('call');
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 active:scale-95 transition-all">
                <Phone className="w-4 h-4" /> Call
              </a>
            ) : (
              <button onClick={() => dispatch(openAuthModal({ mode: 'login' }))}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 text-white rounded-xl text-sm font-bold active:scale-95 transition-all">
                <Lock className="w-4 h-4" /> Call
              </button>
            )}

            {/* WhatsApp */}
            {waLink ? (
              user ? (
                <a href={waLink} target="_blank" rel="noopener noreferrer"
                  onClick={() => captureContactLead('whatsapp')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-xl text-sm font-bold hover:bg-[#1ebe5d] active:scale-95 transition-all">
                  <WhatsAppIcon className="w-4 h-4" /> WhatsApp
                </a>
              ) : (
                <button onClick={() => dispatch(openAuthModal({ mode: 'login' }))}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-xl text-sm font-bold active:scale-95 transition-all">
                  <WhatsAppIcon className="w-4 h-4" /> WhatsApp
                </button>
              )
            ) : null}

            {/* Enquire */}
            <button onClick={() => openInquiryModal('general')}
              className={cn(
                'flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold active:scale-95 transition-all',
                (!phone && !waLink) ? 'flex-1 bg-primary-600 text-white' : 'px-4 border-2 border-gray-200 text-gray-700 hover:bg-gray-50',
              )}>
              <Send className="w-4 h-4" /> {(!phone && !waLink) ? 'Send Inquiry' : 'Enquire'}
            </button>
          </div>
        </div>
      )}

      {/* ── Inquiry Modal ─────────────────────────────────────────────────────── */}
      {showInquiryModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center md:p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={() => setShowInquiryModal(false)} />
          <div className="relative bg-white rounded-t-3xl md:rounded-2xl shadow-2xl w-full md:max-w-lg max-h-[92dvh] flex flex-col">
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0 md:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="font-bold text-gray-900">
                  {inquiryType === 'site_visit' ? '📅 Schedule a Visit' : inquiryType === 'price_negotiation' ? '💬 Negotiate Price' : `Contact ${isAgent ? 'Agent' : 'Owner'}`}
                </h3>
                <p className="text-xs text-gray-500">{isAgent ? (owner?.company || owner?.name) : owner?.name} · {property.title.slice(0, 40)}</p>
              </div>
              <button onClick={() => setShowInquiryModal(false)}
                className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
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
