/**
 * @jest-environment jsdom
 */

import React from 'react'
import { render } from '@testing-library/react'
import { Sparkline } from '@/components/charts/Sparkline'
import type { SeriesDataPoint } from '@/lib/data/types'

// Recharts uses ResizeObserver and SVG layout — mock it for jsdom
jest.mock('recharts', () => {
  const React = require('react')
  return {
    LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="sparkline-chart">{children}</div>,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  }
})

const DATA: SeriesDataPoint[] = [
  { date: '2024-01-01', value: 3.1 },
  { date: '2024-02-01', value: 3.2 },
  { date: '2024-03-01', value: 3.0 },
  { date: '2024-04-01', value: 3.4 },
]

describe('Sparkline', () => {
  it('renders without crashing with data', () => {
    const { getByTestId } = render(
      <Sparkline data={DATA} width={60} height={24} />
    )
    expect(getByTestId('sparkline-chart')).toBeInTheDocument()
  })

  it('renders without crashing with empty data', () => {
    const { getByTestId } = render(
      <Sparkline data={[]} width={60} height={24} />
    )
    expect(getByTestId('sparkline-chart')).toBeInTheDocument()
  })
})
