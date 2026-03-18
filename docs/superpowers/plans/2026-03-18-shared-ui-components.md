# Shared UI Components Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build all shared UI primitives used by every page — Sparkline, KPICard, ChartWrapper (with date range controls, chart type toggle, recession bands, overlay series, rich tooltip, PNG/CSV export, and share URL), plus the Zustand preference store and SWR data-fetching hooks.

**Architecture:** All components are purely presentational — they accept data as props and emit callbacks. Data fetching is the parent's responsibility via two SWR hooks (`useSeries`, `useMultiSeries`) that call the already-built `/api/series` and `/api/multi` routes. `ChartWrapper` is the centrepiece: it composes `DateRangePills`, `ChartTypeToggle`, `RecessionBands`, `RichTooltip`, `ExportButton`, and `ShareButton` into a single drop-in chart widget. The Recharts `XAxis` uses Unix timestamps (not date strings) so `ReferenceArea` recession bands position correctly on the time axis.

**Tech Stack:** Recharts 3, shadcn/ui (skeleton, badge, tooltip), Zustand 5, SWR 2, html2canvas, nuqs 2 (for future URL state wiring — not wired in this plan)

---

## File Map

```
src/
├── lib/
│   ├── store.ts                           # Zustand global prefs store
│   ├── hooks/
│   │   ├── useSeries.ts                   # SWR hook → /api/series
│   │   └── useMultiSeries.ts              # SWR hook → /api/multi
│   └── data/
│       └── nber-recessions.ts             # Static NBER recession date pairs (pre-computed timestamps)
│
├── components/
│   ├── ui/                                # shadcn/ui generated (do not edit manually)
│   │                                      # skeleton.tsx, badge.tsx, tooltip.tsx added by CLI
│   └── charts/
│       ├── Sparkline.tsx                  # Tiny inline line chart — no axes, no tooltip (optional)
│       ├── KPICard.tsx                    # Label + value + delta + sparkline; loading/error states
│       ├── DateRangePills.tsx             # 1Y · 2Y · 5Y · 10Y · Max pill buttons
│       ├── ChartTypeToggle.tsx            # Line / Bar / Area icon toggle
│       ├── RecessionBands.tsx             # NBER ReferenceArea elements for a Recharts chart
│       ├── RichTooltip.tsx                # Custom Recharts Tooltip content component
│       ├── ExportButton.tsx               # PNG (html2canvas) + CSV download menu
│       ├── ShareButton.tsx                # Copy current URL to clipboard
│       └── ChartWrapper.tsx               # Full chart widget — composes all of the above
│
└── __tests__/
    ├── lib/
    │   └── store.test.ts
    └── components/
        └── charts/
            ├── Sparkline.test.tsx
            ├── KPICard.test.tsx
            ├── DateRangePills.test.tsx
            └── ChartWrapper.test.tsx
```

---

## Task 1: Install Dependencies + shadcn/ui Init

**Files:**
- Modify: `package.json` (via npm)
- Modify: `src/app/globals.css` (shadcn appends CSS variables)
- Create: `src/components/ui/skeleton.tsx` (shadcn CLI)
- Create: `src/components/ui/badge.tsx` (shadcn CLI)
- Create: `src/components/ui/tooltip.tsx` (shadcn CLI)
- Create: `components.json` (shadcn config, project root)

- [ ] **Step 1.1: Install SWR and html2canvas**

```bash
npm install swr html2canvas
```

Expected: both added to `dependencies` in `package.json`.

- [ ] **Step 1.2: Initialize shadcn/ui**

Run from the project root (same directory as `package.json`):

```bash
npx shadcn@latest init
```

When prompted:
- **Which style would you like to use?** → Default
- **Which color would you like to use as the base color?** → Slate
- **Would you like to use CSS variables for theming?** → Yes

shadcn will create `components.json` and append CSS variable definitions to `src/app/globals.css`. It will also update `tailwind.config.ts` if one exists — we don't have one (Tailwind 4 uses CSS-first config), so shadcn will operate purely via CSS variables. That's fine.

After init, open `src/app/globals.css` and verify it now contains `--background`, `--primary`, `--card`, etc. CSS variables in the `:root` block. If shadcn replaced your existing minimal `:root`, that's expected — the shadcn variables are a superset.

- [ ] **Step 1.3: Add shadcn components**

```bash
npx shadcn@latest add skeleton badge tooltip
```

Expected: `src/components/ui/skeleton.tsx`, `badge.tsx`, `tooltip.tsx` created.

- [ ] **Step 1.4: Verify TypeScript compiles clean**

```bash
npx tsc --noEmit
```

Expected: no errors. If shadcn generated files reference `cn` from `@/lib/utils` and that file doesn't exist, shadcn should have created it. If not, create `src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

And install the deps:
```bash
npm install clsx tailwind-merge
```

- [ ] **Step 1.5: Commit**

```bash
git add package.json package-lock.json components.json src/app/globals.css src/components/ui/ src/lib/utils.ts
git commit -m "feat: install SWR, html2canvas, shadcn/ui (skeleton, badge, tooltip)"
```

---

## Task 2: NBER Recession Data + Zustand Preference Store

**Files:**
- Create: `src/lib/data/nber-recessions.ts`
- Create: `src/lib/store.ts`
- Create: `src/__tests__/lib/store.test.ts`

### Step 2.1 — Write the failing store test

- [ ] Create `src/__tests__/lib/store.test.ts`:

