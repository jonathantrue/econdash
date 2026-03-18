import { buildCacheKey, getTtlForRange } from '@/lib/cache'

describe('buildCacheKey', () => {
  it('builds key from parts', () => {
    expect(buildCacheKey('fred', 'CPIAUCSL', '5y')).toBe('fred:CPIAUCSL:5y')
  })

  it('handles ticker key', () => {
    expect(buildCacheKey('ticker', 'markets', '60s')).toBe('ticker:markets:60s')
  })
})

describe('getTtlForRange', () => {
  it('returns 7 days for long historical ranges', () => {
    expect(getTtlForRange('10y')).toBe(7 * 24 * 60 * 60)
    expect(getTtlForRange('max')).toBe(7 * 24 * 60 * 60)
  })

  it('returns 24 hours for medium ranges', () => {
    expect(getTtlForRange('5y')).toBe(24 * 60 * 60)
    expect(getTtlForRange('2y')).toBe(24 * 60 * 60)
  })

  it('returns 5 minutes for short ranges', () => {
    expect(getTtlForRange('1y')).toBe(5 * 60)
  })
})
