'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Sparkline } from '@/components/charts/Sparkline'
import type { SeriesDataPoint } from '@/lib/data/types'

type Variant = 'default' | 'hero'

type KPICardProps = {
  label: string
  href: string
  value?: number
  unitsShort?: string
  sparklineData?: SeriesDataPoint[]
  isLoading: boolean
  isError: boolean
  onClick?: () => void
  variant?: Variant
}

function getDelta(data: SeriesDataPoint[]): number | null {
  if (data.length < 2) return null
  const last = data[data.length - 1]
  const prev = data[data.length - 2]
  if (!last || !prev) return null
  return last.value - prev.value
}

function DeltaIndicator({ delta, variant = 'default' }: { delta: number | null; variant?: Variant }) {
  if (variant === 'hero') {
    if (delta === null) return <span className="text-overlay-text/40 text-xs">─</span>
    if (delta > 0)      return <span className="text-overlay-text/80 text-xs">▲</span>
    if (delta < 0)      return <span className="text-overlay-text/80 text-xs">▼</span>
    return                     <span className="text-overlay-text/40 text-xs">─</span>
  }
  if (delta === null) return <span className="text-muted-foreground text-xs">─</span>
  if (delta > 0)      return <span className="text-chart-3 text-xs">▲</span>
  if (delta < 0)      return <span className="text-destructive text-xs">▼</span>
  return                     <span className="text-muted-foreground text-xs">─</span>
}

export function KPICard({
  label, href, value, unitsShort, sparklineData = [],
  isLoading, isError, onClick, variant = 'default',
}: KPICardProps) {
  const delta = getDelta(sparklineData)

  const handleClick = () => {
    if (onClick) onClick()
    else window.location.href = href
  }

  if (isLoading) {
    return (
      <div className={`rounded-md p-4 flex flex-col gap-2 shadow-[0_4px_12px_rgba(23,28,31,0.05)] ${
        variant === 'hero'
          ? 'bg-gradient-to-br from-primary to-primary-container'
          : 'bg-surface-lowest'
      }`}>
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-6 w-full" />
      </div>
    )
  }

  if (variant === 'hero') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className="bg-gradient-to-br from-primary to-primary-container text-white rounded-md
                   shadow-[0_4px_12px_rgba(23,28,31,0.05)] p-4 flex flex-col gap-1 text-left
                   hover:opacity-95 transition-opacity w-full"
      >
        <span className="text-[9px] font-bold uppercase tracking-widest text-overlay-text/60">{label}</span>
        <div className="flex items-baseline gap-1.5">
          {isError ? (
            <span className="font-headline text-[2rem] font-extrabold text-overlay-text/40 leading-none">—</span>
          ) : (
            <>
              <span className="font-headline text-[2rem] font-extrabold text-white leading-none">
                {value !== undefined ? value.toFixed(2) : '—'}
              </span>
              {unitsShort && (
                <span className="text-[11px] text-overlay-text/60">{unitsShort}</span>
              )}
              <DeltaIndicator delta={delta} variant="hero" />
            </>
          )}
        </div>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="bg-surface-lowest rounded-md shadow-[0_4px_12px_rgba(23,28,31,0.05)]
                 hover:shadow-[0_8px_24px_rgba(23,28,31,0.09)] p-4 flex flex-col gap-1
                 text-left transition-all w-full"
    >
      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{label}</span>
      <div className="flex items-baseline gap-1.5">
        {isError ? (
          <span className="font-headline text-[1.6rem] font-extrabold text-muted-foreground leading-none">—</span>
        ) : (
          <>
            <span className="font-headline text-[1.6rem] font-extrabold text-primary leading-none">
              {value !== undefined ? value.toFixed(2) : '—'}
            </span>
            {unitsShort && (
              <span className="text-[11px] text-muted-foreground">{unitsShort}</span>
            )}
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
