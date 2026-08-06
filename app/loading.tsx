import { StatCardsSkeleton } from '@/components/dashboard/stat-cards'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { WorkflowRunsTableSkeleton } from '@/components/dashboard/workflow-runs-table'

export default function DashboardLoading() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-24 pt-6 md:px-6 md:pb-8">
      <div className="space-y-2">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>

      <StatCardsSkeleton />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="p-6 shadow-sm lg:col-span-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-4 h-[260px] w-full" />
        </Card>
        <Card className="p-6 shadow-sm lg:col-span-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-4 h-[260px] w-full" />
        </Card>
      </div>

      <WorkflowRunsTableSkeleton />
    </div>
  )
}
