'use client';

/**
 * AgentCallCTA — client component used in the server-rendered agent detail page.
 * Renders Call Now / Email buttons behind an auth gate for phone.
 */

import { Mail, Phone } from 'lucide-react';
import { CallButton } from '@/components/common/PhoneRevealButton';

interface Props {
  phone?: string;
  email?: string;
  variant?: 'desktop-hero' | 'mobile-bar';
}

export default function AgentCallCTA({ phone, email, variant = 'desktop-hero' }: Props) {
  if (variant === 'mobile-bar') {
    return (
      <div className="md:hidden sticky top-16 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex gap-3 p-3">
          {phone && (
            <CallButton
              phone={`+91${phone}`}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm"
            >
              <Phone className="w-4 h-4" /> Call Agent
            </CallButton>
          )}
          {email && (
            <a
              href={`mailto:${email}`}
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
          className="flex items-center justify-center gap-2 py-3.5 px-6 bg-white text-primary-700 rounded-2xl font-bold hover:bg-primary-50 transition-colors shadow-lg"
        >
          <Phone className="w-5 h-5" />
          Call Now
        </CallButton>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className="flex items-center justify-center gap-2 py-3.5 px-6 bg-primary-600/40 border border-primary-400/50 text-white rounded-2xl font-bold hover:bg-primary-600/60 transition-colors"
        >
          <Mail className="w-5 h-5" />
          Send Email
        </a>
      )}
    </div>
  );
}
