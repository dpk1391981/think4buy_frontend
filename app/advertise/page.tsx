'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Home, ChevronRight, TrendingUp, Target, Users, Star,
  CheckCircle, Send, AlertCircle, BarChart2, Building2, Zap,
} from 'lucide-react';

const API_BASE = '/api/q';

const AD_PACKAGES = [
  {
    name: 'Starter',
    price: '₹4,999',
    period: '/month',
    highlight: false,
    features: [
      '1 Featured Listing',
      'Basic Lead Access (20/month)',
      'Standard profile badge',
      'Search result boost',
      'Email support',
    ],
  },
  {
    name: 'Growth',
    price: '₹12,999',
    period: '/month',
    highlight: true,
    badge: 'Most Popular',
    features: [
      '5 Featured Listings',
      'Priority Lead Access (100/month)',
      'Silver agent badge',
      'Top-3 search placement',
      'Homepage banner (city)',
      'WhatsApp lead notifications',
      'Dedicated account manager',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    highlight: false,
    features: [
      'Unlimited Featured Listings',
      'Unlimited Lead Access',
      'Gold agent badge',
      '#1 sponsored placement',
      'Homepage hero banner (national)',
      'Co-branded email campaigns',
      'Priority onboarding support',
      'Custom analytics dashboard',
    ],
  },
];

const WHY_ADVERTISE = [
  { icon: <Users className="w-5 h-5" />,      title: '5L+ Monthly Visitors',   desc: 'Reach active property seekers across India every month.' },
  { icon: <Target className="w-5 h-5" />,     title: 'Intent-First Audience',  desc: 'Every visitor is actively searching to buy, rent, or invest.' },
  { icon: <BarChart2 className="w-5 h-5" />,  title: 'Measurable ROI',         desc: 'Track impressions, clicks, leads, and conversions in real time.' },
  { icon: <TrendingUp className="w-5 h-5" />, title: 'City-Level Targeting',   desc: 'Target specific cities, localities, and property categories.' },
  { icon: <Star className="w-5 h-5" />,       title: 'Premium Placement',      desc: 'Featured slots, sponsored listings, and homepage banners.' },
  { icon: <Zap className="w-5 h-5" />,        title: 'Fast Go-Live',           desc: 'Campaign live within 24 hours of confirmation and payment.' },
];

export default function AdvertisePage() {
  const [form, setForm]     = useState({ name: '', company: '', email: '', phone: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())    e.name    = 'Name is required';
    if (!form.email.trim())   e.email   = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.phone.trim())   e.phone   = 'Phone is required';
    else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid 10-digit mobile number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setStatus('submitting');
    try {
      const res = await fetch(`${API_BASE}/leads/public`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName:  form.name,
          contactEmail: form.email,
          contactPhone: form.phone,
          source:       'contact_form',
          notes:        `[ADVERTISE ENQUIRY] Company: ${form.company || 'N/A'} | ${form.message || 'Interested in advertising'}`,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      setForm({ name: '', company: '', email: '', phone: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  const inputCls = (key: string) =>
    `w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-colors ${
      errors[key] ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-300 focus:border-primary-400'
    }`;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Advertise With Think4BuySale',
            url: 'https://think4buysale.com/advertise',
            description: 'Reach active property buyers and investors across India. Advertising packages for real estate agents, builders, and brands.',
          }),
        }}
      />

      <main className="min-h-screen bg-white pt-16">

        {/* Hero */}
        <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-primary-900 text-white py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-gray-400 mb-5">
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />Home
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white">Advertise With Us</span>
            </nav>
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-400 text-amber-900 px-3 py-1 rounded-full mb-4">
                <Building2 className="w-3 h-3" /> For Builders, Agents & Brands
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 leading-tight">
                Reach India&apos;s Most Active<br />Property Seekers
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed mb-6">
                Advertise on Think4BuySale to connect with buyers, investors, and tenants who are ready to transact. Targeted, measurable, and effective.
              </p>
              <a
                href="#contact-form"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-400 text-white rounded-xl font-bold text-sm transition-colors"
              >
                Get a Free Media Kit <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Why advertise */}
        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Why Advertise on Think4BuySale?</h2>
              <p className="text-gray-500 max-w-xl mx-auto">We give your brand direct access to India&apos;s most intent-rich property audience.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {WHY_ADVERTISE.map(w => (
                <div key={w.title} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex gap-4">
                  <div className="w-10 h-10 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    {w.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-1">{w.title}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{w.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Packages */}
        <section className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Advertising Packages</h2>
              <p className="text-gray-500 max-w-xl mx-auto">Flexible plans for individual agents, real estate agencies, and large builders.</p>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {AD_PACKAGES.map(pkg => (
                <div
                  key={pkg.name}
                  className={`relative rounded-2xl border p-6 flex flex-col ${
                    pkg.highlight
                      ? 'border-primary-400 bg-primary-50 shadow-lg'
                      : 'border-gray-100 bg-white shadow-sm'
                  }`}
                >
                  {pkg.badge && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold bg-primary-600 text-white px-3 py-1 rounded-full whitespace-nowrap">
                      {pkg.badge}
                    </span>
                  )}
                  <div className="mb-5">
                    <h3 className="text-lg font-bold text-gray-900">{pkg.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-extrabold text-gray-900">{pkg.price}</span>
                      {pkg.period && <span className="text-sm text-gray-500">{pkg.period}</span>}
                    </div>
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {pkg.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#contact-form"
                    className={`block text-center py-2.5 rounded-xl text-sm font-bold transition-colors ${
                      pkg.highlight
                        ? 'bg-primary-600 text-white hover:bg-primary-700'
                        : 'border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pkg.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                  </a>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-gray-400 mt-6">All prices exclude GST. Annual billing available at 20% discount.</p>
          </div>
        </section>

        {/* Enquiry Form */}
        <section id="contact-form" className="py-16 px-4 bg-gray-50">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Your Free Media Kit</h2>
              <p className="text-gray-500 text-sm">Fill the form and our partnerships team will reach out within one business day.</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
              {status === 'success' ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Enquiry Received!</h3>
                  <p className="text-gray-500 text-sm mb-6">Our team will reach out to you within one business day with a customised media kit.</p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Submit Another Enquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
                      <input type="text" value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="Your name" className={inputCls('name')} />
                      {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Company / Agency</label>
                      <input type="text" value={form.company}
                        onChange={e => setForm(p => ({ ...p, company: e.target.value }))}
                        placeholder="Your company" className={inputCls('company')} />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                      <input type="email" value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="you@company.com" className={inputCls('email')} />
                      {errors.email && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone <span className="text-red-500">*</span></label>
                      <input type="tel" value={form.phone}
                        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                        placeholder="98765 43210" className={inputCls('phone')} />
                      {errors.phone && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tell Us About Your Goal (optional)</label>
                    <textarea
                      value={form.message}
                      onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                      rows={4}
                      placeholder="e.g., I want to promote 3 projects in Pune and Nashik targeting first-time buyers..."
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 resize-none transition-colors"
                    />
                  </div>

                  {status === 'error' && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      Something went wrong. Please try again or email us at support@think4buysale.com
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm"
                  >
                    {status === 'submitting' ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending…
                      </span>
                    ) : (
                      <><Send className="w-4 h-4" /> Request Media Kit</>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
