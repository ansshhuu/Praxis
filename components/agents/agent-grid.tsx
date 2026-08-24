'use client'

import { Play, Zap } from 'lucide-react'

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

export function AgentGrid({
  agents,
  onRun,
}: {
  agents: AgentView[]
  onRun: (agent: AgentView) => void
}) {
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
              <TableHead>Avg Latency</TableHead>
              <TableHead>Error Rate</TableHead>
              <TableHead className="pr-6 text-right">Run</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((agent) => (
              <TableRow key={agent.id} className="hover:bg-gray-50/50">
                <TableCell className="pl-6">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#FFFAEC] text-[#D4A017]">
                      <Zap className="size-4" />
                    </div>
                    <div>
                      <p className="text-[13.5px] font-bold text-gray-900">{agent.name}</p>
                      <p className="max-w-[220px] truncate text-[12px] font-medium text-gray-500">
                        {agent.description}
                      </p>
                    </div>
                  </div>
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
                  <div className="flex max-w-[240px] flex-wrap gap-1.5">
                    {agent.capabilities.slice(0, 2).map((capability) => (
                      <span
                        key={capability}
                        className="rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600"
                      >
                        {capability}
                      </span>
                    ))}
                    {agent.capabilities.length > 2 && (
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-500">
                        +{agent.capabilities.length - 2}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <LatencyCell ms={agent.health.lastLatencyMs ?? (agent.metrics.runCount > 0 ? Math.round(agent.metrics.avgLatencyMs) : null)} />
                </TableCell>
                <TableCell>
                  <span className="text-[13px] font-bold tabular-nums text-gray-700">
                    {agent.metrics.runCount > 0 ? `${Math.round(agent.metrics.errorRate * 100)}%` : '—'}
                  </span>
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <Button size="sm" variant="outline" onClick={() => onRun(agent)}>
                    <Play className="size-3.5" />
                    Run
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