```typescript
import { usePrefsStore } from '@/lib/store'

describe('usePrefsStore', () => {
  beforeEach(() => {
    usePrefsStore.setState({
      defaultRange: '5y',
      recessionBandsOn: false,
      featuredChartIndex: 0,
    })
  })

  it('has correct initial state', () => {
    const state = usePrefsStore.getState()
    expect(state.defaultRange).toBe('5y')
    expect(state.recessionBandsOn).toBe(false)
    expect(state.featuredChartIndex).toBe(0)
  })

  it('setDefaultRange updates range', () => {
    usePrefsStore.getState().setDefaultRange('10y')
    expect(usePrefsStore.getState().defaultRange).toBe('10y')
  })

  it('toggleRecessionBands flips the value', () => {
    usePrefsStore.getState().toggleRecessionBands()
    expect(usePrefsStore.getState().recessionBandsOn).toBe(true)
    usePrefsStore.getState().toggleRecessionBands()
    expect(usePrefsStore.getState().recessionBandsOn).toBe(false)
  })

  it('setFeaturedChartIndex updates index', () => {
    usePrefsStore.getState().setFeaturedChartIndex(3)
    expect(usePrefsStore.getState().featuredChartIndex).toBe(3)
  })
})
```

- [ ] **Step 2.2: Run the test to confirm it fails**

```bash
npx jest src/__tests__/lib/store.test.ts --no-coverage
```

Expected: FAIL — "Cannot find module '@/lib/store'"

- [ ] **Step 2.3: Create `src/lib/data/nber-recessions.ts`**

```typescript
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
```

- [ ] **Step 2.4: Create `src/lib/store.ts`**

```typescript
import { create } from 'zustand'
import type { FetchOptions } from '@/lib/data/types'

type Range = NonNullable<FetchOptions['range']>

type PrefsState = {
  defaultRange: Range
  recessionBandsOn: boolean
  featuredChartIndex: number
  setDefaultRange: (range: Range) => void
  toggleRecessionBands: () => void
  setFeaturedChartIndex: (index: number) => void
}

export const usePrefsStore = create<PrefsState>()((set) => ({
  defaultRange: '5y',
  recessionBandsOn: false,
  featuredChartIndex: 0,
  setDefaultRange: (range) => set({ defaultRange: range }),
  toggleRecessionBands: () => set((s) => ({ recessionBandsOn: !s.recessionBandsOn })),
  setFeaturedChartIndex: (index) => set({ featuredChartIndex: index }),
}))
```

- [ ] **Step 2.5: Run the test to confirm it passes**

```bash
npx jest src/__tests__/lib/store.test.ts --no-coverage
```

Expected: PASS — 4 tests.

- [ ] **Step 2.6: Commit**

```bash
git add src/lib/store.ts src/lib/data/nber-recessions.ts src/__tests__/lib/store.test.ts
git commit -m "feat: Zustand preference store + NBER recession data"
```

---

## Task 3: Sparkline Component

**Files:**
- Create: `src/components/charts/Sparkline.tsx`
- Create: `src/__tests__/components/charts/Sparkline.test.tsx`

The Sparkline is a bare-bones Recharts `LineChart` — no axes, no grid, no tooltip (unless `showTooltip` is true). Used in KPI cards and regional panel. Fixed dimensions passed as props.

- [ ] **Step 3.1: Write the failing test**

Create `src/__tests__/components/charts/Sparkline.test.tsx`:

```typescript
import React from 'react'
import { render } from '@testing-library/react'
import { Sparkline } from '@/components/charts/Sparkline'
import type { SeriesDataPoint } from '@/lib/data/types'

// Recharts uses ResizeObserver and SVG layout — mock it for jsdom
jest.mock('recharts', () => {
  const React = require('react')
  return {
    LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="sparkline-chart">{children}</div>,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  }
})

const DATA: SeriesDataPoint[] = [
  { date: '2024-01-01', value: 3.1 },
  { date: '2024-02-01', value: 3.2 },
  { date: '2024-03-01', value: 3.0 },
  { date: '2024-04-01', value: 3.4 },
]

describe('Sparkline', () => {
  it('renders without crashing with data', () => {
    const { getByTestId } = render(
      <Sparkline data={DATA} width={60} height={24} />
    )
    expect(getByTestId('sparkline-chart')).toBeInTheDocument()
  })

  it('renders without crashing with empty data', () => {
    const { getByTestId } = render(
      <Sparkline data={[]} width={60} height={24} />
    )
    expect(getByTestId('sparkline-chart')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3.2: Run to confirm failure**

```bash
npx jest src/__tests__/components/charts/Sparkline.test.tsx --no-coverage
```

Expected: FAIL — "Cannot find module '@/components/charts/Sparkline'"

- [ ] **Step 3.3: Implement `src/components/charts/Sparkline.tsx`**

```typescript
'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import type { SeriesDataPoint } from '@/lib/data/types'

type SparklineProps = {
  data: SeriesDataPoint[]
  width: number
  height: number
  color?: string
  showTooltip?: boolean
}

