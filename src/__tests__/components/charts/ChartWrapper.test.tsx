/** @jest-environment jsdom */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { ChartWrapper } from '@/components/charts/ChartWrapper'
import type { SeriesData } from '@/lib/data/types'

jest.mock('recharts', () => {
  const React = require('react')
  return {
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
    BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
    AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
    Line: () => null,
    Bar: () => null,
    Area: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    ReferenceArea: () => null,
    Legend: () => null,
  }
})

const SERIES: SeriesData = {
  id: 'CPIAUCSL',
  name: 'Consumer Price Index',
  source: 'FRED',
  units: 'Index',
  unitsShort: 'Index',
  frequency: 'monthly',
  lastUpdated: new Date().toISOString(),
  data: [
    { date: '2024-01-01', value: 310 },
    { date: '2024-02-01', value: 311 },
    { date: '2024-03-01', value: 312 },
  ],
}

const BASE_PROPS = {
  title: 'Consumer Price Index',
  seriesId: 'CPIAUCSL',
  range: '5y' as const,
  onRangeChange: jest.fn(),
  chartType: 'line' as const,
  onChartTypeChange: jest.fn(),
  recessionBands: false,
  onRecessionBandsToggle: jest.fn(),
}

describe('ChartWrapper', () => {
  it('shows spinner when loading', () => {
    render(<ChartWrapper {...BASE_PROPS} data={null} isLoading isError={false} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows error message with retry when error', () => {
    const onRetry = jest.fn()
    render(<ChartWrapper {...BASE_PROPS} data={null} isLoading={false} isError onRetry={onRetry} />)
    expect(screen.getByText(/could not load data/i)).toBeInTheDocument()
    expect(screen.getByText(/retry/i)).toBeInTheDocument()
  })

  it('renders line chart when data is present', () => {
    render(<ChartWrapper {...BASE_PROPS} data={SERIES} isLoading={false} isError={false} />)
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  it('renders bar chart when chartType is bar', () => {
    render(
      <ChartWrapper
        {...BASE_PROPS}
        chartType="bar"
        data={SERIES}
        isLoading={false}
        isError={false}
      />
    )
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument()
  })

  it('shows stale data badge when isStale', () => {
    render(
      <ChartWrapper {...BASE_PROPS} data={SERIES} isLoading={false} isError={false} isStale />
    )
    expect(screen.getByText(/data may be outdated/i)).toBeInTheDocument()
  })

  it('renders title', () => {
    render(<ChartWrapper {...BASE_PROPS} data={SERIES} isLoading={false} isError={false} />)
    expect(screen.getByText('Consumer Price Index')).toBeInTheDocument()
  })

  it('shows export and share buttons', () => {
    render(<ChartWrapper {...BASE_PROPS} data={SERIES} isLoading={false} isError={false} />)
    expect(screen.getByTitle('Export')).toBeInTheDocument()
    expect(screen.getByTitle('Copy link')).toBeInTheDocument()
  })

  it('container uses ambient shadow, not slate border', () => {
    const { container } = render(
      <ChartWrapper {...BASE_PROPS} data={SERIES} isLoading={false} isError={false} />
    )
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).not.toContain('border-slate-200')
    expect(wrapper.className).toContain('shadow-')
  })

  it('loading spinner uses border-primary class', () => {
    const { container } = render(
      <ChartWrapper {...BASE_PROPS} data={null} isLoading isError={false} />
    )
    const spinner = container.querySelector('[role="status"]')
    expect(spinner?.className).toContain('border-primary')
  })
})
