'use client';

/**
 * AgentCallCTA — client component used in the server-rendered agent detail page.
 * Renders Call / WhatsApp / Email buttons behind an auth gate for phone.
 *
 * mobile-bar: fixed floating bar at BOTTOM of screen (like property detail page)
 * desktop-hero: inline CTA in the hero section
 */

import { useCallback } from 'react';
import { Mail, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { leadsApi } from '@/lib/api';
import { CallButton, WhatsAppIcon } from '@/components/common/PhoneRevealButton';

function normalizePhone(raw: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0'))  return digits.slice(1);
  return digits.slice(-10);
}

interface Props {
  phone?: string;
  email?: string;
  agentId?: string;
  agentName?: string;
  variant?: 'desktop-hero' | 'mobile-bar';
}

export default function AgentCallCTA({ phone, email, agentId, agentName, variant = 'desktop-hero' }: Props) {
  const { user } = useAuth();

  const cleanPhone = phone ? normalizePhone(phone) : '';
  const waNumber   = cleanPhone ? `91${cleanPhone}` : '';
  const waText     = encodeURIComponent(
    `Hi${agentName ? ` ${agentName}` : ''}, I found your profile on Think4BuySale and would like to discuss a property. Please let me know when you're available.`
  );
  const waLink = waNumber ? `https://wa.me/${waNumber}?text=${waText}` : null;

  const captureLead = useCallback((source: 'call' | 'whatsapp' | 'contact_form') => {
    if (!user?.phone) return;
    const cp = normalizePhone(user.phone);
    if (cp.length !== 10) return;
    leadsApi.capturePublic({
      source,
      contactName:  user.name || cp,   // use phone digits as fallback, never 'Unknown'
      contactPhone: cp,
      contactEmail: user.email ?? undefined,
      assignedAgentId: agentId,
      contactUserId: user.id,
    }).catch(() => {});
  }, [user, agentId]);

  if (variant === 'mobile-bar') {
    // ── Fixed floating bar above MobileBottomNav (which is lg:hidden z-50) ────
    return (
      <div className="lg:hidden fixed bottom-16 left-0 right-0 z-[55] bg-white border-t border-gray-200 shadow-2xl">
        <div className="flex items-center gap-2 px-3 py-3">
          {cleanPhone ? (
            <CallButton
              phone={`+91${cleanPhone}`}
              agentId={agentId}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm active:scale-95 transition-all"
            >
              <Phone className="w-4 h-4" /> Call
            </CallButton>
          ) : null}

          {waLink ? (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => captureLead('whatsapp')}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#25D366] text-white rounded-xl font-bold text-sm active:scale-95 transition-all"
            >
              <WhatsAppIcon className="w-4 h-4" /> WhatsApp
            </a>
          ) : null}

          {email && !cleanPhone && !waLink && (
            <a
              href={`mailto:${email}`}
              onClick={() => captureLead('contact_form')}
              className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm"
            >
              <Mail className="w-4 h-4" /> Email
            </a>
          )}
        </div>
      </div>
    );
  }

  // ── Desktop hero CTA ───────────────────────────────────────────────────────
  return (
    <div className="hidden md:flex flex-col gap-3 min-w-48">
      {cleanPhone && (
        <CallButton
          phone={`+91${cleanPhone}`}
          agentId={agentId}
          className="flex items-center justify-center gap-2 py-3.5 px-6 bg-white text-primary-700 rounded-2xl font-bold hover:bg-primary-50 transition-colors shadow-lg"
        >
          <Phone className="w-5 h-5" />
          Call Now
        </CallButton>
      )}
      {waLink && (
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => captureLead('whatsapp')}
          className="flex items-center justify-center gap-2 py-3.5 px-6 bg-[#25D366] text-white rounded-2xl font-bold hover:bg-[#1ebe5d] transition-colors shadow-lg"
        >
          <WhatsAppIcon className="w-5 h-5" />
          WhatsApp
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          onClick={() => captureLead('contact_form')}
          className="flex items-center justify-center gap-2 py-3.5 px-6 bg-primary-600/40 border border-primary-400/50 text-white rounded-2xl font-bold hover:bg-primary-600/60 transition-colors"
        >
          <Mail className="w-5 h-5" />
          Send Email
        </a>
      )}
    </div>
  );
}
