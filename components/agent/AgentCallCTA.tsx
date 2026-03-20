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
import { CallButton } from '@/components/common/PhoneRevealButton';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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
    // ── Fixed floating bar at BOTTOM (mirrors property detail sticky bar) ─────
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl safe-bottom">
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
