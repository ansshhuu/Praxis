'use client'

import { Download, Loader2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { DASHBOARD_RANGES, type DashboardRange } from '@/lib/dashboard/types'

const RANGE_LABELS: Record<DashboardRange, string> = {
  7: 'Last 7 Days',
  30: 'Last 30 Days',
  90: 'Last 90 Days',
}

function relativeMinutes(from: string | null): string {
  if (!from) return 'just now'
  const minutes = Math.floor((Date.now() - new Date(from).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes === 1) return '1m ago'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  return hours === 1 ? '1h ago' : `${hours}h ago`
}

export function DashboardHeader({
  range,
  onRangeChange,
  generatedAt,
}: {
  range: DashboardRange
  onRangeChange: (range: DashboardRange) => void
  generatedAt: string | null
}) {
  const router = useRouter()
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => setTick((n) => n + 1), 30000)
    return () => window.clearInterval(timer)
  }, [])

  async function handleExport() {
    if (exporting) return
    setExporting(true)
    setExportError(null)
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'WORKFLOW', format: 'PDF' }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Report generation failed')
      if (body.report?.fileUrl) window.open(body.report.fileUrl, '_blank', 'noopener')
    } catch (error) {
      setExportError((error as Error).message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Real-time workspace activity and execution health
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-[12.5px] font-semibold text-green-700">
          <span className="size-1.5 animate-pulse rounded-full bg-green-500" />
          Live · Updated {relativeMinutes(generatedAt)}
        </span>

        <div className="relative">
          <select
            aria-label="Date range"
            value={range}
            onChange={(e) => onRangeChange(Number(e.target.value) as DashboardRange)}
            className="h-9 appearance-none rounded-lg border border-gray-200 bg-white pr-8 pl-3 text-[13px] font-medium text-gray-700 shadow-sm outline-none hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-gray-300"
          >
            {DASHBOARD_RANGES.map((value) => (
              <option key={value} value={value}>
                {RANGE_LABELS[value]}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-gray-400"
          >
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <Button variant="outline" onClick={handleExport} disabled={exporting} className="h-9 font-semibold">
          {exporting ? <Loader2 className="mr-1.5 size-4 animate-spin" /> : <Download className="mr-1.5 size-4" />}
          {exporting ? 'Exporting…' : 'Export Report'}
        </Button>

        <Button
          onClick={() => router.push('/workflows')}
          className="h-9 bg-[#111111] font-semibold text-white hover:brightness-125"
        >
          <Plus className="mr-1.5 size-4" />
          New Workflow
        </Button>

        {exportError && (
          <p role="alert" className="basis-full text-right text-xs font-medium text-red-600">
            {exportError}
          </p>
        )}
      </div>
    </div>
  )
}
