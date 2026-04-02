'use client';

/**
 * OnboardingEnforcer — mounted in the root layout.
 *
 * Globally redirects users to /auth/onboarding whenever:
 *   - user.needsOnboarding is true, OR
 *   - user is authenticated but has no name saved yet
 *
 * Also blocks the browser back button while the user is on the onboarding
 * page, ensuring they cannot navigate away until onboarding is complete.
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

  // Redirect to onboarding when needed
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

  // Block browser back button while on onboarding page
  useEffect(() => {
    if (!user) return;
    const needsOnboarding = user.needsOnboarding || !user.name?.trim();
    if (!needsOnboarding) return;
    if (!pathname.startsWith('/auth/onboarding')) return;

    // Push an extra history entry so "back" lands on this same page
    history.pushState(null, '', window.location.href);

    const blockBack = () => {
      // Re-push to keep trapping the back button
      history.pushState(null, '', window.location.href);
    };

    window.addEventListener('popstate', blockBack);
    return () => window.removeEventListener('popstate', blockBack);
  }, [user, pathname]);

  // Renders nothing — this is a pure side-effect component
  return null;
}
