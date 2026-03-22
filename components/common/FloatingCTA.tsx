'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Phone, MessageCircle, Search, ChevronUp, CheckCircle, User, LogIn } from 'lucide-react';
import { cn, toLeadPropertyType } from '@/lib/utils';
import { smartSearchApi, leadsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch } from '@/lib/store';
import { openAuthModal } from '@/lib/store/slices/uiSlice';

interface FloatingCTAProps {
  propertyId?: string;
  propertyTitle?: string;
  agentPhone?: string;
  agentWhatsapp?: string;
  city?: string;
  locality?: string;
  // Property details for rich lead generation
  price?: number | string;
  area?: number | string;
  areaUnit?: string;
  propertyType?: string;
  category?: string;
}

function buildRequirement(params: {
  title?: string; locality?: string; city?: string;
  price?: number | string; area?: number | string; areaUnit?: string;
  category?: string;
}): string {
  const parts: string[] = [];
  if (params.category && params.category !== 'buy') parts.push(`Looking to ${params.category}`);
  else parts.push('Interested in buying');
  if (params.title) parts.push(`"${params.title}"`);
  if (params.locality) parts.push(`in ${params.locality}`);
  else if (params.city) parts.push(`in ${params.city}`);
  if (params.price) {
    const p = Number(params.price);
    if (!isNaN(p) && p > 0) {
      const fmt = p >= 1_00_00_000 ? `₹${(p / 1_00_00_000).toFixed(1)}Cr`
        : p >= 1_00_000 ? `₹${(p / 1_00_000).toFixed(1)}L`
        : `₹${p.toLocaleString('en-IN')}`;
      parts.push(`(${fmt})`);
    }
  }
  return parts.join(' ');
}

