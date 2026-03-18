import { DetailPage } from '@/components/detail/DetailPage'

const TABS = [
  { id: 'dgs10',    label: '10Y Yield',    seriesId: 'DGS10'    },
  { id: 'dgs2',     label: '2Y Yield',     seriesId: 'DGS2'     },
  { id: 'dgs30',    label: '30Y Yield',    seriesId: 'DGS30'    },
  { id: 'spread',   label: 'Yield Spread', seriesId: 'T10Y2Y'   },
  { id: 'fedfunds', label: 'Fed Funds',    seriesId: 'FEDFUNDS' },
] as const

export default function MarketsPage() {
  return <DetailPage title="Markets & Finance" tabs={TABS} />
}
