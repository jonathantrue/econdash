# Region Toggle Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a States / Regions toggle to the Regional Explorer so users can view and click into the 4 Census Bureau regions instead of individual states.

**Architecture:** Three tasks: (1) create pure data/utility files (`census-regions.ts`, `region-series.ts`) with TDD; (2) rename `USChoropleth`'s `selectedFips` prop to `highlightedFips?: string[]`; (3) wire mode toggle + region drill-down into `RegionalExplorer`. Region series are computed client-side from the 51 state series already in memory — no new API calls.

**Tech Stack:** TypeScript strict (`noUncheckedIndexedAccess: true`), React 19, Jest + React Testing Library, existing `useMemo` patterns.

---

## Task 1: Census Regions Data + Region Series Utility

**Files:**
- Create: `src/lib/data/census-regions.ts`
- Create: `src/lib/utils/region-series.ts`
- Create: `src/__tests__/lib/utils/region-series.test.ts`

---

- [ ] **Step 1.1: Write failing tests for `computeRegionSeries`**

Create `src/__tests__/lib/utils/region-series.test.ts`:

```typescript
import { computeRegionSeries } from '@/lib/utils/region-series'
import type { SeriesData } from '@/lib/data/types'

const makeSeries = (id: string, points: { date: string; value: number }[]): SeriesData => ({
  id,
  name: 'Test',
  units: 'Percent',
  unitsShort: '%',
  frequency: 'monthly',
  source: 'FRED',
  data: points,
  lastUpdated: '2024-01-01T00:00:00Z',
})

describe('computeRegionSeries', () => {
  it('averages matching dates across all member series', () => {
    const result = computeRegionSeries('test', 'Test', [
      makeSeries('A', [{ date: '2024-01-01', value: 4.0 }, { date: '2024-02-01', value: 6.0 }]),
      makeSeries('B', [{ date: '2024-01-01', value: 6.0 }, { date: '2024-02-01', value: 8.0 }]),
    ])
    expect(result.data).toHaveLength(2)
    expect(result.data[0]).toEqual({ date: '2024-01-01', value: 5.0 })
    expect(result.data[1]).toEqual({ date: '2024-02-01', value: 7.0 })
  })

  it('skips null/undefined entries and averages only present states', () => {
    const result = computeRegionSeries('test', 'Test', [
      makeSeries('A', [{ date: '2024-01-01', value: 4.0 }]),
      null,
      undefined,
    ])
    expect(result.data).toHaveLength(1)
    expect(result.data[0]).toEqual({ date: '2024-01-01', value: 4.0 })
  })

  it('sorts output data chronologically', () => {
    const result = computeRegionSeries('test', 'Test', [
      makeSeries('A', [
        { date: '2024-03-01', value: 3.0 },
        { date: '2024-01-01', value: 1.0 },
        { date: '2024-02-01', value: 2.0 },
      ]),
    ])
    expect(result.data.map(d => d.date)).toEqual([
      '2024-01-01',
      '2024-02-01',
      '2024-03-01',
    ])
  })

  it('returns empty data array when all inputs are null or undefined', () => {
    const result = computeRegionSeries('test', 'Test', [null, undefined, null])
    expect(result.data).toHaveLength(0)
    expect(result.id).toBe('test')
    expect(result.name).toBe('Test Unemployment')
  })
})
```

- [ ] **Step 1.2: Run to confirm failure**

```bash
cd "C:\Users\truej\OneDrive\Desktop\claudecli" && npx jest src/__tests__/lib/utils/region-series.test.ts --no-coverage 2>&1
```

Expected: FAIL — "Cannot find module '@/lib/utils/region-series'"

- [ ] **Step 1.3: Create `src/lib/utils/region-series.ts`**

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
  const dateMap = new Map<string, number[]>()

  for (const series of memberSeriesData) {
    if (!series) continue
    for (const point of series.data) {
      const existing = dateMap.get(point.date) ?? []
      existing.push(point.value)
      dateMap.set(point.date, existing)
    }
  }

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

- [ ] **Step 1.4: Run tests to confirm passing**

```bash
cd "C:\Users\truej\OneDrive\Desktop\claudecli" && npx jest src/__tests__/lib/utils/region-series.test.ts --no-coverage 2>&1
```

