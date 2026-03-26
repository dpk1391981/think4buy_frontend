'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const MESSAGES = [
  'Signing you in securely…',
  'Verifying your credentials…',
  'Preparing your dashboard…',
  'Almost there…',
];

/**
 * Full-screen overlay shown immediately after OTP verify success.
 * Covers the page-transition flash so the user sees a clean branded loader
 * instead of half-rendered authenticated content.
 *
 * Clears automatically when:
 *  a) The URL changes (navigation to destination completed), OR
 *  b) After 6 s as a safety net (prevents stuck state on slow networks)
 */
export default function AuthLoadingOverlay() {
  const { loginLoading, setLoginLoading } = useAuth();
  const pathname        = usePathname();
  const prevPathRef     = useRef(pathname);
  const [msgIdx,  setMsgIdx]  = useState(0);
  const [visible, setVisible] = useState(false);

  // Animate message cycling while visible
  useEffect(() => {
    if (!loginLoading) return;
    setMsgIdx(0);
    setVisible(true);
    const t = setInterval(() => setMsgIdx((i) => (i + 1) % MESSAGES.length), 1400);
    return () => clearInterval(t);
  }, [loginLoading]);

  // Dismiss when navigation completes (path changed)
  useEffect(() => {
    if (loginLoading && pathname !== prevPathRef.current) {
      // Small delay so the destination page has time to paint before we unmount
      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(() => setLoginLoading(false), 300); // allow fade-out transition
      }, 200);
      return () => clearTimeout(t);
    }
    prevPathRef.current = pathname;
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Safety timeout — never block the UI for more than 6 s
  useEffect(() => {
    if (!loginLoading) return;
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => setLoginLoading(false), 300);
    }, 6000);
    return () => clearTimeout(t);
  }, [loginLoading, setLoginLoading]);

  if (!loginLoading) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Signing in"
      className={[
        'fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white',
        'transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0',
      ].join(' ')}
    >
      {/* Spinner with logo */}
      <div className="relative mb-7">
        <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-primary-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Cycling message */}
      <p className="text-base font-semibold text-gray-800 transition-all duration-500">
        {MESSAGES[msgIdx]}
      </p>
      <p className="text-sm text-gray-400 mt-1.5 font-medium">
        Think<span className="text-primary-500">4Buy</span><span className="text-amber-500">Sale</span>
      </p>

      {/* Subtle dot-pulse at bottom */}
      <div className="absolute bottom-10 flex items-center gap-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-primary-300"
            style={{ animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>

      <style>{`
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40%            { transform: scale(1);   opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
