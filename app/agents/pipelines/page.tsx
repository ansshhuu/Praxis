'use client'

import { AlertCircle, Workflow } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { AgentView } from '@/components/agents/types'
import { PipelineBuilder } from '@/components/agents/pipeline-builder'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Skeleton } from '@/components/ui/skeleton'

export default function AgentPipelinesPage() {
  const [agents, setAgents] = useState<AgentView[] | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
            <Workflow className="size-6 text-[#D4A017]" /> Multi-Agent Pipeline Builder
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Configure sequential or parallel agent stages and inspect shared execution state.
          </p>
        </div>

        {error && (
          <div role="alert" className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {!agents ? (
          <Skeleton className="h-96 w-full rounded-2xl" />
        ) : (
          <PipelineBuilder agents={agents} />
        )}
      </div>
    </DashboardShell>
  )
}
