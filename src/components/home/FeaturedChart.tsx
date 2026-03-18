'use client'

import { useState } from 'react'
import { useSeries } from '@/lib/hooks/useSeries'
import { ChartWrapper } from '@/components/charts/ChartWrapper'
import type { FetchOptions } from '@/lib/data/types'

type Range = NonNullable<FetchOptions['range']>
type ChartType = 'line' | 'bar' | 'area'

export function FeaturedChart() {
  const [range, setRange] = useState<Range>('5y')
  const [chartType, setChartType] = useState<ChartType>('line')
  const [recessionBands, setRecessionBands] = useState(false)

  const { data, isLoading, isError, isStale, retry } = useSeries({
    id: 'GDPC1',
    adapter: 'fred',
    options: { range },
  })

  return (
    <ChartWrapper
      title="Real GDP"
      subtitle="Billions of Chained 2017 Dollars, Seasonally Adjusted Annual Rate"
      seriesId="GDPC1"
      data={data}
      isLoading={isLoading}
      isError={isError}
      isStale={isStale}
      onRetry={retry}
      range={range}
      onRangeChange={setRange}
      chartType={chartType}
      onChartTypeChange={setChartType}
      recessionBands={recessionBands}
      onRecessionBandsToggle={() => setRecessionBands(b => !b)}
    />
  )
}
