/**
 * BFF Cache Invalidation Webhook
 * ─────────────────────────────────────────────────────────────────────────────
 * POST /api/bff/cache-invalidate
 * Body: { resource: "properties" | "agents" | "all", secret: "..." }
 *
 * Called by NestJS backend after property/agent updates.
 * Protected by INVALIDATE_SECRET (shared between NestJS and Next.js).
 */

import { NextRequest, NextResponse } from 'next/server';
import { cacheInvalidate } from '@/lib/cache';

const INVALIDATE_SECRET = process.env.CACHE_INVALIDATE_SECRET ?? '';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resource, secret } = body;

    if (!INVALIDATE_SECRET || secret !== INVALIDATE_SECRET) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    if (resource === 'all') {
      await Promise.all([
        cacheInvalidate('properties:*'),
        cacheInvalidate('agents:*'),
        cacheInvalidate('seo:*'),
      ]);
    } else if (resource === 'properties') {
      await cacheInvalidate('properties:*');
    } else if (resource === 'agents') {
      await cacheInvalidate('agents:*');
    } else {
      await cacheInvalidate(`${resource}:*`);
    }

    return NextResponse.json({ success: true, invalidated: resource });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}
