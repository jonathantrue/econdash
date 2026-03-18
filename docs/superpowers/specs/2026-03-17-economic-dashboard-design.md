# Economic Dashboard — Design Spec
**Date:** 2026-03-17
**Status:** Approved for implementation
**Stack:** Next.js 14 · TypeScript · Vercel

---

## 1. Overview

A comprehensive, public-facing economic dashboard called **EconDash** — a multi-page, multi-tab "economic command center" built on Next.js 14 (App Router), TypeScript, and hosted on Vercel. The dashboard serves a mixed audience: personal research and portfolio use, but fully shareable via URL-preserved state. Every chart view's indicator, date range, chart type, overlay selections, and tab are accessible via a direct link. Global UI preferences (recession band default, default date range) are stored in Zustand and are intentionally not included in shareable URLs — they represent personal defaults, not view state.

The visual language is **Executive Light**: clean white/slate palette, strong typography, subtle gradients, and professional polish — premium SaaS aesthetic applied to public economic data.

---

## 2. Pages & Navigation Structure

### Top-Level Navigation
```
Logo | Macro | Markets | Labor | Housing | Regional
```
A persistent top nav bar with a **live markets ticker strip** below it showing: S&P 500, Dow Jones, Nasdaq, 10Y Treasury yield, WTI crude, Gold spot price. The ticker refreshes every 60 seconds via a dedicated `/api/ticker` endpoint that bypasses the standard series cache (it has its own 60s TTL in Vercel KV, separate from chart data).

### Pages

| Route | Title | Description |
|---|---|---|
| `/` | Economic Command Center | Hub home page |
| `/macro` | Macroeconomics | GDP, inflation, rates, trade |
| `/markets` | Markets & Finance | Equities, bonds, commodities, VIX |
| `/labor` | Labor Market | Employment, wages, participation |
| `/housing` | Housing & Real Estate | Prices, mortgage rates, affordability |
| `/regional` | Regional Explorer | Interactive US map |

Each detail page (`/macro`, `/markets`, `/labor`, `/housing`) uses **tabs** to organize sub-topics. Tabs are rendered as shadcn/ui `Tabs` components and are URL-addressable (e.g., `/macro?tab=inflation`).

---

## 3. Home Page Layout (`/`)

**Editorial Split layout:**

- **Top:** 5 KPI cards in a horizontal row:
  1. GDP Growth (YoY) — BEA
  2. CPI Inflation (YoY) — BLS
  3. Unemployment Rate — BLS
  4. Fed Funds Rate — FRED
  5. S&P 500 (level + daily % change) — Polygon.io

  Each card shows: label, current value, delta indicator (▲/▼/─), and a 4-point sparkline (last 4 data points of the series). Clicking any card navigates to the corresponding detail page.

- **Middle:** Two-column split
  - **Left (40%):** Stack of 3–4 KPI detail cards with fuller sparklines (12 data points, line chart using a lightweight inline SVG via Recharts `<LineChart>` at fixed 120×40px dimensions). Cards are: GDP, CPI, Unemployment, and Housing Affordability Index. Each is clickable and navigates to the relevant detail page with the matching indicator pre-selected.
  - **Right (60%):** Large featured chart. The featured chart is **static by default**: "CPI vs Fed Funds Rate (5Y, line)". It does not auto-rotate. A "Refresh featured" button (icon only) allows the user to manually cycle to the next preset. Presets (in order): CPI vs Fed Funds · GDP Growth (10Y) · Unemployment Rate (10Y) · S&P 500 (2Y) · 10Y Yield Curve Spread. The active preset index is stored in Zustand (not URL).

- **Bottom:** Full-width **mini choropleth map** (height: 260px desktop, 200px tablet, hidden on mobile — replaced by a "View Regional Map →" link button). Defaults to unemployment rate by state. Clicking any state navigates to `/regional?view=state&selected=[STATE_CODE]&indicator=unemployment`. The mini map is a simplified render using `react-simple-maps` with D3 color scale — no date slider or toggle controls.

