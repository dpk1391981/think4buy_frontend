'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, X, Loader2, CheckCircle, Phone } from 'lucide-react';
import { serviceLeadsApi, servicesApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// ── Service metadata (local fallback; hydrated from API when available) ─────────
const SERVICES_META: Record<string, {
  emoji: string; description: string; features: string[];
  cta: string; color: string; textColor: string;
  interestOptions: string[];
}> = {
  'home-loan': {
    emoji: '🏦',
    description: 'Compare and apply for home loans from 50+ banks and NBFCs. Get the lowest interest rates and fastest approvals.',
    features: ['Rate comparison', 'Online application', '24-hr approval', 'Tax benefits'],
    cta: 'Check Eligibility',
    color: 'border-blue-200 hover:border-blue-400',
    textColor: 'text-blue-600',
    interestOptions: ['Under ₹25L', '₹25L – ₹50L', '₹50L – ₹1Cr', '₹1Cr – ₹2Cr', 'Above ₹2Cr'],
  },
  'legal-services': {
    emoji: '⚖️',
    description: 'Complete property legal assistance — title verification, documentation, registration and legal consultation.',
    features: ['Title verification', 'Sale deed', 'Property registration', 'Legal consultation'],
    cta: 'Get Legal Help',
    color: 'border-purple-200 hover:border-purple-400',
    textColor: 'text-purple-600',
    interestOptions: ['Title Verification', 'Sale Deed', 'Property Registration', 'Legal Consultation', 'NRI Services'],
  },
  'interior-design': {
    emoji: '🎨',
    description: 'Transform your new home with expert interior designers. 2D/3D designs, modular kitchens, custom furniture.',
    features: ['Free consultation', '3D visualization', 'Modular furniture', 'Budget-friendly'],
    cta: 'Get Free Quote',
    color: 'border-pink-200 hover:border-pink-400',
    textColor: 'text-pink-600',
    interestOptions: ['1 BHK', '2 BHK', '3 BHK', '4+ BHK', 'Office / Commercial'],
  },
  'packers-movers': {
    emoji: '🚚',
    description: 'Reliable and affordable moving services across India. Door-to-door packing, loading, transport and unloading.',
    features: ['Verified movers', 'Insurance cover', 'Real-time tracking', 'Guaranteed delivery'],
    cta: 'Get Moving Quote',
    color: 'border-orange-200 hover:border-orange-400',
    textColor: 'text-orange-600',
    interestOptions: ['Local move (same city)', 'Intercity move', 'Office / Commercial', 'Vehicle transport', 'Storage services'],
  },
  'rental-agreement': {
    emoji: '📄',
    description: 'Create legally valid rental agreements online in minutes. E-stamping, notarization, and home delivery available.',
    features: ['Online creation', 'E-stamp paper', 'Legal validity', 'Home delivery'],
    cta: 'Create Agreement',
    color: 'border-teal-200 hover:border-teal-400',
    textColor: 'text-teal-600',
    interestOptions: ['11-month agreement', 'Long-term lease (11+ months)', 'Commercial lease', 'Leave & License'],
  },
  'property-insurance': {
    emoji: '🛡️',
    description: 'Protect your property investment with comprehensive insurance. Coverage against natural disasters, theft, and more.',
    features: ['Comprehensive cover', 'Quick claims', 'Digital policy', 'Affordable premiums'],
    cta: 'Get Insured',
    color: 'border-green-200 hover:border-green-400',
    textColor: 'text-green-600',
    interestOptions: ['Home structure', 'Home contents', 'Builder risk', 'Rental income protection'],
  },
};

interface ApiService { id: string; name: string; slug: string; description?: string; icon?: string; }

// ── Lead modal ────────────────────────────────────────────────────────────────

function LeadModal({
  service,
  onClose,
}: {
  service: ApiService & { meta: typeof SERVICES_META[string] };
  onClose: () => void;
}) {
  const { user } = useAuth();
  const overlayRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({ name: '', phone: '', email: '', location: '', interest: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill from auth
  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name:  f.name  || (user as any).name  || '',
        phone: f.phone || (user as any).phone || '',
        email: f.email || (user as any).email || '',
      }));
    }
  }, [user]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const phone = form.phone.replace(/\D/g, '').slice(-10);
    if (!form.name.trim())        { setError('Please enter your name.'); return; }
    if (!/^[6-9]\d{9}$/.test(phone)) { setError('Enter a valid 10-digit mobile number.'); return; }
    setSubmitting(true);
    try {
      await serviceLeadsApi.create({
        serviceId: service.id,
        name:     form.name.trim(),
        phone,
        email:    form.email.trim() || undefined,
        location: form.location.trim() || undefined,
        interest: form.interest || undefined,
        message:  form.message.trim() || undefined,
        source:   typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'web',
      });
      setSubmitted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const { meta } = service;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{meta.emoji}</span>
            <div>
              <p className="font-bold text-gray-900 text-base leading-tight">{service.name}</p>
              <p className="text-xs text-gray-500">Get a free callback from our expert</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {submitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-9 h-9 text-green-600" />
              </div>
              <p className="font-bold text-gray-900 text-lg mb-1">Request Sent!</p>
              <p className="text-sm text-gray-500 mb-5">
                Our team will contact you shortly for <strong>{service.name}</strong>.
              </p>
              <button
                onClick={onClose}
                className="px-8 py-3 bg-primary-600 text-white rounded-2xl text-sm font-bold hover:bg-primary-700 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <input
                type="text" value={form.name} onChange={set('name')}
                placeholder="Your Name *" required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 transition-colors"
              />
              <div className="flex gap-2">
                <span className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm flex-shrink-0 gap-1">
                  <Phone className="w-3.5 h-3.5" /> +91
                </span>
                <input
                  type="tel" value={form.phone} onChange={set('phone')}
                  placeholder="Mobile Number *" required maxLength={10}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 transition-colors"
                />
              </div>
              <input
                type="email" value={form.email} onChange={set('email')}
                placeholder="Email (optional)"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 transition-colors"
              />
              <input
                type="text" value={form.location} onChange={set('location')}
                placeholder="Your City / Location"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 transition-colors"
              />
              {meta.interestOptions.length > 0 && (
                <select
                  value={form.interest} onChange={set('interest')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 bg-white transition-colors"
                >
                  <option value="">Select your requirement…</option>
                  {meta.interestOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}
              <textarea
                value={form.message} onChange={set('message')}
                placeholder="Any specific requirements? (optional)" rows={2}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 transition-colors resize-none"
              />
              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
              )}
              <button
                type="submit" disabled={submitting}
                className="w-full py-3.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {submitting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                  : <>Get Free Callback <ArrowRight className="w-4 h-4" /></>}
              </button>
              <p className="text-center text-[11px] text-gray-400">
                🔒 Your contact info is never shared with third parties.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main grid ─────────────────────────────────────────────────────────────────

export default function ServicesGrid() {
  const [services, setServices] = useState<ApiService[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeService, setActiveService] = useState<(ApiService & { meta: typeof SERVICES_META[string] }) | null>(null);

  useEffect(() => {
    servicesApi.getAll()
      .then(r => {
        const list: ApiService[] = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
        setServices(list.length ? list : FALLBACK_SERVICES);
      })
      .catch(() => setServices(FALLBACK_SERVICES))
      .finally(() => setLoading(false));
  }, []);

  const openModal = (svc: ApiService) => {
    const meta = SERVICES_META[svc.slug] ?? {
      emoji: '🏠', description: svc.description || '', features: [],
      cta: 'Get Quote', color: 'border-gray-200 hover:border-gray-400',
      textColor: 'text-primary-600', interestOptions: [],
    };
    setActiveService({ ...svc, meta });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4" />
            <div className="h-5 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-3 bg-gray-100 rounded w-3/4 mb-1" />
            <div className="h-3 bg-gray-100 rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((svc) => {
          const meta = SERVICES_META[svc.slug] ?? {
            emoji: '🏠', description: svc.description || '',
            features: [], cta: 'Get Quote',
            color: 'border-gray-200 hover:border-gray-400',
            textColor: 'text-primary-600', interestOptions: [],
          };
          return (
            <div
              key={svc.slug}
              className={`bg-white rounded-2xl border-2 p-6 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${meta.color}`}
            >
              <div className="text-4xl mb-4">{meta.emoji}</div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{svc.name}</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-4">{meta.description}</p>

              {meta.features.length > 0 && (
                <ul className="space-y-1.5 mb-5">
                  {meta.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${meta.textColor.replace('text-', 'bg-')}`} />
                      {f}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center gap-3 mt-auto">
                {/* Primary CTA — opens modal */}
                <button
                  onClick={() => openModal(svc)}
                  className={`flex items-center gap-2 font-semibold text-sm px-4 py-2.5 rounded-xl border-2 ${meta.textColor} border-current hover:bg-current/10 transition-colors`}
                >
                  Get Quote <ArrowRight className="w-4 h-4" />
                </button>

                {/* Secondary — detail page */}
                <Link
                  href={`/services/${svc.slug}`}
                  className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors"
                >
                  Learn more
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {activeService && (
        <LeadModal service={activeService} onClose={() => setActiveService(null)} />
      )}
    </>
  );
}

// Fallback if API is unavailable
const FALLBACK_SERVICES: ApiService[] = [
  { id: 'home-loan',      name: 'Home Loan',         slug: 'home-loan'      },
  { id: 'legal-services', name: 'Legal Services',    slug: 'legal-services' },
  { id: 'interior-design',name: 'Interior Design',   slug: 'interior-design'},
  { id: 'packers-movers', name: 'Packers & Movers',  slug: 'packers-movers' },
  { id: 'rental-agreement',name:'Rental Agreement',  slug: 'rental-agreement'},
  { id: 'property-insurance',name:'Property Insurance',slug:'property-insurance'},
];
