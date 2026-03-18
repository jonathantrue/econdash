'use client'

import type { FetchOptions } from '@/lib/data/types'

type Range = NonNullable<FetchOptions['range']>

const RANGES: { label: string; value: Range }[] = [
  { label: '1Y', value: '1y' },
  { label: '2Y', value: '2y' },
  { label: '5Y', value: '5y' },
  { label: '10Y', value: '10y' },
  { label: 'Max', value: 'max' },
]

type DateRangePillsProps = {
  value: Range
  onChange: (range: Range) => void
}

export function DateRangePills({ value, onChange }: DateRangePillsProps) {
  return (
    <div className="flex items-center gap-1">
      {RANGES.map(r => (
        <button
          key={r.value}
          type="button"
          onClick={() => onChange(r.value)}
          className={
            r.value === value
              ? 'px-2 py-0.5 rounded text-xs font-medium bg-blue-800 text-white'
              : 'px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200'
          }
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}
