'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import EmailAuthFlow, { safeRedirect, homeForRole } from '@/components/auth/EmailAuthFlow';

// Value props for the desktop side panel. Each one is a promise the product
// actually keeps — free listings, direct owner contact, reviewed listings — so
// nothing here has to be walked back later.
const HIGHLIGHTS = [
  { icon: '🏡', title: 'Direct owner contact', text: 'Reach owners and agents yourself — no gatekeeping, no waiting on a callback.' },
  { icon: '✅', title: 'Verified listings',    text: 'Listings are reviewed before they go live, so what you see is what exists.' },
  { icon: '📢', title: 'Post property free',   text: 'Owners and agents list at no cost. No commission on what you sell or rent.' },
  { icon: '🔔', title: 'Saved searches',       text: 'Shortlist properties and pick up exactly where you left off, on any device.' },
];

export default function AuthPageClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const redirectTo = safeRedirect(params.get('redirect'));

  // Already signed in — nothing to do here.
  useEffect(() => {
    if (!authLoading && user) router.replace(redirectTo || homeForRole(user));
  }, [authLoading, user, redirectTo, router]);

  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* ── Left brand panel — desktop only ─────────────────────────────── */}
      <aside className="hidden lg:flex lg:w-[46%] xl:w-1/2 relative bg-gradient-to-br from-slate-900 via-primary-900 to-primary-800 text-white p-12 xl:p-16 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-16 left-8 w-72 h-72 bg-primary-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-8 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
              <span className="text-primary-700 font-black text-sm">T4</span>
            </div>
            <span className="text-xl font-bold">
              Think<span className="text-primary-300">4Buy</span><span className="text-amber-400">Sale</span>
            </span>
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-3xl xl:text-4xl font-extrabold leading-tight mb-3">
            Find the right property.<br />Talk to the right person.
          </h1>
          <p className="text-white/70 text-sm mb-10">
            One account to shortlist properties, contact owners and agents directly, and list your
            own property free.
          </p>

          <ul className="space-y-5">
            {HIGHLIGHTS.map((h) => (
              <li key={h.title} className="flex items-start gap-3.5">
                <span className="text-xl leading-none mt-0.5 shrink-0">{h.icon}</span>
                <div>
                  <p className="font-semibold text-sm">{h.title}</p>
                  <p className="text-white/60 text-xs leading-relaxed mt-0.5">{h.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-white/40 text-xs">
          © {new Date().getFullYear()} Think4BuySale. All rights reserved.
        </p>
      </aside>

      {/* ── Right form column ───────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col">

        {/* Mobile top bar */}
        <div className="lg:hidden bg-white border-b border-gray-100 px-4 py-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-xs">T4</span>
            </div>
            <span className="text-lg font-bold text-gray-900">
              Think<span className="text-primary-600">4Buy</span><span className="text-amber-500">Sale</span>
            </span>
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 p-6 sm:p-8">
              <EmailAuthFlow redirectTo={redirectTo} />
            </div>

            <p className="text-center text-sm text-gray-500 mt-5">
              <Link href="/" className="inline-flex items-center justify-center gap-1.5 hover:text-primary-600 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to home
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
