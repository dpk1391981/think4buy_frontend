'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Sparkles, CheckCircle } from 'lucide-react';
import { smartSearchApi, leadsApi } from '@/lib/api';
import { toLeadPropertyType } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface IntentPopupProps {
  propertyId?: string;
  propertyTitle?: string;
  agentPhone?: string;
  city?: string;
  locality?: string;
  price?: number | string;
  area?: number | string;
  areaUnit?: string;
  propertyType?: string;
  category?: string;
  /** Seconds of stay before triggering (default 30) */
  stayTrigger?: number;
  /** Scroll depth % to trigger (default 70) */
  scrollTrigger?: number;
}

export default function IntentPopup({
  propertyId,
  propertyTitle,
  agentPhone,
  city,
  locality,
  price,
  area,
  areaUnit,
  propertyType,
  category,
  stayTrigger = 30,
  scrollTrigger = 70,
}: IntentPopupProps) {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const triggered = useRef(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Auto-fill from logged-in user
  useEffect(() => {
    if (user) {
      setName((user as any).name  || '');
      setPhone((user as any).phone || '');
    }
  }, [user]);

  const trigger = () => {
    if (triggered.current) return;
    triggered.current = true;
    setShow(true);
  };

  useEffect(() => {
    const t = setTimeout(trigger, stayTrigger * 1000);
    return () => clearTimeout(t);
  }, [stayTrigger]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onScroll = () => {
      const pct = ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100;
      if (pct >= scrollTrigger) trigger();
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [scrollTrigger]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');

    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setPhoneError('Enter a valid 10-digit mobile number');
      return;
    }

    setSubmitting(true);
    try {
      // Create actual lead in CRM
      await leadsApi.capturePublic({
        source:        'property_page',
        propertyId,
        contactName:   name.trim() || `User ${cleanPhone.slice(-4)}`,
        contactPhone:  cleanPhone,
        contactUserId: (user as any)?.id ?? undefined,
        city,
        locality,
        price:         price ? Number(price) : undefined,
        area:          area  ? Number(area)  : undefined,
        areaUnit,
        propertyType:  toLeadPropertyType(propertyType, category),
        note:          `Intent popup lead${propertyTitle ? ` — ${propertyTitle}` : ''}`,
      });

      // Track behavior for scoring
      if (propertyId) {
        smartSearchApi.trackBehavior({
          propertyId,
          eventType:    'inquiry',
          contactName:  name.trim(),
          contactPhone: cleanPhone,
        });
      }

      setDone(true);
      setTimeout(() => {
        setShow(false);
        setDismissed(true);
      }, 3000);
    } catch {
      setPhoneError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectCall = () => {
    if (propertyId) smartSearchApi.trackBehavior({ propertyId, eventType: 'contact' });
    if (propertyId && (user as any)?.phone) {
      leadsApi.capturePublic({
        source: 'call', propertyId,
        contactName:   (user as any).name  || undefined,
        contactPhone:  (user as any).phone,
        contactUserId: (user as any).id    || undefined,
        city, locality,
      }).catch(() => {});
    }
    if (agentPhone) window.location.href = `tel:${agentPhone}`;
    setShow(false);
    setDismissed(true);
  };

  if (!show || dismissed) return null;

  const isAutoFilled = !!(user && (user as any).phone);

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-8 duration-300">

        {/* Header */}
        <div className="relative bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-700 px-6 py-5">
          <button
            onClick={() => { setShow(false); setDismissed(true); }}
            className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-start gap-3">
            <div className="bg-white/20 rounded-full p-2 flex-shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-tight">
                Interested in this property?
              </h3>
              <p className="text-white/80 text-sm mt-1">
                {isAutoFilled
                  ? `Hi ${(user as any).name?.split(' ')[0] || 'there'}! Get the best deal today.`
                  : 'Talk to our expert and get the best deal today!'}
              </p>
            </div>
          </div>
        </div>

        {!done ? (
          <div className="px-6 py-5">
            {propertyTitle && (
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-4 bg-gray-50 rounded-xl px-3 py-2">
                <span className="truncate">
                  <span className="text-gray-400">Property: </span>
                  <span className="font-medium text-gray-700">{propertyTitle}</span>
                </span>
              </div>
            )}

            {isAutoFilled && (
              <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2.5 mb-3">
                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                Details pre-filled from your profile
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 ${
                  isAutoFilled && name ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-gray-50'
                }`}
              />

              <div>
                <input
                  type="tel"
                  placeholder="Mobile Number *"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setPhoneError(''); }}
                  required
                  maxLength={15}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 ${
                    phoneError
                      ? 'border-red-300 bg-red-50 focus:ring-red-300'
                      : isAutoFilled && phone
                        ? 'border-green-200 bg-green-50/50 focus:ring-primary-300'
                        : 'border-gray-200 bg-gray-50 focus:ring-primary-300'
                  }`}
                />
                {phoneError && (
                  <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                    <span>⚠</span> {phoneError}
                  </p>
                )}
              </div>

              {/* Property context pills */}
              {(locality || city || price) && (
                <div className="flex flex-wrap gap-1.5">
                  {(locality || city) && (
                    <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      📍 {locality || city}
                    </span>
                  )}
                  {price && (() => {
                    const p = Number(price);
                    if (isNaN(p) || p <= 0) return null;
                    const fmt = p >= 1_00_00_000 ? `₹${(p / 1_00_00_000).toFixed(1)}Cr`
                      : p >= 1_00_000 ? `₹${(p / 1_00_000).toFixed(1)}L`
                      : `₹${p.toLocaleString('en-IN')}`;
                    return <span className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full">💰 {fmt}</span>;
                  })()}
                  {area && (
                    <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                      📐 {area} {areaUnit || 'sqft'}
                    </span>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || !phone}
                className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl text-sm transition-colors mt-1 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting…</>
                ) : (
                  'Get Best Deal from Agent →'
                )}
              </button>
            </form>

            {agentPhone && (
              <>
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs text-gray-400">or</span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <button
                  onClick={handleDirectCall}
                  className="w-full border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium py-2.5 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                >
                  📞 Call Now
                </button>
              </>
            )}

            <p className="text-[11px] text-gray-400 text-center mt-3">
              By clicking, you agree to be contacted by our agent.
            </p>
          </div>
        ) : (
          <div className="px-6 py-8 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="font-bold text-gray-800 text-lg">You're all set!</p>
            <p className="text-gray-500 text-sm mt-1">
              Our agent will reach out to <span className="font-semibold text-gray-700">{phone}</span> shortly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
