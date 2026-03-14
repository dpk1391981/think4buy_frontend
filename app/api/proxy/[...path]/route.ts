/**
 * Next.js API Proxy Route
 * ────────────────────────────────────────────────────────────────────────────
 * Acts as a gateway between the browser and the NestJS backend.
 *
 * Benefits:
 *  • The real backend URL never appears in the browser (only /api/proxy/... is visible)
 *  • We can inject internal API keys / service tokens here transparently
 *  • Request signing headers are added server-side (secrets never reach the browser)
 *  • Auth tokens from cookies are forwarded without JavaScript access
 *
 * Usage from frontend code:
 *   fetch('/api/proxy/properties?limit=10')
 *   // → proxied to: http://backend:3001/api/v1/properties?limit=10
 *
 * Sensitive endpoints (leads, wallet, admin) SHOULD go through this proxy.
 * Public read endpoints (property listings, locations) may call the CDN directly.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { cookies } from 'next/headers';

// The backend is only reachable server-side — never exposed in browser JS
const BACKEND_URL    = process.env.BACKEND_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
const SIGNING_KEY    = process.env.INTERNAL_API_KEY     ?? '';
const SIGNING_SECRET = process.env.INTERNAL_API_SECRET  ?? '';

/** Endpoints that require the proxy (not public CDN-cached routes) */
const PROXY_SENSITIVE_PATHS = ['/leads', '/inquiries', '/wallet', '/admin', '/auth/profile'];

function buildSignatureHeaders(method: string, path: string) {
  if (!SIGNING_KEY || !SIGNING_SECRET) return {};
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload   = `${method}:${path}:${timestamp}`;
  const signature = createHmac('sha256', SIGNING_SECRET).update(payload).digest('hex');
  return {
    'X-API-KEY':   SIGNING_KEY,
    'X-TIMESTAMP': timestamp,
    'X-SIGNATURE': signature,
  };
}

async function handler(req: NextRequest, { params }: { params: { path: string[] } }) {
  const path   = '/' + (params.path ?? []).join('/');
  const search = req.nextUrl.search ?? '';
  const target = `${BACKEND_URL}${path}${search}`;

  // Forward the Authorization header from the incoming request
  const authHeader = req.headers.get('authorization') ?? '';

  // Forward cookies (refresh token is HTTP-only, not accessible from JS)
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  // Build forwarded headers
  const forwardHeaders: HeadersInit = {
    'Content-Type':   req.headers.get('content-type') ?? 'application/json',
    'Accept':         'application/json',
    'Accept-Language': req.headers.get('accept-language') ?? 'en-US,en;q=0.9',
    'X-Forwarded-For': req.headers.get('x-forwarded-for') ?? req.ip ?? '',
    'X-Request-ID':   req.headers.get('x-request-id') ?? crypto.randomUUID(),
    ...(authHeader && { Authorization: authHeader }),
    ...(cookieHeader && { Cookie: cookieHeader }),
    ...buildSignatureHeaders(req.method, path),
  };

  try {
    const body = req.method !== 'GET' && req.method !== 'HEAD'
      ? await req.text()
      : undefined;

    const backendRes = await fetch(target, {
      method:  req.method,
      headers: forwardHeaders,
      body,
      // 30 second timeout
      signal: AbortSignal.timeout(30_000),
    });

    // Forward the response with original status
    const responseBody = await backendRes.text();
    const responseHeaders = new Headers();

    // Forward Set-Cookie headers (so HTTP-only cookies work end-to-end)
    backendRes.headers.forEach((value, key) => {
      if (['set-cookie', 'x-request-id'].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });
    responseHeaders.set('Content-Type', backendRes.headers.get('content-type') ?? 'application/json');

    return new NextResponse(responseBody, {
      status:  backendRes.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    if (err.name === 'TimeoutError') {
      return NextResponse.json({ success: false, message: 'Gateway timeout' }, { status: 504 });
    }
    console.error('[Proxy] Error forwarding request:', err);
    return NextResponse.json({ success: false, message: 'Service unavailable' }, { status: 503 });
  }
}

export const GET    = handler;
export const POST   = handler;
export const PUT    = handler;
export const PATCH  = handler;
export const DELETE = handler;
export const HEAD   = handler;
