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
