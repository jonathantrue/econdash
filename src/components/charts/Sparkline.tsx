'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import type { SeriesDataPoint } from '@/lib/data/types'

type SparklineProps = {
  data: SeriesDataPoint[]
  width: number
  height: number
  color?: string
  showTooltip?: boolean
}

export function Sparkline({ data, width, height, color = '#3b82f6', showTooltip = false }: SparklineProps) {
  const chartData = data.map(pt => ({ ts: new Date(pt.date).getTime(), value: pt.value }))

  return (
    <LineChart width={width} height={height} data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
      <XAxis dataKey="ts" hide />
      <YAxis hide domain={['auto', 'auto']} />
      {showTooltip && <Tooltip formatter={(v: number) => [v.toFixed(2), '']} labelFormatter={() => ''} />}
      <Line
        type="monotone"
        dataKey="value"
        stroke={color}
        strokeWidth={1.5}
        dot={false}
        isAnimationActive={false}
      />
    </LineChart>
  )
}
