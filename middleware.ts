import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { KNOWN_CITY_SLUGS } from '@/lib/city-slugs';

/**
 * Middleware — runs at the Edge before any page renders.
 *
 * URL CONVENTION:
 *   ALL listing/SEO pages use the flat hyphen pattern as canonical:
 *     ✅  /flats-for-sale-in-noida
 *     ❌  /flats-for-sale-in/noida  (slash form → 301 redirect)
 *
 * NON-LISTING pages that still use directory routes (agents, prices) are
 * rewritten internally from hyphen → slash so Next.js can find them.
 *
 * Auth detection uses the `t4bs_auth` presence cookie (set by AuthContext on
 * login/refresh). NOT a security token — real auth is enforced by the backend.
 */

// ── Private routes ────────────────────────────────────────────────────────────

const PRIVATE_PREFIXES = [
  '/dashboard',
  '/profile',
  '/my-listings',
  '/agent/',
  '/owner',
  '/buyer',
  '/admin',
];

const GUEST_ONLY_PREFIXES = [
  '/auth/login',
  '/auth/register',
];

// ── File-extension cleanup ─────────────────────────────────────────────────────

const STRIPPED_EXTENSIONS = /\.(php|html?|asp|aspx|cfm|cgi|jsp|pl|py|rb|do|action)$/i;

// ── Matcher ───────────────────────────────────────────────────────────────────

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|uploads/).*)',
  ],
};

// ── 301 redirect map: slash-pattern → canonical hyphen-pattern ────────────────
//
// Any URL with a slash separator that was ever indexed or linked will be
// permanently redirected to its canonical hyphen equivalent.
//
// Format: [regex, replacement-string-builder]
// The first capture group is the city/slug after the route prefix.

const SLASH_TO_HYPHEN: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  // ── Listing pages (same prefix, just add dash) ─────────────────────────────
  [/^\/property-for-sale-in\/([^/]+)\/?$/, m => `/property-for-sale-in-${m[1]}`],
  [/^\/property-for-rent-in\/([^/]+)\/?$/, m => `/property-for-rent-in-${m[1]}`],
  [/^\/flats-for-sale-in\/([^/]+)\/?$/, m => `/flats-for-sale-in-${m[1]}`],
  [/^\/flats-for-rent-in\/([^/]+)\/?$/, m => `/flats-for-rent-in-${m[1]}`],
  [/^\/villas-for-sale-in\/([^/]+)\/?$/, m => `/villas-for-sale-in-${m[1]}`],
  [/^\/plots-for-sale-in\/([^/]+)\/?$/, m => `/plots-for-sale-in-${m[1]}`],
  [/^\/commercial-property-in\/([^/]+)\/?$/, m => `/commercial-property-in-${m[1]}`],
  [/^\/office-space-for-rent-in\/([^/]+)\/?$/, m => `/office-space-for-rent-in-${m[1]}`],
  [/^\/new-projects-in\/([^/]+)\/?$/, m => `/new-projects-in-${m[1]}`],
  [/^\/pg-in\/([^/]+)\/?$/, m => `/pg-in-${m[1]}`],
  [/^\/property-in\/([^/]+)\/?$/, m => `/property-in-${m[1]}`],
  // ── Listing pages with prefix change ──────────────────────────────────────
  [/^\/new-projects\/([^/]+)\/?$/, m => `/new-projects-in-${m[1]}`],
  [/^\/flats-for-sale\/([^/]+)\/?$/, m => `/flats-for-sale-in-${m[1]}`],
  [/^\/flats-for-rent\/([^/]+)\/?$/, m => `/flats-for-rent-in-${m[1]}`],
  // ── /buy/* and /rent/* sub-routes ─────────────────────────────────────────
  [/^\/buy\/property-in-([^/]+)\/?$/, m => `/property-for-sale-in-${m[1]}`],
  [/^\/rent\/property-in-([^/]+)\/?$/, m => `/property-for-rent-in-${m[1]}`],
  [/^\/buy\/([^/]+)-in-([^/]+)\/?$/, m => `/${m[1]}-for-sale-in-${m[2]}`],
  [/^\/rent\/([^/]+)-in-([^/]+)\/?$/, m => `/${m[1]}-for-rent-in-${m[2]}`],
  // ── Non-listing slash pages (agents, prices) → canonical hyphen ────────────
  [/^\/property-agents-in\/([^/]+)\/?$/, m => `/property-agents-in-${m[1]}`],
  [/^\/property-prices-in\/([^/]+)\/?$/, m => `/property-prices-in-${m[1]}`],
  // ── Legacy /properties-in/state → /properties-in-state ───────────────────
  [/^\/properties-in\/([^/]+)\/?$/, m => `/properties-in-${m[1]}`],
  // ── /agents-in/city → /agents-in-city ────────────────────────────────────
  [/^\/agents-in\/([^/]+)\/?$/, m => `/agents-in-${m[1]}`],
];