Expected: PASS — 4 tests.

- [ ] **Step 1.5: Create `src/lib/data/census-regions.ts`**

```typescript
export type RegionMeta = {
  id: string     // e.g. 'northeast'
  name: string   // e.g. 'Northeast'
  fips: string[] // member state FIPS codes (zero-padded)
}

export const CENSUS_REGIONS: RegionMeta[] = [
  {
    id: 'northeast',
    name: 'Northeast',
    fips: ['09', '23', '25', '33', '34', '36', '42', '44', '50'],
    // CT, ME, MA, NH, NJ, NY, PA, RI, VT
  },
  {
    id: 'midwest',
    name: 'Midwest',
    fips: ['17', '18', '19', '20', '26', '27', '29', '31', '38', '39', '46', '55'],
    // IL, IN, IA, KS, MI, MN, MO, NE, ND, OH, SD, WI
  },
  {
    id: 'south',
    name: 'South',
    fips: ['01', '05', '10', '11', '12', '13', '21', '22', '24', '28', '37', '40', '45', '47', '48', '51', '54'],
    // AL, AR, DE, DC, FL, GA, KY, LA, MD, MS, NC, OK, SC, TN, TX, VA, WV
  },
  {
    id: 'west',
    name: 'West',
    fips: ['02', '04', '06', '08', '15', '16', '30', '32', '35', '41', '49', '53', '56'],
    // AK, AZ, CA, CO, HI, ID, MT, NV, NM, OR, UT, WA, WY
  },
]

/** Returns a Map<fips, regionId> for O(1) state→region lookup. */
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

- [ ] **Step 1.6: TypeScript check**

```bash
cd "C:\Users\truej\OneDrive\Desktop\claudecli" && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 1.7: Full suite — no regressions**

```bash
cd "C:\Users\truej\OneDrive\Desktop\claudecli" && npm test -- --no-coverage 2>&1
```

Expected: all 71 tests pass.

- [ ] **Step 1.8: Commit**

```bash
cd "C:\Users\truej\OneDrive\Desktop\claudecli" && git add src/lib/data/census-regions.ts src/lib/utils/region-series.ts src/__tests__/lib/utils/region-series.test.ts && git commit -m "feat: census regions data + computeRegionSeries utility"
```

---

## Task 2: USChoropleth — `selectedFips` → `highlightedFips` Prop Rename

**Files:**
- Modify: `src/components/regional/USChoropleth.tsx`
- Modify: `src/__tests__/components/regional/USChoropleth.test.tsx`

**Context:** `selectedFips?: string | null` becomes `highlightedFips?: string[]`. The only call site (`RegionalExplorer.tsx`) is updated in Task 3. This is a breaking change — do Task 2 and Task 3 before running a full build.

---

- [ ] **Step 2.1: Read current USChoropleth test to understand what needs updating**

Read `src/__tests__/components/regional/USChoropleth.test.tsx`. Note: none of the existing 4 tests pass `selectedFips`, so no existing tests break. We only need to add the new `highlightedFips` test.

- [ ] **Step 2.2: Add the failing `highlightedFips` test**

Open `src/__tests__/components/regional/USChoropleth.test.tsx` and add this test inside the `describe('USChoropleth', ...)` block after the existing 4 tests:

```typescript
  it('highlights all FIPS in highlightedFips with amber fill', () => {
    const { container } = render(
      <USChoropleth values={[]} highlightedFips={['06', '36']} />
    )
    const paths = container.querySelectorAll('path')
    // Mock topology has features with id 6 (→ '06') and 36 (→ '36'), in that order.
    expect(paths[0]).toHaveAttribute('fill', '#f59e0b')
    expect(paths[1]).toHaveAttribute('fill', '#f59e0b')
  })
```

- [ ] **Step 2.3: Run to confirm failure**

```bash
cd "C:\Users\truej\OneDrive\Desktop\claudecli" && npx jest src/__tests__/components/regional/USChoropleth.test.tsx --no-coverage 2>&1
```

Expected: FAIL on the new test — `highlightedFips` prop not yet recognized.

- [ ] **Step 2.4: Update `src/components/regional/USChoropleth.tsx`**

Read the file first.

Make these two changes:

