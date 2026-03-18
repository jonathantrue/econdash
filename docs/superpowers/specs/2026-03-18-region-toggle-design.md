# Region Toggle Design Spec

## Goal

Add a States / Regions toggle to the Regional Explorer map. In region mode, US states are grouped into the 4 Census Bureau regions (Northeast, Midwest, South, West), each colored by the simple average of its member states' latest unemployment rates. Clicking any state in a region selects that region and shows a drill-down chart of the region's averaged historical unemployment rate.

## Decisions

- **Region scheme:** US Census Bureau 4 regions (Northeast, Midwest, South, West). DC is classified in South per Census convention.
- **Aggregation:** Simple average of member states' latest values (choropleth color) and month-by-month simple average of historical data (drill-down chart).
- **Toggle placement:** Inside the map card header, top-right, as compact pill buttons — consistent with existing chart control styling.
- **No additional API calls:** Region series are computed client-side from the 51 state series already fetched by `useMultiSeries`.
- **v1 range limitation:** `STATE_REQUESTS` fetches all state series with `range: '1y'`. The region drill-down chart therefore always shows ~12 months of averaged data. The `DateRangePills` control remains visible (no changes to `ChartWrapper`), but the subtitle reads `"Simple average of N states · last 12 months"` to make the constraint clear to the user.

---

## Architecture

### Files Changed or Created

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/data/census-regions.ts` | Create | 4 Census regions with member FIPS arrays; `getFipsToRegion()` lookup helper |
| `src/lib/utils/region-series.ts` | Create | `computeRegionSeries()` — averages N state series into one SeriesData |
| `src/components/regional/USChoropleth.tsx` | Modify | Breaking prop rename: `selectedFips` → `highlightedFips?: string[]`; update all call sites |
| `src/components/regional/RegionalExplorer.tsx` | Modify | Mode toggle UI, region state, region drill-down wiring; update USChoropleth call site |
| `src/__tests__/lib/utils/region-series.test.ts` | Create | Unit tests for `computeRegionSeries` |
| `src/__tests__/components/regional/USChoropleth.test.tsx` | Modify | Update for `highlightedFips` prop rename |
| `src/__tests__/components/regional/RegionalExplorer.test.tsx` | Modify | Add region mode tests |

---

## Data Layer

### `src/lib/data/census-regions.ts`

```typescript
export type RegionMeta = {
  id: string     // e.g. 'northeast'
  name: string   // e.g. 'Northeast'
  fips: string[] // member state FIPS codes
}

export const CENSUS_REGIONS: RegionMeta[] = [
  {
    id: 'northeast',
    name: 'Northeast',
    fips: ['09','23','25','33','34','36','42','44','50'],
    // CT, ME, MA, NH, NJ, NY, PA, RI, VT
  },
  {
    id: 'midwest',
    name: 'Midwest',
    fips: ['17','18','19','20','26','27','29','31','38','39','46','55'],
    // IL, IN, IA, KS, MI, MN, MO, NE, ND, OH, SD, WI
  },
  {
    id: 'south',
    name: 'South',
    fips: ['01','05','10','11','12','13','21','22','24','28','37','40','45','47','48','51','54'],
    // AL, AR, DE, DC, FL, GA, KY, LA, MD, MS, NC, OK, SC, TN, TX, VA, WV
  },
  {
    id: 'west',
    name: 'West',
    fips: ['02','04','06','08','15','16','30','32','35','41','49','53','56'],
    // AK, AZ, CA, CO, HI, ID, MT, NV, NM, OR, UT, WA, WY
  },
]

// Returns a Map<fips, regionId> for O(1) state→region lookup.
export function getFipsToRegion(): Map<string, string> {
  const map = new Map<string, string>()
  for (const region of CENSUS_REGIONS) {
    for (const fips of region.fips) {
      map.set(fips, region.id)
    }
  }
  return map
}
```

### `src/lib/utils/region-series.ts`

```typescript
import type { SeriesData } from '@/lib/data/types'

/**
 * Averages N state SeriesData arrays month-by-month into a single SeriesData.
 * Only dates present in at least one member series are included.
 * For each date, the average is computed over states that have a value for that date.
 */
