'use client'

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RichTooltipProps = {
  active?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any[]
  label?: number
  primaryLabel?: string
  primaryUnitsShort?: string
  primarySource?: string
  overlayLabel?: string
  overlayUnitsShort?: string
  overlaySource?: string
}

export function RichTooltip({
  active,
  payload,
  label,
  primaryLabel = 'Value',
  primaryUnitsShort = '',
  primarySource,
  overlayLabel,
  overlayUnitsShort = '',
  overlaySource,
}: RichTooltipProps) {
  if (!active || !payload || payload.length === 0) return null

  const primary = payload.find((p: { dataKey: string }) => p.dataKey === 'value')
  const overlay = payload.find((p: { dataKey: string }) => p.dataKey === 'overlayValue')
  // yoyChange is stored on each chartData point and accessible via payload[].payload
  const yoyChange: number | null = primary?.payload?.yoyChange ?? null

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs min-w-[160px]">
      <p className="font-semibold text-slate-700 mb-2">{formatDate(Number(label))}</p>
      {primary && primary.value !== undefined && (
        <div className="mb-1">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">{primaryLabel}</span>
            <span className="font-medium text-slate-900">
              {Number(primary.value).toFixed(2)}{primaryUnitsShort ? ` ${primaryUnitsShort}` : ''}
            </span>
          </div>
          {yoyChange !== null && (
            <div className="flex justify-between gap-4 text-slate-400 mt-0.5">
              <span>YoY</span>
              <span className={yoyChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                {yoyChange >= 0 ? '+' : ''}{yoyChange.toFixed(2)}%
              </span>
            </div>
          )}
          {primarySource && (
            <div className="text-slate-300 mt-0.5 text-right">{primarySource}</div>
          )}
        </div>
      )}
      {overlay && overlay.value !== undefined && (
        <div className="border-t border-slate-100 pt-1 mt-1">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">{overlayLabel ?? 'Overlay'}</span>
            <span className="font-medium text-red-700">
              {Number(overlay.value).toFixed(2)}{overlayUnitsShort ? ` ${overlayUnitsShort}` : ''}
            </span>
          </div>
          {overlaySource && (
            <div className="text-slate-300 mt-0.5 text-right">{overlaySource}</div>
          )}
        </div>
      )}
    </div>
  )
}
