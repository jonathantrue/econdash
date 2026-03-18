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
