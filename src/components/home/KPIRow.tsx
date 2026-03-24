'use client'

import { useMultiSeries } from '@/lib/hooks/useMultiSeries'
import { KPICard } from '@/components/charts/KPICard'

const KPI_SERIES = [
  { id: 'CPIAUCSL', label: 'CPI',           href: '/macro',   range: '1y' as const },
  { id: 'GDPC1',   label: 'Real GDP',       href: '/macro',   range: '5y' as const },
  { id: 'UNRATE',  label: 'Unemployment',   href: '/labor',   range: '1y' as const },
  { id: 'FEDFUNDS',label: 'Fed Funds Rate', href: '/markets', range: '1y' as const },
  { id: 'DGS10',   label: '10Y Yield',      href: '/markets', range: '1y' as const },
] as const

const REQUESTS = KPI_SERIES.map(kpi => ({
  adapter: 'fred' as const,
  seriesId: kpi.id,
  options: { range: kpi.range },
}))

export function KPIRow() {
  const { results, isLoading, isError } = useMultiSeries(REQUESTS)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr] gap-4">
      {KPI_SERIES.map((kpi, i) => {
        const series = results?.[i]
        const lastPoint = series && series.data.length > 0
          ? series.data[series.data.length - 1]
          : undefined
        return (
          <KPICard
            key={kpi.id}
            label={kpi.label}
            href={kpi.href}
            value={lastPoint?.value}
            unitsShort={series?.unitsShort}
            sparklineData={series?.data}
            isLoading={isLoading}
            isError={isError}
            variant={i === 0 ? 'hero' : 'default'}
          />
        )
      })}
    </div>
  )
}
