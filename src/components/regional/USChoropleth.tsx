'use client'

import { useMemo } from 'react'
import { geoAlbersUsa, geoPath } from 'd3-geo'
import { feature } from 'topojson-client'
import { scaleSequential } from 'd3-scale'
import { interpolateBlues } from 'd3-scale-chromatic'
import type { FeatureCollection, Geometry } from 'geojson'

// us-atlas ships untyped JSON; we cast it to the shape we need.
type UsAtlasTopology = {
  type: 'Topology'
  objects: { states: { type: string; geometries: unknown[] } }
  arcs: number[][][]
  transform?: { scale: [number, number]; translate: [number, number] }
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const usAtlas = require('us-atlas/states-10m.json') as UsAtlasTopology

type StateFeature = {
  id: string | number
  type: 'Feature'
  geometry: Geometry | null
  properties: Record<string, unknown>
}

export type StateValue = {
  fips: string
  value: number | null
}

type USChoroplethProps = {
  values: StateValue[]
  colorDomain?: [number, number]
  onStateClick?: (fips: string) => void
  highlightedFips?: string[]
}

const WIDTH = 975
const HEIGHT = 610

export function USChoropleth({
  values,
  colorDomain = [2, 10],
  onStateClick,
  highlightedFips = [],
}: USChoroplethProps) {
  const { pathGenerator, stateFeatures } = useMemo(() => {
    const projection = geoAlbersUsa().scale(1300).translate([WIDTH / 2, HEIGHT / 2])
    const pathFn = geoPath(projection)
    // @ts-expect-error — us-atlas is untyped JSON; topojson-client accepts it
    const fc = feature(usAtlas, usAtlas.objects.states) as FeatureCollection<Geometry>
    return {
      pathGenerator: pathFn,
      stateFeatures: (fc.features ?? []) as StateFeature[],
    }
  }, [])

  const valueMap = useMemo(
    () => new Map(values.map(v => [v.fips, v.value])),
    [values]
  )

  const colorScale = useMemo(
    () => scaleSequential(interpolateBlues).domain(colorDomain),
    [colorDomain]
  )

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      width="100%"
      aria-label="US states unemployment rate map"
      role="img"
    >
      {stateFeatures.map(state => {
        const fips = String(state.id).padStart(2, '0')
        const value = valueMap.get(fips) ?? null
        const fill = value !== null ? colorScale(value) : '#e2e8f0'
        const pathD = pathGenerator(state as Parameters<typeof pathGenerator>[0]) ?? ''
        const isSelected = highlightedFips.includes(fips)

        return (
          <path
            key={fips}
            d={pathD}
            fill={isSelected ? '#f59e0b' : fill}
            stroke="white"
            strokeWidth={0.5}
            className={onStateClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
            onClick={() => onStateClick?.(fips)}
          />
        )
      })}
    </svg>
  )
}
