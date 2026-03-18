# EconDash Foundation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the EconDash Next.js 14 application with a working navigation shell, typed data layer, Vercel KV caching infrastructure, FRED adapter, and two live API route handlers — deployed to Vercel.

**Architecture:** Next.js 14 App Router with TypeScript strict mode. All external API calls happen server-side in Route Handlers, never in client components. A Vercel KV Redis layer caches responses by TTL. Every external data source has its own typed adapter implementing a shared `fetchSeries` interface.

**Tech Stack:** Next.js 14, TypeScript (strict), Tailwind CSS, shadcn/ui, Vercel KV, Jest + React Testing Library, MSW

---

## File Map

```
econdash/
├── .gitignore
├── .env.example                          # template — commit this
├── .env.local                            # secrets — never commit
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── jest.config.ts
├── jest.setup.ts
├── .eslintrc.json
├── .prettierrc
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # root layout: NavBar + TickerStrip + children
│   │   ├── page.tsx                      # home page stub ("Coming soon")
│   │   ├── macro/page.tsx                # stub
│   │   ├── markets/page.tsx              # stub
│   │   ├── labor/page.tsx                # stub
│   │   ├── housing/page.tsx              # stub
│   │   ├── regional/page.tsx             # stub
│   │   └── api/
│   │       ├── series/route.ts           # GET /api/series?id=&adapter=&range=
│   │       ├── ticker/route.ts           # GET /api/ticker
│   │       └── multi/route.ts            # POST /api/multi
│   │
│   ├── components/
│   │   └── layout/
│   │       ├── NavBar.tsx                # top nav with links
│   │       └── TickerStrip.tsx           # live markets ticker (client component)
│   │
│   └── lib/
│       ├── data/
│       │   ├── types.ts                  # SeriesDataPoint, SeriesData, FetchOptions
│       │   └── fred.ts                   # FRED adapter
│       └── cache.ts                      # Vercel KV helpers (get/set with TTL)
│
└── src/__tests__/
    ├── lib/
    │   ├── data/
    │   │   └── fred.test.ts
    │   └── cache.test.ts
    └── api/
        ├── series.test.ts
        └── ticker.test.ts
```

---

## Task 1: Git + GitHub + Next.js Scaffold

**Files:**
- Create: all root config files listed in the file map above

- [ ] **Step 1.1: Initialize git and create GitHub repo**

```bash
cd /c/Users/truej/OneDrive/Desktop/claudecli
git init
gh repo create econdash --public --source=. --remote=origin
```

Expected: GitHub repo created, remote `origin` set.

- [ ] **Step 1.2: Create the Next.js app**

```bash
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-turbopack
```

When prompted, accept all defaults. This creates the full Next.js scaffold in the current directory.

- [ ] **Step 1.3: Verify it runs**

```bash
npm run dev
```

Open http://localhost:3000. Expected: Next.js default page renders without errors. Stop the dev server.

- [ ] **Step 1.4: Install additional dependencies**

```bash
npm install @vercel/kv zustand nuqs framer-motion recharts
npm install react-simple-maps d3-scale d3-scale-chromatic
npm install -D jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D msw ts-jest @types/jest
npm install -D prettier eslint-config-prettier
```

- [ ] **Step 1.5: Create `.gitignore`**

```
node_modules/
.next/
.env.local
.superpowers/
coverage/
```

- [ ] **Step 1.6: Create `.env.example`**

```bash
# Copy this to .env.local and fill in your keys
FRED_API_KEY=your_fred_api_key_here
BLS_API_KEY=your_bls_api_key_here
BEA_API_KEY=your_bea_api_key_here
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
POLYGON_API_KEY=your_polygon_key_here
EIA_API_KEY=your_eia_key_here

# Vercel KV — filled automatically when you link KV in Vercel dashboard
KV_REST_API_URL=
KV_REST_API_TOKEN=
```

- [ ] **Step 1.7: Initial commit**

```bash
git add .
git commit -m "chore: initial Next.js 14 scaffold with TypeScript and Tailwind"
git push -u origin main
```

