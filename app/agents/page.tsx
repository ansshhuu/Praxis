'use client'

import { AlertCircle, Bot, ShieldAlert, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'

import { AgentGrid } from '@/components/agents/agent-grid'
import { AgentRunnerDrawer } from '@/components/agents/agent-runner-drawer'
import type { AgentView } from '@/components/agents/types'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard } from '@/components/ui/stat-card'

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentView[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [runningAgent, setRunningAgent] = useState<AgentView | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const response = await fetch('/api/agents')
        const body = await response.json().catch(() => null)
        if (!response.ok) throw new Error((body as { error?: string } | null)?.error ?? 'Could not load agents')
        if (!cancelled) setAgents((body as { agents: AgentView[] }).agents)
      } catch (loadError) {
        if (!cancelled) setError((loadError as Error).message)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const activeCount = agents?.filter((a) => a.health.status === 'active').length ?? 0
  const errorCount = agents?.filter((a) => a.health.status === 'error').length ?? 0
  const avgLatency = agents?.length
    ? Math.round(
        agents.reduce((sum, a) => sum + (a.metrics.runCount > 0 ? a.metrics.avgLatencyMs : 0), 0) /
          agents.filter((a) => a.metrics.runCount > 0).length || 0,
      )
    : 0

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
            <Bot className="size-6 text-[#D4A017]" /> AI Agent Orchestration Hub
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            {agents ? agents.length : '…'} specialized agents across development, business, operations, marketing and content
          </p>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {!agents ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:gap-6">
              <StatCard title="Registered Agents" value={agents.length.toString()} icon={Bot} />
              <StatCard title="Currently Active" value={activeCount.toString()} icon={Zap} iconColor="text-green-600" iconBg="bg-green-50" />
              <StatCard title="Agents In Error" value={errorCount.toString()} icon={ShieldAlert} iconColor={errorCount > 0 ? 'text-red-600' : undefined} iconBg={errorCount > 0 ? 'bg-red-50' : undefined} />
              <StatCard title="Avg Latency" value={avgLatency ? `${avgLatency}ms` : '—'} icon={Zap} />
            </div>

            <AgentGrid agents={agents} onRun={setRunningAgent} />
          </>
        )}
      </div>

      {runningAgent && <AgentRunnerDrawer agent={runningAgent} onClose={() => setRunningAgent(null)} />}
    </DashboardShell>
  )
}
