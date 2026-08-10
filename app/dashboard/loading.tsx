import { RecentRunsTableSkeleton } from '@/components/dashboard/recent-runs-table'
import { StatCardsSkeleton } from '@/components/dashboard/stat-cards'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pt-6 pb-8 md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-8 w-44 rounded-full" />
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
        </div>
      </div>

      <StatCardsSkeleton />

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
    </div>
  )
}
