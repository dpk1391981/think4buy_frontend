'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { MessageCircle, Phone, Mail, Send, CheckCircle, User, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { inquiriesApi } from '@/lib/api';

interface Props {
  agentId: string;
  agentName: string;
  agentPhone?: string;
  agentEmail?: string;
  propertyId?: string;
}

export default function AgentContactForm({
  agentId,
  agentName,
  agentPhone,
  agentEmail,
  propertyId,
}: Props) {
  const { user } = useAuth();
  const pathname = usePathname();

  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [submitting, setSubmitting]     = useState(false);
  const [submitted, setSubmitted]       = useState(false);
  const [error, setError]               = useState('');
  const [showLoginGate, setShowLoginGate] = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const name    = user?.name  || form.name;
  const phone   = user?.phone || form.phone;
  const message = form.message;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Require login before sending
    if (!user) {
      setShowLoginGate(true);
      return;
    }

    if (!name.trim()) { setError('Please enter your name.'); return; }
    if (!phone.trim()) { setError('Please enter your phone number.'); return; }

    setSubmitting(true);
    try {
      const payload = {
        name:    name.trim(),
        email:   user?.email ?? '',
        phone:   phone.trim(),
        message: message.trim() || `Hi ${agentName.split(' ')[0]}, I would like to connect with you.`,
        type:    'general',
      };

      if (propertyId) {
        await inquiriesApi.create(propertyId, payload);
      } else {
        await inquiriesApi.contactAgent(agentId, payload);
      }
      setSubmitted(true);
    } catch {
      setError('Could not send message. Please try calling directly.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
        <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
        <h3 className="font-bold text-emerald-800 mb-1">Message Sent!</h3>
        <p className="text-sm text-emerald-700">
          {agentName.split(' ')[0]} will get back to you soon.
        </p>
        <button
          onClick={() => { setSubmitted(false); setForm({ name: '', phone: '', message: '' }); }}
          className="mt-4 text-xs text-emerald-600 hover:underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-5 py-4">
        <div className="flex items-center gap-2 text-white">
          <MessageCircle className="w-5 h-5" />
          <div>
            <h3 className="font-bold text-sm">Contact {agentName.split(' ')[0]}</h3>
            <p className="text-primary-200 text-xs">Free consultation · Quick login required</p>
          </div>
        </div>
      </div>

      {/* Direct contact */}
      <div className="flex gap-2 p-4 border-b border-gray-100">
        {agentPhone && (
          <a
            href={`tel:+91${agentPhone}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            Call Now
          </a>
        )}
        {agentEmail && (
          <a
            href={`mailto:${agentEmail}`}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Mail className="w-3.5 h-3.5" />
            Email
          </a>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 space-y-3">
        <p className="text-xs text-gray-400 text-center mb-1">or send a message</p>

        {/* Form fields — hidden once login gate is shown */}
        {!showLoginGate && <>

        {/* Name */}
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={name}
            onChange={e => set('name', e.target.value)}
            placeholder="Your name *"
            readOnly={!!user?.name}
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 read-only:bg-gray-50 read-only:text-gray-500"
          />
        </div>

        {/* Phone */}
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="tel"
            value={phone}
            onChange={e => set('phone', e.target.value)}
            placeholder="Your phone number *"
            readOnly={!!user?.phone}
            inputMode="numeric"
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 read-only:bg-gray-50 read-only:text-gray-500"
          />
        </div>

        {/* Message */}
        <textarea
          value={message}
          onChange={e => set('message', e.target.value)}
          placeholder={`Hi ${agentName.split(' ')[0]}, I'm looking for a property…`}
          rows={3}
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 resize-none"
        />

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60"
        >
          {submitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Sending…
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Send Message
            </>
          )}
        </button>

        </>}

        {!showLoginGate && (
          <p className="text-[10px] text-gray-400 text-center leading-relaxed">
            Your details are shared only with {agentName.split(' ')[0]}. We never sell your data.
          </p>
        )}

        {/* Login gate — shown after guest tries to submit */}
        {showLoginGate && (
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-center space-y-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <LogIn className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Login to send your message</p>
              <p className="text-xs text-gray-500 mt-0.5">Create a free account or login to contact {agentName.split(' ')[0]}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href={`/auth/login?redirect=${encodeURIComponent(pathname)}`}
                className="flex items-center justify-center gap-2 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                Login / Sign up Free
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setShowLoginGate(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ← Back to message
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
