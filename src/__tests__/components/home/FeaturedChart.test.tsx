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
    range,
  }: {
    title: string
    isLoading: boolean
    range: string
  }) => (
    <div data-testid="chart-wrapper" data-range={range}>
      {isLoading ? <div role="status" /> : <span>{title}</span>}
    </div>
  ),
}))

const mockUseSeries = useSeries as jest.MockedFunction<typeof useSeries>

describe('FeaturedChart', () => {
  it('passes isLoading to ChartWrapper when loading', () => {
    mockUseSeries.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      isStale: false,
      retry: jest.fn(),
    })
    render(<FeaturedChart />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('passes title "Real GDP" to ChartWrapper', () => {
    mockUseSeries.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      isStale: false,
      retry: jest.fn(),
    })
    render(<FeaturedChart />)
    expect(screen.getByText('Real GDP')).toBeInTheDocument()
  })

  it('defaults range to 5y', () => {
    mockUseSeries.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      isStale: false,
      retry: jest.fn(),
    })
    render(<FeaturedChart />)
    expect(screen.getByTestId('chart-wrapper')).toHaveAttribute('data-range', '5y')
  })
})