---

## Task 2: TypeScript + Tooling Config

**Files:**
- Modify: `tsconfig.json`
- Create: `jest.config.ts`, `jest.setup.ts`, `.prettierrc`

- [ ] **Step 2.1: Enable strict TypeScript**

Replace the `compilerOptions` in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 2.2: Create `jest.config.ts`**

```typescript
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  coverageProvider: 'v8',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
}

export default createJestConfig(config)
```

- [ ] **Step 2.3: Create `jest.setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 2.4: Create `.prettierrc`**

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
```

- [ ] **Step 2.5: Add test script to `package.json`**

In `package.json`, add to `"scripts"`:
```json
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage"
```

- [ ] **Step 2.6: Verify tooling**

```bash
npx tsc --noEmit
```

Expected: No errors. If errors appear, fix the tsconfig paths.

- [ ] **Step 2.7: Commit**

```bash
git add .
git commit -m "chore: configure TypeScript strict mode, Jest, and Prettier"
```

---

## Task 3: Data Types

**Files:**
- Create: `src/lib/data/types.ts`
- Create: `src/__tests__/lib/data/types.test.ts`

- [ ] **Step 3.1: Write the failing type test**

Create `src/__tests__/lib/data/types.test.ts`:

```typescript
import type { SeriesData, SeriesDataPoint, FetchOptions } from '@/lib/data/types'

describe('SeriesData types', () => {
  it('SeriesDataPoint has date and value', () => {
    const point: SeriesDataPoint = { date: '2024-01-01', value: 3.1 }
    expect(point.date).toBe('2024-01-01')
    expect(point.value).toBe(3.1)
  })

  it('SeriesData has required fields', () => {
    const series: SeriesData = {
      id: 'CPIAUCSL',
      name: 'Consumer Price Index',
      source: 'BLS',
      units: 'Percent Change from Year Ago',
      unitsShort: '% YoY',
      frequency: 'monthly',
      data: [{ date: '2024-01-01', value: 3.1 }],
      lastUpdated: '2024-02-15T00:00:00Z',
    }
    expect(series.frequency).toBe('monthly')
  })

  it('FetchOptions range values are valid', () => {
    const opts: FetchOptions = { range: '5y' }
    expect(['1y','2y','5y','10y','max']).toContain(opts.range)
  })
})
```

- [ ] **Step 3.2: Run test — verify it fails**

```bash
npm test -- types.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/data/types'"

- [ ] **Step 3.3: Create `src/lib/data/types.ts`**

```typescript
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
```

- [ ] **Step 3.4: Run test — verify it passes**

```bash
npm test -- types.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 3.5: Commit**

```bash
git add src/lib/data/types.ts src/__tests__/lib/data/types.test.ts
git commit -m "feat: add SeriesData, SeriesDataPoint, and FetchOptions types"
```

---

## Task 4: Cache Utility

**Files:**
- Create: `src/lib/cache.ts`
- Create: `src/__tests__/lib/cache.test.ts`

- [ ] **Step 4.1: Write failing cache tests**

Create `src/__tests__/lib/cache.test.ts`:

```typescript
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
```

- [ ] **Step 4.2: Run test — verify it fails**

```bash
npm test -- cache.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/cache'"

- [ ] **Step 4.3: Create `src/lib/cache.ts`**

```typescript
import { kv } from '@vercel/kv'
import type { SeriesData } from '@/lib/data/types'

export function buildCacheKey(...parts: string[]): string {
  return parts.join(':')
}

export function getTtlForRange(range: string): number {
  if (range === '10y' || range === 'max') return 7 * 24 * 60 * 60  // 7 days
  if (range === '5y' || range === '2y') return 24 * 60 * 60         // 24 hours
  return 5 * 60                                                       // 5 minutes (1y, daily)
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    return await kv.get<T>(key)
  } catch {
    // KV unavailable in local dev without env vars — return null (cache miss)
    return null
  }
}

