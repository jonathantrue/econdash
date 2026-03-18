import { kv } from '@vercel/kv'

export function buildCacheKey(...parts: string[]): string {
  return parts.join(':')
}

// Accepts `string` (not `FetchOptions['range']`) intentionally — the ticker route
// passes non-standard values like '60s' which correctly fall through to the 5-minute default.
export function getTtlForRange(range: string): number {
  if (range === '10y' || range === 'max') return 7 * 24 * 60 * 60  // 7 days
  if (range === '5y' || range === '2y') return 24 * 60 * 60         // 24 hours
  return 5 * 60                                                       // 5 minutes (1y, daily)
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    return await kv.get<T>(key)
  } catch {
    // KV unavailable in local dev without env vars — return null (cache miss)
    return null
  }
}

export async function setCached<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    await kv.set(key, value, { ex: ttlSeconds })
  } catch {
    // KV unavailable in local dev — silently skip caching
  }
}
