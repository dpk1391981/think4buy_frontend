'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { X, Heart, Home, BookOpen } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { closeAuthModal, AuthModalReason } from '@/lib/store/slices/uiSlice';
import EmailAuthFlow, { homeForRole, safeRedirect } from '@/components/auth/EmailAuthFlow';

/**
 * The global login sheet, opened from wishlist / contact / post-property CTAs
 * across the app.
 *
 * The flow itself is EmailAuthFlow, shared with the /auth page — this file is
 * only the chrome and the "where do we go afterwards" decision. That sharing is
 * the point: this modal is reached from ~20 call sites, and when mobile OTP was
 * switched off, a private copy of the phone flow in here would have left every
 * one of those buttons opening a dead end.
 */

const REASON_CONFIG: Record<AuthModalReason, { icon: React.ReactNode; title: string; subtitle: string }> = {
  wishlist: {
    icon: <Heart className="w-5 h-5 text-red-500 fill-red-500" />,
    title: 'Save to Wishlist',
    subtitle: 'Sign in with your email to save this property',
  },
  'post-property': {
    icon: <Home className="w-5 h-5 text-primary-600" />,
    title: 'Post Property FREE',
    subtitle: 'Sign in with your email to list in minutes',
  },
  'app-open': {
    icon: <BookOpen className="w-5 h-5 text-primary-600" />,
    title: 'Welcome to Think4BuySale',
    subtitle: 'Sign in with your email to get started',
  },
  general: {
    icon: null,
    title: 'Login / Sign Up',
    subtitle: 'Enter your email to continue',
  },
};

export default function AuthModal() {
  const dispatch = useAppDispatch();
  const router   = useRouter();
  const pathname = usePathname();
  const { authModalOpen, authModalReason, authModalRedirectTo } = useAppSelector((s) => s.ui);
  const reasonConfig = REASON_CONFIG[authModalReason] ?? REASON_CONFIG.general;

  const [visible, setVisible] = useState(false);

  // Prevent body scroll while the sheet is open
  useEffect(() => {
    document.body.style.overflow = authModalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [authModalOpen]);

  // Animate in/out — tiny delay so the translate transition fires after mount
  useEffect(() => {
    if (authModalOpen) requestAnimationFrame(() => setVisible(true));
    else setVisible(false);
  }, [authModalOpen]);

  if (!authModalOpen) return null;

  const redirectTo = safeRedirect(authModalRedirectTo);

  const handleAuthenticated = (data: any) => {
    dispatch(closeAuthModal());

    if (data.isNewUser) {
      const q = redirectTo ? `?redirect=${encodeURIComponent(redirectTo)}` : '';
      router.push(`/auth/onboarding${q}`);
      return;
    }
    if (redirectTo) { router.push(redirectTo); return; }

    // Signed in from the header while on the guest post-property page — send
    // them to the real form regardless of role, since that is what they were
    // in the middle of doing.
    if (pathname === '/post-property/guest') { router.push('/post-property'); return; }

    router.push(homeForRole(data.user));
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center transition-colors duration-300 ${visible ? 'bg-black/60' : 'bg-black/0'}`}
      onClick={() => dispatch(closeAuthModal())}
    >
      {/* Slides up from the bottom on mobile, fades in centered on desktop */}
      <div
        className={`
          bg-white w-full sm:max-w-md sm:mx-4
          rounded-t-3xl sm:rounded-3xl shadow-2xl
          max-h-[92vh] overflow-y-auto
          transition-all duration-300 ease-out
          ${visible
            ? 'translate-y-0 opacity-100 sm:scale-100'
            : 'translate-y-full opacity-0 sm:translate-y-0 sm:scale-95'
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle — tap to close on mobile */}
        <div
          className="w-full flex justify-center pt-3 pb-1 sm:hidden cursor-pointer"
          onClick={() => dispatch(closeAuthModal())}
          aria-label="Close"
        >
          <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* Reason badge + close */}
        <div className="px-6 pt-5 flex items-start justify-between gap-3">
          {reasonConfig.icon ? (
            <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
              {reasonConfig.icon}
            </div>
          ) : <span />}
          <button
            onClick={() => dispatch(closeAuthModal())}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pb-6 pt-2">
          <EmailAuthFlow
            title={reasonConfig.title}
            subtitle={reasonConfig.subtitle}
            redirectTo={redirectTo}
            onAuthenticated={handleAuthenticated}
          />
        </div>
      </div>
    </div>
  );
}
