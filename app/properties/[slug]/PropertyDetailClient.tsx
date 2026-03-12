'use client';

import { useState, useEffect } from 'react';
import OptimizedImage from '@/components/common/OptimizedImage';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  BedDouble,
  Bath,
  Maximize2,
  MapPin,
  CheckCircle,
  Phone,
  MessageSquare,
  Heart,
  Share2,
  ChevronLeft,
  Building,
  Calendar,
  Car,
  Wind,
  ArrowLeft,
  Eye,
  X,
} from 'lucide-react';
import { Property } from '@/types/property';
import {
  formatPrice,
  formatArea,
  getPropertyTypeLabel,
  getCategoryLabel,
  getFurnishingLabel,
  getPrimaryImage,
  timeAgo,
} from '@/lib/utils';
import { cn } from '@/lib/utils';
import { inquiriesApi, propertiesApi } from '@/lib/api';
import PropertyCard from '@/components/property/PropertyCard';
import { useAnalytics } from '@/hooks/useAnalytics';

interface Props {
  property: Property;
}

export default function PropertyDetailClient({ property }: Props) {
  const [activeImage, setActiveImage] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [showMobileInquiry, setShowMobileInquiry] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { trackPropertyView, trackPropertyInquiry } = useAnalytics();

  // Track property view once on mount
  useEffect(() => {
    trackPropertyView(property.id, {
      propertyType: property.type,
      city:  property.city  || undefined,
      state: property.state || undefined,
      source: 'direct',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [property.id]);

  const { data: similar } = useQuery({
    queryKey: ['similar', property.id],
    queryFn: () => propertiesApi.getSimilar(property.id).then((r) => r.data),
  });

  const images = property.images?.length ? property.images : [{ url: getPrimaryImage([]), alt: property.title }];

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await inquiriesApi.create(property.id, inquiryForm);
      setSubmitted(true);
      trackPropertyInquiry(property.id, {
        city:  property.city  || undefined,
        state: property.state || undefined,
      });
    } catch {
      alert('Failed to send inquiry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const specs = [
    { icon: BedDouble, label: 'Bedrooms', value: property.bedrooms ? `${property.bedrooms} BHK` : null },
    { icon: Bath, label: 'Bathrooms', value: property.bathrooms },
    { icon: Maximize2, label: 'Area', value: property.area ? formatArea(property.area, property.areaUnit) : null },
    { icon: Building, label: 'Floor', value: property.floorNumber ? `${property.floorNumber} of ${property.totalFloors}` : null },
    { icon: Car, label: 'Parking', value: property.parkingSpots ? `${property.parkingSpots} spot${property.parkingSpots > 1 ? 's' : ''}` : null },
    { icon: Wind, label: 'Furnishing', value: getFurnishingLabel(property.furnishingStatus) },
    { icon: Calendar, label: 'Possession', value: property.possessionStatus === 'ready_to_move' ? 'Ready to Move' : 'Under Construction' },
    { icon: Building, label: 'Age', value: property.propertyAge ? `${property.propertyAge} years` : null },
  ].filter((s) => s.value);

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-32 md:pb-0">
      <div className="container-max py-3 md:py-6">
        {/* Back button on mobile / Breadcrumb on desktop */}
        <div className="md:hidden flex items-center gap-3 mb-3">
          <Link
            href="/properties"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 shadow-sm flex-shrink-0"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </Link>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 truncate">
              {property.city} · {property.category}
            </p>
            <p className="text-sm font-semibold text-gray-900 truncate">{property.title}</p>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <span>/</span>
          <Link href="/properties" className="hover:text-primary-600">Properties</Link>
          <span>/</span>
          <Link href={`/properties?city=${property.city}`} className="hover:text-primary-600">{property.city}</Link>
          <span>/</span>
          <span className="text-gray-800 line-clamp-1">{property.title}</span>
        </nav>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Image Gallery */}
            <div className="bg-black rounded-2xl overflow-hidden mb-6">
              <div className="relative aspect-[16/9] md:aspect-[2/1]">
                <OptimizedImage
                  src={images[activeImage]?.url}
                  alt={images[activeImage]?.alt || property.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 70vw"
                />

                {/* Nav arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setActiveImage((i) => Math.max(0, i - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                      disabled={activeImage === 0}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setActiveImage((i) => Math.min(images.length - 1, i + 1))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors rotate-180"
                      disabled={activeImage === images.length - 1}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Counter */}
                <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                  {activeImage + 1} / {images.length}
                </div>

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  {property.isVerified && (
                    <span className="badge bg-green-500 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" /> Verified
                    </span>
                  )}
                  {property.isPremium && (
                    <span className="badge bg-purple-600 text-white">Premium</span>
                  )}
                </div>

                {/* Actions top right */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                    <Heart className="w-4 h-4 text-gray-500" />
                  </button>
                  <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                    <Share2 className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-2 p-3 overflow-x-auto custom-scrollbar">
                  {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={cn(
                        'relative w-16 h-12 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all',
                        activeImage === i ? 'border-primary-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-80',
                      )}
                    >
                      <OptimizedImage
                        src={img.url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Price */}
            <div className="bg-white rounded-2xl p-5 md:p-6 mb-4 shadow-sm border border-gray-100">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="badge badge-buy">{getCategoryLabel(property.category)}</span>
                    <span className="badge bg-gray-100 text-gray-600">{getPropertyTypeLabel(property.type)}</span>
                    {property.reraNumber && (
                      <span className="badge bg-blue-50 text-blue-600">RERA ✓</span>
                    )}
                  </div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
                    {property.title}
                  </h1>
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <MapPin className="w-4 h-4 text-primary-500" />
                    <span>{property.locality}, {property.city}</span>
                    {property.pincode && <span className="text-gray-400">- {property.pincode}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">
                    {formatPrice(property.price, property.priceUnit)}
                  </p>
                  {property.area && (
                    <p className="text-sm text-gray-500">
                      ₹{Math.round(property.price / property.area).toLocaleString('en-IN')}/sqft
                    </p>
                  )}
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 text-sm text-gray-500 pt-3 border-t border-gray-100">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" /> {property.viewCount} views
                </span>
                <span>Posted {timeAgo(property.createdAt)}</span>
                {property.reraNumber && (
                  <span className="text-green-600 font-medium">RERA: {property.reraNumber}</span>
                )}
              </div>
            </div>

            {/* Specifications */}
            {specs.length > 0 && (
              <div className="bg-white rounded-2xl p-5 md:p-6 mb-4 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Property Overview</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {specs.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="text-center p-3 bg-gray-50 rounded-xl">
                      <Icon className="w-5 h-5 text-primary-600 mx-auto mb-2" />
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      <p className="font-semibold text-gray-900 text-sm">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div className="bg-white rounded-2xl p-5 md:p-6 mb-4 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-3">About this Property</h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm md:text-base">
                {property.description}
              </p>
            </div>

            {/* Amenities */}
            {property.amenities?.length > 0 && (
              <div className="bg-white rounded-2xl p-5 md:p-6 mb-4 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {property.amenities.map((amenity) => (
                    <div
                      key={amenity.id}
                      className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-sm"
                    >
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 font-medium">{amenity.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="bg-white rounded-2xl p-5 md:p-6 mb-4 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Location</h2>
              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <MapPin className="w-4 h-4 text-primary-600 flex-shrink-0" />
                <span>{[property.address, property.locality, property.city, property.pincode].filter(Boolean).join(', ')}</span>
              </div>
              {/* Map placeholder */}
              <div className="bg-gray-100 rounded-xl h-48 md:h-64 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <MapPin className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">Map View</p>
                  {property.latitude && property.longitude && (
                    <a
                      href={`https://maps.google.com/?q=${property.latitude},${property.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary-600 hover:underline mt-1 block"
                    >
                      Open in Google Maps
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Similar Properties */}
            {similar?.length > 0 && (
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Similar Properties</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {similar.slice(0, 4).map((p: Property) => (
                    <PropertyCard key={p.id} property={p} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - Contact */}
          <div className="hidden md:block w-80 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              {/* Owner Info */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold text-lg">
                    {property.owner?.name?.charAt(0) || 'O'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{property.owner?.name || 'Owner'}</p>
                    {property.owner?.company && (
                      <p className="text-xs text-gray-500">{property.owner.company}</p>
                    )}
                    {property.owner?.isVerified && (
                      <div className="flex items-center gap-1 text-green-600 text-xs">
                        <CheckCircle className="w-3 h-3" /> Verified Owner
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => setShowPhone(!showPhone)}
                    className="btn-primary w-full justify-center"
                  >
                    <Phone className="w-4 h-4" />
                    {showPhone ? property.owner?.phone || '+91 XXXXX XXXXX' : 'Show Phone Number'}
                  </button>
                  <button
                    onClick={() => document.getElementById('inquiry-form')?.scrollIntoView({ behavior: 'smooth' })}
                    className="btn-outline w-full justify-center"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Send Inquiry
                  </button>
                </div>
              </div>

              {/* Inquiry Form */}
              <div id="inquiry-form" className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Send Inquiry</h3>

                {submitted ? (
                  <div className="text-center py-6">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="font-semibold text-gray-900">Inquiry Sent!</p>
                    <p className="text-sm text-gray-500 mt-1">Owner will contact you shortly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleInquiry} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Your Name *"
                      required
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm((f) => ({ ...f, name: e.target.value }))}
                      className="input-field"
                    />
                    <input
                      type="email"
                      placeholder="Email Address *"
                      required
                      value={inquiryForm.email}
                      onChange={(e) => setInquiryForm((f) => ({ ...f, email: e.target.value }))}
                      className="input-field"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number *"
                      required
                      value={inquiryForm.phone}
                      onChange={(e) => setInquiryForm((f) => ({ ...f, phone: e.target.value }))}
                      className="input-field"
                    />
                    <textarea
                      placeholder="Your message..."
                      rows={3}
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm((f) => ({ ...f, message: e.target.value }))}
                      className="input-field resize-none"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn-primary w-full justify-center"
                    >
                      {submitting ? 'Sending...' : 'Send Inquiry'}
                    </button>
                    <p className="text-xs text-gray-400 text-center">
                      By submitting, you agree to our Privacy Policy.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer CTA */}
      <div className="md:hidden fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 px-3 py-2.5 flex gap-3 z-40 shadow-lg">
        <button
          onClick={() => setShowPhone(!showPhone)}
          className="flex-1 btn-outline justify-center py-3 text-sm"
        >
          <Phone className="w-4 h-4" />
          {showPhone ? (property.owner?.phone || 'Call') : 'Call Owner'}
        </button>
        <button
          onClick={() => setShowMobileInquiry(true)}
          className="flex-1 btn-primary justify-center py-3 text-sm"
        >
          <MessageSquare className="w-4 h-4" />
          Inquire Now
        </button>
      </div>

      {/* Mobile Inquiry Bottom Sheet */}
      {showMobileInquiry && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileInquiry(false)} />
          <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[90dvh] flex flex-col">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0">
              <h3 className="font-bold text-gray-900 text-lg">Send Inquiry</h3>
              <button
                onClick={() => setShowMobileInquiry(false)}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-5 pb-safe-nav">
              {submitted ? (
                <div className="text-center py-10">
                  <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
                  <p className="font-bold text-gray-900 text-lg">Inquiry Sent!</p>
                  <p className="text-sm text-gray-500 mt-1">Owner will contact you shortly.</p>
                  <button
                    onClick={() => setShowMobileInquiry(false)}
                    className="mt-5 btn-primary px-8"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInquiry} className="space-y-3 pb-6">
                  <input
                    type="text"
                    placeholder="Your Name *"
                    required
                    value={inquiryForm.name}
                    onChange={(e) => setInquiryForm((f) => ({ ...f, name: e.target.value }))}
                    className="input-field"
                  />
                  <input
                    type="email"
                    placeholder="Email Address *"
                    required
                    value={inquiryForm.email}
                    onChange={(e) => setInquiryForm((f) => ({ ...f, email: e.target.value }))}
                    className="input-field"
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number *"
                    required
                    value={inquiryForm.phone}
                    onChange={(e) => setInquiryForm((f) => ({ ...f, phone: e.target.value }))}
                    className="input-field"
                  />
                  <textarea
                    placeholder="Your message..."
                    rows={3}
                    value={inquiryForm.message}
                    onChange={(e) => setInquiryForm((f) => ({ ...f, message: e.target.value }))}
                    className="input-field resize-none"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full justify-center py-3.5 text-base"
                  >
                    {submitting ? 'Sending...' : 'Send Inquiry'}
                  </button>
                  <p className="text-xs text-gray-400 text-center pb-2">
                    By submitting, you agree to our Privacy Policy.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
