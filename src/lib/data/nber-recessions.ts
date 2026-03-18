// NBER-dated US recession periods. Source: https://www.nber.org/research/data/us-business-cycle-expansions-and-contractions
// Each entry: { start, end } as ISO date strings (first day of peak/trough month).
// startTs / endTs are pre-computed Unix timestamps (ms) for use in Recharts ReferenceArea.

export type RecessionPeriod = {
  start: string
  end: string
  startTs: number
  endTs: number
  label: string
}

function ts(iso: string): number {
  return new Date(iso).getTime()
}

export const NBER_RECESSIONS: RecessionPeriod[] = [
  { start: '1969-12-01', end: '1970-11-01', label: '1969–70', startTs: ts('1969-12-01'), endTs: ts('1970-11-01') },
  { start: '1973-11-01', end: '1975-03-01', label: '1973–75', startTs: ts('1973-11-01'), endTs: ts('1975-03-01') },
  { start: '1980-01-01', end: '1980-07-01', label: '1980',    startTs: ts('1980-01-01'), endTs: ts('1980-07-01') },
  { start: '1981-07-01', end: '1982-11-01', label: '1981–82', startTs: ts('1981-07-01'), endTs: ts('1982-11-01') },
  { start: '1990-07-01', end: '1991-03-01', label: '1990–91', startTs: ts('1990-07-01'), endTs: ts('1991-03-01') },
  { start: '2001-03-01', end: '2001-11-01', label: '2001',    startTs: ts('2001-03-01'), endTs: ts('2001-11-01') },
  { start: '2007-12-01', end: '2009-06-01', label: 'GFC',     startTs: ts('2007-12-01'), endTs: ts('2009-06-01') },
  { start: '2020-02-01', end: '2020-04-01', label: 'COVID',   startTs: ts('2020-02-01'), endTs: ts('2020-04-01') },
]
