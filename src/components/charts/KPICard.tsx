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
