'use client';

import { useState } from 'react';
import { MessageCircle, Phone, Mail, Send, LogIn, CheckCircle, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch } from '@/lib/store';
import { openAuthModal } from '@/lib/store/slices/uiSlice';
import { inquiriesApi } from '@/lib/api';

interface Props {
  agentId: string;
  agentName: string;
  agentPhone?: string;
  agentEmail?: string;
  /** Optional: link inquiry to a specific property */
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
  const dispatch = useAppDispatch();

  const [form, setForm] = useState({
    name:    '',
    phone:   '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState('');

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Gate: require login only at submit time
    if (!user) {
      dispatch(openAuthModal('login'));
      return;
    }

    if (!form.phone && !form.message) {
      setError('Please enter your phone or a message.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name:    form.name || user.name,
        email:   user.email,
        phone:   form.phone || user.phone || '',
        message: form.message || `Hi, I would like to connect with you regarding property services.`,
        type:    'general',
      };

      if (propertyId) {
        // Inquiry tied to a specific property
        await inquiriesApi.create(propertyId, payload);
      } else {
        // Direct agent contact (no property)
        await inquiriesApi.contactAgent(agentId, payload);
      }
      setSubmitted(true);
    } catch {
      setError('Failed to send. Please try calling directly.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success state ──────────────────────────────────────────────────
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
            <p className="text-primary-200 text-xs">Get a free consultation</p>
          </div>
        </div>
      </div>

      {/* Direct contact quick links */}
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

      {/* Inquiry form — visible to all, login required only on submit */}
      <div className="p-4">
        <p className="text-xs text-gray-500 mb-3 text-center">
          or send a message through the platform
        </p>

        {/* Show auth hint only if not logged in */}
        {!user && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 mb-4 text-xs text-blue-700">
            <LogIn className="w-3.5 h-3.5 flex-shrink-0" />
            <span>
              You can fill the form now.{' '}
              <button
                onClick={() => dispatch(openAuthModal('login'))}
                className="font-semibold underline underline-offset-2"
              >
                Login
              </button>{' '}
              is only required when you submit.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Name */}
          <div>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={user ? user.name : form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Your name"
                readOnly={!!user}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 read-only:bg-gray-50 read-only:text-gray-500"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="tel"
                value={user?.phone ?? form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="Your phone number"
                readOnly={!!user?.phone}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 read-only:bg-gray-50 read-only:text-gray-500"
              />
            </div>
          </div>

          {/* Message */}
          <textarea
            value={form.message}
            onChange={e => set('message', e.target.value)}
            placeholder={`Hi ${agentName.split(' ')[0]}, I'm looking for a property and would like your help…`}
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
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Sending…
              </span>
            ) : !user ? (
              <>
                <LogIn className="w-4 h-4" />
                Login to Send Message
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Message
              </>
            )}
          </button>
        </form>

        <p className="text-[10px] text-gray-400 text-center mt-3 leading-relaxed">
          Your contact details are shared only with {agentName.split(' ')[0]}.
          We never sell your data.
        </p>
      </div>
    </div>
  );
}
