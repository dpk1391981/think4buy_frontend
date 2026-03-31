/**
 * Redis KV Cache — Server-Side Only
 * ─────────────────────────────────────────────────────────────────────────────
 * Used exclusively in Next.js Route Handlers and server components (SSR/ISR).
 * Never imported by client components — Redis credentials never reach the browser.
 *
 * Cache key convention:
 *   bff:<resource>:<params-hash>
 *   e.g. bff:properties:city=delhi&type=buy&page=1
 *
 * TTLs:
 *   Property listings  : 5 minutes  (frequently updated)
 *   City/SEO pages     : 30 minutes (changes rarely)
 *   Agent listings     : 15 minutes
 *   Search suggestions : 60 minutes
 */

import { createClient, RedisClientType } from 'redis';
import { createHash } from 'crypto';

let _client: RedisClientType | null = null;
let _connecting = false;

async function getClient(): Promise<RedisClientType | null> {
  if (!process.env.REDIS_URL) return null; // graceful degradation — no Redis = no cache
  if (_client?.isReady) return _client;
  if (_connecting) return null;

  _connecting = true;
  try {
    const client = createClient({ url: process.env.REDIS_URL }) as RedisClientType;
    client.on('error', (err) => console.error('[Cache] Redis error:', err.message));
    await client.connect();
    _client = client;
    return _client;
  } catch (err: any) {
    console.error('[Cache] Redis connect failed:', err.message);
    return null;
  } finally {
    _connecting = false;
  }
}

/** Build a short deterministic key from any params object or string */
export function cacheKey(prefix: string, params: Record<string, any> | string): string {
  const raw = typeof params === 'string' ? params : JSON.stringify(params, Object.keys(params).sort());
  const hash = createHash('md5').update(raw).digest('hex').slice(0, 12);
  return `bff:${prefix}:${hash}`;
}

/**
 * Get a cached value. Returns null on miss or Redis unavailable.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = await getClient();
    if (!client) return null;
    const raw = await client.get(key);
    return typeof raw === 'string' ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Set a cache value with TTL (seconds).
 * Silently fails if Redis is unavailable — caller always gets fresh data.
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    const client = await getClient();
    if (!client) return;
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch {
    // non-fatal
  }
}

/**
 * Invalidate all keys matching a prefix pattern.
 * Call this from webhook handlers or admin actions when data changes.
 * Example: cacheInvalidate('properties:*') after a property is updated.
 */
export async function cacheInvalidate(pattern: string): Promise<void> {
  try {
    const client = await getClient();
    if (!client) return;
    const keys = await client.keys(`bff:${pattern}`);
    if (keys.length > 0) {
      await client.del(keys);
      console.log(`[Cache] Invalidated ${keys.length} keys matching bff:${pattern}`);
    }
  } catch {
    // non-fatal
  }
}

/** Convenience: get-or-set pattern */
export async function cacheGetOrSet<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;

  const fresh = await fetcher();
  await cacheSet(key, fresh, ttlSeconds);
  return fresh;
}

/** TTL constants (seconds) */
export const TTL = {
  PROPERTY_LIST:    5 * 60,   //  5 minutes
  PROPERTY_DETAIL: 10 * 60,   // 10 minutes
  CITY_PAGE:       30 * 60,   // 30 minutes
  AGENT_LIST:      15 * 60,   // 15 minutes
  SEARCH_SUGGEST:  60 * 60,   //  1 hour
  SEO_META:        60 * 60,   //  1 hour
} as const;
