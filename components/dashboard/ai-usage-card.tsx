'use client'

import { useState } from 'react'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import type { ModuleUsage } from '@/lib/dashboard/types'

type Metric = 'requests' | 'share'

export function AiUsageCard({ modules, range }: { modules: ModuleUsage[]; range: number }) {
  const [metric, setMetric] = useState<Metric>('requests')

  const total = modules.reduce((sum, row) => sum + row.count, 0)
  const peak = modules.reduce((max, row) => Math.max(max, row.count), 0)

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>AI Usage by Module</CardTitle>
          <p className="mt-1 text-[13px] text-gray-500">
            {total.toLocaleString('en-US')} requests in the last {range} days
          </p>
        </div>
        <div className="relative shrink-0">
          <select
            aria-label="Usage metric"
            value={metric}
            onChange={(e) => setMetric(e.target.value as Metric)}
            className="h-8 appearance-none rounded-lg border border-gray-200 bg-white pr-7 pl-2.5 text-[12px] font-semibold text-gray-700 outline-none hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-gray-300"
          >
            <option value="requests">By Requests</option>
            <option value="share">By Share</option>
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="pointer-events-none absolute top-1/2 right-2 size-3 -translate-y-1/2 text-gray-400"
          >
            <path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </CardHeader>

      <div className="flex flex-col gap-5 px-6 pb-2">
        {modules.map((row) => {
          const width =
            metric === 'share' ? row.pct : peak === 0 ? 0 : Math.round((row.count / peak) * 1000) / 10
          return (
            <div key={row.id} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex items-center gap-2 text-[13.5px] font-semibold text-gray-900">
                  <span className="size-2 rounded-full" style={{ background: row.color }} />
                  {row.label}
                </span>
                <span className="shrink-0 text-[12.5px] font-medium text-gray-500 tabular-nums">
                  <span className="font-bold text-gray-900">{row.pct}%</span>
                  {' · '}
                  {row.count.toLocaleString('en-US')}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${width}%`, background: row.color }}
                />
              </div>
            </div>
          )
        })}

        {total === 0 && (
          <p className="py-4 text-center text-[13px] text-gray-400">
            No AI activity recorded in this window yet.
          </p>
        )}
      </div>
    </Card>
  )
}
