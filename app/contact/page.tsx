'use client';

import { useState } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, AlertCircle, Home, ChevronRight } from 'lucide-react';

const API_BASE = '/api/q';

const CONTACT_DETAILS = [
  {
    icon: <MapPin className="w-5 h-5 text-primary-600" />,
    title: 'Our Office',
    lines: ['Think4BuySale Pvt. Ltd.', 'New Delhi, India — 110001'],
  },
  {
    icon: <Phone className="w-5 h-5 text-primary-600" />,
    title: 'Phone',
    lines: ['+91 98765 43210', 'Mon – Sat, 9am – 6pm'],
  },
  {
    icon: <Mail className="w-5 h-5 text-primary-600" />,
    title: 'Email',
    lines: ['support@think4buysale.com', 'Response within 24 hours'],
  },
  {
    icon: <Clock className="w-5 h-5 text-primary-600" />,
    title: 'Business Hours',
    lines: ['Mon – Sat: 9:00 AM – 6:00 PM', 'Sunday: Closed'],
  },
];

export default function ContactPage() {
  const [form, setForm]     = useState({ name: '', email: '', phone: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())              e.name    = 'Name is required';
    if (!form.email.trim())             e.email   = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.phone.trim())             e.phone   = 'Phone is required';
    else if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Enter a valid 10-digit Indian mobile number';
    if (!form.message.trim())           e.message = 'Message is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          notes:        form.message,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setStatus('success');
      setForm({ name: '', email: '', phone: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  const field = (
    key: keyof typeof form,
    label: string,
    type = 'text',
    placeholder = '',
    isTextarea = false,
  ) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label} <span className="text-red-500">*</span>
      </label>
      {isTextarea ? (
        <textarea
          value={form[key]}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          rows={5}
          placeholder={placeholder}
          className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none transition-colors ${
            errors[key] ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-300 focus:border-primary-400'
          }`}
        />
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          placeholder={placeholder}
          className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-colors ${
            errors[key] ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-primary-300 focus:border-primary-400'
          }`}
        />
      )}
      {errors[key] && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />{errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <>
      {/* SEO Metadata injected via layout — structured data inline */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: 'Contact Think4BuySale',
            url: 'https://think4buysale.com/contact',
            description: 'Get in touch with the Think4BuySale team for property inquiries, agent support, or general assistance.',
          }),
        }}
      />

      <main className="min-h-screen bg-gray-50 pt-16 pb-20">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary-700 to-primary-900 text-white py-14 px-4">
          <div className="max-w-4xl mx-auto">
            <nav className="flex items-center gap-2 text-xs text-primary-300 mb-4">
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-1"><Home className="w-3.5 h-3.5" />Home</Link>
              <ChevronRight className="w-3 h-3" />
              <span className="text-white">Contact Us</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Get in Touch</h1>
            <p className="text-primary-200 text-lg max-w-xl">
              Have a question about buying, selling, or renting property? Our team is ready to help you.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-5 gap-10">

            {/* Contact details — left column */}
            <aside className="lg:col-span-2 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Contact Information</h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Reach us through any of the following channels and we will respond as quickly as possible.
                </p>
              </div>

              <div className="space-y-4">
                {CONTACT_DETAILS.map(d => (
                  <div key={d.title} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      {d.icon}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-0.5">{d.title}</p>
                      {d.lines.map((l, i) => (
                        <p key={i} className="text-sm text-gray-700">{l}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </aside>

            {/* Contact form — right column */}
            <section className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-1">Send Us a Message</h2>
                <p className="text-gray-500 text-sm mb-6">We typically respond within 24 business hours.</p>

                {status === 'success' ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Message Sent!</h3>
                    <p className="text-gray-500 text-sm mb-6">Thank you for reaching out. Our team will get back to you shortly.</p>
                    <button
                      onClick={() => setStatus('idle')}
                      className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-semibold hover:bg-primary-700 transition-colors"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                    <div className="grid sm:grid-cols-2 gap-5">
                      {field('name',  'Full Name',    'text',  'Your full name')}
                      {field('phone', 'Phone Number', 'tel',   '98765 43210')}
                    </div>
                    {field('email',   'Email Address','email', 'you@example.com')}
                    {field('message', 'Message',      'text',  'How can we help you?', true)}

                    {status === 'error' && (
                      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        Something went wrong. Please try again or call us directly.
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={status === 'submitting'}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm"
                    >
                      {status === 'submitting' ? (
                        <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending…</span>
                      ) : (
                        <><Send className="w-4 h-4" /> Send Message</>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
