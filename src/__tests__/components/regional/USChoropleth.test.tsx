/** @jest-environment jsdom */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { USChoropleth } from '@/components/regional/USChoropleth'

jest.mock('us-atlas/states-10m.json', () => ({
  type: 'Topology',
  objects: { states: { type: 'GeometryCollection', geometries: [] } },
  arcs: [],
}))

jest.mock('topojson-client', () => ({
  feature: () => ({
    type: 'FeatureCollection',
    features: [
      { id: 6,  type: 'Feature', geometry: null, properties: {} },
      { id: 36, type: 'Feature', geometry: null, properties: {} },
    ],
  }),
}))

jest.mock('d3-geo', () => ({
  geoAlbersUsa: () => {
    const proj: Record<string, unknown> = {}
    proj['scale'] = () => proj
    proj['translate'] = () => proj
    return proj
  },
  geoPath: () => () => 'M0 0 Z',
}))

jest.mock('d3-scale', () => ({
  scaleSequential: () => {
    const fn = (v: number) => `rgb(0,0,${v})`
    fn['domain'] = () => fn
    return fn
  },
}))

jest.mock('d3-scale-chromatic', () => ({
  interpolateBlues: (t: number) => `rgb(0,0,${t})`,
}))

describe('USChoropleth', () => {
  it('renders an SVG element', () => {
    const { container } = render(<USChoropleth values={[]} />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders one path per state feature', () => {
    const { container } = render(<USChoropleth values={[]} />)
    expect(container.querySelectorAll('path')).toHaveLength(2)
  })

  it('calls onStateClick with FIPS when a state path is clicked', () => {
    const onStateClick = jest.fn()
    const { container } = render(
      <USChoropleth values={[]} onStateClick={onStateClick} />
    )
    const paths = container.querySelectorAll('path')
    fireEvent.click(paths[0]!)
    expect(onStateClick).toHaveBeenCalledWith('06')
  })

  it('does not throw when value is null for a state', () => {
    expect(() =>
      render(<USChoropleth values={[{ fips: '06', value: null }]} />)
    ).not.toThrow()
  })

  it('highlights all FIPS in highlightedFips with amber fill', () => {
    const { container } = render(
      <USChoropleth values={[]} highlightedFips={['06', '36']} />
    )
    const paths = container.querySelectorAll('path')
    // Mock topology has features with id 6 (→ '06') and 36 (→ '36'), in that order.
    expect(paths[0]).toHaveAttribute('fill', '#f59e0b')
    expect(paths[1]).toHaveAttribute('fill', '#f59e0b')
  })
})
