/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { KPICard } from '@/components/charts/KPICard'
import type { SeriesDataPoint } from '@/lib/data/types'

jest.mock('recharts', () => {
  const React = require('react')
  return {
    LineChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  }
})

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }))

const DATA: SeriesDataPoint[] = [
  { date: '2024-01-01', value: 3.1 },
  { date: '2024-02-01', value: 3.4 },
]

describe('KPICard', () => {
  it('shows skeleton when loading', () => {
    const { container } = render(
      <KPICard label="CPI" href="/macro" isLoading isError={false} />
    )
    // shadcn Skeleton renders a div with animate-pulse
    expect(container.querySelector('[class*="animate-pulse"]')).toBeInTheDocument()
  })

  it('shows dash when error', () => {
    render(<KPICard label="CPI" href="/macro" isLoading={false} isError value={undefined} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('shows value and label', () => {
    render(
      <KPICard
        label="CPI"
        href="/macro"
        isLoading={false}
        isError={false}
        value={3.4}
        unitsShort="% YoY"
        sparklineData={DATA}
      />
    )
    expect(screen.getByText('CPI')).toBeInTheDocument()
    expect(screen.getByText('3.40')).toBeInTheDocument()
  })

  it('shows up arrow when delta is positive', () => {
    render(
      <KPICard
        label="CPI"
        href="/macro"
        isLoading={false}
        isError={false}
        value={3.4}
        sparklineData={DATA}
      />
    )
    expect(screen.getByText('▲')).toBeInTheDocument()
  })

  it('calls onClick when clicked', async () => {
    const onClick = jest.fn()
    render(
      <KPICard
        label="CPI"
        href="/macro"
        isLoading={false}
        isError={false}
        value={3.4}
        onClick={onClick}
      />
    )
    await userEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('hero variant renders gradient container', () => {
    const { container } = render(
      <KPICard label="CPI" href="/macro" isLoading={false} isError={false} value={3.4} variant="hero" />
    )
    const btn = container.querySelector('button')
    expect(btn?.className).toContain('from-primary')
  })

  it('hero variant shows em-dash with overlay-text class on error', () => {
    render(
      <KPICard label="CPI" href="/macro" isLoading={false} isError variant="hero" />
    )
    const dash = screen.getByText('—')
    expect(dash.className).toContain('text-overlay-text')
  })

  it('default variant uses ambient shadow, not border', () => {
    const { container } = render(
      <KPICard label="CPI" href="/macro" isLoading={false} isError={false} value={3.4} />
    )
    const btn = container.querySelector('button')
    expect(btn?.className).not.toContain('border-slate-200')
    expect(btn?.className).toContain('shadow-')
  })

  it('default variant up-arrow uses text-chart-3', () => {
    render(
      <KPICard
        label="CPI"
        href="/macro"
        isLoading={false}
        isError={false}
        value={3.4}
        sparklineData={DATA}
      />
    )
    const arrow = screen.getByText('▲')
    expect(arrow.className).toContain('text-chart-3')
  })
})
