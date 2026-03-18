'use client'

import { useQueryState, parseAsString, parseAsBoolean } from 'nuqs'
import { useSeries } from '@/lib/hooks/useSeries'
import { ChartWrapper } from '@/components/charts/ChartWrapper'
import type { FetchOptions } from '@/lib/data/types'

type Range = NonNullable<FetchOptions['range']>
type ChartType = 'line' | 'bar' | 'area'

export type TabConfig = {
  id: string
  label: string
  seriesId: string
}

type DetailPageProps = {
  title: string
  tabs: readonly TabConfig[]
}

export function DetailPage({ title, tabs }: DetailPageProps) {
  const firstTabId = tabs[0]?.id ?? ''

  const [activeTab, setActiveTab] = useQueryState('tab', parseAsString.withDefault(firstTabId))
  const [range, setRange] = useQueryState('range', parseAsString.withDefault('5y'))
  const [chartType, setChartType] = useQueryState('chartType', parseAsString.withDefault('line'))
  const [recessionBands, setRecessionBands] = useQueryState(
    'recessionBands',
    parseAsBoolean.withDefault(false)
  )

  const currentTab = tabs.find(t => t.id === activeTab) ?? tabs[0]

  const { data, isLoading, isError, isStale, retry } = useSeries(
    currentTab
      ? { id: currentTab.seriesId, adapter: 'fred', options: { range: range as Range } }
      : null
  )

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => void setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      {currentTab && (
        <ChartWrapper
          title={currentTab.label}
          seriesId={currentTab.seriesId}
          data={data}
          isLoading={isLoading}
          isError={isError}
          isStale={isStale}
          onRetry={retry}
          range={range as Range}
          onRangeChange={r => void setRange(r)}
          chartType={chartType as ChartType}
          onChartTypeChange={t => void setChartType(t)}
          recessionBands={recessionBands}
          onRecessionBandsToggle={() => void setRecessionBands(r => !(r ?? false))}
        />
      )}
    </div>
  )
}
