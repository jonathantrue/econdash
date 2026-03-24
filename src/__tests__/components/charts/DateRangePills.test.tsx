/**
 * @jest-environment jsdom
 */
import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DateRangePills } from '@/components/charts/DateRangePills'

describe('DateRangePills', () => {
  it('renders all 5 range options', () => {
    render(<DateRangePills value="5y" onChange={jest.fn()} />)
    expect(screen.getByText('1Y')).toBeInTheDocument()
    expect(screen.getByText('2Y')).toBeInTheDocument()
    expect(screen.getByText('5Y')).toBeInTheDocument()
    expect(screen.getByText('10Y')).toBeInTheDocument()
    expect(screen.getByText('Max')).toBeInTheDocument()
  })

  it('highlights the active range', () => {
    render(<DateRangePills value="5y" onChange={jest.fn()} />)
    const active = screen.getByText('5Y').closest('button')
    expect(active?.className).toContain('bg-surface-lowest')
  })

  it('calls onChange with the selected range', async () => {
    const onChange = jest.fn()
    render(<DateRangePills value="5y" onChange={onChange} />)
    await userEvent.click(screen.getByText('10Y'))
    expect(onChange).toHaveBeenCalledWith('10y')
  })
})
