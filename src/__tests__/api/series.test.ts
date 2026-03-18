import { GET } from '@/app/api/series/route'
import * as fredModule from '@/lib/data/fred'
import * as cacheModule from '@/lib/cache'

jest.mock('@/lib/data/fred')
jest.mock('@/lib/cache')

const mockSeriesData = {
  id: 'CPIAUCSL',
  name: 'Consumer Price Index',
  source: 'FRED',
  units: 'Index',
  unitsShort: 'Index',
  frequency: 'monthly' as const,
  data: [{ date: '2024-01-01', value: 3.1 }],
  lastUpdated: '2024-02-15T00:00:00Z',
}

beforeEach(() => {
  jest.mocked(cacheModule.getCached).mockResolvedValue(null)  // cache miss
  jest.mocked(cacheModule.setCached).mockResolvedValue(undefined)
  jest.mocked(fredModule.fetchFredSeries).mockResolvedValue(mockSeriesData)
})

afterEach(() => jest.clearAllMocks())

function makeRequest(params: Record<string, string>) {
  const url = new URL('http://localhost/api/series')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new Request(url)
}

describe('GET /api/series', () => {
  it('returns 400 if id param is missing', async () => {
    const res = await GET(makeRequest({}))
    expect(res.status).toBe(400)
    const body = await res.json() as { error: string }
    expect(body.error).toMatch(/id/)
  })

  it('returns 400 if adapter is unsupported', async () => {
    const res = await GET(makeRequest({ id: 'CPIAUCSL', adapter: 'unknown' }))
    expect(res.status).toBe(400)
  })

  it('returns SeriesData from FRED adapter on cache miss', async () => {
    const res = await GET(makeRequest({ id: 'CPIAUCSL', adapter: 'fred', range: '5y' }))
    expect(res.status).toBe(200)
    const body = await res.json() as typeof mockSeriesData
    expect(body.id).toBe('CPIAUCSL')
    expect(fredModule.fetchFredSeries).toHaveBeenCalledWith('CPIAUCSL', { range: '5y', startDate: undefined, endDate: undefined })
  })

  it('returns cached data without calling adapter', async () => {
    jest.mocked(cacheModule.getCached).mockResolvedValue(mockSeriesData)
    const res = await GET(makeRequest({ id: 'CPIAUCSL', adapter: 'fred', range: '5y' }))
    expect(res.status).toBe(200)
    expect(fredModule.fetchFredSeries).not.toHaveBeenCalled()
  })

  it('sets cache after fetching', async () => {
    await GET(makeRequest({ id: 'CPIAUCSL', adapter: 'fred', range: '5y' }))
    expect(cacheModule.setCached).toHaveBeenCalled()
  })
})