export function Sparkline({ data, width, height, color = '#3b82f6', showTooltip = false }: SparklineProps) {
  const chartData = data.map(pt => ({ ts: new Date(pt.date).getTime(), value: pt.value }))

  return (
    <LineChart width={width} height={height} data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
      <XAxis dataKey="ts" hide />
      <YAxis hide domain={['auto', 'auto']} />
      {showTooltip && <Tooltip formatter={(v: number) => [v.toFixed(2), '']} labelFormatter={() => ''} />}
      <Line
        type="monotone"
        dataKey="value"
        stroke={color}
        strokeWidth={1.5}
        dot={false}
        isAnimationActive={false}
      />
    </LineChart>
  )
}
```

- [ ] **Step 3.4: Run to confirm passing**

```bash
npx jest src/__tests__/components/charts/Sparkline.test.tsx --no-coverage
```

Expected: PASS — 2 tests.

- [ ] **Step 3.5: Commit**

```bash
git add src/components/charts/Sparkline.tsx src/__tests__/components/charts/Sparkline.test.tsx
git commit -m "feat: Sparkline component (Recharts, no axes)"
```

---

## Task 4: KPICard Component

**Files:**
- Create: `src/components/charts/KPICard.tsx`
- Create: `src/__tests__/components/charts/KPICard.test.tsx`

KPICard is purely presentational. Props provide everything — the parent fetches data and passes it in. Shows: label, value with units, delta (▲/▼/─), sparkline. Has loading (skeleton) and error ("—") states.

Delta logic: if `sparklineData` has ≥ 2 points, `delta = last.value - secondToLast.value`. If delta > 0 → ▲ green, delta < 0 → ▼ red, delta === 0 → ─ slate.

- [ ] **Step 4.1: Write the failing test**

Create `src/__tests__/components/charts/KPICard.test.tsx`:

```typescript
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KPICard } from '@/components/charts/KPICard'
import type { SeriesDataPoint } from '@/lib/data/types'

jest.mock('recharts', () => {
  const React = require('react')
  return {
    LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  }
})

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }))

const DATA: SeriesDataPoint[] = [
  { date: '2024-01-01', value: 3.1 },
  { date: '2024-02-01', value: 3.4 },
]

