import { KPIRow } from '@/components/home/KPIRow'
import { FeaturedChart } from '@/components/home/FeaturedChart'
import { ChoroplethStub } from '@/components/home/ChoroplethStub'

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Economic Command Center</h1>
        <p className="text-sm text-slate-500 mt-1">Live US economic data powered by FRED</p>
      </div>

      <KPIRow />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FeaturedChart />
        </div>
        <div>
          <ChoroplethStub />
        </div>
      </div>
    </div>
  )
}
