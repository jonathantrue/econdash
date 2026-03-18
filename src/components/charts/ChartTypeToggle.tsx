'use client'

type ChartType = 'line' | 'bar' | 'area'

const TYPES: { label: string; value: ChartType; icon: string }[] = [
  { label: 'Line', value: 'line', icon: '╱' },
  { label: 'Bar', value: 'bar', icon: '▬' },
  { label: 'Area', value: 'area', icon: '▲' },
]

type ChartTypeToggleProps = {
  value: ChartType
  onChange: (type: ChartType) => void
}

export function ChartTypeToggle({ value, onChange }: ChartTypeToggleProps) {
  return (
    <div className="flex items-center gap-1 border-l border-slate-200 pl-2 ml-1">
      {TYPES.map(t => (
        <button
          key={t.value}
          type="button"
          title={t.label}
          onClick={() => onChange(t.value)}
          className={
            t.value === value
              ? 'px-1.5 py-0.5 rounded text-xs bg-blue-800 text-white'
              : 'px-1.5 py-0.5 rounded text-xs bg-slate-100 text-slate-600 hover:bg-slate-200'
          }
        >
          {t.icon}
        </button>
      ))}
    </div>
  )
}
