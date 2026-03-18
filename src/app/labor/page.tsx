import { DetailPage } from '@/components/detail/DetailPage'

const TABS = [
  { id: 'unrate',  label: 'Unemployment',  seriesId: 'UNRATE'  },
  { id: 'u6',      label: 'U-6 Rate',      seriesId: 'U6RATE'  },
  { id: 'payems',  label: 'Payrolls',      seriesId: 'PAYEMS'  },
  { id: 'civpart', label: 'Participation', seriesId: 'CIVPART' },
] as const

export default function LaborPage() {
  return <DetailPage title="Labor Market" tabs={TABS} />
}
