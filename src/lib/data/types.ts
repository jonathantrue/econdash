export type SeriesDataPoint = {
  date: string    // ISO 8601: "2024-01-01"
  value: number
}

export type SeriesData = {
  id: string
  name: string
  source: string
  units: string
  unitsShort: string   // used on chart axes and for dual Y-axis detection
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
  data: SeriesDataPoint[]
  lastUpdated: string  // ISO 8601
}

export type FetchOptions = {
  range?: '1y' | '2y' | '5y' | '10y' | 'max'
  startDate?: string   // ISO 8601 — mutually exclusive with range
  endDate?: string     // ISO 8601 — defaults to today
  frequency?: 'monthly' | 'quarterly' | 'annual'
}
