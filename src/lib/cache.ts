import Redis from 'ioredis'

let _client: Redis | null = null

function getClient(): Redis | null {
  if (!process.env.REDIS_URL) return null
  if (!_client) _client = new Redis(process.env.REDIS_URL)
  return _client
}

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
    const client = getClient()
    if (!client) return null
    const raw = await client.get(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function setCached<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    const client = getClient()
    if (!client) return
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds)
  } catch {
    // Redis unavailable — silently skip caching
  }
}