export async function setCached<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    await kv.set(key, value, { ex: ttlSeconds })
  } catch {
    // KV unavailable in local dev — silently skip caching
  }
}
```

Note: The try/catch allows local development without Vercel KV credentials. In production, KV will always be available.

- [ ] **Step 4.4: Run test — verify it passes**

```bash
npm test -- cache.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 4.5: Commit**

```bash
git add src/lib/cache.ts src/__tests__/lib/cache.test.ts
git commit -m "feat: add Vercel KV cache utility with TTL helpers"
```

---

## Task 5: FRED Adapter

**Files:**
- Create: `src/lib/data/fred.ts`
- Create: `src/__tests__/lib/data/fred.test.ts`

- [ ] **Step 5.1: Write failing FRED adapter tests**

Create `src/__tests__/lib/data/fred.test.ts`:

```typescript
import { fetchFredSeries, fredRangeToDate } from '@/lib/data/fred'
import type { FetchOptions } from '@/lib/data/types'

// Mock global fetch
const mockFetch = jest.fn()
global.fetch = mockFetch

const MOCK_FRED_RESPONSE = {
  observations: [
    { date: '2019-01-01', value: '1.6' },
    { date: '2020-01-01', value: '2.3' },
    { date: '2021-01-01', value: '1.4' },
    { date: '2022-01-01', value: '8.0' },
    { date: '2023-01-01', value: '3.4' },
    { date: '.', value: '.' },  // missing value — should be filtered
  ],
}

beforeEach(() => {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => MOCK_FRED_RESPONSE,
  })
  process.env.FRED_API_KEY = 'test_key'
})

afterEach(() => jest.clearAllMocks())

describe('fetchFredSeries', () => {
  it('returns SeriesData with correct shape', async () => {
    const result = await fetchFredSeries('CPIAUCSL', { range: '5y' })
    expect(result.id).toBe('CPIAUCSL')
    expect(result.source).toBe('FRED')
    expect(result.frequency).toBe('monthly')
    expect(result.data).toHaveLength(5) // missing value filtered out
  })

  it('filters out missing values (value === ".")', async () => {
    const result = await fetchFredSeries('CPIAUCSL', { range: '5y' })
    expect(result.data.every(d => typeof d.value === 'number')).toBe(true)
  })

  it('parses observation values as numbers', async () => {
    const result = await fetchFredSeries('CPIAUCSL', { range: '5y' })
    expect(result.data[0]).toEqual({ date: '2019-01-01', value: 1.6 })
  })

  it('calls FRED API with correct params', async () => {
    await fetchFredSeries('CPIAUCSL', { range: '5y' })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('series_id=CPIAUCSL'),
    )
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('api_key=test_key'),
    )
  })

  it('throws if FRED_API_KEY is not set', async () => {
    delete process.env.FRED_API_KEY
    await expect(fetchFredSeries('CPIAUCSL', {})).rejects.toThrow('FRED_API_KEY')
  })
})

describe('fredRangeToDate', () => {
  it('returns a date string N years ago', () => {
    const result = fredRangeToDate('5y')
    const fiveYearsAgo = new Date()
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5)
    expect(result).toBe(fiveYearsAgo.toISOString().split('T')[0])
  })

  it('returns undefined for "max"', () => {
    expect(fredRangeToDate('max')).toBeUndefined()
  })
})
```

- [ ] **Step 5.2: Run test — verify it fails**

```bash
npm test -- fred.test.ts
```

Expected: FAIL — "Cannot find module '@/lib/data/fred'"

- [ ] **Step 5.3: Create `src/lib/data/fred.ts`**

