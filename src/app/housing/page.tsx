import { DetailPage } from '@/components/detail/DetailPage'

const TABS = [
  { id: 'mortgage', label: 'Mortgage Rate',  seriesId: 'MORTGAGE30US' },
  { id: 'prices',   label: 'Home Prices',    seriesId: 'CSUSHPISA'    },
  { id: 'starts',   label: 'Housing Starts', seriesId: 'HOUST'        },
  { id: 'afford',   label: 'Affordability',  seriesId: 'FIXHAI'       },
] as const

export default function HousingPage() {
  return <DetailPage title="Housing" tabs={TABS} />
}
