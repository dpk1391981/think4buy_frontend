'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { authEvents } from '@/lib/authEvents';

/**
 * Shows a non-intrusive banner when the session expires (refresh token invalid).
 * Does NOT redirect — the middleware handles route protection on the next navigation.
 */
export default function AuthSessionExpiredToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return authEvents.on('auth-fail', () => {
      setVisible(true);
      // Auto-dismiss after 6 s
      setTimeout(() => setVisible(false), 6000);
    });
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-[250] w-[calc(100%-2rem)] max-w-sm
                 bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3.5 flex items-start gap-3
                 animate-slide-up"
    >
      <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Session expired</p>
        <p className="text-xs text-gray-400 mt-0.5">Please sign in again to continue.</p>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
