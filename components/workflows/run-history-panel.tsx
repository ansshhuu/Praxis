'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

import { ExecutionTraceTree } from './execution-trace-tree'
import type { WorkflowRunTraceView } from './types'

const PAGE_SIZE = 10

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function RunHistoryPanel() {
  const [page, setPage] = useState(1)
  const [traces, setTraces] = useState<WorkflowRunTraceView[] | null>(null)
  const [total, setTotal] = useState(0)
  const [selected, setSelected] = useState<WorkflowRunTraceView | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const response = await fetch(`/api/workflows/history?page=${page}&pageSize=${PAGE_SIZE}`)
        const body = await response.json().catch(() => null)
        if (!response.ok) throw new Error((body as { error?: string } | null)?.error ?? 'Could not load run history')
        if (cancelled) return
        const parsed = body as { traces: WorkflowRunTraceView[]; total: number }
        setTraces(parsed.traces)
        setTotal(parsed.total)
      } catch (loadError) {
        if (!cancelled) setError((loadError as Error).message)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Card className="overflow-hidden xl:col-span-2">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Workflow</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Run at</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {error && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-red-500 font-bold">
                    {error}
                  </TableCell>
                </TableRow>
              )}
              {traces?.length === 0 && !error && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400 font-medium">
                    No workflow runs recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {traces?.map((trace) => (
                <TableRow
                  key={trace.runId}
                  className={cn('cursor-pointer', selected?.runId === trace.runId && 'bg-[#FFFAEC]')}
                  onClick={() => setSelected(trace)}
                >
                  <TableCell className="pl-6 font-bold text-gray-900">{trace.workflowId}</TableCell>
                  <TableCell>
                    <StatusBadge status={trace.status} />
                  </TableCell>
                  <TableCell className="tabular-nums">{trace.executionTime}ms</TableCell>
                  <TableCell className="text-gray-500">{formatDate(trace.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 p-4">
          <span className="text-[12px] font-medium text-gray-500">
            Page {page} of {totalPages} · {total} runs
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="icon-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button variant="outline" size="icon-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="mb-1 text-sm font-bold text-gray-900">Execution Trace</h3>
        <p className="mb-4 text-[12.5px] font-medium text-gray-500">
          {selected ? selected.runId : 'Select a run to inspect its node tree'}
        </p>
        {selected ? (
          <>
            {selected.errorDetails && (
              <p className="mb-3 rounded-lg border border-red-100 bg-red-50 p-2.5 text-[12.5px] font-medium text-red-600">
                {selected.errorDetails}
              </p>
            )}
            <ExecutionTraceTree nodes={selected.nodeExecutionTree} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-100 py-14 text-center">
            <p className="text-[13px] font-medium text-gray-400">No run selected</p>
          </div>
        )}
      </Card>
    </div>
  )
}
