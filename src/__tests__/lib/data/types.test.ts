import type { SeriesData, SeriesDataPoint, FetchOptions } from '@/lib/data/types'

describe('SeriesData types', () => {
  it('SeriesDataPoint has date and value', () => {
    const point: SeriesDataPoint = { date: '2024-01-01', value: 3.1 }
    expect(point.date).toBe('2024-01-01')
    expect(point.value).toBe(3.1)
  })

  it('SeriesData has required fields', () => {
    const series: SeriesData = {
      id: 'CPIAUCSL',
      name: 'Consumer Price Index',
      source: 'BLS',
      units: 'Percent Change from Year Ago',
      unitsShort: '% YoY',
      frequency: 'monthly',
      data: [{ date: '2024-01-01', value: 3.1 }],
      lastUpdated: '2024-02-15T00:00:00Z',
    }
    expect(series.frequency).toBe('monthly')
  })

  it('FetchOptions range values are valid', () => {
    const opts: FetchOptions = { range: '5y' }
    expect(['1y','2y','5y','10y','max']).toContain(opts.range)
  })
})
