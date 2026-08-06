import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { StatCards } from '@/components/dashboard/stat-cards'
import { SuccessRateChart } from '@/components/dashboard/success-rate-chart'
import { UsageChart } from '@/components/dashboard/usage-chart'
import { WorkflowRunsTable } from '@/components/dashboard/workflow-runs-table'

export default function DashboardPage() {
  return (
    <DashboardShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of your automation platform
          </p>
        </div>

        <StatCards />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <SuccessRateChart />
          </div>
          <div className="lg:col-span-2">
            <UsageChart />
          </div>
        </div>

        <WorkflowRunsTable />
      </div>
    </DashboardShell>
  )
}
