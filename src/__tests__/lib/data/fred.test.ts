import { fetchFredSeries, fredRangeToDate } from '@/lib/data/fred'
import type { FetchOptions } from '@/lib/data/types'

// Mock global fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

const MOCK_FRED_RESPONSE = {
  observations: [
    { date: '2019-01-01', value: '1.6' },
    { date: '2020-01-01', value: '2.3' },
    { date: '2021-01-01', value: '1.4' },
    { date: '2022-01-01', value: '8.0' },
    { date: '2023-01-01', value: '3.4' },
    { date: '.', value: '.' },  // missing value — should be filtered
  ],
}

beforeEach(() => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => MOCK_FRED_RESPONSE,
  })
  process.env['FRED_API_KEY'] = 'test_key'
})

afterEach(() => jest.clearAllMocks())

describe('fetchFredSeries', () => {
  it('returns SeriesData with correct shape', async () => {
    const result = await fetchFredSeries('CPIAUCSL', { range: '5y' })
    expect(result.id).toBe('CPIAUCSL')
    expect(result.source).toBe('FRED')
    expect(result.frequency).toBe('monthly')
    expect(result.data).toHaveLength(5) // missing value filtered out
  })

  it('filters out missing values (value === ".")', async () => {
    const result = await fetchFredSeries('CPIAUCSL', { range: '5y' })
    expect(result.data.every(d => typeof d.value === 'number')).toBe(true)
  })

  it('parses observation values as numbers', async () => {
    const result = await fetchFredSeries('CPIAUCSL', { range: '5y' })
    expect(result.data[0]).toEqual({ date: '2019-01-01', value: 1.6 })
  })

  it('calls FRED API with correct params', async () => {
    await fetchFredSeries('CPIAUCSL', { range: '5y' })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('series_id=CPIAUCSL'),
    )
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('api_key=test_key'),
    )
  })

  it('throws if FRED_API_KEY is not set', async () => {
    delete process.env['FRED_API_KEY']
    await expect(fetchFredSeries('CPIAUCSL', {})).rejects.toThrow('FRED_API_KEY')
  })
})

describe('fredRangeToDate', () => {
  it('returns a date string N years ago', () => {
    const result = fredRangeToDate('5y')
    const fiveYearsAgo = new Date()
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
    expect(result).toBe(fiveYearsAgo.toISOString().split('T')[0])
  })

  it('returns undefined for "max"', () => {
    expect(fredRangeToDate('max')).toBeUndefined()
  })
})
