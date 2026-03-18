import { NextResponse } from 'next/server'
import { fetchFredSeries } from '@/lib/data/fred'
import { getCached, setCached, buildCacheKey, getTtlForRange } from '@/lib/cache'
import type { FetchOptions, SeriesData } from '@/lib/data/types'

type MultiSeriesRequest = {
  adapter: string
  seriesId: string
  options: FetchOptions
}

type MultiRequest = {
  series: MultiSeriesRequest[]
}

type MultiResult = SeriesData | { error: string; id?: string }

const ADAPTER_MAP: Record<string, (id: string, opts: FetchOptions) => Promise<SeriesData>> = {
  fred: fetchFredSeries,
}

export async function POST(request: Request) {
  let body: MultiRequest
  try {
    body = await request.json() as MultiRequest
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!Array.isArray(body.series) || body.series.length === 0) {
    return NextResponse.json({ error: 'body.series must be a non-empty array' }, { status: 400 })
  }

  const results: MultiResult[] = await Promise.all(
    body.series.map(async ({ adapter, seriesId, options }) => {
      const fetchFn = ADAPTER_MAP[adapter]
      if (!fetchFn) return { error: `Unsupported adapter: ${adapter}` }

      const range = options.range ?? '5y'
      const cacheKey = buildCacheKey(adapter, seriesId, range)
      const cached = await getCached<SeriesData>(cacheKey)
      if (cached) return cached

      try {
        const data = await fetchFn(seriesId, options)
        await setCached(cacheKey, data, getTtlForRange(range))
        return data
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Fetch failed', id: seriesId }
      }
    })
  )

  return NextResponse.json({ results })
}
