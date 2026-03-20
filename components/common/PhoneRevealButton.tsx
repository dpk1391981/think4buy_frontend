'use client';

/**
 * PhoneRevealButton
 * Wraps any phone/whatsapp call-to-action behind an auth gate.
 * – Logged-in users: behaves normally (tel: or wa.me link / reveal number).
 * – Guest users: shows a "Login to View" button that opens the auth modal.
 */

import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch } from '@/lib/store';
import { openAuthModal } from '@/lib/store/slices/uiSlice';
import { leadsApi } from '@/lib/api';
import { Phone, Lock } from 'lucide-react';
import { useState } from 'react';

export function WhatsAppIcon({ className }: { className?: string }) {
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

// ── Call button ────────────────────────────────────────────────────────────────

interface CallButtonProps {
  phone: string;
  className?: string;
  children?: React.ReactNode;
  agentId?: string;
  propertyId?: string;
}

export function CallButton({ phone, className, children, agentId, propertyId }: CallButtonProps) {
  const { user } = useAuth();
  const dispatch  = useAppDispatch();

  if (!user) {
    return (
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); dispatch(openAuthModal({ mode: 'login', reason: 'general' })); }}
        className={className}
        title="Login to view phone number"
      >
        <Lock className="w-3.5 h-3.5 flex-shrink-0" />
        {children ?? 'Login to Call'}
      </button>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = normalizePhone(user.phone || '');
    if (cleanPhone.length === 10) {
      leadsApi.capturePublic({
        source: 'call',
        contactName: user.name?.trim() || `User ${cleanPhone.slice(-4)}`,
        contactPhone: cleanPhone,
        contactEmail: user.email ?? undefined,
        propertyId: propertyId ?? undefined,
        assignedAgentId: agentId ?? undefined,
      }).catch(() => {});
    }
  };

  return (
    <a href={`tel:${phone}`} className={className} onClick={handleClick}>
      {children ?? (
        <>
          <Phone className="w-3.5 h-3.5 flex-shrink-0" />
          Call Now
        </>
      )}
    </a>
  );
}

// ── WhatsApp button ────────────────────────────────────────────────────────────

interface WhatsAppButtonProps {
  phone: string;
  message?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  agentId?: string;
  propertyId?: string;
}

export function WhatsAppButton({ phone, message = '', className, style, children, agentId, propertyId }: WhatsAppButtonProps) {
  const { user } = useAuth();
  const dispatch  = useAppDispatch();

  const clean = phone.replace(/[^0-9]/g, '');
  const href  = `https://wa.me/${clean}${message ? `?text=${encodeURIComponent(message)}` : ''}`;

  if (!user) {
    return (
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); dispatch(openAuthModal({ mode: 'login', reason: 'general' })); }}
        className={className}
        style={style}
        title="Login to WhatsApp"
      >
        <Lock className="w-3.5 h-3.5 flex-shrink-0" />
        {children ?? 'Login to Chat'}
      </button>
    );
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = normalizePhone(user.phone || '');
    if (cleanPhone.length === 10) {
      leadsApi.capturePublic({
        source: 'whatsapp',
        contactName: user.name?.trim() || `User ${cleanPhone.slice(-4)}`,
        contactPhone: cleanPhone,
        contactEmail: user.email ?? undefined,
        propertyId: propertyId ?? undefined,
        assignedAgentId: agentId ?? undefined,
      }).catch(() => {});
    }
  };

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} style={style} onClick={handleClick}>
      {children ?? (
        <>
          <WhatsAppIcon className="w-3.5 h-3.5 flex-shrink-0" />
          WhatsApp
        </>
      )}
    </a>
  );
}

// ── Reveal number button (for property detail sidebar) ─────────────────────────

interface RevealPhoneProps {
  phone: string;
  className?: string;
  revealedClassName?: string;
  agentId?: string;
  propertyId?: string;
}

export function RevealPhoneButton({ phone, className, revealedClassName, agentId, propertyId }: RevealPhoneProps) {
  const { user } = useAuth();
  const dispatch  = useAppDispatch();
  const [shown, setShown] = useState(false);

  if (!user) {
    return (
      <button
        onClick={() => dispatch(openAuthModal({ mode: 'login', reason: 'general' }))}
        className={className}
      >
        <Lock className="w-4 h-4 flex-shrink-0" />
        Login to View Phone Number
      </button>
    );
  }

  const handleReveal = () => {
    if (!shown) {
      const cleanPhone = normalizePhone(user.phone || '');
      if (cleanPhone.length === 10) {
        leadsApi.capturePublic({
          source: 'view_phone',
          contactName: user.name?.trim() || `User ${cleanPhone.slice(-4)}`,
          contactPhone: cleanPhone,
          contactEmail: user.email ?? undefined,
          propertyId: propertyId ?? undefined,
          assignedAgentId: agentId ?? undefined,
        }).catch(() => {});
      }
    }
    setShown(true);
  };

  return (
    <a
      href={shown ? `tel:${phone}` : undefined}
      onClick={handleReveal}
      className={shown ? (revealedClassName ?? className) : className}
    >
      <Phone className="w-4 h-4 flex-shrink-0" />
      {shown ? phone : `${phone.slice(0, 5)}XXXXX — Tap to Reveal`}
    </a>
  );
}
