import type { SeriesData, FetchOptions } from '@/lib/data/types'

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations'

type SeriesMeta = Pick<SeriesData, 'name' | 'units' | 'unitsShort' | 'frequency'>

// Map FRED series IDs to human-readable metadata
const FRED_SERIES_META: Record<string, SeriesMeta> = {
  CPIAUCSL:  { name: 'Consumer Price Index', units: 'Index 1982-84=100', unitsShort: 'Index', frequency: 'monthly' },
  CPILFESL:  { name: 'Core CPI (ex Food & Energy)', units: 'Index 1982-84=100', unitsShort: 'Index', frequency: 'monthly' },
  PCEPI:     { name: 'PCE Price Index', units: 'Index 2017=100', unitsShort: 'Index', frequency: 'monthly' },
  PCEPILFE:  { name: 'Core PCE Price Index', units: 'Index 2017=100', unitsShort: 'Index', frequency: 'monthly' },
  GDPC1:     { name: 'Real GDP', units: 'Billions of Chained 2017 Dollars', unitsShort: '$B', frequency: 'quarterly' },
  FEDFUNDS:  { name: 'Federal Funds Effective Rate', units: 'Percent', unitsShort: '%', frequency: 'monthly' },
  DGS10:     { name: '10-Year Treasury Yield', units: 'Percent', unitsShort: '%', frequency: 'daily' },
  DGS2:      { name: '2-Year Treasury Yield', units: 'Percent', unitsShort: '%', frequency: 'daily' },
  UNRATE:    { name: 'Unemployment Rate', units: 'Percent', unitsShort: '%', frequency: 'monthly' },
  FIXHAI:    { name: 'Housing Affordability Index', units: 'Index', unitsShort: 'Index', frequency: 'monthly' },
  // Labor
  PAYEMS:       { name: 'Nonfarm Payrolls', units: 'Thousands of Persons', unitsShort: 'K', frequency: 'monthly' },
  CIVPART:      { name: 'Labor Force Participation Rate', units: 'Percent', unitsShort: '%', frequency: 'monthly' },
  U6RATE:       { name: 'U-6 Unemployment Rate', units: 'Percent', unitsShort: '%', frequency: 'monthly' },
  // Markets
  DGS30:        { name: '30-Year Treasury Yield', units: 'Percent', unitsShort: '%', frequency: 'daily' },
  T10Y2Y:       { name: '10Y\u20132Y Treasury Spread', units: 'Percent', unitsShort: '%', frequency: 'daily' },
  // Housing
  MORTGAGE30US: { name: '30-Year Fixed Mortgage Rate', units: 'Percent', unitsShort: '%', frequency: 'weekly' },
  CSUSHPISA:    { name: 'Case-Shiller Home Price Index', units: 'Index Jan 2000=100', unitsShort: 'Index', frequency: 'monthly' },
  HOUST:        { name: 'Housing Starts', units: 'Thousands of Units', unitsShort: 'K units', frequency: 'monthly' },
}

const DEFAULT_META: SeriesMeta = {
  name: 'FRED Series',
  units: 'Value',
  unitsShort: 'Value',
  frequency: 'monthly',
}

export function fredRangeToDate(range: string): string | undefined {
  if (range === 'max') return undefined
  const years = parseInt(range.replace('y', ''), 10)
  if (isNaN(years)) return undefined
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  return d.toISOString().split('T')[0]
}

type FredObservation = { date: string; value: string }
type FredResponse = { observations: FredObservation[] }

export async function fetchFredSeries(seriesId: string, options: FetchOptions): Promise<SeriesData> {
  const apiKey = process.env['FRED_API_KEY']
  if (!apiKey) throw new Error('FRED_API_KEY environment variable is not set')

  const params = new URLSearchParams({
    series_id: seriesId,
    api_key: apiKey,
    file_type: 'json',
  })

  if (options.startDate) {
    params.set('observation_start', options.startDate)
  } else if (options.range) {
    const startDate = fredRangeToDate(options.range)
    if (startDate) params.set('observation_start', startDate)
  }

  if (options.endDate) params.set('observation_end', options.endDate)

  const url = `${FRED_BASE}?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`FRED API error: ${res.status} for series ${seriesId}`)

  const json = await res.json() as FredResponse

  const data = json.observations
    .filter(obs => obs.value !== '.' && obs.date !== '.')
    .map(obs => ({ date: obs.date, value: parseFloat(obs.value) }))

  const meta = FRED_SERIES_META[seriesId] ?? DEFAULT_META

  return {
    id: seriesId,
    ...meta,
    source: 'FRED',
    data,
    lastUpdated: new Date().toISOString(),
  }
}
