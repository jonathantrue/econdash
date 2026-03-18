import { DetailPage } from '@/components/detail/DetailPage'

const TABS = [
  { id: 'cpi',      label: 'CPI',       seriesId: 'CPIAUCSL'  },
  { id: 'core-cpi', label: 'Core CPI',  seriesId: 'CPILFESL'  },
  { id: 'pce',      label: 'PCE',       seriesId: 'PCEPI'     },
  { id: 'core-pce', label: 'Core PCE',  seriesId: 'PCEPILFE'  },
  { id: 'gdp',      label: 'Real GDP',  seriesId: 'GDPC1'     },
  { id: 'fedfunds', label: 'Fed Funds', seriesId: 'FEDFUNDS'  },
] as const

export default function MacroPage() {
  return <DetailPage title="Macroeconomics" tabs={TABS} />
}
