/**
 * BFF Route: Property Listings
 * ─────────────────────────────────────────────────────────────────────────────
 * GET /api/bff/properties?city=delhi&type=buy&page=1&limit=20
 *
 * Pipeline:
 *   1. Rate-limit by IP (in-memory; use Redis-backed for multi-node)
 *   2. Check Redis cache — return immediately on hit
 *   3. Call NestJS backend with BFF secret + HMAC headers
 *   4. Sanitize response (strip sensitive fields based on auth role)
 *   5. Write to Redis cache
 *   6. Return sanitized data with cache headers
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { bffFetch } from '@/lib/bff-client';
import { sanitizeProperties, type UserRole } from '@/lib/sanitize';
import { cacheGetOrSet, cacheKey, TTL } from '@/lib/cache';

// ── Per-IP rate limiting (in-memory, single instance) ────────────────────────
// For multi-node deployments: replace with Redis INCR + EXPIRE
const ipWindows = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT   = 60;        // max requests
const RATE_WINDOW  = 60_000;    // per 60 seconds

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const win = ipWindows.get(ip);
  if (!win || now > win.resetAt) {
    ipWindows.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  win.count++;
  return win.count <= RATE_LIMIT;
}

// ── Role detection from JWT (server-side) ─────────────────────────────────────
function getRoleFromHeaders(hdrs: Headers): UserRole {
  // The Authorization header is sent by the Next.js middleware for authenticated
  // requests. We do a lightweight decode (no verify — backend already verified).
  const auth = hdrs.get('authorization');
  if (!auth) return 'anonymous';
  try {
    const payload = JSON.parse(
      Buffer.from(auth.split('.')[1], 'base64url').toString(),
    );
    const role: string = (payload.role ?? '').toLowerCase();
    if (['admin', 'super_admin'].includes(role)) return 'admin';
    if (['agent', 'broker'].includes(role)) return 'agent';
    if (['owner', 'seller'].includes(role)) return 'owner';
    if (role === 'buyer') return 'buyer';
    return 'buyer'; // authenticated but unknown role → buyer tier
  } catch {
    return 'anonymous';
  }
}

export async function GET(req: NextRequest) {
  // ── Rate limiting ──────────────────────────────────────────────────────────
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? '0.0.0.0';

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, message: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  // ── Parse & validate query params ─────────────────────────────────────────
  const sp      = req.nextUrl.searchParams;
  const city    = sp.get('city')?.toLowerCase().trim().replace(/[^a-z-]/g, '') ?? '';
  const type    = ['buy', 'rent', 'pg', 'plot'].includes(sp.get('type') ?? '')
    ? sp.get('type')! : '';
  const page    = Math.max(1, Math.min(100, parseInt(sp.get('page') ?? '1', 10)));
  const limit   = Math.max(1, Math.min(50, parseInt(sp.get('limit') ?? '20', 10)));
  const minPrice = parseInt(sp.get('minPrice') ?? '0', 10) || undefined;
  const maxPrice = parseInt(sp.get('maxPrice') ?? '0', 10) || undefined;
  const bedrooms = parseInt(sp.get('bedrooms') ?? '0', 10) || undefined;
  const sortBy  = ['price', 'date', 'area', 'popular'].includes(sp.get('sortBy') ?? '')
    ? sp.get('sortBy')! : 'date';

  // ── Determine user role (for field sanitization) ───────────────────────────
  const hdrs    = await headers();
  const role    = getRoleFromHeaders(hdrs);
  const accessToken = hdrs.get('authorization') ?? undefined;

  // ── Cache (anonymous requests only — authenticated always get fresh data) ──
  const isAnon  = role === 'anonymous';
  const ck = cacheKey('properties', { city, type, page, limit, minPrice, maxPrice, bedrooms, sortBy });

  if (isAnon) {
    const cached = await cacheGetOrSet(ck, TTL.PROPERTY_LIST, async () => {
      const { data } = await bffFetch<any>('/properties', {
        params: { city, listingType: type, page, limit, minPrice, maxPrice, bedrooms, sortBy },
      });
      return sanitizeProperties(data?.data ?? data?.properties ?? [], 'anonymous');
    });

    return NextResponse.json(
      { success: true, data: cached, cached: true },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
          'CDN-Cache-Control': 'public, max-age=300',
          'Vercel-CDN-Cache-Control': 'public, max-age=300',
        },
      },
    );
  }

  // ── Authenticated: fresh data, sanitized to role ───────────────────────────
  try {
    const { data } = await bffFetch<any>('/properties', {
      accessToken,
      clientIp: ip,
      params: { city, listingType: type, page, limit, minPrice, maxPrice, bedrooms, sortBy },
    });

    const raw = data?.data ?? data?.properties ?? [];
    const sanitized = sanitizeProperties(raw, role);

    return NextResponse.json(
      { success: true, data: sanitized, total: data?.total, page, limit },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch (err: any) {
    const status = err.status ?? 502;
    return NextResponse.json({ success: false, message: 'Failed to fetch properties' }, { status });
  }
}
