import { Activity, Coins, Gauge, Zap } from 'lucide-react'
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

import type { AgentMetricView, AgentSnapshotView, LatencyBucketView, ProviderMetricView } from './types'

const PROVIDER_COLORS: Record<string, string> = {
  openai: '#10b981',
  anthropic: '#D4A017',
  gemini: '#3b82f6',
  ollama: '#a855f7',
  unknown: '#9ca3af',
}

const tooltipStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #f3f4f6',
  borderRadius: '0.75rem',
  fontSize: 12,
  fontWeight: 600,
  padding: '8px 12px',
}

export function TokenConsumptionWidget({ metrics }: { metrics: AgentMetricView[] }) {
  const totalTokens = metrics.reduce((sum, m) => sum + m.totalTokens, 0)
  return <StatCard title="Token Consumption" value={totalTokens.toLocaleString()} icon={Zap} />
}

export function EstimatedCostWidget({ metrics }: { metrics: AgentMetricView[] }) {
  const totalCost = metrics.reduce((sum, m) => sum + m.totalCost, 0)
  return <StatCard title="Estimated LLM Cost" value={`$${totalCost.toFixed(2)}`} icon={Coins} />
}

export function TotalAgentRunsWidget({ metrics }: { metrics: AgentMetricView[] }) {
  const totalRuns = metrics.reduce((sum, m) => sum + m.runCount, 0)
  return <StatCard title="Total Agent Runs" value={totalRuns.toLocaleString()} icon={Activity} />
}

export function AvgAgentLatencyWidget({ metrics }: { metrics: AgentMetricView[] }) {
  const withRuns = metrics.filter((m) => m.runCount > 0)
  const avg = withRuns.length === 0 ? 0 : withRuns.reduce((sum, m) => sum + m.avgLatencyMs, 0) / withRuns.length
  return <StatCard title="Avg Agent Latency" value={`${Math.round(avg)}ms`} icon={Gauge} />
}

export function LatencyHistogramWidget({ histogram }: { histogram: LatencyBucketView[] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Model Latency Histogram</CardTitle>
        <CardDescription>Distribution of agent execution latency</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={histogram} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 500 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af', fontWeight: 500 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f9fafb' }} />
            <Bar dataKey="count" name="Runs" fill="#D4A017" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

export function ProviderDistributionWidget({ providers }: { providers: ProviderMetricView[] }) {
  const data = providers.map((p) => ({ name: p.provider, value: p.runCount }))
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Multi-Provider Gateway Distribution</CardTitle>
        <CardDescription>OpenAI vs. Gemini vs. Claude vs. Ollama usage</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-10 text-center text-[13px] font-medium text-gray-400">No agent runs recorded yet.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={2}>
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={PROVIDER_COLORS[entry.name] ?? '#9ca3af'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              {data.map((entry) => (
                <span key={entry.name} className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  <span className="size-2.5 rounded-sm" style={{ backgroundColor: PROVIDER_COLORS[entry.name] ?? '#9ca3af' }} />
                  {entry.name}
                </span>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function AgentPerformanceRankingWidget({ metrics }: { metrics: AgentMetricView[] }) {
  const top = [...metrics].sort((a, b) => b.runCount - a.runCount).slice(0, 10)
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Agent Performance Ranking</CardTitle>
        <CardDescription>Top agents by run volume, latency and error rate</CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        {top.length === 0 ? (
          <p className="px-6 py-10 text-center text-[13px] font-medium text-gray-400">No agent activity recorded yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Agent</TableHead>
                <TableHead>Runs</TableHead>
                <TableHead>Avg Latency</TableHead>
                <TableHead className="pr-6">Error Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top.map((metric) => (
                <TableRow key={metric.agentId}>
                  <TableCell className="pl-6 font-bold text-gray-900">{metric.agentId}</TableCell>
                  <TableCell className="tabular-nums">{metric.runCount}</TableCell>
                  <TableCell className="tabular-nums">{Math.round(metric.avgLatencyMs)}ms</TableCell>
                  <TableCell className={cn('pr-6 tabular-nums font-bold', metric.errorRate > 0.2 ? 'text-red-600' : 'text-gray-700')}>
                    {Math.round(metric.errorRate * 100)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export function AgentMiniGrid({ snapshot }: { snapshot: AgentSnapshotView[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Live Agent Status Grid</CardTitle>
        <CardDescription>All {snapshot.length} registered agents at a glance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {snapshot.map((agent) => (
            <div key={agent.id} className="flex flex-col gap-1.5 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
              <div className="flex items-center justify-between">
                <span className="truncate text-[11.5px] font-bold text-gray-900">{agent.name}</span>
              </div>
              <StatusBadge status={agent.status} className="w-fit" />
              <span className="text-[11px] font-medium text-gray-400 tabular-nums">
                {agent.lastLatencyMs !== null ? `${agent.lastLatencyMs}ms` : 'no runs yet'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
