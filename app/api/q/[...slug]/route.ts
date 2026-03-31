/**
 * Internal data handler — server-side only.
 * All browser API calls are routed through here.
 * Adds authentication headers, BFF secret, and HMAC signatures
 * before forwarding to the backend service.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { cookies } from 'next/headers';

// Resolution order for the backend URL:
//   1. BACKEND_INTERNAL_URL          — server-only secret var, ideal for prod (e.g. http://127.0.0.1:3001/api/v1)
//   2. NEXT_PUBLIC_API_BASE_URL+/api/v1 — public backend origin already needed for images
//   3. localhost fallback             — local dev only
// NEXT_PUBLIC_API_URL is the *frontend* URL — never use it here (would cause the proxy to call itself).
const _backendOrigin = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '');
const BACKEND_URL =
  process.env.BACKEND_INTERNAL_URL ??
  (_backendOrigin ? `${_backendOrigin}/api/v1` : null) ??
  'http://localhost:3001/api/v1';

const BFF_SECRET     = process.env.BFF_INTERNAL_SECRET  ?? '';
const SIGNING_KEY    = process.env.INTERNAL_API_KEY     ?? '';
const SIGNING_SECRET = process.env.INTERNAL_API_SECRET  ?? '';

if (!process.env.BACKEND_INTERNAL_URL && !process.env.NEXT_PUBLIC_API_BASE_URL) {
  console.warn('[BFF] Neither BACKEND_INTERNAL_URL nor NEXT_PUBLIC_API_BASE_URL is set — falling back to localhost');
}

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

async function handler(req: NextRequest, { params }: { params: { slug: string[] } }) {
  const path   = '/' + (params.slug ?? []).join('/');
  const search = req.nextUrl.search ?? '';
  const target = `${BACKEND_URL}${path}${search}`;

  const authHeader  = req.headers.get('authorization') ?? '';
  const cookieStore = cookies();
  const cookieHeader = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join('; ');

  const forwardHeaders: HeadersInit = {
    'Content-Type':    req.headers.get('content-type') ?? 'application/json',
    'Accept':          'application/json',
    'Accept-Language': req.headers.get('accept-language') ?? 'en-US,en;q=0.9',
    'X-Forwarded-For': req.headers.get('x-forwarded-for') ?? req.ip ?? '',
    'X-Request-ID':    req.headers.get('x-request-id') ?? crypto.randomUUID(),
    ...(BFF_SECRET && { 'X-BFF-Secret': BFF_SECRET }),
    ...(authHeader && { Authorization: authHeader }),
    ...(cookieHeader && { Cookie: cookieHeader }),
    ...buildSignatureHeaders(req.method, path),
  };

  // These endpoints are fire-and-forget — never block the client for them.
  // If the backend is unreachable, acknowledge immediately so the browser
  // does not log 503 errors or stall waiting for non-critical requests.
  const isAnalyticsTrack = path === '/analytics/track';
  const isPropertyView   = req.method === 'POST' && /^\/properties\/[^/]+\/view$/.test(path);
  const isFireAndForget  = isAnalyticsTrack || isPropertyView;

  try {
    const contentType = req.headers.get('content-type') ?? '';
    const body = req.method !== 'GET' && req.method !== 'HEAD'
      ? contentType.includes('multipart/form-data')
        ? await req.arrayBuffer()
        : await req.text()
      : undefined;

    if (isFireAndForget) {
      // Fire-and-forget: respond immediately, send to backend in background
      fetch(target, {
        method:  req.method,
        headers: forwardHeaders,
        body,
        signal:  AbortSignal.timeout(5_000),
      }).catch(() => {});
      return NextResponse.json({ success: true }, { status: 202 });
    }

    const backendRes = await fetch(target, {
      method:  req.method,
      headers: forwardHeaders,
      body,
      signal:  AbortSignal.timeout(30_000),
    });

    const responseBody    = await backendRes.text();
    const responseHeaders = new Headers();

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
    if (isFireAndForget) {
      // Fire-and-forget failures must never surface as errors to the client
      return NextResponse.json({ success: true }, { status: 202 });
    }
    if (err.name === 'TimeoutError') {
      console.error(`[BFF] Timeout: ${req.method} ${target}`);
      return NextResponse.json({ success: false, message: 'Gateway timeout' }, { status: 504 });
    }
    console.error(`[BFF] Upstream error: ${req.method} ${target} — ${err?.message ?? err}`);
    return NextResponse.json({ success: false, message: 'Service unavailable' }, { status: 503 });
  }
}

export const GET    = handler;
export const POST   = handler;
export const PUT    = handler;
export const PATCH  = handler;
export const DELETE = handler;
export const HEAD   = handler;