```typescript
import type { SeriesData, FetchOptions } from '@/lib/data/types'

const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations'

// Map FRED series IDs to human-readable metadata
const FRED_SERIES_META: Record<string, Pick<SeriesData, 'name' | 'units' | 'unitsShort' | 'frequency'>> = {
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
}

const DEFAULT_META: Pick<SeriesData, 'name' | 'units' | 'unitsShort' | 'frequency'> = {
  name: 'FRED Series',
  units: 'Value',
  unitsShort: 'Value',
  frequency: 'monthly',
}

export function fredRangeToDate(range: string): string | undefined {
  if (range === 'max') return undefined
  const years = parseInt(range.replace('y', ''), 10)
  const d = new Date()
  d.setFullYear(d.getFullYear() - years)
  return d.toISOString().split('T')[0]
}

export async function fetchFredSeries(seriesId: string, options: FetchOptions): Promise<SeriesData> {
  const apiKey = process.env.FRED_API_KEY
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

  const json = await res.json() as { observations: Array<{ date: string; value: string }> }

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
```

- [ ] **Step 5.4: Run test — verify it passes**

```bash
npm test -- fred.test.ts
```

Expected: PASS (7 tests)

- [ ] **Step 5.5: Commit**

```bash
git add src/lib/data/fred.ts src/__tests__/lib/data/fred.test.ts
git commit -m "feat: add FRED adapter with series metadata and range parsing"
```

---

## Task 6: `/api/series` Route Handler

**Files:**
- Create: `src/app/api/series/route.ts`
- Create: `src/__tests__/api/series.test.ts`

- [ ] **Step 6.1: Write failing route tests**

Create `src/__tests__/api/series.test.ts`:

```typescript
import { GET } from '@/app/api/series/route'
import * as fredModule from '@/lib/data/fred'
import * as cacheModule from '@/lib/cache'

jest.mock('@/lib/data/fred')
jest.mock('@/lib/cache')

const mockSeriesData = {
  id: 'CPIAUCSL',
  name: 'Consumer Price Index',
  source: 'FRED',
  units: 'Index',
  unitsShort: 'Index',
  frequency: 'monthly' as const,
  data: [{ date: '2024-01-01', value: 3.1 }],
  lastUpdated: '2024-02-15T00:00:00Z',
}

beforeEach(() => {
  jest.mocked(cacheModule.getCached).mockResolvedValue(null)  // cache miss
  jest.mocked(cacheModule.setCached).mockResolvedValue(undefined)
  jest.mocked(fredModule.fetchFredSeries).mockResolvedValue(mockSeriesData)
})

afterEach(() => jest.clearAllMocks())

function makeRequest(params: Record<string, string>) {
  const url = new URL('http://localhost/api/series')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new Request(url)
}

describe('GET /api/series', () => {
  it('returns 400 if id param is missing', async () => {
    const res = await GET(makeRequest({}))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/id/)
  })

  it('returns 400 if adapter is unsupported', async () => {
    const res = await GET(makeRequest({ id: 'CPIAUCSL', adapter: 'unknown' }))
    expect(res.status).toBe(400)
  })

  it('returns SeriesData from FRED adapter on cache miss', async () => {
    const res = await GET(makeRequest({ id: 'CPIAUCSL', adapter: 'fred', range: '5y' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('CPIAUCSL')
    expect(fredModule.fetchFredSeries).toHaveBeenCalledWith('CPIAUCSL', { range: '5y' })
  })

  it('returns cached data without calling adapter', async () => {
    jest.mocked(cacheModule.getCached).mockResolvedValue(mockSeriesData)
    const res = await GET(makeRequest({ id: 'CPIAUCSL', adapter: 'fred', range: '5y' }))
    expect(res.status).toBe(200)
    expect(fredModule.fetchFredSeries).not.toHaveBeenCalled()
  })

  it('sets cache after fetching', async () => {
    await GET(makeRequest({ id: 'CPIAUCSL', adapter: 'fred', range: '5y' }))
    expect(cacheModule.setCached).toHaveBeenCalled()
  })
})
```

- [ ] **Step 6.2: Run test — verify it fails**

```bash
npm test -- series.test.ts
```

Expected: FAIL — "Cannot find module '@/app/api/series/route'"

