'use client'

type ChartType = 'line' | 'bar' | 'area'

const TYPES: { label: string; value: ChartType; icon: string }[] = [
  { label: 'Line', value: 'line', icon: '╱' },
  { label: 'Bar',  value: 'bar',  icon: '▬' },
  { label: 'Area', value: 'area', icon: '▲' },
]

type ChartTypeToggleProps = {
  value: ChartType
  onChange: (type: ChartType) => void
}

export function ChartTypeToggle({ value, onChange }: ChartTypeToggleProps) {
  return (
    <div className="border-l border-border pl-2 ml-1">
      <div className="flex items-center gap-0.5 bg-surface-container rounded p-0.5">
        {TYPES.map(t => (
          <button
            key={t.value}
            type="button"
            title={t.label}
            onClick={() => onChange(t.value)}
            className={
              t.value === value
                ? 'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-surface-lowest text-primary shadow-[0_1px_3px_rgba(23,28,31,0.08)]'
                : 'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide text-muted-foreground hover:text-primary'
            }
          >
            {t.icon}
          </button>
        ))}
      </div>
    </div>
  )
}
