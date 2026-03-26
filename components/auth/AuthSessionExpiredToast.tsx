'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { authEvents } from '@/lib/authEvents';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Shows a non-intrusive banner ONLY when a previously authenticated user's
 * session expires mid-session (refresh token invalid).
 *
 * Does NOT show on initial load with no token — that is a normal unauthenticated
 * state, not a session expiry.
 */
export default function AuthSessionExpiredToast() {
  const { user }      = useAuth();
  const wasAuthed     = useRef(false);
  const [visible, setVisible] = useState(false);

  // Track whether the user was ever authenticated in this session
  useEffect(() => {
    if (user) wasAuthed.current = true;
  }, [user]);

  useEffect(() => {
    return authEvents.on('auth-fail', () => {
      // Only show if user had an active session — not on cold load failures
      if (!wasAuthed.current) return;
      setVisible(true);
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
