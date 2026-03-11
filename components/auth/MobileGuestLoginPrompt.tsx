'use client';

import { useEffect, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppDispatch } from '@/lib/store';
import { openAuthModal } from '@/lib/store/slices/uiSlice';

const SESSION_KEY = 't4bs_guest_prompt_dismissed';

export default function MobileGuestLoginPrompt() {
  const { user, loading } = useAuth();
  const dispatch = useAppDispatch();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) return;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SESSION_KEY)) return;

    // Show after 2.5s delay
    const t = setTimeout(() => {
      setMounted(true);
      requestAnimationFrame(() => setVisible(true));
    }, 2500);

    return () => clearTimeout(t);
  }, [loading, user]);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(SESSION_KEY, '1');
    setTimeout(() => setMounted(false), 350);
  };

  const handleLogin = () => {
    dispatch(openAuthModal({ mode: 'login', reason: 'app-open' }));
    dismiss();
  };

  if (!mounted || user) return null;

  return (
    // Only render on mobile (md:hidden)
    <div className="md:hidden fixed bottom-[64px] left-0 right-0 z-40 px-3 pb-2">
      <div
        className={`
          bg-white rounded-2xl shadow-xl border border-gray-100
          transition-all duration-350 ease-out
          ${visible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
        `}
      >
        {/* Gradient accent bar */}
        <div className="h-1 w-full rounded-t-2xl bg-gradient-to-r from-primary-500 to-primary-700" />

        <div className="px-4 py-3 flex items-center gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-primary-600" />
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-tight">Get the full experience</p>
            <p className="text-xs text-gray-500 mt-0.5 truncate">Save properties, post listings & more</p>
          </div>

          {/* CTA */}
          <button
            onClick={handleLogin}
            className="flex-shrink-0 px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-xl shadow-md shadow-primary-600/30 active:scale-95 transition-transform"
          >
            Login
          </button>

          {/* Dismiss */}
          <button
            onClick={dismiss}
            className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
