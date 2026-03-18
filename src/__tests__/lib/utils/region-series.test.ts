import { computeRegionSeries } from '@/lib/utils/region-series'
import type { SeriesData } from '@/lib/data/types'

const makeSeries = (id: string, points: { date: string; value: number }[]): SeriesData => ({
  id,
  name: 'Test',
  units: 'Percent',
  unitsShort: '%',
  frequency: 'monthly',
  source: 'FRED',
  data: points,
  lastUpdated: '2024-01-01T00:00:00Z',
})

describe('computeRegionSeries', () => {
  it('averages matching dates across all member series', () => {
    const result = computeRegionSeries('test', 'Test', [
      makeSeries('A', [{ date: '2024-01-01', value: 4.0 }, { date: '2024-02-01', value: 6.0 }]),
      makeSeries('B', [{ date: '2024-01-01', value: 6.0 }, { date: '2024-02-01', value: 8.0 }]),
    ])
    expect(result.data).toHaveLength(2)
    expect(result.data[0]).toEqual({ date: '2024-01-01', value: 5.0 })
    expect(result.data[1]).toEqual({ date: '2024-02-01', value: 7.0 })
  })

  it('skips null/undefined entries and averages only present states', () => {
    const result = computeRegionSeries('test', 'Test', [
      makeSeries('A', [{ date: '2024-01-01', value: 4.0 }]),
      null,
      undefined,
    ])
    expect(result.data).toHaveLength(1)
    expect(result.data[0]).toEqual({ date: '2024-01-01', value: 4.0 })
  })

  it('sorts output data chronologically', () => {
    const result = computeRegionSeries('test', 'Test', [
      makeSeries('A', [
        { date: '2024-03-01', value: 3.0 },
        { date: '2024-01-01', value: 1.0 },
        { date: '2024-02-01', value: 2.0 },
      ]),
    ])
    expect(result.data.map(d => d.date)).toEqual([
      '2024-01-01',
      '2024-02-01',
      '2024-03-01',
    ])
  })

  it('returns empty data array when all inputs are null or undefined', () => {
    const result = computeRegionSeries('test', 'Test', [null, undefined, null])
    expect(result.data).toHaveLength(0)
    expect(result.id).toBe('test')
    expect(result.name).toBe('Test Unemployment')
  })
})