- **Far right (≥1280px only):** "Latest Data Releases" feed panel (width: 280px). Shows the 8 most recent BLS/BEA/FRED data release events with: series name, released value, release date, and source badge. Below 1280px this panel is hidden; its content is not shown elsewhere (it is a bonus feature, not critical path).

---

## 4. Detail Pages

### `/macro` — Macroeconomics
**Tabs:** Overview · GDP · Inflation · Interest Rates · Trade
**Key indicators:**
- GDP (real, nominal, YoY, QoQ) — BEA
- CPI, Core CPI, PCE, Core PCE — BLS / BEA
- Fed Funds Rate, SOFR, 2Y/10Y/30Y yields — FRED / Treasury
- Trade balance, imports, exports — BEA / Census
- **Recession probability**: rendered as a **linear probability bar** (0–100%, colored green→yellow→red). Source: NY Fed recession probability model (monthly series). A gauge-style visualization is not used — the bar is simpler and more readable in context.

### `/markets` — Markets & Finance
**Tabs:** Equities · Bonds & Rates · Commodities · Sentiment
**Key indicators:**
- S&P 500, Dow Jones, Nasdaq 100 — Alpha Vantage / Polygon.io
- Yield curve: full curve visualization (spot rates at 1M/3M/6M/1Y/2Y/5Y/10Y/20Y/30Y plotted as a curve, plus the 2Y–10Y spread time series) — FRED / Treasury
- WTI crude, Brent, natural gas, gold, silver — EIA / Alpha Vantage
- VIX volatility index — Alpha Vantage (series: `VIX`)
- **Market Sentiment indicator**: a custom composite derived from: VIX level, S&P 500 52-week relative position, and put/call ratio (if available from Polygon.io). Displayed as a labeled spectrum bar (Extreme Fear → Fear → Neutral → Greed → Extreme Greed). This is a derived metric, not a third-party index. The CNN Fear & Greed Index is not used as it is not available via a public API.
- Sector rotation heatmap (11 GICS sectors) — Alpha Vantage ETF data (XLK, XLV, XLF, etc.)

### `/labor` — Labor Market
**Tabs:** Overview · Employment · Wages · Openings
**Key indicators:**
- Unemployment rate (U-3, U-6) — BLS
- Nonfarm payrolls (total, private, government) — BLS
- Average hourly earnings, wage growth YoY — BLS
- Labor force participation rate — BLS
- Job openings, hires, quits (JOLTS) — BLS
- Initial & continuing jobless claims — FRED / DOL

### `/housing` — Housing & Real Estate
**Tabs:** Prices · Mortgage · Supply · Affordability
**Key indicators:**
- Case-Shiller National Home Price Index — FRED
- FHFA House Price Index — FRED
- 30Y and 15Y fixed mortgage rates — FRED
- Housing starts, building permits, completions — Census
- Existing and new home sales — Census / NAR via FRED
- Housing affordability index — FRED (`FIXHAI`)

**Rent vs. Own Affordability Calculator (interactive widget on Affordability tab):**
- **Inputs:** Home price (slider + text, default $400,000), Down payment % (slider, default 20%), Mortgage rate (pre-filled with the 30Y fixed rate already loaded by the parent Mortgage tab — passed as a prop; falls back to 6.5% if unavailable), Annual rent (text input, default $24,000), Annual home appreciation assumption (slider, default 3%), Years to compare (slider, 5/10/15/20/30)
- **Output:** Side-by-side comparison of total cost of ownership vs. total rent paid over the selected period. Displayed as a grouped bar chart (one bar pair per 5-year milestone). A summary line states: "At current rates, buying breaks even with renting after approximately X years."
- **Formula:** Buy-side total cost = down payment + (monthly mortgage payment × months) + (property tax estimate at 1.2% annually) − (estimated equity at appreciation rate). Rent-side = annual rent × years × 1.03 (3% annual rent increase). This is illustrative, not financial advice — a disclaimer is shown below the calculator.
- This is a client-side calculation only — no API call required.

---

## 5. Regional Explorer (`/regional`)