- [ ] **Step 6.3: Create `src/app/api/series/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { fetchFredSeries } from '@/lib/data/fred'
import { getCached, setCached, buildCacheKey, getTtlForRange } from '@/lib/cache'
import type { FetchOptions, SeriesData } from '@/lib/data/types'

const SUPPORTED_ADAPTERS = ['fred'] as const
type Adapter = typeof SUPPORTED_ADAPTERS[number]

const ADAPTER_MAP: Record<Adapter, (id: string, opts: FetchOptions) => Promise<SeriesData>> = {
  fred: fetchFredSeries,
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const adapter = (searchParams.get('adapter') ?? 'fred') as Adapter
  const range = (searchParams.get('range') ?? '5y') as FetchOptions['range']
  const startDate = searchParams.get('startDate') ?? undefined
  const endDate = searchParams.get('endDate') ?? undefined

  if (!id) {
    return NextResponse.json({ error: 'Missing required param: id' }, { status: 400 })
  }

  if (!SUPPORTED_ADAPTERS.includes(adapter)) {
    return NextResponse.json(
      { error: `Unsupported adapter: ${adapter}. Supported: ${SUPPORTED_ADAPTERS.join(', ')}` },
      { status: 400 }
    )
  }

  const cacheKey = buildCacheKey(adapter, id, range ?? startDate ?? 'custom')
  const cached = await getCached<SeriesData>(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const fetchFn = ADAPTER_MAP[adapter]
    const data = await fetchFn(id, { range, startDate, endDate })
    const ttl = getTtlForRange(range ?? '5y')
    await setCached(cacheKey, data, ttl)
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
```

- [ ] **Step 6.4: Run test — verify it passes**

```bash
npm test -- series.test.ts
```

Expected: PASS (5 tests)

- [ ] **Step 6.5: Commit**

```bash
git add src/app/api/series/route.ts src/__tests__/api/series.test.ts
git commit -m "feat: add /api/series route handler with FRED adapter and KV caching"
```

---

## Task 7: `/api/ticker` Route Handler

**Files:**
- Create: `src/app/api/ticker/route.ts`
- Create: `src/__tests__/api/ticker.test.ts`

- [ ] **Step 7.1: Write failing ticker tests**

Create `src/__tests__/api/ticker.test.ts`:

```typescript
import { GET } from '@/app/api/ticker/route'
import * as cacheModule from '@/lib/cache'

jest.mock('@/lib/cache')

const mockTickerData = {
  sp500: { value: 5241.32, change: 0.62 },
  dow: { value: 39127.80, change: 0.25 },
  nasdaq: { value: 16379.46, change: 0.81 },
  yield10y: { value: 4.42, change: -0.08 },
  wti: { value: 78.40, change: -0.32 },
  gold: { value: 2180.50, change: 0.15 },
  updatedAt: new Date().toISOString(),
}

beforeEach(() => {
  jest.mocked(cacheModule.getCached).mockResolvedValue(null)
  jest.mocked(cacheModule.setCached).mockResolvedValue(undefined)
})

afterEach(() => jest.clearAllMocks())

describe('GET /api/ticker', () => {
  it('returns 200 with ticker shape', async () => {
    // When no external API is available, ticker returns fallback/stub values
    const res = await GET(new Request('http://localhost/api/ticker'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('sp500')
    expect(body).toHaveProperty('yield10y')
    expect(body).toHaveProperty('updatedAt')
  })

  it('returns cached ticker if available', async () => {
    jest.mocked(cacheModule.getCached).mockResolvedValue(mockTickerData)
    const res = await GET(new Request('http://localhost/api/ticker'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.sp500.value).toBe(5241.32)
    expect(cacheModule.setCached).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 7.2: Run test — verify it fails**

```bash
npm test -- ticker.test.ts
```

Expected: FAIL — "Cannot find module '@/app/api/ticker/route'"

- [ ] **Step 7.3: Create `src/app/api/ticker/route.ts`**

Note: In Plan 1, the ticker returns stub values. Real market data from Alpha Vantage/Polygon will be wired in Plan 4 (Detail Pages) when those adapters are built.

```typescript
import { NextResponse } from 'next/server'
import { getCached, setCached, buildCacheKey } from '@/lib/cache'

