'use client'

import { useEffect, useState } from 'react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

interface TrendPoint {
  label: string
  value: number
}

interface WorkflowStatusPoint {
  name: string
  success: number
  failed: number
}

interface ApiCallPoint {
  date: string
  calls: number
}

interface ResponseTimePoint {
  date: string
  p50: number
  p95: number
  p99: number
}

interface StorageUsage {
  label: string
  used: number
  total: number
  unit: string
}

interface Analytics {
  totals: {
    workflowRuns: number
    workflowSuccess: number
    workflowFailed: number
    documentsProcessed: number
    resumesScreened: number
    chatMessages: number
  }
  aiUsageOverTime: TrendPoint[]
  workflowStatus: WorkflowStatusPoint[]
  responseTime: ResponseTimePoint[]
  apiCalls: ApiCallPoint[]
  storage: StorageUsage
}

const AMBER = '#F5CA50'
const DARK_GOLD = '#D4A017'
const SUCCESS = '#22c55e'
const DESTRUCTIVE = '#ef4444'

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #f3f4f6',
  borderRadius: '0.75rem',
  color: '#111827',
  fontSize: 12,
  fontWeight: 600,
  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  padding: '8px 12px',
}

function AiUsageChart({ data }: { data: TrendPoint[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">AI Usage Over Time</CardTitle>
        <CardDescription>Daily AI requests across all modules</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="aiUsageGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={AMBER} stopOpacity={0.4} />
                <stop offset="95%" stopColor={AMBER} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={10} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={10} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: AMBER, strokeOpacity: 0.3 }} />
            <Area type="monotone" dataKey="value" name="Requests" stroke={DARK_GOLD} strokeWidth={3} fill="url(#aiUsageGrad)" dot={false} activeDot={{ r: 5, fill: DARK_GOLD, stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function WorkflowStatusChart({ data }: { data: WorkflowStatusPoint[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Workflow Success / Fail</CardTitle>
        <CardDescription>Daily breakdown of workflow execution results</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={10} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={10} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f9fafb' }} />
            <Bar dataKey="success" name="Success" stackId="a" fill={SUCCESS} radius={[0, 0, 0, 0]} />
            <Bar dataKey="failed" name="Failed" stackId="a" fill={DESTRUCTIVE} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 flex items-center gap-5 justify-center">
          <span className="flex items-center gap-2 text-[12px] font-bold text-gray-500 uppercase tracking-wide">
            <span className="size-2.5 rounded-sm bg-[#22c55e]" /> Success
          </span>
          <span className="flex items-center gap-2 text-[12px] font-bold text-gray-500 uppercase tracking-wide">
            <span className="size-2.5 rounded-sm bg-[#ef4444]" /> Failed
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function ResponseTimeChart({ data }: { data: ResponseTimePoint[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Response Time Trend</CardTitle>
        <CardDescription>Workflow run duration percentiles in milliseconds</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={10} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={10} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="p50" name="p50 (ms)" stroke={AMBER} strokeWidth={3} dot={false} activeDot={{ r: 5, fill: AMBER, stroke: '#fff', strokeWidth: 2 }} />
            <Line type="monotone" dataKey="p95" name="p95 (ms)" stroke={DARK_GOLD} strokeWidth={2} dot={false} strokeDasharray="4 4" activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="p99" name="p99 (ms)" stroke="#9ca3af" strokeWidth={2} dot={false} strokeDasharray="2 4" activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 flex items-center gap-5 justify-center">
          {[{ label: 'p50', color: AMBER }, { label: 'p95', color: DARK_GOLD }, { label: 'p99', color: '#9ca3af' }].map((item) => (
            <span key={item.label} className="flex items-center gap-2 text-[12px] font-bold text-gray-500 uppercase tracking-wide">
              <span className="size-2.5 rounded-sm" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ApiCallsChart({ data }: { data: ApiCallPoint[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">API Calls Count</CardTitle>
        <CardDescription>Recorded platform operations per day</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="apiCallsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={DARK_GOLD} stopOpacity={0.2} />
                <stop offset="95%" stopColor={DARK_GOLD} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={10} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={10} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: DARK_GOLD, strokeOpacity: 0.3 }} />
            <Area type="monotone" dataKey="calls" name="API Calls" stroke={DARK_GOLD} strokeWidth={3} fill="url(#apiCallsGrad)" dot={false} activeDot={{ r: 5, fill: DARK_GOLD, stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

function StorageGauge({ storage }: { storage: StorageUsage }) {
  const usedPct = storage.total > 0 ? Math.round((storage.used / storage.total) * 100) : 0
  const free = Math.round((storage.total - storage.used) * 100) / 100

  const pieData = [
    { name: 'Used', value: storage.used },
    { name: 'Free', value: free },
  ]

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2 text-center">
        <CardTitle className="text-lg">Storage Usage</CardTitle>
        <CardDescription>Platform document and data storage</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        <div className="relative flex items-center justify-center mt-2">
          <ResponsiveContainer width={200} height={200}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={95}
                startAngle={90}
                endAngle={-270}
                paddingAngle={2}
                dataKey="value"
                strokeWidth={0}
              >
                <Cell fill={AMBER} />
                <Cell fill="#f3f4f6" />
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} ${storage.unit}`, '']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-bold tabular-nums text-gray-900">{usedPct}%</span>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">Used</span>
          </div>
        </div>
        <div className="flex w-full justify-around text-center border-t border-gray-100 pt-5">
          <div>
            <p className="text-lg font-bold text-gray-900 tabular-nums">{storage.used} {storage.unit}</p>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Used</p>
          </div>
          <div className="w-px bg-gray-100" />
          <div>
            <p className="text-lg font-bold text-gray-900 tabular-nums">{free} {storage.unit}</p>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Free</p>
          </div>
          <div className="w-px bg-gray-100" />
          <div>
            <p className="text-lg font-bold text-gray-900 tabular-nums">{storage.total} {storage.unit}</p>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const response = await fetch('/api/analytics')
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null
          throw new Error(body?.error ?? 'Could not load analytics.')
        }
        const { analytics: payload } = (await response.json()) as { analytics: Analytics }
        if (!cancelled) setAnalytics(payload)
      } catch (loadError) {
        if (!cancelled) setError((loadError as Error).message)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  return (
    <DashboardShell>
      <div className="mx-auto flex max-w-[1400px] w-full flex-col gap-6 md:p-6 p-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Analytics Overview</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Platform performance metrics and usage insights
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 p-4 border border-red-100">
            <p className="text-[13px] font-bold text-red-600">{error}</p>
          </div>
        )}

        {analytics && (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <AiUsageChart data={analytics.aiUsageOverTime} />
              <WorkflowStatusChart data={analytics.workflowStatus} />
              <ResponseTimeChart data={analytics.responseTime} />
              <ApiCallsChart data={analytics.apiCalls} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-1">
                 <StorageGauge storage={analytics.storage} />
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  )
}