### Geographic Regions
The map uses the **4 US Census Bureau geographic regions** exactly as defined:
- **Northeast**: CT, ME, MA, NH, NJ, NY, PA, RI, VT
- **Midwest**: IL, IN, IA, KS, MI, MN, MO, NE, ND, OH, SD, WI
- **South**: AL, AR, DE, FL, GA, KY, LA, MD, MS, NC, OK, SC, TN, TX, VA, WV + DC
- **West**: AK, AZ, CA, CO, HI, ID, MT, NV, NM, OR, UT, WA, WY

### View Toggle
A segmented control at the top-right of the map:
```
[ State View ]  [ Regional View ]
```
Default: State View.

**State View**
- All 50 states individually colored by selected indicator using a D3 sequential color scale
- Click any state → state is highlighted (bold 2px border, `#1e40af`), all other states dim to 60% opacity
- Right panel (320px width, fixed, slides in from right) shows: state name, current indicator value, sparkline (12 monthly or 8 quarterly data points, as available), national rank (e.g., "Ranked 3rd lowest"), and the other 5 map indicators for that state (i.e., the full set of 6 map indicators minus the one currently driving the map color — listed as a compact stat row: label, value, and up/down delta vs. national average)
- Clicking another state swaps the panel content; clicking the same state again deselects (panel closes)

**Regional View**
- States are grouped into the 4 Census regions; each region is rendered as a single color bloc (all states in the region share the same color value based on the region aggregate)
- Region aggregate values by indicator type:
  - **Unemployment Rate, Labor Force Participation Rate**: population-weighted average across member states (weight = state civilian labor force size from BLS)
  - **Wage Growth (YoY)**: employment-weighted average (weight = state total employment from BLS QCEW)
  - **GDP Growth (YoY)**: GDP-level-weighted average (weight = state nominal GDP from BEA; growth rates cannot be meaningfully averaged by population)
  - **Home Price Appreciation (YoY)**: simple (unweighted) average across member states — a regional price level would require housing stock data not readily available; unweighted average is standard practice for regional HPI aggregation
  - **Nonfarm Payrolls Growth (YoY)**: employment-weighted average (same weight as wage growth)
- Click a region → region highlighted (bold outline), others dim
- Right panel shows: region name, aggregate value, ranked list of member states for this indicator (descending), sparkline of regional aggregate over time

### Indicator Dropdown
Available indicators for map coloring:
1. Unemployment Rate — BLS LAUST state series
2. GDP Growth (YoY) — BEA state GDP
3. Wage Growth (YoY) — BLS QCEW state data
4. Home Price Appreciation (YoY) — FRED state-level FHFA HPI series
5. Labor Force Participation Rate — BLS LAUST
6. Nonfarm Payrolls Growth (YoY) — BLS state payrolls

**Note:** State-level CPI is not included as a map indicator — BLS does not publish CPI for all 50 states (only for ~30 metro areas). The national CPI is shown contextually in the right panel but does not drive map coloring.

### Date Slider
- Resolution matches the selected indicator's native frequency: monthly indicators use monthly steps; quarterly (GDP) use quarterly steps
- When switching indicators, the slider resets to the most recent available date
- Displayed as: "Showing data as of: [Month Year]" with a play/pause button for auto-animation (500ms per step)
- Mixed-frequency is handled by showing the most recently available value for each state — states with quarterly data show the latest quarter even when the slider is at a monthly position

### Color Scale Toggle
- **Sequential**: D3 `interpolateBlues` (light = low, dark = high). Used by default.
- **Diverging**: D3 `interpolateRdYlGn` centered on the national average for the currently displayed date. The midpoint is always the current national average value for that indicator and date — not a fixed baseline.

### State Comparison Tool
Accessible via "Compare States" button above the map. Opens a **slide-over drawer** (full-height, 480px wide on desktop). The drawer URL updates to `/regional?compare=CA,TX,NY` (appended to existing params) so the comparison is shareable without being a separate page route. Up to 3 states can be selected. The drawer shows a side-by-side table of all 6 map indicators for the selected states.

