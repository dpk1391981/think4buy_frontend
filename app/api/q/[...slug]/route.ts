/**
 * Internal data handler — server-side only.
 * All browser API calls are routed through here.
 * Adds authentication headers, BFF secret, and HMAC signatures
 * before forwarding to the backend service.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { cookies } from 'next/headers';

// BACKEND_INTERNAL_URL must point to the NestJS backend (e.g. https://api.example.com/api/v1).
// NEXT_PUBLIC_API_URL is the *frontend* URL — never use it as a backend target.
// Falling back to NEXT_PUBLIC_API_URL here would cause the proxy to call itself.
const BACKEND_URL    = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:3001/api/v1';
const BFF_SECRET     = process.env.BFF_INTERNAL_SECRET  ?? '';
const SIGNING_KEY    = process.env.INTERNAL_API_KEY     ?? '';
const SIGNING_SECRET = process.env.INTERNAL_API_SECRET  ?? '';

if (!process.env.BACKEND_INTERNAL_URL) {
  console.warn('[BFF] BACKEND_INTERNAL_URL is not set — falling back to http://localhost:3001/api/v1');
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

  try {
    const contentType = req.headers.get('content-type') ?? '';
    const body = req.method !== 'GET' && req.method !== 'HEAD'
      ? contentType.includes('multipart/form-data')
        ? await req.arrayBuffer()
        : await req.text()
      : undefined;

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
