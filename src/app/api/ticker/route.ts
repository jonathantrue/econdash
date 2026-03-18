import { NextResponse } from 'next/server'
import { getCached, setCached, buildCacheKey } from '@/lib/cache'

type TickerItem = { value: number; change: number }

export type TickerData = {
  sp500: TickerItem
  dow: TickerItem
  nasdaq: TickerItem
  yield10y: TickerItem
  wti: TickerItem
  gold: TickerItem
  updatedAt: string
}

const TICKER_TTL = 60  // 60 seconds

function getStubTicker(): TickerData {
  return {
    sp500:    { value: 0, change: 0 },
    dow:      { value: 0, change: 0 },
    nasdaq:   { value: 0, change: 0 },
    yield10y: { value: 0, change: 0 },
    wti:      { value: 0, change: 0 },
    gold:     { value: 0, change: 0 },
    updatedAt: new Date().toISOString(),
  }
}

export async function GET(_request: Request) {
  const cacheKey = buildCacheKey('ticker', 'markets', '60s')
  const cached = await getCached<TickerData>(cacheKey)
  if (cached) return NextResponse.json(cached)

  // TODO (Plan 4): Replace stub with live Alpha Vantage / Polygon.io fetch
  const ticker = getStubTicker()
  await setCached(cacheKey, ticker, TICKER_TTL)
  return NextResponse.json(ticker)
}