### Data Sources for Maps
- State unemployment & LFPR: BLS LAUST series (via FRED)
- State GDP: BEA Regional Data API
- State home prices: FRED FHFA state-level HPI series (e.g., `AZSTHPI` for Arizona)
- State wage data: BLS Quarterly Census of Employment and Wages (QCEW)
- State payrolls: BLS State and Metro Area Employment (SAE) series

---

## 6. Data Architecture

### API Endpoints (Route Handlers)

| Endpoint | Purpose |
|---|---|
| `/api/series` | Fetch a single economic time series by adapter + series ID |
| `/api/regional` | Fetch state-level or region-level data for the map |
| `/api/ticker` | Fetch live markets ticker values (60s TTL cache) |
| `/api/multi` | Fetch multiple series in one request (for overlay charts). Request body: `{ series: Array<{ adapter: string; seriesId: string; options: FetchOptions }> }`. Response: `{ results: SeriesData[] }` in the same order as the request array. |

### SeriesData Type Contract
All adapters return a consistent `SeriesData` type:
```typescript
type SeriesDataPoint = {
  date: string;        // ISO 8601: "2024-01-01"
  value: number;
}

type SeriesData = {
  id: string;          // e.g., "CPIAUCSL"
  name: string;        // e.g., "Consumer Price Index"
  source: string;      // e.g., "BLS"
  units: string;       // e.g., "Percent Change from Year Ago"
  unitsShort: string;  // e.g., "% YoY" — used on chart axes
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annual";
  data: SeriesDataPoint[];
  lastUpdated: string; // ISO 8601
}
```
The `unitsShort` field is used to determine dual Y-axis rendering: if two overlaid series have different `unitsShort` values, a dual Y-axis is rendered automatically. No additional user configuration required.

### Unified Data Layer
All external API calls are made server-side via Next.js Route Handlers. API keys are stored in Vercel environment variables and never exposed to the client.

**Adapter pattern — file structure:**
```
src/lib/data/
  fred.ts          — FRED API adapter
  bls.ts           — BLS Public Data API adapter
  bea.ts           — BEA API adapter
  census.ts        — Census Bureau adapter
  treasury.ts      — Treasury yield curve adapter
  eia.ts           — EIA Open Data adapter
  alpha-vantage.ts — Alpha Vantage adapter (equities, forex)
  polygon.ts       — Polygon.io adapter (market data)
  ny-fed.ts        — NY Fed recession probability adapter
```
Note: A World Bank adapter is not included — international comparisons are explicitly out of scope for this version.

Each adapter exports:
```typescript
type FetchOptions = {
  range?: "1y" | "2y" | "5y" | "10y" | "max"; // mutually exclusive with startDate/endDate
  startDate?: string;  // ISO 8601, e.g. "2010-01-01"
  endDate?: string;    // ISO 8601, defaults to today
  frequency?: "monthly" | "quarterly" | "annual"; // optional — adapter uses native frequency if omitted
}

fetchSeries(seriesId: string, options: FetchOptions): Promise<SeriesData>
```

### Cache Key Schema (Vercel KV)
Keys follow the pattern: `{source}:{seriesId}:{range}`

Examples:
- `fred:CPIAUCSL:5y`
- `bls:LNS14000000:10y`
- `ticker:markets:60s`
- `regional:unemployment:state:2024-01`

### Caching Strategy (Vercel KV)

| Data type | Cache TTL | Key pattern |
|---|---|---|
| Ticker strip (equities, rates) | 60 sec | `ticker:markets:60s` |
| Market prices for charts | 5 min | `{source}:{id}:5m` |
| Interest rates, yields (chart) | 15 min | `fred:{id}:15m` |
| Monthly macro series (CPI, jobs) | 24 hr | `{source}:{id}:{range}` |
| Quarterly series (GDP, BEA) | 24 hr | `{source}:{id}:{range}` |
| Regional/state data | 24 hr | `regional:{indicator}:{view}:{date}` |
| Historical series (>2Y range) | 7 days | `{source}:{id}:{range}` |

