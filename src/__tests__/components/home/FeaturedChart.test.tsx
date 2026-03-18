/** @jest-environment jsdom */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { FeaturedChart } from '@/components/home/FeaturedChart'
import { useSeries } from '@/lib/hooks/useSeries'

jest.mock('@/lib/hooks/useSeries')
jest.mock('@/components/charts/ChartWrapper', () => ({
  ChartWrapper: ({
    title,
    isLoading,
    isError,
    isStale,
    range,
    chartType,
    recessionBands,
  }: {
    title: string
    isLoading: boolean
    isError: boolean
    isStale: boolean
    range: string
    chartType: string
    recessionBands: boolean
  }) => (
    <div
      data-testid="chart-wrapper"
      data-range={range}
      data-chart-type={chartType}
      data-recession-bands={String(recessionBands)}
      data-is-error={String(isError)}
      data-is-stale={String(isStale)}
    >
      {isLoading ? <div role="status" /> : <span>{title}</span>}
    </div>
  ),
}))

const mockUseSeries = useSeries as jest.MockedFunction<typeof useSeries>

const BASE_RETURN = {
  data: null,
  isLoading: false,
  isError: false,
  isStale: false,
  retry: jest.fn(),
}

describe('FeaturedChart', () => {
  it('passes isLoading to ChartWrapper when loading', () => {
    mockUseSeries.mockReturnValue({ ...BASE_RETURN, isLoading: true })
    render(<FeaturedChart />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('passes title "Real GDP" to ChartWrapper', () => {
    mockUseSeries.mockReturnValue(BASE_RETURN)
    render(<FeaturedChart />)
    expect(screen.getByText('Real GDP')).toBeInTheDocument()
  })

  it('defaults range to 5y', () => {
    mockUseSeries.mockReturnValue(BASE_RETURN)
    render(<FeaturedChart />)
    expect(screen.getByTestId('chart-wrapper')).toHaveAttribute('data-range', '5y')
  })

  it('defaults chartType to line', () => {
    mockUseSeries.mockReturnValue(BASE_RETURN)
    render(<FeaturedChart />)
    expect(screen.getByTestId('chart-wrapper')).toHaveAttribute('data-chart-type', 'line')
  })

  it('defaults recessionBands to false', () => {
    mockUseSeries.mockReturnValue(BASE_RETURN)
    render(<FeaturedChart />)
    expect(screen.getByTestId('chart-wrapper')).toHaveAttribute('data-recession-bands', 'false')
  })

  it('forwards isError from useSeries to ChartWrapper', () => {
    mockUseSeries.mockReturnValue({ ...BASE_RETURN, isError: true })
    render(<FeaturedChart />)
    expect(screen.getByTestId('chart-wrapper')).toHaveAttribute('data-is-error', 'true')
  })

  it('forwards isStale from useSeries to ChartWrapper', () => {
    mockUseSeries.mockReturnValue({ ...BASE_RETURN, isStale: true })
    render(<FeaturedChart />)
    expect(screen.getByTestId('chart-wrapper')).toHaveAttribute('data-is-stale', 'true')
  })
})
