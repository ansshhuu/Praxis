'use client'

import { AlertCircle } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { ActivityFeed } from '@/components/dashboard/activity-feed'
import { AiUsageCard } from '@/components/dashboard/ai-usage-card'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { RecentRunsTable, RecentRunsTableSkeleton } from '@/components/dashboard/recent-runs-table'
import { StatCards, StatCardsSkeleton } from '@/components/dashboard/stat-cards'
import { SuccessRateChart } from '@/components/dashboard/success-rate-chart'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ACTIVITY_MAX,
  ACTIVITY_PAGE_SIZE,
  type DashboardPayload,
  type DashboardRange,
} from '@/lib/dashboard/types'

function ChartRowSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i}>
          <div className="px-6">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-2 h-4 w-56" />
            <Skeleton className="mt-5 h-[240px] w-full" />
          </div>
        </Card>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const [range, setRange] = useState<DashboardRange>(7)
  const [runsPage, setRunsPage] = useState(1)
  const [activityLimit, setActivityLimit] = useState(ACTIVITY_PAGE_SIZE)

  const [data, setData] = useState<DashboardPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const requestId = useRef(0)

  const load = useCallback(async () => {
    const id = ++requestId.current
    try {
      const res = await fetch(
        `/api/dashboard?range=${range}&runsPage=${runsPage}&activityLimit=${activityLimit}`,
        { cache: 'no-store' },
      )
      const body = await res.json().catch(() => ({}))
      if (id !== requestId.current) return
      if (!res.ok) throw new Error(body.error || 'Could not load dashboard data')
      setData(body.dashboard as DashboardPayload)
      setError(null)
    } catch (err) {
      if (id !== requestId.current) return
      setError((err as Error).message)
    } finally {
      if (id === requestId.current) setLoadingMore(false)
    }
  }, [range, runsPage, activityLimit])

  useEffect(() => {
    load()
  }, [load])

  function handleRangeChange(next: DashboardRange) {
    setRange(next)
    setRunsPage(1)
  }

  function handleLoadMore() {
    setLoadingMore(true)
    setActivityLimit((current) => Math.min(current + ACTIVITY_PAGE_SIZE, ACTIVITY_MAX))
  }

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <DashboardHeader
          range={range}
          onRangeChange={handleRangeChange}
          generatedAt={data?.generatedAt ?? null}
        />

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700"
          >
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {!data ? (
          <>
            <StatCardsSkeleton />
            <ChartRowSkeleton />
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <RecentRunsTableSkeleton />
              </div>
              <Card>
                <div className="px-6">
                  <Skeleton className="h-5 w-36" />
                  <div className="mt-4 space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </>
        ) : (
          <>
            <StatCards stats={data.stats} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SuccessRateChart
                data={data.successRate}
                range={data.range}
                onRangeChange={handleRangeChange}
              />
              <AiUsageCard modules={data.moduleUsage} range={data.range} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="min-w-0 xl:col-span-2">
                <RecentRunsTable
                  rows={data.runs.rows}
                  page={data.runs.page}
                  perPage={data.runs.perPage}
                  total={data.runs.total}
                  onPageChange={setRunsPage}
                />
              </div>
              <ActivityFeed
                items={data.activity.items}
                hasMore={data.activity.hasMore && activityLimit < ACTIVITY_MAX}
                loadingMore={loadingMore}
                onLoadMore={handleLoadMore}
              />
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  )
}
