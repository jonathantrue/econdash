'use client'

import { useEffect, useState } from 'react'
import type { TickerData } from '@/lib/data/types'

function TickerItem({ label, value, change, format = 'number' }: {
  label: string
  value: number
  change: number
  format?: 'number' | 'percent'
}) {
  const isPositive = change >= 0
  const sign = isPositive ? '+' : ''
  const displayValue = format === 'percent'
    ? `${value.toFixed(2)}%`
    : value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  return (
    <span className="flex items-center gap-1.5 text-xs whitespace-nowrap">
      <span className="text-overlay-text/50 font-bold text-[10px]">{label}</span>
      <span className="text-overlay-text/85 font-semibold">{displayValue}</span>
      <span className={isPositive ? 'text-chart-3' : 'text-on-primary-negative'}>
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
        if (res.ok) {
          const data = await res.json() as TickerData
          setTicker(data)
        }
      } catch {
        // silent — ticker is non-critical
      }
    }

    void fetchTicker()
    const interval = setInterval(() => void fetchTicker(), 60_000)
    return () => clearInterval(interval)
  }, [])

  if (!ticker) {
    return <div className="fixed top-0 left-0 right-0 z-[100] bg-primary h-8" aria-hidden="true" />
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] bg-primary h-8 px-6 flex items-center gap-6 overflow-x-auto hide-scrollbar"
      role="region"
      aria-label="Market ticker"
    >
      <span className="flex items-center gap-1.5 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-chart-3 animate-pulse" />
        <span className="text-[8px] font-bold uppercase tracking-[2px] text-overlay-text/50">Live</span>
      </span>
      <TickerItem label="S&P 500"  value={ticker.sp500.value}    change={ticker.sp500.change} />
      <TickerItem label="Dow"      value={ticker.dow.value}      change={ticker.dow.change} />
      <TickerItem label="Nasdaq"   value={ticker.nasdaq.value}   change={ticker.nasdaq.change} />
      <TickerItem label="10Y Yield" value={ticker.yield10y.value} change={ticker.yield10y.change} format="percent" />
      <TickerItem label="WTI"      value={ticker.wti.value}      change={ticker.wti.change} />
      <TickerItem label="Gold"     value={ticker.gold.value}     change={ticker.gold.change} />
    </div>
  )
}
