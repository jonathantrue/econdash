/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { RegionalExplorer } from '@/components/regional/RegionalExplorer'
import { useMultiSeries } from '@/lib/hooks/useMultiSeries'
import { useSeries } from '@/lib/hooks/useSeries'
import { STATES } from '@/lib/data/state-series'
import type { SeriesData } from '@/lib/data/types'

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

// Creates 51 mock results aligned with the STATES array order.
function makeMockResults(): SeriesData[] {
  return STATES.map(s => ({
    id: `${s.abbr}UR`,
    name: 'State Unemployment Rate',
    units: 'Percent',
    unitsShort: '%',
    frequency: 'monthly' as const,
    source: 'FRED',
    data: [{ date: '2024-01-01', value: 4.0 }],
    lastUpdated: '2024-01-01T00:00:00Z',
  }))
}

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

  it('renders States and Regions toggle buttons', () => {
    mockUseMultiSeries.mockReturnValue({
      results: null,
      isLoading: false,
      isError: false,
      retry: jest.fn(),
    })
    render(<RegionalExplorer />)
    expect(screen.getByRole('button', { name: /states/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /regions/i })).toBeInTheDocument()
  })

  it('shows "Select a region" placeholder after switching to region mode', () => {
    mockUseMultiSeries.mockReturnValue({
      results: null,
      isLoading: false,
      isError: false,
      retry: jest.fn(),
    })
    render(<RegionalExplorer />)
    fireEvent.click(screen.getByRole('button', { name: /regions/i }))
    expect(screen.getByText(/select a region/i)).toBeInTheDocument()
  })

  it('shows region ChartWrapper when a state is clicked in region mode', () => {
    mockUseMultiSeries.mockReturnValue({
      results: makeMockResults(),
      isLoading: false,
      isError: false,
      retry: jest.fn(),
    })
    render(<RegionalExplorer />)
    fireEvent.click(screen.getByRole('button', { name: /regions/i }))
    // USChoropleth mock fires onStateClick('06') — California → West region
    fireEvent.click(screen.getByTestId('us-choropleth'))
    expect(screen.getByTestId('chart-wrapper')).toBeInTheDocument()
    expect(screen.getByText(/west unemployment/i)).toBeInTheDocument()
  })
})
