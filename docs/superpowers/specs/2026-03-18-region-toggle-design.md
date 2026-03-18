# Region Toggle Design Spec

## Goal

Add a States / Regions toggle to the Regional Explorer map. In region mode, US states are grouped into the 4 Census Bureau regions (Northeast, Midwest, South, West), each colored by the simple average of its member states' latest unemployment rates. Clicking any state in a region selects that region and shows a drill-down chart of the region's averaged historical unemployment rate.

## Decisions

- **Region scheme:** US Census Bureau 4 regions (Northeast, Midwest, South, West). DC is classified in South per Census convention.
- **Aggregation:** Simple average of member states' latest values (choropleth color) and month-by-month simple average of historical data (drill-down chart).
- **Toggle placement:** Inside the map card header, top-right, as compact pill buttons — consistent with existing chart control styling.
- **No additional API calls:** Region series are computed client-side from the 51 state series already fetched by `useMultiSeries`.

---

## Architecture

### Files Changed or Created

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/data/census-regions.ts` | Create | 4 Census regions with member FIPS arrays; `getFipsToRegion()` lookup helper |
| `src/lib/utils/region-series.ts` | Create | `computeRegionSeries()` — averages N state series into one SeriesData |
| `src/components/regional/USChoropleth.tsx` | Modify | Replace `selectedFips?: string \| null` with `highlightedFips?: string[]` |
| `src/components/regional/RegionalExplorer.tsx` | Modify | Mode toggle UI, region state, region drill-down wiring |
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

### `src/components/regional/USChoropleth.tsx` — prop rename

Replace `selectedFips?: string | null` with `highlightedFips?: string[]`.

Internal change: `const isSelected = fips === selectedFips` becomes `const isSelected = (highlightedFips ?? []).includes(fips)`.

This is backwards-compatible in effect — passing `[]` or omitting the prop leaves all states unselected.

### `src/components/regional/RegionalExplorer.tsx` — mode toggle + region drill-down

New state:
```typescript
const [mode, setMode] = useState<'states' | 'regions'>('states')
const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null)
```

Module-level constant (stable reference):
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

**State mode** — identical to current behavior. `highlightedFips={selectedFips ? [selectedFips] : []}`.

**Region mode:**
- `choroplethValues`: each state maps to the simple average of its region's member states' latest values
- `highlightedFips`: all FIPS codes in `selectedRegionId`'s region (or `[]`)
- `onStateClick`: maps FIPS → region id via `FIPS_TO_REGION`, calls `setSelectedRegionId`
- Drill-down: `computeRegionSeries(region.id, region.name, memberSeriesData)` passed directly as `data` prop to `ChartWrapper`
- `isLoading={false}`, `isError={false}`, `isStale={false}` for the region chart (data is already in memory)
- Title: `"{Region Name} Unemployment"`, subtitle: `"Simple average of N states"`

**Computing region choropleth values:**
```typescript
const regionAverages = useMemo(() => {
  if (!results) return new Map<string, number | null>()
  return new Map(
    CENSUS_REGIONS.map(region => {
      const memberValues = region.fips
        .map(fips => {
          const idx = STATES.findIndex(s => s.fips === fips)
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

Region choropleth values (each state gets its region's average):
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
- Returns averaged data points for dates present in all series
- Handles missing states (undefined/null entries)
- Sorts output by date
- Returns empty data array when all inputs are null

### `src/__tests__/components/regional/USChoropleth.test.tsx` (update existing)
- Replace `selectedFips` with `highlightedFips` in click test
- Add test: multiple FIPS in `highlightedFips` all render amber

### `src/__tests__/components/regional/RegionalExplorer.test.tsx` (add 3 tests)
- Toggle renders "States" and "Regions" buttons
- Clicking "Regions" button switches to region mode
- In region mode, clicking the choropleth calls `setSelectedRegionId` (not state FIPS)

---

## What Doesn't Change

- `useMultiSeries` and all API routes — no new fetches
- `ChartWrapper` — receives computed data the same way it does in state mode
- `KPIRow`, `FeaturedChart`, all detail pages — untouched
