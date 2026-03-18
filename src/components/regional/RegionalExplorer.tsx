'use client'

import { useState } from 'react'
import { useMultiSeries } from '@/lib/hooks/useMultiSeries'
import { useSeries } from '@/lib/hooks/useSeries'
import { USChoropleth } from '@/components/regional/USChoropleth'
import { ChartWrapper } from '@/components/charts/ChartWrapper'
import { STATES, STATE_UR_SERIES } from '@/lib/data/state-series'
import type { FetchOptions } from '@/lib/data/types'

type Range = NonNullable<FetchOptions['range']>
type ChartType = 'line' | 'bar' | 'area'

// Module-level for stable SWR cache key reference.
const STATE_REQUESTS = STATES.map(s => ({
  adapter: 'fred' as const,
  seriesId: STATE_UR_SERIES[s.fips] ?? `${s.abbr}UR`,
  options: { range: '1y' as Range },
}))

export function RegionalExplorer() {
  const [selectedFips, setSelectedFips] = useState<string | null>(null)
  const [drillRange, setDrillRange] = useState<Range>('5y')
  const [drillChartType, setDrillChartType] = useState<ChartType>('line')
  const [drillRecessionBands, setDrillRecessionBands] = useState(false)

  const { results, isLoading } = useMultiSeries(STATE_REQUESTS)

  const choroplethValues = STATES.map((s, i) => {
    const series = results?.[i]
    const lastPoint =
      series && series.data.length > 0 ? series.data[series.data.length - 1] : undefined
    return { fips: s.fips, value: lastPoint?.value ?? null }
  })

  const selectedState = STATES.find(s => s.fips === selectedFips) ?? null
  const selectedSeriesId = selectedFips ? (STATE_UR_SERIES[selectedFips] ?? null) : null

  const { data: drillData, isLoading: drillLoading, isError: drillError, isStale: drillStale, retry: drillRetry } =
    useSeries(
      selectedSeriesId
        ? { id: selectedSeriesId, adapter: 'fred', options: { range: drillRange } }
        : null
    )

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Regional Explorer</h1>
        <p className="text-sm text-slate-500 mt-1">
          State unemployment rates — click a state for detail
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
              <USChoropleth
                values={choroplethValues}
                colorDomain={[2, 8]}
                onStateClick={setSelectedFips}
                selectedFips={selectedFips}
              />
            </div>
          </div>

          <div>
            {selectedState && selectedSeriesId ? (
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
            ) : (
              <div className="flex items-center justify-center text-sm text-slate-400 border border-dashed border-slate-200 rounded-xl min-h-[280px]">
                Select a state to view detail
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
