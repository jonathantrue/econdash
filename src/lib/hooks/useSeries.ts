import useSWR from 'swr'
import type { SeriesData, FetchOptions } from '@/lib/data/types'

type Adapter = 'fred'

type UseSeriesParams = {
  id: string
  adapter?: Adapter
  options?: FetchOptions
}

async function fetchSeries(key: string): Promise<SeriesData> {
  const res = await fetch(key)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json() as Promise<SeriesData>
}

function buildUrl(params: UseSeriesParams): string {
  const { id, adapter = 'fred', options = {} } = params
  const search = new URLSearchParams({ id, adapter })
  if (options.range) search.set('range', options.range)
  if (options.startDate) search.set('startDate', options.startDate)
  if (options.endDate) search.set('endDate', options.endDate)
  return `/api/series?${search.toString()}`
}

export function useSeries(params: UseSeriesParams | null) {
  const key = params ? buildUrl(params) : null
  const { data, error, isLoading, mutate } = useSWR<SeriesData>(key, fetchSeries, {
    revalidateOnFocus: false,
  })

  const lastUpdated = data?.lastUpdated
  const isStale = lastUpdated
    ? Date.now() - new Date(lastUpdated).getTime() > 2 * 24 * 60 * 60 * 1000
    : false

  return { data: data ?? null, isLoading, isError: !!error, isStale, retry: mutate }
}
