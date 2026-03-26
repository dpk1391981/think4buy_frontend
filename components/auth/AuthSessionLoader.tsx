'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';

// Public routes where a session-check loader adds no value
const PUBLIC_PREFIXES = [
  '/',
  '/auth/',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/faq',
  '/advertise',
  '/feedback',
  '/complaints',
  '/testimonials',
];

function isPublic(pathname: string): boolean {
  if (pathname === '/') return true;
  return PUBLIC_PREFIXES.some(
    (p) => p.length > 1 && pathname.startsWith(p)
  );
}

/**
 * Shows a gentle "Checking your session…" overlay on protected pages
 * while the initial auth API call is in-flight.
 *
 * On public pages (homepage, auth pages, static pages) this is a no-op —
 * there's no need to block content while we verify the session.
 */
export default function AuthSessionLoader() {
  const { loading } = useAuth();
  const pathname    = usePathname();

  if (!loading || isPublic(pathname)) return null;

  return (
    <div
      role="status"
      aria-label="Checking your session"
      className="fixed inset-0 z-[150] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm"
    >
      <div className="relative mb-4">
        <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-primary-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-md bg-primary-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
              <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
            </svg>
          </div>
        </div>
      </div>
      <p className="text-sm font-medium text-gray-600">Checking your session…</p>
    </div>
  );
}