// ── Internal rewrites: hyphen URL → directory route (for non-listing pages) ───
//
// These pages still live in directory-based Next.js routes because they have
// rich page logic (agents search, price charts, etc.).
// The middleware rewrites the canonical hyphen URL internally before routing.

const HYPHEN_TO_SLASH_REWRITES: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
  [/^\/property-agents-in-([^/]+)$/, m => `/property-agents-in/${m[1]}`],
  [/^\/property-prices-in-([^/]+)$/, m => `/property-prices-in/${m[1]}`],
  [/^\/agents-in-([^/]+)$/, m => `/agents-in/${m[1]}`],
  [/^\/properties-in-([^/]+)$/, m => `/properties-in/${m[1]}`],
];

// ── Middleware ────────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Strip file extensions (301) ────────────────────────────────────────
  if (STRIPPED_EXTENSIONS.test(pathname)) {
    const clean = pathname.replace(STRIPPED_EXTENSIONS, '') || '/';
    const url = request.nextUrl.clone();
    url.pathname = clean;
    return NextResponse.redirect(url, 301);
  }

  // ── 2. Slash → hyphen: 301 redirects for all listing & page URLs ──────────
  for (const [re, build] of SLASH_TO_HYPHEN) {
    const m = pathname.match(re);
    if (m) {
      const url = request.nextUrl.clone();
      url.pathname = build(m);
      url.search = '';
      return NextResponse.redirect(url, 301);
    }
  }

  // ── 3a. /agents?city=X → /agents-in-x (301) ─────────────────────────────
  if (pathname === '/agents') {
    const cityParam = request.nextUrl.searchParams.get('city');
    if (cityParam) {
      const citySlug = cityParam.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const url = request.nextUrl.clone();
      url.pathname = `/agents-in-${citySlug}`;
      url.search = '';
      return NextResponse.redirect(url, 301);
    }
  }

  // ── 3b. /properties?city=X → /properties-in-x (301, only when city is the sole param) ──
  if (pathname === '/properties') {
    const sp = request.nextUrl.searchParams;
    const cityParam = sp.get('city');
    if (cityParam) {
      // Only redirect to city homepage when city is the ONLY query param.
      // /properties?city=Delhi&category=buy must reach the listing page, not the city page.
      const keys = [...sp.keys()];
      if (keys.length === 1) {
        const citySlug = cityParam.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const url = request.nextUrl.clone();
        url.pathname = `/properties-in-${citySlug}`;
        url.search = '';
        return NextResponse.redirect(url, 301);
      }
    }
  }

  // ── 3c. /properties?category=X&city=Y[&locality=Z] → canonical SEO URL (301) ─
  //
  // Converts filter-query URLs into hyphen SEO URLs so every category+city
  // (and category+city+locality) combination has a single canonical address.
  //
  // Trigger conditions (per category):
  //   • category + city           → /{prefix}-in-{city}
  //   • category + city + locality → /{prefix}-in-{city}-{locality}
  //
  // Deep filters (type, bedrooms, price range, geo) keep the query-string form
  // because they don't have dedicated SEO pages.
  if (pathname === '/properties' || pathname === '/search') {
    const sp       = request.nextUrl.searchParams;
    const category = sp.get('category');
    const city     = sp.get('city');
    const locality = sp.get('locality');

    // Only redirect when no other deep filter params are present
    const hasDeepFilters =
      sp.get('type') || sp.get('bedrooms') || sp.get('minPrice') ||
      sp.get('maxPrice') || sp.get('lat') || sp.get('isNewProject');

    if (category && city && !hasDeepFilters) {
      const CATEGORY_TO_PREFIX: Record<string, string> = {
        buy:             'property-for-sale-in',
        rent:            'property-for-rent-in',
        pg:              'pg-in',
        commercial:      'commercial-property-in',
        industrial:      'commercial-property-in',
        builder_project: 'new-projects-in',
        new_projects:    'new-projects-in',
      };
      const prefix = CATEGORY_TO_PREFIX[category];
      if (prefix) {
        const toSlug = (s: string) =>
          s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const citySlug     = toSlug(city);
        const localitySlug = locality ? toSlug(locality) : '';
        const seoPath      = localitySlug
          ? `/${prefix}-${citySlug}-${localitySlug}`
          : `/${prefix}-${citySlug}`;
        const url = request.nextUrl.clone();
        url.pathname = seoPath;
        url.search   = '';
        return NextResponse.redirect(url, 301);
      }
    }

    // /search → /properties (preserve all query params)
    if (pathname === '/search') {
      const url = request.nextUrl.clone();
      url.pathname = '/properties';
      return NextResponse.redirect(url, 301);
    }
  }

  // ── 3. Handle /property-in-{slug}: city-only OR city+locality ────────────
  //   /property-in-delhi         → city page
  //   /property-in-delhi-dwarka  → locality page (delhi known city, dwarka locality)
  //   /property-in-navi-mumbai   → city page (compound city slug)
  //   Redirect legacy ?locality= query → clean hyphen URL
  const propInMatch = pathname.match(/^\/property-in-([a-z0-9][a-z0-9-]*)$/);
  if (propInMatch) {
    const slug = propInMatch[1];

    // 301: ?locality=Dwarka → /property-in-delhi-dwarka
    const localityParam = request.nextUrl.searchParams.get('locality');
    if (localityParam) {
      const localitySlug = localityParam.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const url = request.nextUrl.clone();
      url.pathname = `/property-in-${slug}-${localitySlug}`;
      url.search = '';
      return NextResponse.redirect(url, 301);
    }

    // If compound slug — split into city + locality using KNOWN_CITY_SLUGS
    if (!KNOWN_CITY_SLUGS.has(slug)) {
      const parts = slug.split('-');
      for (let i = parts.length - 1; i >= 1; i--) {
        const citySlug     = parts.slice(0, i).join('-');
        const localitySlug = parts.slice(i).join('-');
        if (KNOWN_CITY_SLUGS.has(citySlug)) {
          // Stays on the same hyphen URL — catch-all handles it
          // We just pass through (no rewrite needed for catch-all)
          break;
        }
      }
    }
    // Falls through — catch-all `[...slug]/page.tsx` handles the hyphen URL
  }

  // ── 4. Hyphen → slash internal rewrites (non-listing pages only) ──────────
  for (const [re, build] of HYPHEN_TO_SLASH_REWRITES) {
    const m = pathname.match(re);
    if (m) {
      const url = request.nextUrl.clone();
      url.pathname = build(m);
      return NextResponse.rewrite(url);
    }
  }

  // ── 5. Agent profile: /agents/amit-verma-in-mumbai → /agents/amit-verma/mumbai
  const agentMatch = pathname.match(/^\/agents\/([a-z0-9-]+)-in-([a-z0-9-]+)$/);
  if (agentMatch) {
    const url = request.nextUrl.clone();
    url.pathname = `/agents/${agentMatch[1]}/${agentMatch[2]}`;
    return NextResponse.rewrite(url);
  }

  // ── 6. Auth guards ────────────────────────────────────────────────────────

  const isAuthed =
    request.cookies.get('t4bs_auth')?.value === '1' ||
    !!request.cookies.get('rt')?.value;

  // /post-property → guest landing for unauthenticated users
  const isPostProperty      = pathname.startsWith('/post-property');
  const isPostPropertyGuest = pathname.startsWith('/post-property/guest');

  if (isPostProperty && !isPostPropertyGuest && !isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = '/post-property/guest';
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (isPostPropertyGuest && isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = '/post-property';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Protect private routes — pass intended path as ?redirect= for post-login return
  if (PRIVATE_PREFIXES.some(p => pathname.startsWith(p)) && !isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    // Only store the path (never full URL) to prevent open-redirect attacks
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect logged-in users away from auth pages
  if (GUEST_ONLY_PREFIXES.some(p => pathname.startsWith(p)) && isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