type TickerItem = { value: number; change: number }

type TickerData = {
  sp500: TickerItem
  dow: TickerItem
  nasdaq: TickerItem
  yield10y: TickerItem
  wti: TickerItem
  gold: TickerItem
  updatedAt: string
}

const TICKER_TTL = 60  // 60 seconds

function getStubTicker(): TickerData {
  return {
    sp500:    { value: 0, change: 0 },
    dow:      { value: 0, change: 0 },
    nasdaq:   { value: 0, change: 0 },
    yield10y: { value: 0, change: 0 },
    wti:      { value: 0, change: 0 },
    gold:     { value: 0, change: 0 },
    updatedAt: new Date().toISOString(),
  }
}

export async function GET() {
  const cacheKey = buildCacheKey('ticker', 'markets', '60s')
  const cached = await getCached<TickerData>(cacheKey)
  if (cached) return NextResponse.json(cached)

  // TODO (Plan 4): Replace stub with live Alpha Vantage / Polygon.io fetch
  const ticker = getStubTicker()
  await setCached(cacheKey, ticker, TICKER_TTL)
  return NextResponse.json(ticker)
}
```

- [ ] **Step 7.4: Run test — verify it passes**

```bash
npm test -- ticker.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 7.5: Commit**

```bash
git add src/app/api/ticker/route.ts src/__tests__/api/ticker.test.ts
git commit -m "feat: add /api/ticker route handler (stub — live data in Plan 4)"
```

---

## Task 8: `/api/multi` Route Handler

**Files:**
- Create: `src/app/api/multi/route.ts`

- [ ] **Step 8.1: Create `src/app/api/multi/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { fetchFredSeries } from '@/lib/data/fred'
import { getCached, setCached, buildCacheKey, getTtlForRange } from '@/lib/cache'
import type { FetchOptions, SeriesData } from '@/lib/data/types'

type MultiRequest = {
  series: Array<{
    adapter: string
    seriesId: string
    options: FetchOptions
  }>
}

const ADAPTER_MAP: Record<string, (id: string, opts: FetchOptions) => Promise<SeriesData>> = {
  fred: fetchFredSeries,
}

export async function POST(request: Request) {
  let body: MultiRequest
  try {
    body = await request.json() as MultiRequest
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!Array.isArray(body.series) || body.series.length === 0) {
    return NextResponse.json({ error: 'body.series must be a non-empty array' }, { status: 400 })
  }

  const results = await Promise.all(
    body.series.map(async ({ adapter, seriesId, options }) => {
      const fetchFn = ADAPTER_MAP[adapter]
      if (!fetchFn) return { error: `Unsupported adapter: ${adapter}` }

      const range = options.range ?? '5y'
      const cacheKey = buildCacheKey(adapter, seriesId, range)
      const cached = await getCached<SeriesData>(cacheKey)
      if (cached) return cached

      try {
        const data = await fetchFn(seriesId, options)
        await setCached(cacheKey, data, getTtlForRange(range))
        return data
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Fetch failed', id: seriesId }
      }
    })
  )

  return NextResponse.json({ results })
}
```

- [ ] **Step 8.2: Write tests for `/api/multi`**

Create `src/__tests__/api/multi.test.ts`:

```typescript
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
    const body = await res.json()
    expect(body.results).toHaveLength(2)
    expect(body.results[0].id).toBe('CPIAUCSL')
    expect(body.results[1].id).toBe('UNRATE')
  })

  it('returns error object for unsupported adapter without crashing', async () => {
    const res = await POST(makeRequest({
      series: [{ adapter: 'unknown', seriesId: 'X', options: {} }],
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.results[0]).toHaveProperty('error')
  })
})
```

- [ ] **Step 8.3: Run tests — verify they pass**

