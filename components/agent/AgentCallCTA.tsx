'use client';

/**
 * AgentCallCTA — client component used in the server-rendered agent detail page.
 * Renders Call Now / Email buttons behind an auth gate for phone.
 */

import { useCallback } from 'react';
import { Mail, Phone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { leadsApi } from '@/lib/api';
import { CallButton } from '@/components/common/PhoneRevealButton';

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
  variant?: 'desktop-hero' | 'mobile-bar';
}

export default function AgentCallCTA({ phone, email, agentId, variant = 'desktop-hero' }: Props) {
  const { user } = useAuth();

  const captureEmailLead = useCallback(() => {
    if (!user?.phone) return;
    const cleanPhone = normalizePhone(user.phone);
    if (cleanPhone.length !== 10) return;
    leadsApi.capturePublic({
      source: 'contact_form',
      contactName: user.name || '',
      contactPhone: cleanPhone,
      contactEmail: user.email ?? '',
      assignedAgentId: agentId,
      contactUserId: user.id,
    }).catch(() => {});
  }, [user, agentId]);

  if (variant === 'mobile-bar') {
    return (
      <div className="md:hidden sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex gap-3 p-3">
          {phone && (
            <CallButton
              phone={`+91${phone}`}
              agentId={agentId}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm"
            >
              <Phone className="w-4 h-4" /> Call Agent
            </CallButton>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
              onClick={captureEmailLead}
              className="flex-1 flex items-center justify-center gap-2 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold text-sm"
            >
              <Mail className="w-4 h-4" /> Email
            </a>
          )}
        </div>
      </div>
    );
  }

  // desktop-hero
  return (
    <div className="hidden md:flex flex-col gap-3 min-w-48">
      {phone && (
        <CallButton
          phone={`+91${phone}`}
          agentId={agentId}
          className="flex items-center justify-center gap-2 py-3.5 px-6 bg-white text-primary-700 rounded-2xl font-bold hover:bg-primary-50 transition-colors shadow-lg"
        >
          <Phone className="w-5 h-5" />
          Call Now
        </CallButton>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          onClick={captureEmailLead}
          className="flex items-center justify-center gap-2 py-3.5 px-6 bg-primary-600/40 border border-primary-400/50 text-white rounded-2xl font-bold hover:bg-primary-600/60 transition-colors"
        >
          <Mail className="w-5 h-5" />
          Send Email
        </a>
      )}
    </div>
  );
}
