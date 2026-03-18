import { NextResponse } from 'next/server'
import { fetchFredSeries } from '@/lib/data/fred'
import { getCached, setCached, buildCacheKey, getTtlForRange } from '@/lib/cache'
import type { FetchOptions, SeriesData } from '@/lib/data/types'

const SUPPORTED_ADAPTERS = ['fred'] as const
type Adapter = typeof SUPPORTED_ADAPTERS[number]

const ADAPTER_MAP: Record<Adapter, (id: string, opts: FetchOptions) => Promise<SeriesData>> = {
  fred: fetchFredSeries,
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const adapterParam = searchParams.get('adapter') ?? 'fred'
  const adapter = adapterParam as Adapter  // safe: guarded below before use
  const range = (searchParams.get('range') ?? '5y') as FetchOptions['range']
  const startDate = searchParams.get('startDate') ?? undefined
  const endDate = searchParams.get('endDate') ?? undefined

  if (!id) {
    return NextResponse.json({ error: 'Missing required param: id' }, { status: 400 })
  }

  if (!SUPPORTED_ADAPTERS.includes(adapterParam as Adapter)) {
    return NextResponse.json(
      { error: `Unsupported adapter: ${adapter}. Supported: ${SUPPORTED_ADAPTERS.join(', ')}` },
      { status: 400 }
    )
  }

  const cacheKey = buildCacheKey(adapter, id, startDate ? `custom:${startDate}` : (range ?? '5y'))
  const cached = await getCached<SeriesData>(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const fetchFn = ADAPTER_MAP[adapter]
    if (!fetchFn) throw new Error(`No fetch function for adapter: ${adapter}`)
    const data = await fetchFn(id, { range, startDate, endDate })
    const ttl = getTtlForRange(range ?? '5y')
    await setCached(cacheKey, data, ttl)
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
