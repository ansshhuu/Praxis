import { CheckCircle2, ListChecks, Timer, XCircle } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'

import type { WorkflowDailyPointView, WorkflowStatsView } from './types'

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #f3f4f6',
  borderRadius: '0.75rem',
  fontSize: 12,
  fontWeight: 600,
  padding: '8px 12px',
}

export function WorkflowSuccessRateWidget({ stats }: { stats: WorkflowStatsView }) {
  return <StatCard title="Workflow Success Rate" value={`${Math.round(stats.successRate * 100)}%`} icon={CheckCircle2} iconColor="text-green-600" iconBg="bg-green-50" />
}

export function WorkflowFailureCountWidget({ stats }: { stats: WorkflowStatsView }) {
  return <StatCard title="Failed Runs" value={stats.failed.toString()} icon={XCircle} iconColor={stats.failed > 0 ? 'text-red-600' : undefined} iconBg={stats.failed > 0 ? 'bg-red-50' : undefined} />
}

export function WorkflowTotalRunsWidget({ stats }: { stats: WorkflowStatsView }) {
  return <StatCard title="Total Workflow Runs" value={stats.total.toString()} icon={ListChecks} />
}

export function WorkflowAvgDurationWidget({ stats }: { stats: WorkflowStatsView }) {
  return <StatCard title="Avg Run Duration" value={`${Math.round(stats.avgExecutionTimeMs)}ms`} icon={Timer} />
}

export function QueueThroughputWidget({ trend }: { trend: WorkflowDailyPointView[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">BullMQ Queue Throughput</CardTitle>
        <CardDescription>Workflow runs processed per day (last 14 days)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="queueThroughputGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4A017" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#D4A017" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 500 }} axisLine={false} tickLine={false} tickFormatter={(d: string) => d.slice(5)} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="success" name="Completed" stroke="#D4A017" strokeWidth={2.5} fill="url(#queueThroughputGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
