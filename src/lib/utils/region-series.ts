import type { SeriesData } from '@/lib/data/types'

/**
 * Averages N state SeriesData arrays month-by-month into a single SeriesData.
 * Only dates present in at least one member series are included.
 * For each date, the average is computed over states that have a value for that date.
 */
export function computeRegionSeries(
  regionId: string,
  regionName: string,
  memberSeriesData: (SeriesData | undefined | null)[],
): SeriesData {
  const dateMap = new Map<string, number[]>()

  for (const series of memberSeriesData) {
    if (!series) continue
    for (const point of series.data) {
      const existing = dateMap.get(point.date) ?? []
      existing.push(point.value)
      dateMap.set(point.date, existing)
    }
  }

  const data = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({
      date,
      value: values.reduce((sum, v) => sum + v, 0) / values.length,
    }))

  return {
    id: regionId,
    name: `${regionName} Unemployment`,
    units: 'Percent',
    unitsShort: '%',
    frequency: 'monthly',
    source: 'FRED',
    data,
    lastUpdated: new Date().toISOString(),
  }
}
