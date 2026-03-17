import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { KNOWN_CITY_SLUGS } from '@/lib/city-slugs';

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

// ── SEO URL rewrites ──────────────────────────────────────────────────────────
// URLs like /property-for-rent-in-mumbai → internal /property-for-rent-in/mumbai
// The external slug stays intact (canonical tags preserve the SEO URL).

const SEO_PREFIXES = [
  'property-for-sale-in',
  'property-for-rent-in',
  'flats-for-sale-in',
  'flats-for-rent-in',
  'villas-for-sale-in',
  'plots-for-sale-in',
  'commercial-property-in',
  'office-space-for-rent-in',
  'new-projects-in',
  'pg-in',
  'property-agents-in',
  // State & city landing pages
  // /properties-in-delhi     → /properties-in/delhi
  // /property-in-mumbai      → /property-in/mumbai
  'properties-in',
  'property-in',
];

// ── Middleware ────────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── /property-in-{slug}: city-only OR city+locality (all-hyphen SEO URLs) ──
  // e.g. /property-in-delhi        → city page  (delhi is a known city)
  // e.g. /property-in-delhi-dwarka → locality page (delhi known, dwarka is locality)
  // e.g. /property-in-navi-mumbai  → city page  (navi-mumbai is a known compound city)
  const propInSlugMatch = pathname.match(/^\/property-in-([a-z0-9][a-z0-9-]*)$/);
  if (propInSlugMatch) {
    const slug = propInSlugMatch[1];

    // 301: legacy ?locality= query → clean all-hyphen URL
    const localityParam = request.nextUrl.searchParams.get('locality');
    if (localityParam) {
      const localitySlug = localityParam.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const url = request.nextUrl.clone();
      url.pathname = `/property-in-${slug}-${localitySlug}`;
      url.search = '';
      return NextResponse.redirect(url, 301);
    }

    // If slug is a known city → standard city-page rewrite (handled by SEO loop below)
    if (KNOWN_CITY_SLUGS.has(slug)) {
      // fall through to the SEO prefix loop
    } else {
      // Unknown slug: try to split as {city}-{locality} — longest matching city prefix wins
      const parts = slug.split('-');
      for (let i = parts.length - 1; i >= 1; i--) {
        const citySlug     = parts.slice(0, i).join('-');
        const localitySlug = parts.slice(i).join('-');
        if (KNOWN_CITY_SLUGS.has(citySlug)) {
          // Rewrite internally to /property-in/[city]/[locality] route
          const url = request.nextUrl.clone();
          url.pathname = `/property-in/${citySlug}/${localitySlug}`;
          return NextResponse.rewrite(url);
        }
      }
      // No match found — fall through and treat as a city page as-is
    }
  }

  // ── 301: /property-in-{city}/{locality} (slash form) → canonical all-hyphen ──
  // Backward compat: redirects any slash-separated locality URLs to the clean form.
  const localitySlashMatch = pathname.match(/^\/property-in-([a-z0-9-]+)\/([a-z0-9-]+)$/);
  if (localitySlashMatch) {
    const url = request.nextUrl.clone();
    url.pathname = `/property-in-${localitySlashMatch[1]}-${localitySlashMatch[2]}`;
    url.search = '';
    return NextResponse.redirect(url, 301);
  }

  // ── 301: /properties-in/state → /properties-in-state (canonical hyphen form) ──
  if (/^\/properties-in\/[^/]+$/.test(pathname)) {
    const slug = pathname.replace('/properties-in/', '');
    const url  = request.nextUrl.clone();
    url.pathname = `/properties-in-${slug}`;
    return NextResponse.redirect(url, 301);
  }

  // ── 301: /property-in/city → /property-in-city (canonical hyphen form) ────────
  if (/^\/property-in\/[^/]+$/.test(pathname)) {
    const slug = pathname.replace('/property-in/', '');
    const url  = request.nextUrl.clone();
    url.pathname = `/property-in-${slug}`;
    return NextResponse.redirect(url, 301);
  }

  // ── SEO URL rewrite: /prefix-in-city → /prefix-in/city ─────────────────
  for (const prefix of SEO_PREFIXES) {
    const match = pathname.match(new RegExp(`^\\/(${prefix})-([^/]+)$`));
    if (match) {
      const url = request.nextUrl.clone();
      url.pathname = `/${match[1]}/${match[2]}`;
      return NextResponse.rewrite(url);
    }
  }

  // ── Agent profile rewrite: /agents/name-in-city → /agents/name/city ────
  // Matches /agents/amit-verma-in-mumbai but NOT /agents (listing page)
  const agentMatch = pathname.match(/^\/agents\/([a-z0-9-]+)-in-([a-z0-9-]+)$/);
  if (agentMatch) {
    const url = request.nextUrl.clone();
    url.pathname = `/agents/${agentMatch[1]}/${agentMatch[2]}`;
    return NextResponse.rewrite(url);
  }


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