```bash
npm test -- multi.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 8.4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 8.5: Commit**

```bash
git add src/app/api/multi/route.ts src/__tests__/api/multi.test.ts
git commit -m "feat: add /api/multi route handler for batch series fetching"
```

---

## Task 9: Navigation Shell

**Files:**
- Modify: `src/app/layout.tsx`
- Create: `src/components/layout/NavBar.tsx`
- Create: `src/components/layout/TickerStrip.tsx`
- Modify: `src/app/page.tsx` and page stubs

- [ ] **Step 9.1: Create `src/components/layout/NavBar.tsx`**

```tsx
import Link from 'next/link'

const NAV_LINKS = [
  { href: '/macro',    label: 'Macro' },
  { href: '/markets',  label: 'Markets' },
  { href: '/labor',    label: 'Labor' },
  { href: '/housing',  label: 'Housing' },
  { href: '/regional', label: 'Regional' },
]

export function NavBar() {
  return (
    <nav className="bg-blue-800 text-white px-6 py-3 flex items-center gap-8">
      <Link href="/" className="font-bold text-lg tracking-tight">
        EconDash
      </Link>
      <div className="flex items-center gap-6">
        {NAV_LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-blue-200 hover:text-white transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
```

- [ ] **Step 9.2: Create `src/components/layout/TickerStrip.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'

type TickerItem = { value: number; change: number }

type TickerData = {
  sp500: TickerItem
  dow: TickerItem
  nasdaq: TickerItem
  yield10y: TickerItem
  wti: TickerItem
  gold: TickerItem
  updatedAt: string
}

function TickerItem({ label, value, change, format = 'number' }: {
  label: string
  value: number
  change: number
  format?: 'number' | 'percent'
}) {
  const isPositive = change >= 0
  const sign = isPositive ? '+' : ''
  const displayValue = format === 'percent' ? `${value.toFixed(2)}%` : value.toLocaleString()
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span className="text-blue-300 font-medium">{label}</span>
      <span className="text-white font-semibold">{displayValue}</span>
      <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
        {sign}{change.toFixed(2)}
      </span>
    </span>
  )
}

export function TickerStrip() {
  const [ticker, setTicker] = useState<TickerData | null>(null)

  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const res = await fetch('/api/ticker')
        if (res.ok) setTicker(await res.json())
      } catch { /* silent */ }
    }

    fetchTicker()
    const interval = setInterval(fetchTicker, 60_000)
    return () => clearInterval(interval)
  }, [])

  if (!ticker) return (
    <div className="bg-blue-900 border-b border-blue-700 h-7" />
  )

  return (
    <div className="bg-blue-900 border-b border-blue-700 px-6 py-1 flex items-center gap-6 overflow-x-auto">
      <TickerItem label="S&P 500" value={ticker.sp500.value} change={ticker.sp500.change} />
      <TickerItem label="Dow" value={ticker.dow.value} change={ticker.dow.change} />
      <TickerItem label="Nasdaq" value={ticker.nasdaq.value} change={ticker.nasdaq.change} />
      <TickerItem label="10Y Yield" value={ticker.yield10y.value} change={ticker.yield10y.change} format="percent" />
      <TickerItem label="WTI" value={ticker.wti.value} change={ticker.wti.change} />
      <TickerItem label="Gold" value={ticker.gold.value} change={ticker.gold.change} />
    </div>
  )
}
```

- [ ] **Step 9.3: Update `src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { NavBar } from '@/components/layout/NavBar'
import { TickerStrip } from '@/components/layout/TickerStrip'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EconDash — Economic Command Center',
  description: 'Comprehensive US economic data dashboard powered by FRED, BLS, BEA, and more.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 min-h-screen`}>
        <NavBar />
        <TickerStrip />
        <main>{children}</main>
      </body>
    </html>
  )
}
```

- [ ] **Step 9.4: Create page stubs**

Replace `src/app/page.tsx`:
```tsx
export default function HomePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-800">Economic Command Center</h1>
      <p className="text-slate-500 mt-2">Home page — coming in Plan 3</p>
    </div>
  )
}
```

Create the same stub for each of these (replace `Home` with the page name):
- `src/app/macro/page.tsx` → "Macroeconomics"
- `src/app/markets/page.tsx` → "Markets & Finance"
- `src/app/labor/page.tsx` → "Labor Market"
- `src/app/housing/page.tsx` → "Housing & Real Estate"
- `src/app/regional/page.tsx` → "Regional Explorer"

- [ ] **Step 9.5: Verify the app builds and renders**

```bash
npm run build
npm run dev
```

Open http://localhost:3000. Expected: NavBar visible, TickerStrip visible (empty or showing zeros), page stub text visible. Navigate to /macro, /markets, /labor, /housing, /regional — all should render stub text.

- [ ] **Step 9.6: Commit**

```bash
git add src/
git commit -m "feat: add NavBar, TickerStrip, root layout, and page stubs"
```

---

## Task 10: Vercel Deployment

**Files:**
- No new files — Vercel reads `next.config.ts` automatically.

- [ ] **Step 10.1: Create Vercel project and link KV**

1. Go to https://vercel.com — sign in and click "Add New Project"
2. Import the `econdash` GitHub repo
3. In the Vercel project settings → **Storage** → Create new KV database → name it `econdash-kv` → link to project
4. Vercel will automatically populate `KV_REST_API_URL` and `KV_REST_API_TOKEN` in environment variables

- [ ] **Step 10.2: Add API keys to Vercel environment variables**

In Vercel dashboard → Settings → Environment Variables, add:
- `FRED_API_KEY` — get free key at https://fred.stlouisfed.org/docs/api/api_key.html
- `BLS_API_KEY` — get free key at https://data.bls.gov/registrationEngine/
- `BEA_API_KEY` — get free key at https://apps.bea.gov/api/signup/
- `ALPHA_VANTAGE_API_KEY` — get free key at https://www.alphavantage.co/support/#api-key
- `POLYGON_API_KEY` — get free key at https://polygon.io/dashboard
- `EIA_API_KEY` — get free key at https://www.eia.gov/opendata/register.php

- [ ] **Step 10.3: Also create `.env.local` locally**

Copy `.env.example` to `.env.local` and fill in the same keys for local development.

- [ ] **Step 10.4: Deploy**

```bash
git push origin main
```

Vercel will auto-deploy. Watch the build in the Vercel dashboard.

Expected: Deployment succeeds. Visit the Vercel URL — NavBar, TickerStrip, and page stubs should render.

- [ ] **Step 10.5: Smoke-test the API routes on production**

Visit: `https://your-vercel-url.vercel.app/api/series?id=CPIAUCSL&adapter=fred&range=5y`

