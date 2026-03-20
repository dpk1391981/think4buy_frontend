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
import { Phone, MessageCircle, Lock } from 'lucide-react';
import { useState } from 'react';

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
          <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
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
