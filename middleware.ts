import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Route protection middleware.
 * Runs at the edge BEFORE any page is rendered — prevents private pages from
 * flashing to unauthenticated users entirely.
 *
 * Auth detection uses the `t4bs_auth` presence cookie (set by AuthContext on
 * login/refresh, cleared on logout). It is NOT a security token — real
 * authentication is enforced by the backend JWT on every API call.
 * The `rt` (HTTP-only refresh token) cookie is also accepted as a fallback
 * for the new auth flow.
 *
 * Route categories:
 *   PRIVATE_ROUTES  — any authenticated user required
 *   AGENT_ROUTES    — agent/owner/admin only (client-side role check still enforced)
 *   ADMIN_ROUTES    — admin only (client-side role check still enforced)
 *   GUEST_ONLY      — redirect logged-in users away (login/register pages)
 */

// ── Route definitions ─────────────────────────────────────────────────────────

const PRIVATE_PREFIXES = [
  '/dashboard',
  '/profile',
  '/my-listings',
  '/agent/',   // NOTE: trailing slash so /agents/* (public) is NOT blocked
  '/owner',
  '/buyer',
  '/admin',
];


/** Pages guests should not see once logged in (redirect to home) */
const GUEST_ONLY_PREFIXES = [
  '/auth/login',
  '/auth/register',
];

// ── Matcher ───────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    /*
     * Match all paths except:
     *  - _next/static  (static files)
     *  - _next/image   (image optimisation)
     *  - favicon.ico
     *  - /api/         (API routes — backend handles their own auth)
     *  - /uploads/     (static media)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|uploads/).*)',
  ],
};

// ── Middleware ────────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth detected by presence cookie (set by AuthContext) OR HTTP-only rt cookie
  const isAuthed =
    request.cookies.get('t4bs_auth')?.value === '1' ||
    !!request.cookies.get('rt')?.value;

  // ── /post-property → guest landing for unauthenticated users ──────────
  const isPostProperty = pathname.startsWith('/post-property');
  const isPostPropertyGuest = pathname.startsWith('/post-property/guest');

  if (isPostProperty && !isPostPropertyGuest && !isAuthed) {
    const guestUrl = request.nextUrl.clone();
    guestUrl.pathname = '/post-property/guest';
    guestUrl.search = '';
    return NextResponse.redirect(guestUrl);
  }

  // Logged-in users hitting /post-property/guest → redirect to the actual form
  if (isPostPropertyGuest && isAuthed) {
    const formUrl = request.nextUrl.clone();
    formUrl.pathname = '/post-property';
    formUrl.search = '';
    return NextResponse.redirect(formUrl);
  }

  // ── Protect private routes ──────────────────────────────────────────────
  const isPrivate = PRIVATE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isPrivate && !isAuthed) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/auth/login';
    // Preserve the intended destination so we can redirect back after login
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Redirect logged-in users away from auth pages ──────────────────────
  const isGuestOnly = GUEST_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isGuestOnly && isAuthed) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = '/';
    homeUrl.search = '';
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}
