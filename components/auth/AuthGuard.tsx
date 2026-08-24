'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  /** Roles allowed to view this page. If omitted, any authenticated user is allowed. */
  allowedRoles?: string[];
  /** Where to redirect after login. Defaults to current path. */
  redirectTo?: string;
  /** Override the redirect target when user is not authenticated (instead of /auth). */
  loginRedirect?: string;
}

/**
 * AuthGuard — client-side route protection.
 *
 * Renders a full-screen loader while auth state is resolving, then either
 * shows `children` (authenticated) or redirects to login (not authenticated).
 *
 * Works in tandem with Next.js middleware.ts which blocks private routes at
 * the edge for clearly unauthenticated users. This component handles:
 *   - The brief window between page load and auth resolution
 *   - Role-based access (e.g. agent-only pages)
 *   - Edge cases where the middleware cookie is stale
 *
 * Usage:
 *   export default function PostPropertyPage() {
 *     return (
 *       <AuthGuard>
 *         <PostPropertyForm />
 *       </AuthGuard>
 *     );
 *   }
 */
export default function AuthGuard({ children, allowedRoles, redirectTo, loginRedirect }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  // `mounted` prevents any content flash during SSR hydration —
  // before this is true, we always show the loader (server has no auth state).
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || loading) return;

    if (!user) {
      if (loginRedirect) {
        router.replace(loginRedirect);
      } else {
        const dest = redirectTo ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
        router.replace(`/auth?redirect=${encodeURIComponent(dest)}`);
      }
      return;
    }

    // New users who haven't selected a role yet, or whose name is still missing — send to onboarding
    if (user.needsOnboarding || !user.name?.trim()) {
      const dest = typeof window !== 'undefined' ? window.location.pathname : '/';
      router.replace(`/auth/onboarding?redirect=${encodeURIComponent(dest)}`);
      return;
    }

    // super_admin bypasses all role restrictions
    const isSuperAdmin = user.role === 'super_admin' || (user as any).isSuperAdmin;
    if (allowedRoles && !isSuperAdmin && !allowedRoles.includes(user.role)) {
      router.replace('/');
    }
  }, [mounted, loading, user, allowedRoles, redirectTo, router]);

  const isSuperAdmin = user?.role === 'super_admin' || (user as any)?.isSuperAdmin;

  // Show loader during SSR hydration, auth loading, or while redirecting
  const shouldShowLoader =
    !mounted ||
    loading ||
    !user ||
    user.needsOnboarding ||
    !user.name?.trim() ||
    (allowedRoles && !isSuperAdmin && !allowedRoles.includes(user.role ?? ''));

  if (shouldShowLoader) {
    return <AuthLoadingScreen />;
  }

  return <>{children}</>;
}

/**
 * Full-screen loading screen shown while auth state is being resolved.
 * Matches the brand style used in the agent layout.
 */
export function AuthLoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-5">
        {/* Brand mark */}
        <div className="w-14 h-14 rounded-2xl bg-primary-600 flex items-center justify-center shadow-2xl shadow-primary-600/40">
          <span className="text-white font-black text-xl">T4</span>
        </div>

        {/* Bouncing dots */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-primary-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>

        <p className="text-xs text-gray-400 font-medium tracking-wide">Loading…</p>
      </div>
    </div>
  );
}
