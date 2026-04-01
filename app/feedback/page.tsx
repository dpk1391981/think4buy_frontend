'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, ChevronRight, Star, Send, CheckCircle, AlertCircle } from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
  ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1`
  : 'http://localhost:3001/api/v1';

const CATEGORIES = [
  'Property Search Experience',
  'Agent Quality',
  'Website / App Usability',
  'Listing Accuracy',
  'Customer Support',
  'Overall Experience',
];

export default function FeedbackPage() {
  const [form, setForm] = useState({
    name: '', email: '', category: '', rating: 0, message: '',
  });
  const [hoverRating, setHoverRating] = useState(0);
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [status, setStatus]           = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())    e.name    = 'Name is required';
    if (!form.message.trim()) e.message = 'Feedback message is required';
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
          source:       'seo_form',
          notes:        `[FEEDBACK] Category: ${form.category || 'General'} | Rating: ${form.rating}/5 | ${form.message}`,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      setForm({ name: '', email: '', category: '', rating: 0, message: '' });
    } catch {
      setStatus('error');
    }
  };

  const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Feedback | Think4BuySale',
            url: 'https://think4buysale.com/feedback',
            description: 'Share your feedback and help us improve the Think4BuySale real estate platform.',
          }),
        }}
      />

      <main className="min-h-screen bg-gray-50 pt-16 pb-20">
        {/* Hero */}
        <section className="bg-gradient-to-br from-emerald-700 to-emerald-500 text-white py-14 px-4">
          <div className="max-w-3xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-emerald-200 mb-4">
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-1"><Home className="w-3.5 h-3.5" />Home</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white">Feedback</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Share Your Feedback</h1>
            <p className="text-emerald-100 text-lg max-w-xl">
              Your experience matters to us. Help us improve by sharing what you loved — and what we can do better.
            </p>
          </div>
        </section>

        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">

            {status === 'success' ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h2>
                <p className="text-gray-500 text-sm mb-6">Your feedback has been received. It means a lot to our team.</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors"
                >
                  Submit More Feedback
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Tell Us About Your Experience</h2>
                  <p className="text-gray-500 text-sm">All fields except rating and category are optional, but the more detail you share, the better we can improve.</p>
                </div>

                {/* Star Rating */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Overall Rating (optional)</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm(p => ({ ...p, rating: s }))}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform active:scale-90"
                        aria-label={`Rate ${s} stars`}
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            s <= (hoverRating || form.rating)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-gray-200 fill-gray-200'
                          }`}
                        />
                      </button>
                    ))}
                    {(hoverRating || form.rating) > 0 && (
                      <span className="ml-2 text-sm font-semibold text-amber-600">
                        {STAR_LABELS[hoverRating || form.rating]}
                      </span>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category (optional)</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 bg-white"
                  >
                    <option value="">Select a category…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Full name"
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-colors ${
                      errors.name ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-emerald-300 focus:border-emerald-400'
                    }`}
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email (optional)</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 transition-colors"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Feedback <span className="text-red-500">*</span></label>
                  <textarea
                    value={form.message}
                    onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    rows={5}
                    placeholder="What did you love? What can we improve? Any specific feature request?"
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none transition-colors ${
                      errors.message ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-emerald-300 focus:border-emerald-400'
                    }`}
                  />
                  {errors.message && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.message}</p>}
                </div>

                {status === 'error' && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    Something went wrong. Please try again.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm"
                >
                  {status === 'submitting' ? (
                    <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting…</span>
                  ) : (
                    <><Send className="w-4 h-4" /> Submit Feedback</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
