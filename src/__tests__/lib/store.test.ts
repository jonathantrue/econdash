import { usePrefsStore } from '@/lib/store'

describe('usePrefsStore', () => {
  beforeEach(() => {
    usePrefsStore.setState({
      defaultRange: '5y',
      recessionBandsOn: false,
      featuredChartIndex: 0,
    })
  })

  it('has correct initial state', () => {
    const state = usePrefsStore.getState()
    expect(state.defaultRange).toBe('5y')
    expect(state.recessionBandsOn).toBe(false)
    expect(state.featuredChartIndex).toBe(0)
  })

  it('setDefaultRange updates range', () => {
    usePrefsStore.getState().setDefaultRange('10y')
    expect(usePrefsStore.getState().defaultRange).toBe('10y')
  })

  it('toggleRecessionBands flips the value', () => {
    usePrefsStore.getState().toggleRecessionBands()
    expect(usePrefsStore.getState().recessionBandsOn).toBe(true)
    usePrefsStore.getState().toggleRecessionBands()
    expect(usePrefsStore.getState().recessionBandsOn).toBe(false)
  })

  it('setFeaturedChartIndex updates index', () => {
    usePrefsStore.getState().setFeaturedChartIndex(3)
    expect(usePrefsStore.getState().featuredChartIndex).toBe(3)
  })
})
