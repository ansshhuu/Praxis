'use client'

import { ChevronDown, Play, Zap } from 'lucide-react'
import { Fragment, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

import { AGENT_CATEGORY_LABELS, type AgentView } from './types'

function LatencyCell({ ms }: { ms: number | null }) {
  if (ms === null) return <span className="text-[13px] font-medium text-gray-400">—</span>
  const color = ms < 1000 ? 'text-green-600' : ms < 3000 ? 'text-amber-600' : 'text-red-600'
  return <span className={cn('text-[13px] font-bold tabular-nums', color)}>{ms}ms</span>
}

function CapabilityChips({ capabilities }: { capabilities: string[] }) {
  const [visible, ...rest] = capabilities
  if (!visible) return <span className="text-[12px] font-medium text-gray-400">—</span>

  return (
    <div className="flex max-w-[220px] items-center gap-1.5">
      <span className="truncate rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-gray-600">
        {visible}
      </span>
      {rest.length > 0 && (
        <span className="group relative shrink-0">
          <span className="cursor-default rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-bold whitespace-nowrap text-gray-500">
            +{rest.length} more
          </span>
          <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 hidden w-max max-w-[220px] -translate-x-1/2 flex-wrap gap-1 rounded-lg border border-gray-100 bg-gray-900 p-2 text-[11px] font-medium text-white shadow-lg group-hover:flex">
            {rest.map((capability) => (
              <span key={capability} className="rounded bg-white/10 px-1.5 py-0.5 whitespace-nowrap">
                {capability}
              </span>
            ))}
          </span>
        </span>
      )}
    </div>
  )
}

function AgentDetailPanel({ agent }: { agent: AgentView }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
      <div>
        <p className="text-[11px] font-bold tracking-wide text-gray-400 uppercase">Description</p>
        <p className="mt-1 text-[13px] font-medium text-gray-700">{agent.description}</p>
      </div>
      <div>
        <p className="text-[11px] font-bold tracking-wide text-gray-400 uppercase">All capabilities</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {agent.capabilities.map((capability) => (
            <span
              key={capability}
              className="rounded-md border border-gray-100 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600"
            >
              {capability}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="text-[11px] font-bold tracking-wide text-gray-400 uppercase">Runs</p>
          <p className="text-[13.5px] font-bold text-gray-900">{agent.metrics.runCount}</p>
        </div>
        <div>
          <p className="text-[11px] font-bold tracking-wide text-gray-400 uppercase">Error rate</p>
          <p className="text-[13.5px] font-bold text-gray-900">
            {agent.metrics.runCount > 0 ? `${Math.round(agent.metrics.errorRate * 100)}%` : '—'}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold tracking-wide text-gray-400 uppercase">Avg latency</p>
          <p className="text-[13.5px] font-bold text-gray-900">
            {agent.metrics.runCount > 0 ? `${Math.round(agent.metrics.avgLatencyMs)}ms` : '—'}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold tracking-wide text-gray-400 uppercase">Total tokens</p>
          <p className="text-[13.5px] font-bold text-gray-900">{agent.metrics.totalTokens}</p>
        </div>
      </div>
    </div>
  )
}

export function AgentGrid({
  agents,
  onRun,
}: {
  agents: AgentView[]
  onRun: (agent: AgentView) => void
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Agent</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Capabilities</TableHead>
              <TableHead className="hidden lg:table-cell">Avg Latency</TableHead>
              <TableHead className="hidden lg:table-cell">Error Rate</TableHead>
              <TableHead className="sticky right-0 bg-gray-50/80 pr-6 text-right">Run</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent) => {
              const isExpanded = expandedId === agent.id
              return (
                <Fragment key={agent.id}>
                  <TableRow className="hover:bg-gray-50/50">
                    <TableCell className="pl-6">
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        onClick={() => setExpandedId((prev) => (prev === agent.id ? null : agent.id))}
                        className="flex items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-[#F5CA50]"
                      >
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#FFFAEC] text-[#D4A017]">
                          <Zap className="size-4" />
                        </div>
                        <div>
                          <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-gray-900">
                            {agent.name}
                            <ChevronDown className={cn('size-3.5 text-gray-400 transition-transform', isExpanded && 'rotate-180')} />
                          </p>
                          <p className="max-w-[220px] truncate text-[12px] font-medium text-gray-500">
                            {agent.description}
                          </p>
                        </div>
                      </button>
                    </TableCell>
                    <TableCell>
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600 uppercase tracking-wide">
                        {AGENT_CATEGORY_LABELS[agent.category]}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={agent.health.status} />
                    </TableCell>
                    <TableCell>
                      <CapabilityChips capabilities={agent.capabilities} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <LatencyCell ms={agent.health.lastLatencyMs ?? (agent.metrics.runCount > 0 ? Math.round(agent.metrics.avgLatencyMs) : null)} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span className="text-[13px] font-bold tabular-nums text-gray-700">
                        {agent.metrics.runCount > 0 ? `${Math.round(agent.metrics.errorRate * 100)}%` : '—'}
                      </span>
                    </TableCell>
                    <TableCell className="sticky right-0 bg-white pr-6 text-right">
                      <Button size="sm" variant="outline" onClick={() => onRun(agent)}>
                        <Play className="size-3.5" />
                        Run
                      </Button>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={7} className="bg-gray-50/30 pl-6">
                        <AgentDetailPanel agent={agent} />
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
