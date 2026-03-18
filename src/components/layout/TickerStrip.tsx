'use client'

import { useEffect, useState } from 'react'
import type { TickerData } from '@/app/api/ticker/route'

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
      <span className="text-blue-300 font-medium">{label}</span>
      <span className="text-white font-semibold">{displayValue}</span>
      <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
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
    return <div className="bg-blue-900 border-b border-blue-700 h-7" aria-hidden="true" />
  }

  return (
    <div className="bg-blue-900 border-b border-blue-700 px-6 py-1 flex items-center gap-6 overflow-x-auto">
      <TickerItem label="S&P 500" value={ticker.sp500.value} change={ticker.sp500.change} />
      <TickerItem label="Dow" value={ticker.dow.value} change={ticker.dow.change} />
      <TickerItem label="Nasdaq" value={ticker.nasdaq.value} change={ticker.nasdaq.change} />
      <TickerItem label="10Y Yield" value={ticker.yield10y.value} change={ticker.yield10y.change} format="percent" />
      <TickerItem label="WTI" value={ticker.wti.value} change={ticker.wti.change} />
      <TickerItem label="Gold" value={ticker.gold.value} change={ticker.gold.change} />
    </div>
  )
}