Expected: JSON response with `id: "CPIAUCSL"` and an array of monthly data points going back 5 years.

- [ ] **Step 10.6: Final commit**

```bash
git add .env.example
git commit -m "chore: update env example with all required API keys"
git push origin main
```

---

## Task 11: Run Full Test Suite

- [ ] **Step 11.1: Run all tests**

```bash
npm test
```

Expected: All tests pass. Count should be 23+ tests across:
- `types.test.ts` — 3 tests
- `cache.test.ts` — 4 tests
- `fred.test.ts` — 7 tests
- `series.test.ts` — 5 tests
- `ticker.test.ts` — 2 tests
- `multi.test.ts` — 4 tests

- [ ] **Step 11.2: Check TypeScript**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 11.3: Final tag**

```bash
git tag v0.1.0-foundation
git push origin --tags
```

---

## What's Next

- **Plan 2: Shared UI Components** — KPI cards, Sparkline component, ChartWrapper (Recharts), DateRangePills, ChartTypeToggle, RecessionBands, OverlaySeries, RichTooltip, ExportButton, ShareButton
- **Plan 3: Home Page** — Editorial split layout wired to live data
- **Plan 4: Detail Pages** — Macro/Markets/Labor/Housing with remaining adapters
- **Plan 5: Regional Explorer** — Choropleth map, state/region toggle, drill-down panel
