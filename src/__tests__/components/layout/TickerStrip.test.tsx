/** @jest-environment jsdom */
import React from 'react'
import { render, screen, act } from '@testing-library/react'

// Set up fetch mock BEFORE importing the component so useEffect picks it up
const mockFetch = jest.fn()
global.fetch = mockFetch

// Import AFTER global mock is set
import { TickerStrip } from '@/components/layout/TickerStrip'

const MOCK_TICKER = {
  sp500:    { value: 5000,  change: 10    },
  dow:      { value: 40000, change: -50   },
  nasdaq:   { value: 17000, change: 30    },
  yield10y: { value: 4.25,  change: -0.05 },
  wti:      { value: 80,    change: 1.5   },
  gold:     { value: 2300,  change: 5     },
}

describe('TickerStrip', () => {
  beforeEach(() => mockFetch.mockClear())

  it('renders a loading placeholder (aria-hidden) before data loads', () => {
    mockFetch.mockResolvedValue({ ok: false })
    const { container } = render(<TickerStrip />)
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('shows the market ticker region after successful fetch', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_TICKER),
    })
    await act(async () => { render(<TickerStrip />) })
    expect(screen.getByRole('region', { name: 'Market ticker' })).toBeInTheDocument()
  })

  it('shows the Live pulse indicator when data is loaded', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_TICKER),
    })
    await act(async () => { render(<TickerStrip />) })
    expect(screen.getByText('Live')).toBeInTheDocument()
  })
})