describe('KPICard', () => {
  it('shows skeleton when loading', () => {
    const { container } = render(
      <KPICard label="CPI" href="/macro" isLoading isError={false} />
    )
    // shadcn Skeleton renders a div with animate-pulse
    expect(container.querySelector('[class*="animate-pulse"]')).toBeInTheDocument()
  })

  it('shows dash when error', () => {
    render(<KPICard label="CPI" href="/macro" isLoading={false} isError value={undefined} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows value and label', () => {
    render(
      <KPICard
        label="CPI"
        href="/macro"
        isLoading={false}
        isError={false}
        value={3.4}
        unitsShort="% YoY"
        sparklineData={DATA}
      />
    )
    expect(screen.getByText('CPI')).toBeInTheDocument()
    expect(screen.getByText('3.40')).toBeInTheDocument()
  })

  it('shows up arrow when delta is positive', () => {
    render(
      <KPICard
        label="CPI"
        href="/macro"
        isLoading={false}
        isError={false}
        value={3.4}
        sparklineData={DATA}
      />
    )
    expect(screen.getByText('▲')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = jest.fn()
    render(
      <KPICard
        label="CPI"
        href="/macro"
        isLoading={false}
        isError={false}
        value={3.4}
        onClick={onClick}
      />
    )
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 4.2: Run to confirm failure**

```bash
npx jest src/__tests__/components/charts/KPICard.test.tsx --no-coverage
```

Expected: FAIL.

- [ ] **Step 4.3: Implement `src/components/charts/KPICard.tsx`**

```typescript
'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Sparkline } from '@/components/charts/Sparkline'
import type { SeriesDataPoint } from '@/lib/data/types'

type KPICardProps = {
  label: string
  href: string
  value?: number
  unitsShort?: string
  sparklineData?: SeriesDataPoint[]
  isLoading: boolean
  isError: boolean
  onClick?: () => void
}

function getDelta(data: SeriesDataPoint[]): number | null {
  if (data.length < 2) return null
  const last = data[data.length - 1]
  const prev = data[data.length - 2]
  if (!last || !prev) return null
  return last.value - prev.value
}

function DeltaIndicator({ delta }: { delta: number | null }) {
  if (delta === null) return <span className="text-slate-400 text-xs">─</span>
  if (delta > 0) return <span className="text-green-600 text-xs">▲</span>
  if (delta < 0) return <span className="text-red-600 text-xs">▼</span>
  return <span className="text-slate-400 text-xs">─</span>
}

export function KPICard({ label, href, value, unitsShort, sparklineData = [], isLoading, isError, onClick }: KPICardProps) {
  const delta = getDelta(sparklineData)

  const handleClick = () => {
    if (onClick) onClick()
    else window.location.href = href
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-full" />
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col gap-1 text-left hover:border-blue-300 hover:shadow-sm transition-all w-full"
    >
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      <div className="flex items-baseline gap-1.5">
        {isError ? (
          <span className="text-2xl font-bold text-slate-400">—</span>
        ) : (
          <>
            <span className="text-2xl font-bold text-slate-900">
              {value !== undefined ? value.toFixed(2) : '—'}
            </span>
            {unitsShort && <span className="text-xs text-slate-400">{unitsShort}</span>}
            <DeltaIndicator delta={delta} />
          </>
        )}
      </div>
      {sparklineData.length > 0 && !isError && (
        <div className="mt-1">
          <Sparkline data={sparklineData.slice(-4)} width={60} height={24} />
        </div>
      )}
    </button>
  )
}
```

- [ ] **Step 4.4: Run to confirm passing**

```bash
npx jest src/__tests__/components/charts/KPICard.test.tsx --no-coverage
```

Expected: PASS — 5 tests.

- [ ] **Step 4.5: Commit**

```bash
git add src/components/charts/KPICard.tsx src/__tests__/components/charts/KPICard.test.tsx
git commit -m "feat: KPICard component with loading/error/delta states"
```

---

## Task 5: useSeries + useMultiSeries Hooks

**Files:**
- Create: `src/lib/hooks/useSeries.ts`
- Create: `src/lib/hooks/useMultiSeries.ts`

These are thin SWR wrappers over the `/api/series` and `/api/multi` routes. No test file needed for hooks that are essentially a fetch call — the API routes are already tested.

- [ ] **Step 5.1: Create `src/lib/hooks/useSeries.ts`**

```typescript
import useSWR from 'swr'
import type { SeriesData, FetchOptions } from '@/lib/data/types'

type Adapter = 'fred'

type UseSeriesParams = {
  id: string
  adapter?: Adapter
  options?: FetchOptions
}

async function fetchSeries(key: string): Promise<SeriesData> {
  const res = await fetch(key)
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json() as Promise<SeriesData>
}

function buildUrl(params: UseSeriesParams): string {
  const { id, adapter = 'fred', options = {} } = params
  const search = new URLSearchParams({ id, adapter })
  if (options.range) search.set('range', options.range)
  if (options.startDate) search.set('startDate', options.startDate)
  if (options.endDate) search.set('endDate', options.endDate)
  return `/api/series?${search.toString()}`
}

export function useSeries(params: UseSeriesParams | null) {
  const key = params ? buildUrl(params) : null
  const { data, error, isLoading, mutate } = useSWR<SeriesData>(key, fetchSeries, {
    revalidateOnFocus: false,
  })

  const lastUpdated = data?.lastUpdated
  const isStale = lastUpdated
    ? Date.now() - new Date(lastUpdated).getTime() > 2 * 24 * 60 * 60 * 1000
    : false

  return { data: data ?? null, isLoading, isError: !!error, isStale, retry: mutate }
}
```

- [ ] **Step 5.2: Create `src/lib/hooks/useMultiSeries.ts`**

```typescript
import useSWR from 'swr'
import type { SeriesData, FetchOptions } from '@/lib/data/types'

type Adapter = 'fred'

type SeriesRequest = {
  adapter: Adapter
  seriesId: string
  options?: FetchOptions
}

async function fetchMulti([, requests]: [string, SeriesRequest[]]): Promise<SeriesData[]> {
  const res = await fetch('/api/multi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ series: requests }),
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  const json = await res.json() as { results: SeriesData[] }
  return json.results
}

export function useMultiSeries(requests: SeriesRequest[] | null) {
  const key = requests ? ['multi', requests] : null
  const { data, error, isLoading, mutate } = useSWR<SeriesData[]>(key, fetchMulti, {
    revalidateOnFocus: false,
  })

  return {
    results: data ?? null,
    isLoading,
    isError: !!error,
    retry: mutate,
  }
}
```

- [ ] **Step 5.3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5.4: Commit**

```bash
git add src/lib/hooks/
git commit -m "feat: useSeries + useMultiSeries SWR hooks"
```

---

## Task 6: DateRangePills + ChartTypeToggle

**Files:**
- Create: `src/components/charts/DateRangePills.tsx`
- Create: `src/components/charts/ChartTypeToggle.tsx`
- Create: `src/__tests__/components/charts/DateRangePills.test.tsx`

- [ ] **Step 6.1: Write the failing test**

Create `src/__tests__/components/charts/DateRangePills.test.tsx`:

```typescript
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateRangePills } from '@/components/charts/DateRangePills'

describe('DateRangePills', () => {
  it('renders all 5 range options', () => {
    render(<DateRangePills value="5y" onChange={jest.fn()} />)
    expect(screen.getByText('1Y')).toBeInTheDocument()
    expect(screen.getByText('2Y')).toBeInTheDocument()
    expect(screen.getByText('5Y')).toBeInTheDocument()
    expect(screen.getByText('10Y')).toBeInTheDocument()
    expect(screen.getByText('Max')).toBeInTheDocument()
  })

  it('highlights the active range', () => {
    render(<DateRangePills value="5y" onChange={jest.fn()} />)
    const active = screen.getByText('5Y').closest('button')
    expect(active?.className).toContain('bg-blue-800')
  })

  it('calls onChange with the selected range', async () => {
    const onChange = jest.fn()
    render(<DateRangePills value="5y" onChange={onChange} />)
    await userEvent.click(screen.getByText('10Y'))
    expect(onChange).toHaveBeenCalledWith('10y')
  })
})
```

- [ ] **Step 6.2: Run to confirm failure**

```bash
npx jest src/__tests__/components/charts/DateRangePills.test.tsx --no-coverage
```

- [ ] **Step 6.3: Implement `src/components/charts/DateRangePills.tsx`**

```typescript
'use client'

import type { FetchOptions } from '@/lib/data/types'

type Range = NonNullable<FetchOptions['range']>

const RANGES: { label: string; value: Range }[] = [
  { label: '1Y', value: '1y' },
  { label: '2Y', value: '2y' },
  { label: '5Y', value: '5y' },
  { label: '10Y', value: '10y' },
  { label: 'Max', value: 'max' },
]

type DateRangePillsProps = {
  value: Range
  onChange: (range: Range) => void
}

export function DateRangePills({ value, onChange }: DateRangePillsProps) {
  return (
    <div className="flex items-center gap-1">
      {RANGES.map(r => (
        <button
          key={r.value}
          type="button"
          onClick={() => onChange(r.value)}
          className={
            r.value === value
              ? 'px-2 py-0.5 rounded text-xs font-medium bg-blue-800 text-white'
              : 'px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200'
          }
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 6.4: Implement `src/components/charts/ChartTypeToggle.tsx`**

No test needed (single-level rendering, same pattern as DateRangePills):

```typescript
'use client'

type ChartType = 'line' | 'bar' | 'area'

const TYPES: { label: string; value: ChartType; icon: string }[] = [
  { label: 'Line', value: 'line', icon: '╱' },
  { label: 'Bar', value: 'bar', icon: '▬' },
  { label: 'Area', value: 'area', icon: '▲' },
]

type ChartTypeToggleProps = {
  value: ChartType
  onChange: (type: ChartType) => void
}

export function ChartTypeToggle({ value, onChange }: ChartTypeToggleProps) {
  return (
    <div className="flex items-center gap-1 border-l border-slate-200 pl-2 ml-1">
      {TYPES.map(t => (
        <button
          key={t.value}
          type="button"
          title={t.label}
          onClick={() => onChange(t.value)}
          className={
            t.value === value
              ? 'px-1.5 py-0.5 rounded text-xs bg-blue-800 text-white'
              : 'px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-600 hover:bg-slate-200'
          }
        >
          {t.icon}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 6.5: Run tests to confirm passing**

```bash
npx jest src/__tests__/components/charts/DateRangePills.test.tsx --no-coverage
```

Expected: PASS — 3 tests.

- [ ] **Step 6.6: Commit**

```bash
git add src/components/charts/DateRangePills.tsx src/components/charts/ChartTypeToggle.tsx src/__tests__/components/charts/DateRangePills.test.tsx
git commit -m "feat: DateRangePills + ChartTypeToggle components"
```

---

## Task 7: RecessionBands + RichTooltip

**Files:**
- Create: `src/components/charts/RecessionBands.tsx`
- Create: `src/components/charts/RichTooltip.tsx`

These are Recharts child components — they render inside a chart's JSX tree. No standalone tests (they're tested as part of ChartWrapper).

- [ ] **Step 7.1: Create `src/components/charts/RecessionBands.tsx`**

RecessionBands renders a `ReferenceArea` for each NBER recession period that overlaps the chart's visible date range.

```typescript
import { ReferenceArea } from 'recharts'
import { NBER_RECESSIONS } from '@/lib/data/nber-recessions'

type RecessionBandsProps = {
  domainStart: number  // Unix ms — leftmost timestamp visible in chart
  domainEnd: number    // Unix ms — rightmost timestamp visible in chart
}

export function RecessionBands({ domainStart, domainEnd }: RecessionBandsProps) {
  const visible = NBER_RECESSIONS.filter(
    r => r.endTs >= domainStart && r.startTs <= domainEnd
  )

  return (
    <>
      {visible.map(r => (
        <ReferenceArea
          key={r.label}
          x1={Math.max(r.startTs, domainStart)}
          x2={Math.min(r.endTs, domainEnd)}
          fill="#94a3b8"
          fillOpacity={0.15}
          strokeOpacity={0}
          label={undefined}
        />
      ))}
    </>
  )
}
```

- [ ] **Step 7.2: Create `src/components/charts/RichTooltip.tsx`**

A custom Recharts `<Tooltip content={...}>` renderer. Spec requires: date, value per series, YoY % change (if monthly or quarterly), and source name.

YoY is pre-computed in ChartWrapper's `chartData` and stored as a `yoyChange: number | null` field on each data point. The tooltip reads it from `payload[n].payload.yoyChange` — no extra calculation needed here.

```typescript
'use client'

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RichTooltipProps = {
  active?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[]
  label?: number
  primaryLabel?: string
  primaryUnitsShort?: string
  primarySource?: string
  overlayLabel?: string
  overlayUnitsShort?: string
  overlaySource?: string
}

export function RichTooltip({
  active,
  payload,
  label,
  primaryLabel = 'Value',
  primaryUnitsShort = '',
  primarySource,
  overlayLabel,
  overlayUnitsShort = '',
  overlaySource,
}: RichTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const primary = payload.find((p: { dataKey: string }) => p.dataKey === 'value')
  const overlay = payload.find((p: { dataKey: string }) => p.dataKey === 'overlayValue')
  // yoyChange is stored on each chartData point and accessible via payload[].payload
  const yoyChange: number | null = primary?.payload?.yoyChange ?? null

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs min-w-[160px]">
      <p className="font-semibold text-slate-700 mb-2">{formatDate(Number(label))}</p>
      {primary && primary.value !== undefined && (
        <div className="mb-1">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">{primaryLabel}</span>
            <span className="font-medium text-slate-900">
              {Number(primary.value).toFixed(2)}{primaryUnitsShort ? ` ${primaryUnitsShort}` : ''}
            </span>
          </div>
          {yoyChange !== null && (
            <div className="flex justify-between gap-4 text-slate-400 mt-0.5">
              <span>YoY</span>
              <span className={yoyChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                {yoyChange >= 0 ? '+' : ''}{yoyChange.toFixed(2)}%
              </span>
            </div>
          )}
          {primarySource && (
            <div className="text-slate-300 mt-0.5 text-right">{primarySource}</div>
          )}
        </div>
      )}
      {overlay && overlay.value !== undefined && (
        <div className="border-t border-slate-100 pt-1 mt-1">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">{overlayLabel ?? 'Overlay'}</span>
            <span className="font-medium text-red-700">
              {Number(overlay.value).toFixed(2)}{overlayUnitsShort ? ` ${overlayUnitsShort}` : ''}
            </span>
          </div>
          {overlaySource && (
            <div className="text-slate-300 mt-0.5 text-right">{overlaySource}</div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7.3: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 7.4: Commit**

```bash
git add src/components/charts/RecessionBands.tsx src/components/charts/RichTooltip.tsx
git commit -m "feat: RecessionBands + RichTooltip Recharts components"
```

---

## Task 8: ExportButton + ShareButton

**Files:**
- Create: `src/components/charts/ExportButton.tsx`
- Create: `src/components/charts/ShareButton.tsx`

- [ ] **Step 8.1: Create `src/components/charts/ExportButton.tsx`**

Two export modes: PNG (html2canvas captures a DOM element) and CSV (generates a text blob). The parent passes a `chartRef` (the container to capture) and `seriesData` + `seriesId` + `range` for naming.

```typescript
'use client'

import { useRef } from 'react'
import type { SeriesData } from '@/lib/data/types'

type ExportButtonProps = {
  chartRef: React.RefObject<HTMLDivElement | null>
  seriesData: SeriesData | null
  range: string
}

async function exportPng(el: HTMLElement, seriesId: string, range: string) {
  const html2canvas = (await import('html2canvas')).default
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false })
  const link = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  link.download = `econdash-${seriesId}-${range}-${date}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

function exportCsv(data: SeriesData, range: string) {
  const rows = ['date,value', ...data.data.map(pt => `${pt.date},${pt.value}`)]
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `econdash-${data.id}-${range}.csv`
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}

export function ExportButton({ chartRef, seriesData, range }: ExportButtonProps) {
  const handlePng = () => {
    if (!chartRef.current || !seriesData) return
    void exportPng(chartRef.current, seriesData.id, range)
  }

  const handleCsv = () => {
    if (!seriesData) return
    exportCsv(seriesData, range)
  }

  return (
    <div className="relative group">
      <button
        type="button"
        title="Export"
        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs"
      >
        ⬇
      </button>
      <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded shadow-lg z-10 hidden group-hover:block min-w-[100px]">
        <button
          type="button"
          onClick={handlePng}
          className="block w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
        >
          Export PNG
        </button>
        <button
          type="button"
          onClick={handleCsv}
          className="block w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
        >
          Export CSV
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 8.2: Create `src/components/charts/ShareButton.tsx`**

Copies the current page URL (including any nuqs query params) to clipboard.

```typescript
'use client'

import { useState } from 'react'

export function ShareButton() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available (e.g., non-HTTPS in dev) — silent fail
    }
  }

  return (
    <button
      type="button"
      title="Copy link"
      onClick={() => void handleCopy()}
      className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs"
    >
      {copied ? '✓' : '🔗'}
    </button>
  )
}
```

- [ ] **Step 8.3: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 8.4: Commit**

```bash
git add src/components/charts/ExportButton.tsx src/components/charts/ShareButton.tsx
git commit -m "feat: ExportButton (PNG + CSV) + ShareButton"
```

---

## Task 9: ChartWrapper

**Files:**
- Create: `src/components/charts/ChartWrapper.tsx`
- Create: `src/__tests__/components/charts/ChartWrapper.test.tsx`

ChartWrapper is the main chart widget. It composes all previous components. The parent passes:
- `data: SeriesData | null` — primary series
- `isLoading`, `isError`, `isStale`, `onRetry`
- `overlay?: SeriesData | null` — optional overlay series
- `overlayOptions?: Array<{id: string, name: string, adapter: string}>` — available overlays to show in the "Add overlay" menu
- `onOverlaySelect?: (id: string | null) => void`
- `range`, `onRangeChange`, `chartType`, `onChartTypeChange`
- `recessionBands`, `onRecessionBandsToggle`
- `title`, `subtitle?`
- `seriesId` — used for export filenames

The chart converts dates to Unix timestamps and uses a numeric x-axis (type="number") so `ReferenceArea` positions correctly.

For overlay: the chart merges primary + overlay data by date into a single `chartData` array with both `value` and `overlayValue` keys. When both series are present and their `unitsShort` differ, a right Y-axis is added.

- [ ] **Step 9.1: Write the failing test**

Create `src/__tests__/components/charts/ChartWrapper.test.tsx`:

```typescript
import React from 'react'
import { render, screen } from '@testing-library/react'
import { ChartWrapper } from '@/components/charts/ChartWrapper'
import type { SeriesData } from '@/lib/data/types'

jest.mock('recharts', () => {
  const React = require('react')
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
    BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
    AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
    Line: () => null,
    Bar: () => null,
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    ReferenceArea: () => null,
    Legend: () => null,
  }
})

const SERIES: SeriesData = {
  id: 'CPIAUCSL',
  name: 'Consumer Price Index',
  source: 'FRED',
  units: 'Index',
  unitsShort: 'Index',
  frequency: 'monthly',
  lastUpdated: new Date().toISOString(),
  data: [
    { date: '2024-01-01', value: 310 },
    { date: '2024-02-01', value: 311 },
    { date: '2024-03-01', value: 312 },
  ],
}

const BASE_PROPS = {
  title: 'Consumer Price Index',
  seriesId: 'CPIAUCSL',
  range: '5y' as const,
  onRangeChange: jest.fn(),
  chartType: 'line' as const,
  onChartTypeChange: jest.fn(),
  recessionBands: false,
  onRecessionBandsToggle: jest.fn(),
}

describe('ChartWrapper', () => {
  it('shows spinner when loading', () => {
    render(<ChartWrapper {...BASE_PROPS} data={null} isLoading isError={false} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows error message with retry when error', () => {
    const onRetry = jest.fn()
    render(<ChartWrapper {...BASE_PROPS} data={null} isLoading={false} isError onRetry={onRetry} />)
    expect(screen.getByText(/could not load data/i)).toBeInTheDocument()
    expect(screen.getByText(/retry/i)).toBeInTheDocument()
  })

  it('renders line chart when data is present', () => {
    render(<ChartWrapper {...BASE_PROPS} data={SERIES} isLoading={false} isError={false} />)
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('renders bar chart when chartType is bar', () => {
    render(
      <ChartWrapper
        {...BASE_PROPS}
        chartType="bar"
        data={SERIES}
        isLoading={false}
        isError={false}
      />
    )
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('shows stale data badge when isStale', () => {
    render(
      <ChartWrapper {...BASE_PROPS} data={SERIES} isLoading={false} isError={false} isStale />
    )
    expect(screen.getByText(/data may be outdated/i)).toBeInTheDocument()
  })

  it('renders title', () => {
    render(<ChartWrapper {...BASE_PROPS} data={SERIES} isLoading={false} isError={false} />)
    expect(screen.getByText('Consumer Price Index')).toBeInTheDocument()
  })

  it('shows export and share buttons', () => {
    render(<ChartWrapper {...BASE_PROPS} data={SERIES} isLoading={false} isError={false} />)
    expect(screen.getByTitle('Export')).toBeInTheDocument()
    expect(screen.getByTitle('Copy link')).toBeInTheDocument()
  })
})
```

- [ ] **Step 9.2: Run to confirm failure**

```bash
npx jest src/__tests__/components/charts/ChartWrapper.test.tsx --no-coverage
```

Expected: FAIL — "Cannot find module '@/components/charts/ChartWrapper'"

- [ ] **Step 9.3: Implement `src/components/charts/ChartWrapper.tsx`**

```typescript
'use client'

import { useRef } from 'react'
import {
  ResponsiveContainer,
  LineChart, BarChart, AreaChart,
  Line, Bar, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { DateRangePills } from '@/components/charts/DateRangePills'
import { ChartTypeToggle } from '@/components/charts/ChartTypeToggle'
import { RecessionBands } from '@/components/charts/RecessionBands'
import { RichTooltip } from '@/components/charts/RichTooltip'
import { ExportButton } from '@/components/charts/ExportButton'
import { ShareButton } from '@/components/charts/ShareButton'
import type { SeriesData, FetchOptions } from '@/lib/data/types'

type Range = NonNullable<FetchOptions['range']>
type ChartType = 'line' | 'bar' | 'area'

type OverlayOption = {
  id: string
  name: string
  adapter: string
}

type ChartWrapperProps = {
  title: string
  subtitle?: string
  seriesId: string
  data: SeriesData | null
  isLoading: boolean
  isError: boolean
  isStale?: boolean
  onRetry?: () => void
  overlay?: SeriesData | null
  overlayOptions?: OverlayOption[]
  onOverlaySelect?: (id: string | null) => void
  range: Range
  onRangeChange: (range: Range) => void
  chartType: ChartType
  onChartTypeChange: (type: ChartType) => void
  recessionBands: boolean
  onRecessionBandsToggle: () => void
  height?: number
}

function formatDateTick(ts: number, frequency: string): string {
  const d = new Date(ts)
  if (frequency === 'quarterly' || frequency === 'annual') {
    return d.getFullYear().toString()
  }
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

export function ChartWrapper({
  title,
  subtitle,
  seriesId,
  data,
  isLoading,
  isError,
  isStale = false,
  onRetry,
  overlay = null,
  overlayOptions = [],
  onOverlaySelect,
  range,
  onRangeChange,
  chartType,
  onChartTypeChange,
  recessionBands,
  onRecessionBandsToggle,
  height = 320,
}: ChartWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Build merged chartData with timestamps and pre-computed YoY % change.
  // YoY looks back 12 points for monthly data, 4 points for quarterly.
  // RichTooltip reads yoyChange from payload[n].payload.yoyChange.
  const chartData = data
    ? (() => {
        const overlayMap = new Map(overlay?.data.map(pt => [pt.date, pt.value]) ?? [])
        const lookback = data.frequency === 'monthly' ? 12 : data.frequency === 'quarterly' ? 4 : 0
        return data.data.map((pt, i) => {
          const past = lookback > 0 ? data.data[i - lookback] : undefined
          const yoyChange =
            past && past.value !== 0
              ? ((pt.value - past.value) / Math.abs(past.value)) * 100
              : null
          return {
            ts: new Date(pt.date).getTime(),
            value: pt.value,
            overlayValue: overlayMap.get(pt.date) ?? null,
            yoyChange,
          }
        })
      })()
    : []

  const domainStart = chartData[0]?.ts ?? 0
  const domainEnd = chartData[chartData.length - 1]?.ts ?? 0
  const dualAxis = !!(overlay && data && overlay.unitsShort !== data.unitsShort)
  const frequency = data?.frequency ?? 'monthly'

  const commonAxisProps = {
    dataKey: 'ts',
    type: 'number' as const,
    domain: ['dataMin', 'dataMax'] as [string, string],
    scale: 'time' as const,
    tickFormatter: (v: number) => formatDateTick(v, frequency),
    tick: { fontSize: 11, fill: '#94a3b8' },
    axisLine: false,
    tickLine: false,
  }

  const leftYAxis = (
    <YAxis
      yAxisId="left"
      tick={{ fontSize: 11, fill: '#94a3b8' }}
      axisLine={false}
      tickLine={false}
      width={50}
      tickFormatter={(v: number) => v.toFixed(1)}
    />
  )

  const rightYAxis = dualAxis ? (
    <YAxis
      yAxisId="right"
      orientation="right"
      tick={{ fontSize: 11, fill: '#ef4444' }}
      axisLine={false}
      tickLine={false}
      width={50}
      tickFormatter={(v: number) => v.toFixed(1)}
    />
  ) : null

  const tooltipEl = (
    <Tooltip
      content={
        <RichTooltip
          primaryLabel={data?.name ?? ''}
          primaryUnitsShort={data?.unitsShort ?? ''}
          primarySource={data?.source}
          overlayLabel={overlay?.name}
          overlayUnitsShort={overlay?.unitsShort}
          overlaySource={overlay?.source}
        />
      }
    />
  )

  const recessionEl = recessionBands && domainStart > 0 ? (
    <RecessionBands domainStart={domainStart} domainEnd={domainEnd} />
  ) : null

  function renderChart() {
    if (chartType === 'bar') {
      return (
        <BarChart data={chartData}>
          <XAxis {...commonAxisProps} />
          {leftYAxis}
          {rightYAxis}
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          {tooltipEl}
          {recessionEl}
          <Bar dataKey="value" yAxisId="left" fill="#3b82f6" radius={[2, 2, 0, 0]} />
          {overlay && <Bar dataKey="overlayValue" yAxisId={dualAxis ? 'right' : 'left'} fill="#ef4444" radius={[2, 2, 0, 0]} />}
          {overlay && <Legend />}
        </BarChart>
      )
    }
    if (chartType === 'area') {
      return (
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="primaryGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis {...commonAxisProps} />
          {leftYAxis}
          {rightYAxis}
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          {tooltipEl}
          {recessionEl}
          <Area type="monotone" dataKey="value" yAxisId="left" stroke="#3b82f6" fill="url(#primaryGrad)" strokeWidth={2} dot={false} />
          {overlay && <Area type="monotone" dataKey="overlayValue" yAxisId={dualAxis ? 'right' : 'left'} stroke="#ef4444" fill="none" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />}
          {overlay && <Legend />}
        </AreaChart>
      )
    }
    // line (default)
    return (
      <LineChart data={chartData}>
        <XAxis {...commonAxisProps} />
        {leftYAxis}
        {rightYAxis}
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        {tooltipEl}
        {recessionEl}
        <Line type="monotone" dataKey="value" yAxisId="left" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
        {overlay && <Line type="monotone" dataKey="overlayValue" yAxisId={dualAxis ? 'right' : 'left'} stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="4 2" isAnimationActive={false} />}
        {overlay && <Legend />}
      </LineChart>
    )
  }

  return (
    <div ref={containerRef} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          {isStale && (
            <Badge variant="outline" className="mt-1 text-amber-600 border-amber-300 text-[10px] px-1.5 py-0">
              Data may be outdated
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangePills value={range} onChange={onRangeChange} />
          <ChartTypeToggle value={chartType} onChange={onChartTypeChange} />
          <div className="border-l border-slate-200 pl-2 ml-1 flex items-center gap-1">
            <button
              type="button"
              title="Recession bands"
              onClick={onRecessionBandsToggle}
              className={`px-2 py-0.5 rounded text-[10px] font-medium ${recessionBands ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              Rec.
            </button>
            {overlayOptions.length > 0 && onOverlaySelect && (
              <select
                className="text-[10px] border border-slate-200 rounded px-1 py-0.5 text-slate-600"
                value={overlay?.id ?? ''}
                onChange={e => onOverlaySelect(e.target.value || null)}
              >
                <option value="">+ Overlay</option>
                {overlayOptions.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            )}
          </div>
          <ExportButton chartRef={containerRef} seriesData={data} range={range} />
          <ShareButton />
        </div>
      </div>

      {/* Chart area */}
      <div className="px-2 pb-4">
        {isLoading && (
          <div className="flex items-center justify-center" style={{ height }}>
            <div role="status" className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" aria-label="Loading chart" />
          </div>
        )}
        {!isLoading && isError && (
          <div className="flex flex-col items-center justify-center gap-2 text-sm text-slate-500" style={{ height }}>
            <p>Could not load data · {data?.source ?? 'source'}</p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="text-blue-600 hover:underline text-xs"
              >
                Retry
              </button>
            )}
          </div>
        )}
        {!isLoading && !isError && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={height}>
            {renderChart()}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 9.4: Run tests to confirm passing**

```bash
npx jest src/__tests__/components/charts/ChartWrapper.test.tsx --no-coverage
```

Expected: PASS — 7 tests.

- [ ] **Step 9.5: Run full test suite**

```bash
npm test
```

Expected: all test suites pass (previously 27 tests + new tests).

- [ ] **Step 9.6: TypeScript check**

```bash
npx tsc --noEmit
```

Expected: no errors. If Recharts type imports cause issues (e.g., `TooltipProps`), fix the imports:
- `TooltipProps` is from `'recharts'`
- `NameType`, `ValueType` are from `'recharts/types/component/DefaultTooltipContent'`

If those paths don't resolve, simplify `RichTooltip.tsx` to use `any` types for the Recharts props:
```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function RichTooltip({ active, payload, label, ...rest }: any) {
```

- [ ] **Step 9.7: Commit**

```bash
git add src/components/charts/ChartWrapper.tsx src/__tests__/components/charts/ChartWrapper.test.tsx
git commit -m "feat: ChartWrapper — full chart widget with controls, recession bands, overlay, export, share"
```

- [ ] **Step 9.8: Push**

```bash
git push origin master
```

---

## What's Next

- **Plan 3: Home Page** — Wire KPICard + ChartWrapper into the Editorial Split layout. The home page uses `useMultiSeries` to batch-fetch the 5 KPI series. Featured chart uses local React state for range/chartType (not nuqs — home page is not URL-stateful). Mini choropleth map is stubbed (placeholder) until Plan 5.
- **Plan 4: Detail Pages** — `/macro`, `/markets`, `/labor`, `/housing` each with tab navigation (nuqs `?tab=`), per-tab `ChartWrapper` instances wired to nuqs URL state for range/chartType/overlay/recession. Additional adapters (BLS, BEA, Treasury, Alpha Vantage, EIA, Polygon, NY Fed).
- **Plan 5: Regional Explorer** — choropleth map, state/region toggle, drill-down panel. React 19 compatible map library to be selected at that time (react-simple-maps removed due to React 19 incompatibility).
