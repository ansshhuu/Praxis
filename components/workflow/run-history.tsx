'use client'

import { History, RefreshCw, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type WorkflowRunRecord = {
  id: string
  status: 'RUNNING' | 'SUCCESS' | 'FAILED'
  error: string | null
  startedAt: string
  finishedAt: string | null
  output: { steps?: { label: string; message: string; status: string }[] } | null
}

const statusStyles: Record<WorkflowRunRecord['status'], string> = {
  SUCCESS: 'bg-[#16a34a]/10 text-[#16a34a]',
  FAILED: 'bg-destructive/10 text-destructive',
  RUNNING: 'bg-amber-500/15 text-amber-600',
}

function duration(run: WorkflowRunRecord) {
  if (!run.finishedAt) return '—'
  const ms = new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime()
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`
}

/**
 * Execution history panel. Rendered alongside the canvas as an overlay so the
 * builder layout itself is untouched.
 */
export function RunHistory({
  workflowId,
  open,
  refreshToken,
  onClose,
}: {
  workflowId: string | null
  open: boolean
  /** Bump to force a refetch (e.g. after a run finishes). */
  refreshToken: number
  onClose: () => void
}) {
  const [runs, setRuns] = useState<WorkflowRunRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workflowId) {
      setRuns([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/workflows/${workflowId}/runs`)
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? 'Failed to load run history')
      setRuns(payload.runs ?? [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [workflowId])

  useEffect(() => {
    if (open) void load()
  }, [open, refreshToken, load])

  return (
    <div
      className={cn(
        'absolute inset-y-0 right-0 z-20 flex w-80 max-w-[85%] flex-col border-l border-border bg-card shadow-xl transition-transform duration-300 ease-out',
        open ? 'translate-x-0' : 'pointer-events-none translate-x-full',
      )}
      role="dialog"
      aria-label="Execution history"
      aria-hidden={!open}
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <History className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">Execution History</p>
            <p className="text-xs text-muted-foreground">Most recent runs first</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Refresh history"
            onClick={() => void load()}
            disabled={loading || !workflowId}
          >
            <RefreshCw className={cn('size-4', loading && 'animate-spin')} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="-mr-1 size-8"
            aria-label="Close history"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {!workflowId && (
          <p className="text-xs text-muted-foreground">
            Save this workflow to start recording executions.
          </p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
        {workflowId && !error && runs.length === 0 && !loading && (
          <p className="text-xs text-muted-foreground">No runs yet.</p>
        )}

        <ul className="flex flex-col gap-2">
          {runs.map((run) => (
            <li key={run.id} className="rounded-lg border border-border p-3">
              <button
                type="button"
                onClick={() => setExpanded((id) => (id === run.id ? null : run.id))}
                className="flex w-full items-center justify-between gap-2 text-left"
              >
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    statusStyles[run.status],
                  )}
                >
                  {run.status}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {new Date(run.startedAt).toLocaleString()} · {duration(run)}
                </span>
              </button>

              {expanded === run.id && (
                <div className="mt-2 flex flex-col gap-1 border-t border-border pt-2">
                  {run.error && <p className="text-xs text-destructive">{run.error}</p>}
                  {run.output?.steps?.map((step, i) => (
                    <p key={i} className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{step.label}</span>
                      {' — '}
                      {step.message}
                    </p>
                  ))}
                  {!run.error && !run.output?.steps?.length && (
                    <p className="text-xs text-muted-foreground">No step details recorded.</p>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
