import { GET } from '@/app/api/ticker/route'
import * as cacheModule from '@/lib/cache'

jest.mock('@/lib/cache')

const mockTickerData = {
  sp500:    { value: 5241.32, change: 0.62 },
  dow:      { value: 39127.80, change: 0.25 },
  nasdaq:   { value: 16379.46, change: 0.81 },
  yield10y: { value: 4.42, change: -0.08 },
  wti:      { value: 78.40, change: -0.32 },
  gold:     { value: 2180.50, change: 0.15 },
  updatedAt: new Date().toISOString(),
}

beforeEach(() => {
  jest.mocked(cacheModule.getCached).mockResolvedValue(null)
  jest.mocked(cacheModule.setCached).mockResolvedValue(undefined)
})

afterEach(() => jest.clearAllMocks())

describe('GET /api/ticker', () => {
  it('returns 200 with correct ticker shape', async () => {
    const res = await GET(new Request('http://localhost/api/ticker'))
    expect(res.status).toBe(200)
    const body = await res.json() as Record<string, unknown>
    expect(body).toHaveProperty('sp500')
    expect(body).toHaveProperty('yield10y')
    expect(body).toHaveProperty('updatedAt')
  })

  it('returns cached ticker if available', async () => {
    jest.mocked(cacheModule.getCached).mockResolvedValue(mockTickerData)
    const res = await GET(new Request('http://localhost/api/ticker'))
    expect(res.status).toBe(200)
    const body = await res.json() as typeof mockTickerData
    expect(body.sp500.value).toBe(5241.32)
    expect(cacheModule.setCached).not.toHaveBeenCalled()
  })
})
