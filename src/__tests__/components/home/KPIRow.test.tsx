/** @jest-environment jsdom */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { KPIRow } from '@/components/home/KPIRow'
import { useMultiSeries } from '@/lib/hooks/useMultiSeries'

jest.mock('@/lib/hooks/useMultiSeries')
jest.mock('@/components/charts/KPICard', () => ({
  KPICard: ({ label, isLoading, isError }: { label: string; isLoading: boolean; isError: boolean }) =>
    isLoading ? (
      <div data-testid="kpi-loading" aria-label={label} />
    ) : (
      <div data-testid={isError ? 'kpi-error' : 'kpi-card'}>{label}</div>
    ),
}))

const mockUseMultiSeries = useMultiSeries as jest.MockedFunction<typeof useMultiSeries>

function makeSeries(id: string) {
  return {
    id,
    name: id,
    source: 'FRED',
    units: '%',
    unitsShort: '%',
    frequency: 'monthly' as const,
    lastUpdated: new Date().toISOString(),
    data: [
      { date: '2024-01-01', value: 1 },
      { date: '2024-02-01', value: 2 },
    ],
  }
}

describe('KPIRow', () => {
  it('shows 5 loading placeholders when loading', () => {
    mockUseMultiSeries.mockReturnValue({
      results: null,
      isLoading: true,
      isError: false,
      retry: jest.fn(),
    })
    render(<KPIRow />)
    expect(screen.getAllByTestId('kpi-loading')).toHaveLength(5)
  })

  it('renders 5 KPI cards with correct labels when data loads', () => {
    mockUseMultiSeries.mockReturnValue({
      results: [
        makeSeries('CPIAUCSL'),
        makeSeries('GDPC1'),
        makeSeries('UNRATE'),
        makeSeries('FEDFUNDS'),
        makeSeries('DGS10'),
      ],
      isLoading: false,
      isError: false,
      retry: jest.fn(),
    })
    render(<KPIRow />)
    expect(screen.getByText('CPI')).toBeInTheDocument()
    expect(screen.getByText('Real GDP')).toBeInTheDocument()
    expect(screen.getByText('Unemployment')).toBeInTheDocument()
    expect(screen.getByText('Fed Funds Rate')).toBeInTheDocument()
    expect(screen.getByText('10Y Yield')).toBeInTheDocument()
  })

  it('forwards isError=true to all 5 KPI cards when fetch fails', () => {
    mockUseMultiSeries.mockReturnValue({
      results: null,
      isLoading: false,
      isError: true,
      retry: jest.fn(),
    })
    render(<KPIRow />)
    expect(screen.getAllByTestId('kpi-error')).toHaveLength(5)
  })
})
