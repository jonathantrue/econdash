import useSWR from 'swr'
import type { SeriesData, FetchOptions } from '@/lib/data/types'

type Adapter = 'fred'

type SeriesRequest = {
  adapter: Adapter
  seriesId: string
  options?: FetchOptions
}

async function fetchMulti([, requests]: [string, SeriesRequest[]]): Promise<SeriesData[]> {
  const res = await fetch('/api/multi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ series: requests }),
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const json = await res.json() as { results: SeriesData[] }
  return json.results
}

export function useMultiSeries(requests: SeriesRequest[] | null) {
  const key = requests ? ['multi', requests] : null
  const { data, error, isLoading, mutate } = useSWR<SeriesData[]>(key, fetchMulti, {
    revalidateOnFocus: false,
  })

  return {
    results: data ?? null,
    isLoading,
    isError: !!error,
    retry: mutate,
  }
}
