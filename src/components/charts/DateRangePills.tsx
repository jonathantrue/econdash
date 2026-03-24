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
    <div className="flex items-center gap-0.5 bg-surface-container rounded p-0.5">
      {RANGES.map(r => (
        <button
          key={r.value}
          type="button"
          onClick={() => onChange(r.value)}
          className={
            r.value === value
              ? 'px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-surface-lowest text-primary shadow-[0_1px_3px_rgba(23,28,31,0.08)]'
              : 'px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide text-muted-foreground hover:text-primary'
          }
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}