**Change 1** — In the `USChoroplethProps` type, replace:
```typescript
  selectedFips?: string | null
```
with:
```typescript
  highlightedFips?: string[]
```

**Change 2** — In the destructured props, replace:
```typescript
  selectedFips = null,
```
with:
```typescript
  highlightedFips = [],
```

**Change 3** — In the render body, replace:
```typescript
        const isSelected = fips === selectedFips
```
with:
```typescript
        const isSelected = highlightedFips.includes(fips)
```

- [ ] **Step 2.5: Run USChoropleth tests**

```bash
cd "C:\Users\truej\OneDrive\Desktop\claudecli" && npx jest src/__tests__/components/regional/USChoropleth.test.tsx --no-coverage 2>&1
```

Expected: PASS — 5 tests (4 existing + 1 new).

- [ ] **Step 2.6: Commit**

> **Note:** Do NOT run `tsc --noEmit` here. `RegionalExplorer.tsx` still passes `selectedFips={selectedFips}` which is now a TypeScript error. That call site is fixed in Step 3.3. The TypeScript check at Step 3.6 covers both tasks together.

```bash
cd "C:\Users\truej\OneDrive\Desktop\claudecli" && git add src/components/regional/USChoropleth.tsx src/__tests__/components/regional/USChoropleth.test.tsx && git commit -m "feat: USChoropleth — rename selectedFips to highlightedFips (accepts array)"
```

---

## Task 3: RegionalExplorer — Mode Toggle + Region Drill-Down

**Files:**
- Modify: `src/components/regional/RegionalExplorer.tsx`
- Modify: `src/__tests__/components/regional/RegionalExplorer.test.tsx`

**Context:** This task wires together everything from Tasks 1 and 2. It also fixes the broken call site (`selectedFips={selectedFips}` → `highlightedFips={...}`) left from Task 2.

---

- [ ] **Step 3.1: Write the 3 new failing tests**

Open `src/__tests__/components/regional/RegionalExplorer.test.tsx`.

Add these imports at the top (after existing imports):
```typescript
import { STATES } from '@/lib/data/state-series'
import type { SeriesData } from '@/lib/data/types'
```

Add a `makeMockResults` helper inside the file (before the `describe` block):
```typescript
// Creates 51 mock results aligned with the STATES array order.
function makeMockResults(): SeriesData[] {
  return STATES.map(s => ({
    id: `${s.abbr}UR`,
    name: 'State Unemployment Rate',
    units: 'Percent',
    unitsShort: '%',
    frequency: 'monthly' as const,
    source: 'FRED',
    data: [{ date: '2024-01-01', value: 4.0 }],
    lastUpdated: '2024-01-01T00:00:00Z',
  }))
}
```

Add these 3 tests inside the existing `describe('RegionalExplorer', ...)` block, after the existing 4 tests:

```typescript
  it('renders States and Regions toggle buttons', () => {
    mockUseMultiSeries.mockReturnValue({
      results: null,
      isLoading: false,
      isError: false,
      retry: jest.fn(),
    })
    render(<RegionalExplorer />)
    expect(screen.getByRole('button', { name: /states/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /regions/i })).toBeInTheDocument()
  })

  it('shows "Select a region" placeholder after switching to region mode', () => {
    mockUseMultiSeries.mockReturnValue({
      results: null,
      isLoading: false,
      isError: false,
      retry: jest.fn(),
    })
    render(<RegionalExplorer />)
    fireEvent.click(screen.getByRole('button', { name: /regions/i }))
    expect(screen.getByText(/select a region/i)).toBeInTheDocument()
  })

  it('shows region ChartWrapper when a state is clicked in region mode', () => {
    mockUseMultiSeries.mockReturnValue({
      results: makeMockResults(),
      isLoading: false,
      isError: false,
      retry: jest.fn(),
    })
    render(<RegionalExplorer />)
    fireEvent.click(screen.getByRole('button', { name: /regions/i }))
    // USChoropleth mock fires onStateClick('06') — California → West region
    fireEvent.click(screen.getByTestId('us-choropleth'))
    expect(screen.getByTestId('chart-wrapper')).toBeInTheDocument()
    expect(screen.getByText(/west unemployment/i)).toBeInTheDocument()
  })
```

- [ ] **Step 3.2: Run to confirm failures**

