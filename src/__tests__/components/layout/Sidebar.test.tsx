/** @jest-environment jsdom */
import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock next/link to render a plain <a>
jest.mock('next/link', () => {
  return function MockLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
    return <a href={href} className={className}>{children}</a>
  }
})

// Default mock: user is on '/'
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

// Import AFTER mocks are set up
import { Sidebar } from '@/components/layout/Sidebar'

describe('Sidebar', () => {
  it('renders all 6 nav links', () => {
    render(<Sidebar />)
    expect(screen.getByText('Overview')).toBeInTheDocument()
    expect(screen.getByText('Macro')).toBeInTheDocument()
    expect(screen.getByText('Markets')).toBeInTheDocument()
    expect(screen.getByText('Labor')).toBeInTheDocument()
    expect(screen.getByText('Housing')).toBeInTheDocument()
    expect(screen.getByText('Regional')).toBeInTheDocument()
  })

  it('marks Overview link as active when pathname is /', () => {
    render(<Sidebar />)
    const link = screen.getByText('Overview').closest('a')
    expect(link?.className).toContain('bg-surface-lowest')
  })

  it('renders brand name and tagline', () => {
    render(<Sidebar />)
    expect(screen.getByText('Federal Intelligence')).toBeInTheDocument()
    expect(screen.getByText('Economic Command Center')).toBeInTheDocument()
  })

  it('renders Export Global Data button', () => {
    render(<Sidebar />)
    expect(screen.getByText('Export Global Data')).toBeInTheDocument()
  })
})
