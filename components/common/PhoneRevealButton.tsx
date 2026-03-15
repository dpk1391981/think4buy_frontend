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
import { Phone, MessageCircle, Lock } from 'lucide-react';
import { useState } from 'react';

// ── Call button ────────────────────────────────────────────────────────────────

interface CallButtonProps {
  phone: string;
  className?: string;
  children?: React.ReactNode;
}

export function CallButton({ phone, className, children }: CallButtonProps) {
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

  return (
    <a href={`tel:${phone}`} className={className} onClick={e => e.stopPropagation()}>
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
  children?: React.ReactNode;
}

export function WhatsAppButton({ phone, message = '', className, children }: WhatsAppButtonProps) {
  const { user } = useAuth();
  const dispatch  = useAppDispatch();

  const clean = phone.replace(/[^0-9]/g, '');
  const href  = `https://wa.me/${clean}${message ? `?text=${encodeURIComponent(message)}` : ''}`;

  if (!user) {
    return (
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); dispatch(openAuthModal({ mode: 'login', reason: 'general' })); }}
        className={className}
        title="Login to WhatsApp"
      >
        <Lock className="w-3.5 h-3.5 flex-shrink-0" />
        {children ?? 'Login to Chat'}
      </button>
    );
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} onClick={e => e.stopPropagation()}>
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
}

export function RevealPhoneButton({ phone, className, revealedClassName }: RevealPhoneProps) {
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

  return (
    <a
      href={shown ? `tel:${phone}` : undefined}
      onClick={() => setShown(true)}
      className={shown ? (revealedClassName ?? className) : className}
    >
      <Phone className="w-4 h-4 flex-shrink-0" />
      {shown ? phone : `${phone.slice(0, 5)}XXXXX — Tap to Reveal`}
    </a>
  );
}
