import { ReferenceArea } from 'recharts'
import { NBER_RECESSIONS } from '@/lib/data/nber-recessions'

type RecessionBandsProps = {
  domainStart: number  // Unix ms — leftmost timestamp visible in chart
  domainEnd: number    // Unix ms — rightmost timestamp visible in chart
  yAxisId?: string
}

export function RecessionBands({ domainStart, domainEnd, yAxisId = 'left' }: RecessionBandsProps) {
  const visible = NBER_RECESSIONS.filter(
    r => r.endTs >= domainStart && r.startTs <= domainEnd
  )

  return (
    <>
      {visible.map(r => (
        <ReferenceArea
          key={r.label}
          x1={Math.max(r.startTs, domainStart)}
          x2={Math.min(r.endTs, domainEnd)}
          yAxisId={yAxisId}
          fill="#94a3b8"
          fillOpacity={0.15}
          strokeOpacity={0}
          label={undefined}
        />
      ))}
    </>
  )
}
