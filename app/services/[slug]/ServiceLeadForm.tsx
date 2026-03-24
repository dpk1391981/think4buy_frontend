'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, Loader2, Phone } from 'lucide-react';
import { serviceLeadsApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  serviceId: string;
  serviceName: string;
  interestOptions?: string[];
}

export default function ServiceLeadForm({ serviceId, serviceName, interestOptions = [] }: Props) {
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    interest: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill from logged-in user
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

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const phone = form.phone.replace(/\D/g, '').slice(-10);
    if (!form.name.trim()) { setError('Please enter your name.'); return; }
    if (!/^[6-9]\d{9}$/.test(phone))  { setError('Enter a valid 10-digit mobile number.'); return; }

    setSubmitting(true);
    try {
      await serviceLeadsApi.create({
        serviceId,
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

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-9 h-9 text-green-600" />
        </div>
        <p className="font-bold text-gray-900 text-lg mb-1">Request Submitted!</p>
        <p className="text-sm text-gray-500">
          Our team will contact you shortly for <strong>{serviceName}</strong>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      {/* Name */}
      <input
        type="text"
        value={form.name}
        onChange={set('name')}
        placeholder="Your Name *"
        required
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
      />

      {/* Phone */}
      <div className="flex gap-2">
        <span className="flex items-center px-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 text-sm flex-shrink-0 gap-1">
          <Phone className="w-3.5 h-3.5" /> +91
        </span>
        <input
          type="tel"
          value={form.phone}
          onChange={set('phone')}
          placeholder="Mobile Number *"
          required
          maxLength={10}
          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
        />
      </div>

      {/* Email */}
      <input
        type="email"
        value={form.email}
        onChange={set('email')}
        placeholder="Email (optional)"
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
      />

      {/* Location */}
      <input
        type="text"
        value={form.location}
        onChange={set('location')}
        placeholder="Your City / Location"
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors"
      />

      {/* Interest dropdown (dynamic per service) */}
      {interestOptions.length > 0 && (
        <select
          value={form.interest}
          onChange={set('interest')}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 bg-white transition-colors"
        >
          <option value="">Select your interest…</option>
          {interestOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {/* Message */}
      <textarea
        value={form.message}
        onChange={set('message')}
        placeholder="Any specific requirements? (optional)"
        rows={3}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-400 focus:border-primary-400 transition-colors resize-none"
      />

      {/* Error */}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 active:bg-primary-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {submitting ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
        ) : (
          <>Request Free Callback <ArrowRight className="w-4 h-4" /></>
        )}
      </button>

      <p className="text-center text-[11px] text-gray-400">
        🔒 Your data is safe. We never share your contact info.
      </p>
    </form>
  );
}