The ticker strip uses a dedicated `/api/ticker` endpoint with its own 60s TTL — it does not share cache entries with the chart data endpoints, resolving the apparent conflict between the 60s ticker refresh and the 5-min chart cache.

### "Max" Date Range
"Max" means the full history returned by the source API for that series — no artificial truncation. Since different series have different historical depths (e.g., CPI goes back to 1913; some BLS series only to 2000), the rendered x-axis will vary by series. A note below the chart displays the actual start date when "Max" is selected: "Showing full history from [earliest date]."

### API Keys Required

| Service | Purpose | Notes |
|---|---|---|
| FRED | Macro series, rates, regional | Free — fred.stlouisfed.org/docs/api |
| BLS | Employment, wages, CPI | Free with registration |
| BEA | GDP, PCE, trade | Free with registration |
| Alpha Vantage | Equities, sector ETFs | Free tier (25 req/day) or Premium |
| Polygon.io | Market data, put/call ratio | Free tier available |
| EIA | Energy prices | Free |

---

## 7. Chart Interactions & Customization

### Compact Inline Controls (all charts)
Controls live in the chart header row — no separate toolbar:
- **Date range pills:** 1Y · 2Y · 5Y · 10Y · Max (+ custom date picker via shadcn/ui `DateRangePicker` in a popover)
- **Chart type icons:** Line · Bar · Area (contextually shown — bar is only offered for monthly/quarterly data, not daily)
- Active selections highlighted in `#1e40af` (primary blue)

### Universal Chart Features
Every chart includes:

- **Recession bands**: Toggle NBER recession shading (gray semi-transparent vertical bands). Off by default. Default can be changed in global preferences (Zustand). When on, bands are rendered as `<ReferenceArea>` components in Recharts using NBER recession dates (a static JSON file bundled with the app — no API call).

- **Overlay series**: "Add overlay" button opens a searchable dropdown of related series (curated per page/tab, not a free-form search). When two series are overlaid and their `unitsShort` values differ, a dual Y-axis is rendered (left axis = primary series, right axis = overlay). If units match, a single Y-axis with a legend is used.

- **Rich crosshair tooltip**: Custom Recharts `<Tooltip>` showing: date, value for each visible series, YoY % change (if the series is monthly or quarterly), and the source name. Rendered as a shadcn/ui styled card.

- **Export PNG**: Uses `html2canvas` to capture the chart container and trigger a download. Filename: `econdash-{seriesId}-{range}-{date}.png`. Chart title and source attribution are included in the capture area.

- **Export CSV**: Generates a comma-delimited string from the active `SeriesData` and triggers a download. Filename: `econdash-{seriesId}-{range}.csv`.

- **Share URL**: Copies the current page URL to clipboard. URL state is managed by `nuqs` and reflects: `tab`, `indicator`, `range`, `chart` (chart type), `overlay` (overlay series ID), `recession` (band toggle). Global preferences (Zustand) are not included in the URL by design.

### URL State (nuqs)
```
/macro?tab=inflation&indicator=CPIAUCSL&range=5y&chart=line&overlay=FEDFUNDS&recession=true
/regional?view=state&selected=TX&indicator=unemployment&date=2024-01
/regional?view=region&selected=south&indicator=unemployment&compare=CA,TX,NY
```

### Global Preferences (Zustand — not in URL)
- Default date range (initial value: 5y)
- Recession bands on/off default (initial value: false)
- Featured chart preset index on home page (initial value: 0)

### Sparklines (standardized)
All sparklines across the app use a consistent Recharts `<LineChart>` implementation at fixed dimensions:
- **KPI card sparklines** (top row): 60×24px, 4 data points, no axes, no tooltip
- **Detail card sparklines** (home page left column): 120×40px, 12 data points, no axes, no tooltip
- **Regional panel sparklines**: 200×60px, 12 data points, no axes, tooltip on hover

These are implemented as a single shared `<Sparkline>` component accepting `data`, `width`, `height`, and `points` props.

---

## 8. Tech Stack

