'use client'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getAiUsageOverTime,
  getApiCallData,
  getResponseTimeData,
  getStorageUsage,
  getWorkflowStatusData,
} from '@/lib/mock-data/analytics'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

// ─── Shared chart config ──────────────────────────────────────────────────────

const INDIGO = '#4F46E5'
const VIOLET = '#7C3AED'
const SUCCESS = '#16a34a'
const DESTRUCTIVE = '#dc2626'
const CHART_3 = '#60a5fa'
const CHART_4 = '#34d399'

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.5rem',
  color: 'hsl(var(--foreground))',
  fontSize: 12,
}

// ─── AI Usage Chart ───────────────────────────────────────────────────────────

function AiUsageChart() {
  const data = getAiUsageOverTime()
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>AI Usage Over Time</CardTitle>
        <CardDescription>Daily AI requests across all modules</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="aiUsageGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={INDIGO} stopOpacity={0.2} />
                <stop offset="95%" stopColor={INDIGO} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: INDIGO, strokeOpacity: 0.3 }} />
            <Area type="monotone" dataKey="value" name="Requests" stroke={INDIGO} strokeWidth={2} fill="url(#aiUsageGrad)" dot={false} activeDot={{ r: 4, fill: INDIGO }} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ─── Workflow Success/Fail Chart ──────────────────────────────────────────────

function WorkflowStatusChart() {
  const data = getWorkflowStatusData()
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Workflow Success / Fail</CardTitle>
        <CardDescription>Daily breakdown of workflow execution results</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }} />
            <Bar dataKey="success" name="Success" stackId="a" fill={SUCCESS} radius={[0, 0, 0, 0]} />
            <Bar dataKey="failed" name="Failed" stackId="a" fill={DESTRUCTIVE} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-sm bg-[#16a34a]" /> Success
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-2 rounded-sm bg-[#dc2626]" /> Failed
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Response Time Trend ──────────────────────────────────────────────────────

function ResponseTimeChart() {
  const data = getResponseTimeData()
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Response Time Trend</CardTitle>
        <CardDescription>API latency percentiles in milliseconds</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="p50" name="p50 (ms)" stroke={INDIGO} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="p95" name="p95 (ms)" stroke={VIOLET} strokeWidth={2} dot={false} strokeDasharray="4 3" activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="p99" name="p99 (ms)" stroke={CHART_3} strokeWidth={2} dot={false} strokeDasharray="2 3" activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-3 flex items-center gap-4">
          {[{ label: 'p50', color: INDIGO }, { label: 'p95', color: VIOLET }, { label: 'p99', color: CHART_3 }].map((item) => (
            <span key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-sm" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── API Calls Chart ──────────────────────────────────────────────────────────

function ApiCallsChart() {
  const data = getApiCallData()
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>API Calls Count</CardTitle>
        <CardDescription>Total API calls per day</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="apiCallsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={CHART_4} stopOpacity={0.25} />
                <stop offset="95%" stopColor={CHART_4} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: CHART_4, strokeOpacity: 0.3 }} />
            <Area type="monotone" dataKey="calls" name="API Calls" stroke={CHART_4} strokeWidth={2} fill="url(#apiCallsGrad)" dot={false} activeDot={{ r: 4, fill: CHART_4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// ─── Storage Gauge ────────────────────────────────────────────────────────────

function StorageGauge() {
  const storage = getStorageUsage()
  const usedPct = Math.round((storage.used / storage.total) * 100)
  const freeGb = storage.total - storage.used

  const pieData = [
    { name: 'Used', value: storage.used },
    { name: 'Free', value: freeGb },
  ]

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Storage Usage</CardTitle>
        <CardDescription>Platform document and data storage</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <ResponsiveContainer width={180} height={180}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                startAngle={90}
                endAngle={-270}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                <Cell fill={INDIGO} />
                <Cell fill="hsl(var(--muted))" />
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} GB`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute flex flex-col items-center">
            <span className="text-2xl font-bold tabular-nums text-foreground">{usedPct}%</span>
            <span className="text-xs text-muted-foreground">Used</span>
          </div>
        </div>
        <div className="flex w-full justify-around text-center">
          <div>
            <p className="text-lg font-semibold tabular-nums">{storage.used} {storage.unit}</p>
            <p className="text-xs text-muted-foreground">Used</p>
          </div>
          <div className="w-px bg-border" />
          <div>
            <p className="text-lg font-semibold tabular-nums">{freeGb} {storage.unit}</p>
            <p className="text-xs text-muted-foreground">Free</p>
          </div>
          <div className="w-px bg-border" />
          <div>
            <p className="text-lg font-semibold tabular-nums">{storage.total} {storage.unit}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  return (
    <DashboardShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform performance metrics and usage insights
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AiUsageChart />
          <WorkflowStatusChart />
          <ResponseTimeChart />
          <ApiCallsChart />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <StorageGauge />
        </div>
      </div>
    </DashboardShell>
  )
}
