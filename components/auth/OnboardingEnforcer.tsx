'use client';

/**
 * OnboardingEnforcer — mounted in the root layout.
 *
 * Globally redirects users to /auth/onboarding whenever:
 *   - user.needsOnboarding is true, OR
 *   - user is authenticated but has no name saved yet
 *
 * This ensures onboarding is enforced on EVERY page — not just those
 * wrapped in <AuthGuard>. Without this, a user can visit public pages
 * (homepage, property listings, etc.) and bypass the onboarding screen
 * even after a hard refresh.
 *
 * The redirect is skipped:
 *   - While auth is still loading (prevent flash)
 *   - When the user is already on an /auth/* page (prevent redirect loops)
 *   - When there is no logged-in user
 */

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function OnboardingEnforcer() {
  const { user, loading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Wait for auth to resolve
    if (loading) return;
    // No user → nothing to enforce
    if (!user) return;
    // Already on an auth page → avoid redirect loops
    if (pathname.startsWith('/auth/')) return;

    const needsOnboarding = user.needsOnboarding || !user.name?.trim();
    if (!needsOnboarding) return;

    router.replace(`/auth/onboarding?redirect=${encodeURIComponent(pathname)}`);
  }, [loading, user, pathname, router]);

  // Renders nothing — this is a pure side-effect component
  return null;
}
