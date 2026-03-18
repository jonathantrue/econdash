/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { RegionalExplorer } from '@/components/regional/RegionalExplorer'
import { useMultiSeries } from '@/lib/hooks/useMultiSeries'
import { useSeries } from '@/lib/hooks/useSeries'

jest.mock('@/lib/hooks/useMultiSeries')
jest.mock('@/lib/hooks/useSeries')
jest.mock('@/components/regional/USChoropleth', () => ({
  USChoropleth: ({
    onStateClick,
  }: {
    onStateClick?: (fips: string) => void
  }) => (
    <div
      data-testid="us-choropleth"
      onClick={() => onStateClick?.('06')}
    />
  ),
}))
jest.mock('@/components/charts/ChartWrapper', () => ({
  ChartWrapper: ({ title }: { title: string }) => (
    <div data-testid="chart-wrapper">{title}</div>
  ),
}))

const mockUseMultiSeries = useMultiSeries as jest.MockedFunction<typeof useMultiSeries>
const mockUseSeries = useSeries as jest.MockedFunction<typeof useSeries>

const BASE_SERIES_RETURN = {
  data: null,
  isLoading: false,
  isError: false,
  isStale: false,
  retry: jest.fn(),
}

describe('RegionalExplorer', () => {
  beforeEach(() => {
    mockUseSeries.mockReturnValue(BASE_SERIES_RETURN)
  })

  it('shows loading spinner when fetching state data', () => {
    mockUseMultiSeries.mockReturnValue({
      results: null,
      isLoading: true,
      isError: false,
      retry: jest.fn(),
    })
    render(<RegionalExplorer />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders USChoropleth when data loads', () => {
    mockUseMultiSeries.mockReturnValue({
      results: null,
      isLoading: false,
      isError: false,
      retry: jest.fn(),
    })
    render(<RegionalExplorer />)
    expect(screen.getByTestId('us-choropleth')).toBeInTheDocument()
  })

  it('shows placeholder text when no state is selected', () => {
    mockUseMultiSeries.mockReturnValue({
      results: null,
      isLoading: false,
      isError: false,
      retry: jest.fn(),
    })
    render(<RegionalExplorer />)
    expect(screen.getByText(/select a state/i)).toBeInTheDocument()
  })

  it('shows ChartWrapper with state name when state is clicked', () => {
    mockUseMultiSeries.mockReturnValue({
      results: null,
      isLoading: false,
      isError: false,
      retry: jest.fn(),
    })
    render(<RegionalExplorer />)
    fireEvent.click(screen.getByTestId('us-choropleth'))
    expect(screen.getByTestId('chart-wrapper')).toBeInTheDocument()
    expect(screen.getByText(/california/i)).toBeInTheDocument()
  })
})