export function computeRegionSeries(
  regionId: string,
  regionName: string,
  memberSeriesData: (SeriesData | undefined | null)[],
): SeriesData {
  // Collect all dates and per-date values from all member series
  const dateMap = new Map<string, number[]>()

  for (const series of memberSeriesData) {
    if (!series) continue
    for (const point of series.data) {
      const existing = dateMap.get(point.date) ?? []
      existing.push(point.value)
      dateMap.set(point.date, existing)
    }
  }

  // Sort by date and compute mean
  const data = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({
      date,
      value: values.reduce((sum, v) => sum + v, 0) / values.length,
    }))

  return {
    id: regionId,
    name: `${regionName} Unemployment`,
    units: 'Percent',
    unitsShort: '%',
    frequency: 'monthly',
    source: 'FRED',
    data,
    lastUpdated: new Date().toISOString(),
  }
}
```

---

## Component Changes

### `src/components/regional/USChoropleth.tsx` — prop rename (breaking)

Replace `selectedFips?: string | null` with `highlightedFips?: string[]`.

Internal change: `const isSelected = fips === selectedFips` becomes `const isSelected = (highlightedFips ?? []).includes(fips)`.

**This is a breaking API change.** The only call site is `RegionalExplorer.tsx`. Its existing `selectedFips={selectedFips}` line must change to `highlightedFips={selectedFips ? [selectedFips] : []}` in state mode. No `!` non-null assertion is needed anywhere — `results[idx]` under `noUncheckedIndexedAccess` is already typed `SeriesData | undefined` and the null-guard on `series` handles it.

### `src/components/regional/RegionalExplorer.tsx` — mode toggle + region drill-down

New state:
```typescript
const [mode, setMode] = useState<'states' | 'regions'>('states')
const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null)
```

Module-level constant (stable reference, avoids re-creating the Map on each render):
```typescript
const FIPS_TO_REGION = getFipsToRegion()
```

Toggle UI (inside map card header, top-right):
```tsx
<div className="flex items-center justify-between mb-3">
  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
    Unemployment Rate
  </span>
  <div className="flex bg-slate-100 rounded-md p-0.5 gap-0.5">
    {(['states', 'regions'] as const).map(m => (
      <button
        key={m}
        type="button"
        onClick={() => { setMode(m); setSelectedFips(null); setSelectedRegionId(null) }}
        className={`px-3 py-1 rounded text-[11px] font-medium transition-colors ${
          mode === m
            ? 'bg-white text-blue-700 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        {m.charAt(0).toUpperCase() + m.slice(1)}
      </button>
    ))}
  </div>
</div>
```

**State mode** — identical to current behavior. Pass `highlightedFips={selectedFips ? [selectedFips] : []}` to `USChoropleth`.

**Region mode:**
- `choroplethValues`: each state maps to its region's average (see `regionAverages` memo below)
- `highlightedFips`: all FIPS in the selected region (or `[]`)
- `onStateClick`: maps FIPS → region id via `FIPS_TO_REGION`, calls `setSelectedRegionId`
- Drill-down: `ChartWrapper` with `data={selectedRegionSeries}` (see memo below), `seriesId={region.id}` (e.g. `'northeast'`), `isLoading={false}`, `isError={false}`, `isStale={false}`, no `onRetry`
- Title: `"{Region Name} Unemployment"`, subtitle: `"Simple average of {N} states · last 12 months"`
- The `DateRangePills` control remains visible inside `ChartWrapper` (no changes to `ChartWrapper`). Selecting a different range updates `drillRange` state but does not change the underlying data — the subtitle `"last 12 months"` makes this constraint clear. This is the accepted v1 trade-off.

**Computing region averages (choropleth color in region mode):**
```typescript
const regionAverages = useMemo(() => {
  if (!results) return new Map<string, number | null>()
  return new Map(
    CENSUS_REGIONS.map(region => {
      const memberValues = region.fips
        .map(fips => {
          const idx = STATES.findIndex(s => s.fips === fips)
          // results[idx] is SeriesData | undefined under noUncheckedIndexedAccess — no ! needed
          const series = idx >= 0 ? results[idx] : undefined
          const last = series && series.data.length > 0
            ? series.data[series.data.length - 1]
            : undefined
          return last?.value ?? null
        })
        .filter((v): v is number => v !== null)
      const avg = memberValues.length > 0
        ? memberValues.reduce((a, b) => a + b, 0) / memberValues.length
        : null
      return [region.id, avg] as const
    })
  )
}, [results])
```

**Computing region drill-down series:**
```typescript
const selectedRegionSeries = useMemo(() => {
  if (!selectedRegionId || !results) return null
  const region = CENSUS_REGIONS.find(r => r.id === selectedRegionId)
  if (!region) return null
  const memberSeriesData = region.fips.map(fips => {
    const idx = STATES.findIndex(s => s.fips === fips)
    return idx >= 0 ? results[idx] : undefined
  })
  return computeRegionSeries(region.id, region.name, memberSeriesData)
}, [results, selectedRegionId])
```

**Choropleth values (state vs region mode):**
```typescript
const choroplethValues = mode === 'states'
  ? STATES.map((s, i) => ({ fips: s.fips, value: results?.[i]?.data.at(-1)?.value ?? null }))
  : STATES.map(s => ({
      fips: s.fips,
      value: regionAverages.get(FIPS_TO_REGION.get(s.fips) ?? '') ?? null,
    }))
```

---

## Testing

### `src/__tests__/lib/utils/region-series.test.ts` (new, 4 tests)
- Returns correctly averaged data points when all member series have matching dates
- Handles sparse input: undefined/null entries are skipped; dates missing from some states are averaged over present states only
- Sorts output chronologically when input dates are unordered
- Returns empty `data` array when all inputs are null/undefined

### `src/__tests__/components/regional/USChoropleth.test.tsx` (update existing)
- Replace `selectedFips` prop with `highlightedFips` in the click test
- Add test: multiple FIPS in `highlightedFips` all get amber fill (state `'06'` and `'36'` both highlighted)

### `src/__tests__/components/regional/RegionalExplorer.test.tsx` (add 3 tests)
- Toggle renders both "States" and "Regions" buttons
- Clicking "Regions" button renders the toggle in active state
- In region mode, clicking the choropleth stub triggers region selection (calls into `FIPS_TO_REGION` path, not raw FIPS)

---

## What Doesn't Change

- `useMultiSeries`, all API routes — no new fetches
- `ChartWrapper` — receives computed data the same way as in state mode
- `KPIRow`, `FeaturedChart`, all detail pages — untouched
