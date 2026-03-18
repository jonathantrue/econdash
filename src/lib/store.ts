import { create } from 'zustand'
import type { FetchOptions } from '@/lib/data/types'

type Range = NonNullable<FetchOptions['range']>

type PrefsState = {
  defaultRange: Range
  recessionBandsOn: boolean
  featuredChartIndex: number
  setDefaultRange: (range: Range) => void
  toggleRecessionBands: () => void
  setFeaturedChartIndex: (index: number) => void
}

export const usePrefsStore = create<PrefsState>()((set) => ({
  defaultRange: '5y',
  recessionBandsOn: false,
  featuredChartIndex: 0,
  setDefaultRange: (range) => set({ defaultRange: range }),
  toggleRecessionBands: () => set((s) => ({ recessionBandsOn: !s.recessionBandsOn })),
  setFeaturedChartIndex: (index) => set({ featuredChartIndex: index }),
}))
