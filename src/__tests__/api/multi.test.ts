import { POST } from '@/app/api/multi/route'
import * as fredModule from '@/lib/data/fred'
import * as cacheModule from '@/lib/cache'

jest.mock('@/lib/data/fred')
jest.mock('@/lib/cache')

const makeSeries = (id: string) => ({
  id,
  name: id,
  source: 'FRED',
  units: 'Percent',
  unitsShort: '%',
  frequency: 'monthly' as const,
  data: [{ date: '2024-01-01', value: 3.1 }],
  lastUpdated: '2024-02-15T00:00:00Z',
})

beforeEach(() => {
  jest.mocked(cacheModule.getCached).mockResolvedValue(null)
  jest.mocked(cacheModule.setCached).mockResolvedValue(undefined)
  jest.mocked(fredModule.fetchFredSeries).mockImplementation(async (id) => makeSeries(id))
})

afterEach(() => jest.clearAllMocks())

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/multi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/multi', () => {
  it('returns 400 for invalid JSON', async () => {
    const req = new Request('http://localhost/api/multi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 if series array is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns results array matching request order', async () => {
    const res = await POST(makeRequest({
      series: [
        { adapter: 'fred', seriesId: 'CPIAUCSL', options: { range: '5y' } },
        { adapter: 'fred', seriesId: 'UNRATE',   options: { range: '5y' } },
      ],
    }))
    expect(res.status).toBe(200)
    const body = await res.json() as { results: Array<{ id: string }> }
    expect(body.results).toHaveLength(2)
    expect(body.results[0]?.id).toBe('CPIAUCSL')
    expect(body.results[1]?.id).toBe('UNRATE')
  })

  it('returns error object for unsupported adapter without crashing', async () => {
    const res = await POST(makeRequest({
      series: [{ adapter: 'unknown', seriesId: 'X', options: {} }],
    }))
    expect(res.status).toBe(200)
    const body = await res.json() as { results: Array<Record<string, unknown>> }
    expect(body.results[0]).toHaveProperty('error')
  })
})