| Layer | Technology | Role |
|---|---|---|
| Framework | Next.js 14 (App Router) | Routing, server components, API routes |
| Language | TypeScript (strict mode) | Type safety throughout |
| Hosting | Vercel | Deployment, Edge Functions, KV cache |
| Styling | Tailwind CSS | Utility-first styling |
| Components | shadcn/ui | Tabs, dropdowns, tooltips, date pickers, drawers |
| Primary charts | Recharts | All time series charts, sparklines |
| Geographic maps | react-simple-maps | SVG map shell, state/region hit targets |
| Map color scales | D3 (d3-scale, d3-scale-chromatic) | Color scale computation only — not rendering |
| Map geodata | TopoJSON (us-atlas) | State/region boundary data |
| Animations | Framer Motion | Page transitions, panel slide-ins, chart mounts |
| URL state | nuqs | Sync chart config to query params |
| Global state | Zustand | User preferences not in URL |
| Data caching | Vercel KV (Redis) | TTL-based API response cache |
| PNG export | html2canvas | Chart-to-image export |
| Analytics | Vercel Analytics | Page view and interaction tracking |
| Linting | ESLint + Prettier | Code style enforcement |
| Git hooks | Husky + lint-staged | Pre-commit lint/format |

**Map rendering responsibilities:**
- `react-simple-maps` owns SVG rendering, projection, and click/hover event handling for states and regions
- `d3-scale` + `d3-scale-chromatic` compute the color value for each state/region given a data value and the chosen color scale (sequential or diverging)
- `us-atlas` (TopoJSON) provides the boundary geometry fed to `react-simple-maps`

---

## 9. Loading & Error States

Every data-dependent UI element must handle three states:

**Loading state:**
- KPI cards: render a skeleton (shadcn/ui `<Skeleton>`) matching the card dimensions
- Charts: render the chart container with axes and a centered `<Loader2>` spinner icon
- Map: render the SVG shell in a uniform light gray (`#f1f5f9`) with a centered spinner

**Error state (API failure or rate limit):**
- KPI cards: show "—" for the value with a tooltip on hover: "Data unavailable. [Source] may be rate limited."
- Charts: render the container with a centered message: "Could not load data · [source name] · Retry" (retry triggers a client-side refetch via SWR `mutate()`)
- Map: render the shell in uniform gray with an overlay: "Regional data unavailable · Retry"

**Stale data state (cache hit but data is older than 2× the TTL):**
- A small amber badge appears in the chart header: "Data may be outdated" with a refresh icon

All data fetching uses **SWR** with `revalidateOnFocus: false` and `dedupingInterval` set to match the cache TTL for each data type.

---

## 10. Responsiveness

| Breakpoint | Behavior |
|---|---|
| ≥1280px | Full layout — all columns, data release sidebar visible |
| 768–1279px | Single-column KPI cards, stacked chart/map sections, tabs collapse to shadcn/ui `<Select>` dropdown, data release sidebar hidden, home mini-map visible at reduced height (200px) |
| <768px | KPI cards in 2×3 grid. Home page middle section: featured chart full-width first, KPI detail cards (left column) hidden on mobile (not shown). Home mini-map hidden (replaced by "View Regional Map →" link button). Full `/regional` map replaced by a ranked list of states sortable by indicator. Tabs replaced by `<Select>` dropdown. |

---

## 11. Project Setup (Implementation Step 1)

Since the project currently lives in a local folder with no git history:
1. `git init` in project root
2. Create `.gitignore` (node_modules, .env.local, .superpowers/, .next/)
3. `gh repo create econdash --public` via GitHub CLI
4. Initial commit + push to `main`
5. Connect repo to Vercel via Vercel dashboard (import from GitHub)
6. Add environment variables in Vercel dashboard: `FRED_API_KEY`, `BLS_API_KEY`, `BEA_API_KEY`, `ALPHA_VANTAGE_API_KEY`, `POLYGON_API_KEY`, `EIA_API_KEY`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`

---

## 12. Out of Scope (Future Enhancements)
- Embeddable iframe widgets
- Metro/county level drill-down on maps
- International comparisons (World Bank / OECD)
- User accounts / saved dashboards
- Push notifications for data releases
- Mobile app
