'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, ChevronRight, AlertTriangle, Send, CheckCircle, AlertCircle } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`
  : 'http://localhost:3001/api/v1';

const CATEGORIES = [
  'Agent Misconduct',
  'Fraudulent Listing',
  'Payment Dispute',
  'Website / App Issue',
  'Data Privacy Concern',
  'Harassment / Spam',
  'Other',
];

export default function ComplaintsPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', category: '', description: '',
  });
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [status, setStatus]   = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())                                              e.name        = 'Name is required';
    if (!form.phone.trim())                                             e.phone       = 'Phone is required';
    else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, '')))     e.phone       = 'Enter a valid 10-digit mobile number';
    if (form.email && !/\S+@\S+\.\S+/.test(form.email))               e.email       = 'Enter a valid email';
    if (!form.description.trim())                                       e.description = 'Please describe the issue';
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
          contactEmail: form.email || undefined,
          contactPhone: form.phone,
          source:       'contact_form',
          notes:        `[COMPLAINT] Category: ${form.category || 'General'} | ${form.description}`,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      setForm({ name: '', email: '', phone: '', category: '', description: '' });
    } catch {
      setStatus('error');
    }
  };

  const field = (
    key: keyof typeof form,
    label: string,
    type = 'text',
    placeholder = '',
    required = false,
  ) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-colors ${
          errors[key] ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-red-300 focus:border-red-400'
        }`}
      />
      {errors[key] && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />{errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'File a Complaint | Think4BuySale',
            url: 'https://think4buysale.com/complaints',
            description: 'Submit a complaint about a listing, agent, or platform issue on Think4BuySale. We take every report seriously.',
          }),
        }}
      />

      <main className="min-h-screen bg-gray-50 pt-16 pb-20">
        {/* Hero */}
        <section className="bg-gradient-to-br from-red-700 to-red-500 text-white py-14 px-4">
          <div className="max-w-3xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-red-200 mb-4">
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />Home
              </Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white">Complaints</span>
            </nav>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold">File a Complaint</h1>
            </div>
            <p className="text-red-100 text-lg max-w-xl">
              Report fraudulent listings, agent misconduct, or any platform issue. We investigate every complaint within 48 hours.
            </p>
          </div>
        </section>

        <div className="max-w-2xl mx-auto px-4 py-12">

          {/* Trust bar */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { icon: '🔒', text: 'Confidential' },
              { icon: '⏱', text: 'Response in 48h' },
              { icon: '✅', text: 'Every report reviewed' },
            ].map(b => (
              <div key={b.text} className="bg-white rounded-xl border border-gray-100 shadow-sm px-3 py-3 flex items-center gap-2 text-center justify-center">
                <span className="text-lg">{b.icon}</span>
                <span className="text-xs font-semibold text-gray-700">{b.text}</span>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            {status === 'success' ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Complaint Submitted</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Thank you for reporting this. Our team will review and respond within 48 business hours.
                </p>
                <button
                  onClick={() => setStatus('idle')}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                  Submit Another Complaint
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Tell Us What Happened</h2>
                  <p className="text-gray-500 text-sm">All complaints are treated with strict confidentiality.</p>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Complaint Category (optional)</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 bg-white"
                  >
                    <option value="">Select a category…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  {field('name',  'Full Name',    'text', 'Your full name',   true)}
                  {field('phone', 'Phone Number', 'tel',  '+91 98765 43210', true)}
                </div>
                {field('email', 'Email (optional)', 'email', 'you@example.com')}

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Describe the Issue <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={5}
                    placeholder="Provide as much detail as possible — what happened, when it happened, who was involved, any reference IDs..."
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none transition-colors ${
                      errors.description ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-red-300 focus:border-red-400'
                    }`}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />{errors.description}
                    </p>
                  )}
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
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm"
                >
                  {status === 'submitting' ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting…
                    </span>
                  ) : (
                    <><Send className="w-4 h-4" /> Submit Complaint</>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Note */}
          <p className="text-xs text-gray-400 text-center mt-6">
            For urgent matters, email us directly at{' '}
            <a href="mailto:support@think4buysale.com" className="text-red-600 hover:underline">
              support@think4buysale.com
            </a>
          </p>
        </div>
      </main>
    </>
  );
}