export default function FloatingCTA({
  propertyId,
  propertyTitle,
  agentPhone,
  agentWhatsapp,
  city,
  locality,
  price,
  area,
  areaUnit,
  propertyType,
  category,
}: FloatingCTAProps) {
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  // 'gate_call' | 'gate_wa' = login gate for logged-out call/WhatsApp taps
  const [mode, setMode] = useState<'menu' | 'callback' | 'find' | 'gate_call' | 'gate_wa'>('menu');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [visible, setVisible] = useState(false);
  const autoFilled = useRef(false);

  const defaultRequirement = buildRequirement({
    title: propertyTitle, locality, city, price, area, areaUnit, category,
  });

  const [form, setForm] = useState({
    name: '',
    phone: '',
    requirement: defaultRequirement,
  });

  // Show after 5 seconds
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 5000);
    return () => clearTimeout(t);
  }, []);

  // Auto-fill from logged-in user
  useEffect(() => {
    if (user && !autoFilled.current) {
      autoFilled.current = true;
      setForm(f => ({
        ...f,
        name:  (user as any).name  || f.name,
        phone: (user as any).phone || f.phone,
      }));
    }
  }, [user]);

  if (!visible) return null;

  const isLoggedIn = !!user;
  const hasPhone = form.phone.replace(/\D/g, '').length >= 10;
  const isAutoFilled = isLoggedIn && !!(user as any).phone;

  const handleCallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');

    const cleanPhone = form.phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create actual lead in CRM
      await leadsApi.capturePublic({
        source:        'property_page',
        propertyId,
        contactName:   form.name.trim() || `User ${cleanPhone.slice(-4)}`,
        contactPhone:  cleanPhone,
        contactUserId: (user as any)?.id ?? undefined,
        city,
        locality,
        price:         price ? Number(price) : undefined,
        area:          area  ? Number(area)  : undefined,
        areaUnit,
        propertyType:  toLeadPropertyType(propertyType, category),
        message:       form.requirement || defaultRequirement,
        note:          `Callback request via FloatingCTA${propertyTitle ? ` — ${propertyTitle}` : ''}`,
      });

      // 2. Track behavior for smart scoring
      if (propertyId) {
        smartSearchApi.trackBehavior({
          propertyId,
          eventType:    'contact',
          contactName:  form.name.trim(),
          contactPhone: cleanPhone,
        });
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setOpen(false);
        setMode('menu');
      }, 3500);
    } catch {
      setPhoneError('Something went wrong. Please try again or call directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const doCall = () => {
    if (propertyId) smartSearchApi.trackBehavior({ propertyId, eventType: 'contact' });
    if (propertyId && (user as any)?.phone) {
      leadsApi.capturePublic({
        source:        'call',
        propertyId,
        contactName:   (user as any).name  || undefined,
        contactPhone:  (user as any).phone,
        contactUserId: (user as any).id    || undefined,
        city, locality,
        price:         price ? Number(price) : undefined,
        area:          area  ? Number(area)  : undefined,
        areaUnit,
        propertyType:  toLeadPropertyType(propertyType, category),
        note:          `Direct call click${propertyTitle ? ` — ${propertyTitle}` : ''}`,
      }).catch(() => {});
    }
    if (agentPhone) window.location.href = `tel:${agentPhone}`;
  };

  const doWhatsApp = () => {
    if (propertyId) smartSearchApi.trackBehavior({ propertyId, eventType: 'contact' });
    if (propertyId && (user as any)?.phone) {
      leadsApi.capturePublic({
        source:        'whatsapp',
        propertyId,
        contactName:   (user as any).name  || undefined,
        contactPhone:  (user as any).phone,
        contactUserId: (user as any).id    || undefined,
        city, locality,
        price:         price ? Number(price) : undefined,
        area:          area  ? Number(area)  : undefined,
        areaUnit,
        propertyType:  toLeadPropertyType(propertyType, category),
        note:          `WhatsApp click${propertyTitle ? ` — ${propertyTitle}` : ''}`,
      }).catch(() => {});
    }
    const msg = propertyTitle
      ? `Hi, I'm interested in: ${propertyTitle}${city ? ` in ${city}` : ''}`
      : 'Hi, I need help finding a property';
    const num = (agentWhatsapp ?? agentPhone ?? '').replace(/\D/g, '');
    if (num) window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleDirectCall = () => {
    if (!user) { setMode('gate_call'); setOpen(true); return; }
    doCall();
  };

  const handleWhatsApp = () => {
    if (!user) { setMode('gate_wa'); setOpen(true); return; }
    doWhatsApp();
  };

  return (
    <div className="fixed bottom-6 right-4 z-50 flex flex-col items-end gap-2">

      {/* Expanded Panel */}
      {open && (
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-80 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">

          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-sm">
                {mode === 'menu'      && 'How can we help?'}
                {mode === 'callback'  && 'Request Callback'}
                {mode === 'find'      && 'Find My Property'}
                {mode === 'gate_call' && 'Login to Call Agent'}
                {mode === 'gate_wa'   && 'Login to WhatsApp Agent'}
              </p>
              {mode === 'callback' && isAutoFilled && (
                <p className="text-primary-200 text-[11px] flex items-center gap-1 mt-0.5">
                  <CheckCircle className="w-3 h-3" /> Logged in as {(user as any).name || 'you'}
                </p>
              )}
            </div>
            <button
              onClick={() => { setOpen(false); setMode('menu'); setPhoneError(''); }}
              className="text-white/80 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Menu */}
          {mode === 'menu' && (
            <div className="p-3 flex flex-col gap-2">
              {(agentPhone || agentWhatsapp) && (
                <button
                  onClick={handleDirectCall}
                  className="flex items-center gap-3 p-3 rounded-xl bg-green-50 hover:bg-green-100 text-green-700 font-medium text-sm transition-colors w-full text-left"
                >
                  <Phone className="w-5 h-5 flex-shrink-0" />
                  <span>Call Agent Now</span>
                </button>
              )}
              {(agentWhatsapp || agentPhone) && (
                <button
                  onClick={handleWhatsApp}
                  className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-sm transition-colors w-full text-left"
                >
                  <MessageCircle className="w-5 h-5 flex-shrink-0" />
                  <span>WhatsApp Agent</span>
                </button>
              )}
              <button
                onClick={() => { setMode('callback'); setSubmitted(false); setPhoneError(''); }}
                className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 hover:bg-primary-100 text-primary-700 font-medium text-sm transition-colors w-full text-left"
              >
                <Phone className="w-5 h-5 flex-shrink-0" />
                <div className="text-left">
                  <p>Request Callback</p>
                  {isAutoFilled && (
                    <p className="text-[10px] text-primary-500 font-normal">Details pre-filled</p>
                  )}
                </div>
              </button>
              <button
                onClick={() => setMode('find')}
                className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium text-sm transition-colors w-full text-left"
              >
                <Search className="w-5 h-5 flex-shrink-0" />
                <span>Find My Property</span>
              </button>
            </div>
          )}

          {/* Callback Form */}
          {mode === 'callback' && !submitted && (
            <form onSubmit={handleCallbackSubmit} className="p-4 flex flex-col gap-3">

              {/* Auto-fill notice */}
              {isAutoFilled ? (
                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
                  <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  Details filled from your profile
                </div>
              ) : !isLoggedIn && (
                <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                  Enter your details to get a callback
                </div>
              )}

              {/* Name */}
              <div>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className={cn(
                    'w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300',
                    isAutoFilled && form.name ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-white',
                  )}
                />
              </div>

              {/* Phone — always required */}
              <div>
                <input
                  type="tel"
                  placeholder="Mobile Number *"
                  value={form.phone}
                  onChange={(e) => { setForm(f => ({ ...f, phone: e.target.value })); setPhoneError(''); }}
                  required
                  maxLength={15}
                  className={cn(
                    'w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2',
                    phoneError
                      ? 'border-red-300 bg-red-50 focus:ring-red-300'
                      : isAutoFilled && form.phone
                        ? 'border-green-200 bg-green-50/50 focus:ring-primary-300'
                        : 'border-gray-200 bg-white focus:ring-primary-300',
                  )}
                />
                {phoneError && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <span>⚠</span> {phoneError}
                  </p>
                )}
              </div>

              {/* Requirement — auto-built from property data */}
              <textarea
                placeholder="Your Requirement"
                value={form.requirement}
                onChange={(e) => setForm(f => ({ ...f, requirement: e.target.value }))}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none bg-white"
              />

              {/* Property context pills */}
              {(locality || city || price) && (
                <div className="flex flex-wrap gap-1.5">
                  {locality && (
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      📍 {locality}
                    </span>
                  )}
                  {price && (() => {
                    const p = Number(price);
                    if (isNaN(p) || p <= 0) return null;
                    const fmt = p >= 1_00_00_000 ? `₹${(p / 1_00_00_000).toFixed(1)}Cr`
                      : p >= 1_00_000 ? `₹${(p / 1_00_000).toFixed(1)}L`
                      : `₹${p.toLocaleString('en-IN')}`;
                    return <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">💰 {fmt}</span>;
                  })()}
                  {area && (
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      📐 {area} {areaUnit || 'sqft'}
                    </span>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !form.phone}
                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
                ) : (
                  'Request Callback'
                )}
              </button>

              <button
                type="button"
                onClick={() => { setMode('menu'); setPhoneError(''); }}
                className="text-gray-500 text-xs text-center hover:text-gray-700"
              >
                ← Back
              </button>
            </form>
          )}

          {/* Find Property Form */}
          {mode === 'find' && !submitted && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const q = (e.currentTarget.elements.namedItem('query') as HTMLInputElement)?.value;
                if (q) window.location.href = `/properties?keyword=${encodeURIComponent(q)}`;
              }}
              className="p-4 flex flex-col gap-3"
            >
              <input
                name="query"
                type="text"
                defaultValue={city ? `2 BHK in ${city}` : ''}
                placeholder='e.g. "2 BHK in Noida under 50L"'
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Search Properties
              </button>
              <button
                type="button"
                onClick={() => setMode('menu')}
                className="text-gray-500 text-xs text-center hover:text-gray-700"
              >
                ← Back
              </button>
            </form>
          )}

          {/* Login gate — Call */}
          {(mode === 'gate_call' || mode === 'gate_wa') && (
            <div className="p-5 flex flex-col gap-3">
              {/* Intent context */}
              <div className={cn(
                'flex items-center gap-3 rounded-xl p-3',
                mode === 'gate_call' ? 'bg-green-50 border border-green-100' : 'bg-emerald-50 border border-emerald-100',
              )}>
                {mode === 'gate_call'
                  ? <Phone className="w-5 h-5 text-green-600 flex-shrink-0" />
                  : <MessageCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                }
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    {mode === 'gate_call' ? 'Call Agent' : 'WhatsApp Agent'}
                  </p>
                  {propertyTitle && (
                    <p className="text-[11px] text-gray-500 truncate">{propertyTitle}</p>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center leading-relaxed">
                Login to reveal agent contact details and get your enquiry tracked so our team can follow up with you.
              </p>

              {/* Login CTA */}
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setMode('menu');
                  dispatch(openAuthModal({ mode: 'login' }));
                }}
                className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl text-sm transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Login / Sign Up — Free
              </button>

              <p className="text-[10px] text-gray-400 text-center">
                Quick login · Details auto-filled · Free forever
              </p>

              <button
                type="button"
                onClick={() => setMode('menu')}
                className="text-gray-400 text-xs text-center hover:text-gray-600"
              >
                ← Back
              </button>
            </div>
          )}

          {/* Success state */}
          {submitted && (
            <div className="p-6 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <p className="font-bold text-gray-800">Callback Requested!</p>
              <p className="text-sm text-gray-500 mt-1">Our agent will call you on <span className="font-semibold text-gray-700">{form.phone}</span> shortly.</p>
            </div>
          )}
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => { setOpen(o => !o); setMode('menu'); setPhoneError(''); }}
        className={cn(
          'w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300',
          'bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800',
          'text-white focus:outline-none focus:ring-4 focus:ring-primary-300',
          open ? 'rotate-180' : 'hover:scale-105',
        )}
        aria-label="Get help"
      >
        {open ? <ChevronUp className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
      </button>
    </div>
  );
}