```bash
cd "C:\Users\truej\OneDrive\Desktop\claudecli" && npx jest src/__tests__/components/regional/RegionalExplorer.test.tsx --no-coverage 2>&1
```

Expected: FAIL on the 3 new tests. The existing 4 may also fail due to the `selectedFips` → `highlightedFips` prop rename not yet patched in `RegionalExplorer`. That's expected — fix it all in the next step.

- [ ] **Step 3.3: Replace `src/components/regional/RegionalExplorer.tsx` with the full implementation**

Read the current file first.

Replace the entire file with:

```typescript
'use client'

import { useState, useMemo } from 'react'
import { useMultiSeries } from '@/lib/hooks/useMultiSeries'
import { useSeries } from '@/lib/hooks/useSeries'
import { USChoropleth } from '@/components/regional/USChoropleth'
import { ChartWrapper } from '@/components/charts/ChartWrapper'
import { STATES, STATE_UR_SERIES } from '@/lib/data/state-series'
import { CENSUS_REGIONS, getFipsToRegion } from '@/lib/data/census-regions'
import { computeRegionSeries } from '@/lib/utils/region-series'
import type { FetchOptions } from '@/lib/data/types'

type Range = NonNullable<FetchOptions['range']>
type ChartType = 'line' | 'bar' | 'area'
type Mode = 'states' | 'regions'

// Module-level constants for stable SWR cache key and FIPS lookup.
const STATE_REQUESTS = STATES.map(s => ({
  adapter: 'fred' as const,
  seriesId: STATE_UR_SERIES[s.fips] ?? `${s.abbr}UR`,
  options: { range: '1y' as Range },
}))

const FIPS_TO_REGION = getFipsToRegion()

export function RegionalExplorer() {
  const [mode, setMode] = useState<Mode>('states')
  const [selectedFips, setSelectedFips] = useState<string | null>(null)
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null)
  const [drillRange, setDrillRange] = useState<Range>('5y')
  const [drillChartType, setDrillChartType] = useState<ChartType>('line')
  const [drillRecessionBands, setDrillRecessionBands] = useState(false)

  const { results, isLoading } = useMultiSeries(STATE_REQUESTS)

  // Per-region average of latest values (used to color states in region mode).
  const regionAverages = useMemo(() => {
    if (!results) return new Map<string, number | null>()
    return new Map(
      CENSUS_REGIONS.map(region => {
        const memberValues = region.fips
          .map(fips => {
            const idx = STATES.findIndex(s => s.fips === fips)
            // results[idx] is SeriesData | undefined — no ! assertion needed
            const series = idx >= 0 ? results[idx] : undefined
            const last =
              series && series.data.length > 0
                ? series.data[series.data.length - 1]
                : undefined
            return last?.value ?? null
          })
          .filter((v): v is number => v !== null)
        const avg =
          memberValues.length > 0
            ? memberValues.reduce((a, b) => a + b, 0) / memberValues.length
            : null
        return [region.id, avg] as const
      })
    )
  }, [results])

  // Averaged time-series for the selected region's drill-down chart.
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

  const choroplethValues =
    mode === 'states'
      ? STATES.map((s, i) => ({
          fips: s.fips,
          value: results?.[i]?.data.at(-1)?.value ?? null,
        }))
      : STATES.map(s => ({
          fips: s.fips,
          value: regionAverages.get(FIPS_TO_REGION.get(s.fips) ?? '') ?? null,
        }))

  const highlightedFips =
    mode === 'states'
      ? selectedFips
        ? [selectedFips]
        : []
      : (CENSUS_REGIONS.find(r => r.id === selectedRegionId)?.fips ?? [])

  function handleStateClick(fips: string) {
    if (mode === 'states') {
      setSelectedFips(fips)
    } else {
      setSelectedRegionId(FIPS_TO_REGION.get(fips) ?? null)
    }
  }

  function handleModeChange(newMode: Mode) {
    setMode(newMode)
    setSelectedFips(null)
    setSelectedRegionId(null)
  }

  // State mode — drill-down via useSeries
  const selectedState = STATES.find(s => s.fips === selectedFips) ?? null
  const selectedSeriesId = selectedFips ? (STATE_UR_SERIES[selectedFips] ?? null) : null

  const {
    data: drillData,
    isLoading: drillLoading,
    isError: drillError,
    isStale: drillStale,
    retry: drillRetry,
  } = useSeries(
    selectedSeriesId
      ? { id: selectedSeriesId, adapter: 'fred', options: { range: drillRange } }
      : null
  )

  // Region mode — selected region metadata
  const selectedRegion = CENSUS_REGIONS.find(r => r.id === selectedRegionId) ?? null

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Regional Explorer</h1>
        <p className="text-sm text-slate-500 mt-1">
          {mode === 'states'
            ? 'State unemployment rates — click a state for detail'
            : 'Census region unemployment rates — click a region for detail'}
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-48">
          <div
            role="status"
            className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"
            aria-label="Loading map data"
          />
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              {/* Mode toggle */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Unemployment Rate
                </span>
                <div className="flex bg-slate-100 rounded-md p-0.5 gap-0.5">
                  {(['states', 'regions'] as const).map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => handleModeChange(m)}
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

              <USChoropleth
                values={choroplethValues}
                colorDomain={[2, 8]}
                onStateClick={handleStateClick}
                highlightedFips={highlightedFips}
              />
            </div>
          </div>

          <div>
            {mode === 'states' && selectedState && selectedSeriesId ? (
              <ChartWrapper
                title={`${selectedState.name} Unemployment`}
                subtitle="Seasonally Adjusted"
                seriesId={selectedSeriesId}
                data={drillData}
                isLoading={drillLoading}
                isError={drillError}
                isStale={drillStale}
                onRetry={drillRetry}
                range={drillRange}
                onRangeChange={setDrillRange}
                chartType={drillChartType}
                onChartTypeChange={setDrillChartType}
                recessionBands={drillRecessionBands}
                onRecessionBandsToggle={() => setDrillRecessionBands(b => !b)}
                height={280}
              />
            ) : mode === 'regions' && selectedRegion && selectedRegionSeries ? (
              <ChartWrapper
                title={`${selectedRegion.name} Unemployment`}
                subtitle={`Simple average of ${selectedRegion.fips.length} states · last 12 months`}
                seriesId={selectedRegion.id}
                data={selectedRegionSeries}
                isLoading={false}
                isError={false}
                isStale={false}
                range={drillRange}
                onRangeChange={setDrillRange}
                chartType={drillChartType}
                onChartTypeChange={setDrillChartType}
                recessionBands={drillRecessionBands}
                onRecessionBandsToggle={() => setDrillRecessionBands(b => !b)}
                height={280}
              />
            ) : (
              <div className="flex items-center justify-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-xl min-h-[280px]">
                {mode === 'states'
                  ? 'Select a state to view detail'
                  : 'Select a region to view detail'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3.4: Run RegionalExplorer tests**

```bash
cd "C:\Users\truej\OneDrive\Desktop\claudecli" && npx jest src/__tests__/components/regional/RegionalExplorer.test.tsx --no-coverage 2>&1
```

Expected: PASS — 7 tests (4 existing + 3 new).

- [ ] **Step 3.5: Run full test suite**

```bash
cd "C:\Users\truej\OneDrive\Desktop\claudecli" && npm test -- --no-coverage 2>&1
```

Expected: all 79 tests pass (71 prior + 4 region-series + 1 USChoropleth highlightedFips + 3 RegionalExplorer).

- [ ] **Step 3.6: TypeScript check**

```bash
cd "C:\Users\truej\OneDrive\Desktop\claudecli" && npx tsc --noEmit 2>&1
```

Expected: no errors.

- [ ] **Step 3.7: Build check**

```bash
cd "C:\Users\truej\OneDrive\Desktop\claudecli" && npm run build 2>&1
```

Expected: clean build, all pages listed as static or dynamic.

- [ ] **Step 3.8: Commit**

```bash
cd "C:\Users\truej\OneDrive\Desktop\claudecli" && git add src/components/regional/RegionalExplorer.tsx src/__tests__/components/regional/RegionalExplorer.test.tsx && git commit -m "feat: RegionalExplorer — States/Regions toggle with census region drill-down"
```

- [ ] **Step 3.9: Push**

```bash
cd "C:\Users\truej\OneDrive\Desktop\claudecli" && git push 2>&1
```
