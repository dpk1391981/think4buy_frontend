/**
 * One place that decides which backend the server-side code talks to.
 *
 * Resolution order:
 *   1. BACKEND_INTERNAL_URL            — server-only var; the right answer when
 *                                        the frontend and backend share a host
 *   2. NEXT_PUBLIC_API_BASE_URL/api/v1 — the public backend origin, already
 *                                        required for images
 *   3. http://localhost:3001/api/v1    — local dev only
 *
 * NEXT_PUBLIC_API_URL is the *frontend* URL. It must never be used here: the
 * proxy would end up calling itself.
 */

/** True when this process is a serverless function rather than a long-lived host. */
const IS_SERVERLESS = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;

function isLoopback(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '[::1]';
  } catch {
    return false;
  }
}

/** Rejects '' and anything `new URL()` cannot parse, so `??` cannot pick a dud. */
function usable(raw: string | undefined): string | null {
  const trimmed = raw?.trim().replace(/\/+$/, '');
  if (!trimmed) return null;
  try {
    new URL(trimmed);
    return trimmed;
  } catch {
    console.error(`[backend-url] Ignoring unparseable URL from env: ${trimmed}`);
    return null;
  }
}

function resolve(): string {
  const internal     = usable(process.env.BACKEND_INTERNAL_URL);
  const publicOrigin = usable(process.env.NEXT_PUBLIC_API_BASE_URL);
  const fromPublic   = publicOrigin ? `${publicOrigin}/api/v1` : null;

  // A loopback address can never resolve to the backend from inside a lambda —
  // there is no sibling process on that box. Preferring it there is not a
  // preference, it is a guaranteed connection failure on every single request,
  // surfacing as a blanket 503 across the whole API rather than as anything that
  // points at the cause. Fall through to the public origin instead.
  if (internal && IS_SERVERLESS && isLoopback(internal)) {
    console.error(
      `[backend-url] BACKEND_INTERNAL_URL is ${internal}, which is unreachable from a ` +
      `serverless function. Falling back to ${fromPublic ?? 'the localhost default'}. ` +
      `Set BACKEND_INTERNAL_URL to the public backend origin.`,
    );
    return fromPublic ?? 'http://localhost:3001/api/v1';
  }

  if (internal) {
    // Not something to override — a backend genuinely may live on a custom port —
    // but worth saying out loud, because a port the host firewall drops looks
    // exactly like a hung request from in here.
    if (IS_SERVERLESS) {
      let port = '';
      try { port = new URL(internal).port; } catch { /* already validated */ }
      if (port && port !== '80' && port !== '443') {
        console.warn(
          `[backend-url] BACKEND_INTERNAL_URL targets port ${port}. If that port is not open ` +
          `to the public internet, every proxied request will hang until it times out.`,
        );
      }
    }
    return internal;
  }

  if (fromPublic) return fromPublic;

  console.warn('[backend-url] Neither BACKEND_INTERNAL_URL nor NEXT_PUBLIC_API_BASE_URL is set — falling back to localhost');
  return 'http://localhost:3001/api/v1';
}

/** Backend base, including the `/api/v1` prefix. Resolved once per process. */
export const BACKEND_BASE_URL = resolve();
