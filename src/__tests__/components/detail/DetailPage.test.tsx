/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DetailPage } from '@/components/detail/DetailPage'
import { useSeries } from '@/lib/hooks/useSeries'

// Make useQueryState behave like useState using the parser's defaultValue.
jest.mock('nuqs', () => {
  const { useState } = require('react')
  return {
    useQueryState: (_key: string, opts: { defaultValue?: unknown }) =>
      useState(opts?.defaultValue ?? null),
    parseAsString: { withDefault: (v: string) => ({ defaultValue: v }) },
    parseAsBoolean: { withDefault: (v: boolean) => ({ defaultValue: v }) },
  }
})

jest.mock('@/lib/hooks/useSeries')
jest.mock('@/components/charts/ChartWrapper', () => ({
  ChartWrapper: ({
    title,
    seriesId,
    isLoading,
  }: {
    title: string
    seriesId: string
    isLoading: boolean
  }) => (
    <div data-testid="chart-wrapper" data-series-id={seriesId}>
      {isLoading ? <div role="status" /> : <span>{title}</span>}
    </div>
  ),
}))

const mockUseSeries = useSeries as jest.MockedFunction<typeof useSeries>

const BASE_SERIES_RETURN = {
  data: null,
  isLoading: false,
  isError: false,
  isStale: false,
  retry: jest.fn(),
}

const TABS = [
  { id: 'cpi', label: 'CPI', seriesId: 'CPIAUCSL' },
  { id: 'gdp', label: 'Real GDP', seriesId: 'GDPC1' },
] as const

describe('DetailPage', () => {
  beforeEach(() => {
    mockUseSeries.mockReturnValue(BASE_SERIES_RETURN)
  })

  it('renders the page title', () => {
    render(<DetailPage title="Macroeconomics" tabs={TABS} />)
    expect(screen.getByRole('heading', { name: 'Macroeconomics' })).toBeInTheDocument()
  })

  it('renders a tab button for each tab', () => {
    render(<DetailPage title="Macroeconomics" tabs={TABS} />)
    expect(screen.getByRole('button', { name: 'CPI' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Real GDP' })).toBeInTheDocument()
  })

  it('renders ChartWrapper with first tab series by default', () => {
    render(<DetailPage title="Macroeconomics" tabs={TABS} />)
    expect(screen.getByTestId('chart-wrapper')).toHaveAttribute('data-series-id', 'CPIAUCSL')
  })

  it('switches ChartWrapper to second tab series when clicked', () => {
    render(<DetailPage title="Macroeconomics" tabs={TABS} />)
    fireEvent.click(screen.getByRole('button', { name: 'Real GDP' }))
    expect(screen.getByTestId('chart-wrapper')).toHaveAttribute('data-series-id', 'GDPC1')
  })

  it('shows spinner in ChartWrapper when loading', () => {
    mockUseSeries.mockReturnValue({ ...BASE_SERIES_RETURN, isLoading: true })
    render(<DetailPage title="Macroeconomics" tabs={TABS} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
