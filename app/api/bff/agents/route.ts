/**
 * BFF Route: Agent Listings
 * ─────────────────────────────────────────────────────────────────────────────
 * GET /api/bff/agents?city=mumbai&page=1&limit=20
 */

import { NextRequest, NextResponse } from 'next/server';
import { bffFetch } from '@/lib/bff-client';
import { sanitizeAgents, type UserRole } from '@/lib/sanitize';
import { cacheGetOrSet, cacheKey, TTL } from '@/lib/cache';
import { headers } from 'next/headers';

function getRoleFromHeaders(hdrs: Headers): UserRole {
  const auth = hdrs.get('authorization');
  if (!auth) return 'anonymous';
  try {
    const payload = JSON.parse(Buffer.from(auth.split('.')[1], 'base64url').toString());
    const role: string = (payload.role ?? '').toLowerCase();
    if (['admin', 'super_admin'].includes(role)) return 'admin';
    if (['agent', 'broker'].includes(role)) return 'agent';
    if (role === 'buyer') return 'buyer';
    return 'buyer';
  } catch {
    return 'anonymous';
  }
}

export async function GET(req: NextRequest) {
  const sp    = req.nextUrl.searchParams;
  const city  = sp.get('city')?.toLowerCase().trim().replace(/[^a-z-]/g, '') ?? '';
  const page  = Math.max(1, Math.min(50, parseInt(sp.get('page') ?? '1', 10)));
  const limit = Math.max(1, Math.min(30, parseInt(sp.get('limit') ?? '12', 10)));

  const hdrs  = await headers();
  const role  = getRoleFromHeaders(hdrs);
  const isAnon = role === 'anonymous';

  const ck = cacheKey('agents', { city, page, limit });

  if (isAnon) {
    const cached = await cacheGetOrSet(ck, TTL.AGENT_LIST, async () => {
      const { data } = await bffFetch<any>('/agency/agents', { params: { city, page, limit } });
      return sanitizeAgents(data?.data ?? data?.agents ?? [], 'anonymous');
    });

    return NextResponse.json(
      { success: true, data: cached },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=120',
        },
      },
    );
  }

  const accessToken = hdrs.get('authorization') ?? undefined;
  const { data } = await bffFetch<any>('/agency/agents', {
    accessToken,
    params: { city, page, limit },
  });
  const sanitized = sanitizeAgents(data?.data ?? data?.agents ?? [], role);
  return NextResponse.json({ success: true, data: sanitized });
}
