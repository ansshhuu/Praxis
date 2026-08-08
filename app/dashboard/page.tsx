'use client'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { StatCards } from '@/components/dashboard/stat-cards'
import { SuccessRateChart } from '@/components/dashboard/success-rate-chart'
import { UsageChart } from '@/components/dashboard/usage-chart'
import { WorkflowRunsTable } from '@/components/dashboard/workflow-runs-table'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Clock } from 'lucide-react'

// Dummy data for Recent Activity
const recentActivity = [
  { id: 1, action: "Invoice Processing", status: "completed", time: "10 min ago" },
  { id: 2, action: "Employee Onboarding", status: "failed", time: "45 min ago" },
  { id: 3, action: "Weekly Report Gen", status: "completed", time: "2 hours ago" },
  { id: 4, action: "Data Sync to CRM", status: "running", time: "Now" },
]

export default function DashboardPage() {
  return (
    <DashboardShell>
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Overview of your workflows, runs, and AI usage.
            </p>
          </div>
        </div>

        {/* 1. Stat Cards Row */}
        <StatCards />

        {/* 2. Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <SuccessRateChart />
          </div>
          <div className="lg:col-span-2">
            <UsageChart />
          </div>
        </div>

        {/* 3. Lists Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Top Failed Workflows</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <WorkflowRunsTable />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="px-6 flex flex-col gap-4">
                {recentActivity.map(act => (
                  <div key={act.id} className="flex items-center justify-between border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 rounded-full bg-gray-50 items-center justify-center">
                        <Clock className="size-3.5 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{act.action}</p>
                        <p className="text-xs text-gray-500">{act.time}</p>
                      </div>
                    </div>
                    <StatusBadge status={act.status} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
