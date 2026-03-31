/**
 * BFF Internal Client — Server-Side Only
 * ─────────────────────────────────────────────────────────────────────────────
 * Used by Next.js Route Handlers to call the NestJS backend.
 * This module must NEVER be imported by client components.
 *
 * Features:
 *  - Adds BFF secret header (X-BFF-Secret) so backend can reject direct calls
 *  - Adds HMAC request signature (X-API-KEY, X-TIMESTAMP, X-SIGNATURE)
 *  - Forwards real client IP via X-Forwarded-For
 *  - 30s timeout with descriptive errors
 */

import { createHmac } from 'crypto';

const BACKEND  = process.env.BACKEND_INTERNAL_URL ?? 'http://127.0.0.1:3001/api/v1';
const BFF_SECRET   = process.env.BFF_INTERNAL_SECRET  ?? '';
const SIGNING_KEY  = process.env.INTERNAL_API_KEY      ?? '';
const SIGNING_SECRET = process.env.INTERNAL_API_SECRET ?? '';

function hmacHeaders(method: string, path: string): Record<string, string> {
  if (!SIGNING_KEY || !SIGNING_SECRET) return {};
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload   = `${method}:${path}:${timestamp}`;
  const signature = createHmac('sha256', SIGNING_SECRET).update(payload).digest('hex');
  return { 'X-API-KEY': SIGNING_KEY, 'X-TIMESTAMP': timestamp, 'X-SIGNATURE': signature };
}

export interface BffFetchOptions {
  method?: string;
  body?: unknown;
  accessToken?: string;
  clientIp?: string;
  params?: Record<string, string | number | boolean | undefined>;
}

export async function bffFetch<T = unknown>(
  path: string,
  options: BffFetchOptions = {},
): Promise<{ data: T; status: number }> {
  const { method = 'GET', body, accessToken, clientIp, params } = options;

  // Build query string from params
  const qs = params
    ? '?' + new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== '')
          .map(([k, v]) => [k, String(v)]),
      ).toString()
    : '';

  const url = `${BACKEND}${path}${qs}`;

  const headers: Record<string, string> = {
    'Content-Type':    'application/json',
    'Accept':          'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    ...(BFF_SECRET && { 'X-BFF-Secret': BFF_SECRET }),
    ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
    ...(clientIp && { 'X-Forwarded-For': clientIp }),
    ...hmacHeaders(method, path),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30_000),
    // Node.js fetch: do not reuse connections for backend (keep-alive pooling
    // is handled automatically by the Node.js undici client)
    cache: 'no-store',
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw Object.assign(new Error(`BFF upstream error ${res.status}: ${errText}`), {
      status: res.status,
    });
  }

  const data = (await res.json()) as T;
  return { data, status: res.status };
}
