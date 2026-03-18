'use client'

import type { SeriesData } from '@/lib/data/types'

type ExportButtonProps = {
  chartRef: React.RefObject<HTMLDivElement | null>
  seriesData: SeriesData | null
  range: string
}

async function exportPng(el: HTMLElement, seriesId: string, range: string) {
  const html2canvas = (await import('html2canvas')).default
  const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false })
  const link = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)
  link.download = `econdash-${seriesId}-${range}-${date}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

function exportCsv(data: SeriesData, range: string) {
  const rows = ['date,value', ...data.data.map(pt => `${pt.date},${pt.value}`)]
  const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.download = `econdash-${data.id}-${range}.csv`
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}

export function ExportButton({ chartRef, seriesData, range }: ExportButtonProps) {
  const handlePng = () => {
    if (!chartRef.current || !seriesData) return
    void exportPng(chartRef.current, seriesData.id, range)
  }

  const handleCsv = () => {
    if (!seriesData) return
    exportCsv(seriesData, range)
  }

  return (
    <div className="relative group">
      <button
        type="button"
        title="Export"
        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-xs"
      >
        ⬇
      </button>
      <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded shadow-lg z-10 hidden group-hover:block min-w-[100px]">
        <button
          type="button"
          onClick={handlePng}
          className="block w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
        >
          Export PNG
        </button>
        <button
          type="button"
          onClick={handleCsv}
          className="block w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
        >
          Export CSV
        </button>
      </div>
    </div>
  )
}
