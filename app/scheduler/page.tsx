'use client'

import { Loader2, Pause, Play, Plus, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Wire format returned by /api/scheduler/jobs. */
interface ScheduledJob {
  id: string
  workflowId: string
  workflowName: string
  cronExpr: string
  cronReadable: string
  nextRun: string
  lastRun: string | null
  isActive: boolean
  triggeredBy: string
}

interface WorkflowOption {
  id: string
  name: string
}

function formatRunTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null)
  return (body as { error?: string } | null)?.error ?? fallback
}

// ─── Toggle Switch ─────────────────────────────────────────────────────────────

function StatusToggle({ active, onChange, id }: { active: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={active}
      title={active ? 'Pause job' : 'Activate job'}
      onClick={() => onChange(!active)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active ? 'bg-primary' : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform',
          active ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

// ─── New Job Modal ─────────────────────────────────────────────────────────────

function NewJobModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (job: ScheduledJob) => void
}) {
  const [workflows, setWorkflows] = useState<WorkflowOption[]>([])
  const [workflowId, setWorkflowId] = useState('')
  const [cronExpr, setCronExpr] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // A schedule points at a workflow by id, so the picker is populated from the
  // user's own workflows rather than accepting a free-text name.
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch('/api/workflows')
        if (!response.ok) throw new Error(await readError(response, 'Could not load workflows.'))
        const { workflows: rows } = (await response.json()) as { workflows: WorkflowOption[] }
        if (cancelled) return
        setWorkflows(rows)
        setWorkflowId((current) => current || rows[0]?.id || '')
      } catch (loadError) {
        if (!cancelled) setError((loadError as Error).message)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleSave() {
    if (isSaving) return
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/scheduler/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflow_id: workflowId, cron_expr: cronExpr.trim() }),
      })

      if (!response.ok) {
        throw new Error(await readError(response, 'Could not save the job.'))
      }

      const { job } = (await response.json()) as { job: ScheduledJob }
      onCreated(job)
      onClose()
    } catch (saveError) {
      setError((saveError as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">New Scheduled Job</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="new-job-workflow">Workflow</label>
            <select
              id="new-job-workflow"
              value={workflowId}
              onChange={(e) => setWorkflowId(e.target.value)}
              className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {workflows.length === 0 ? (
                <option value="">No workflows available</option>
              ) : (
                workflows.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="new-job-cron">Cron Expression</label>
            <input
              id="new-job-cron"
              value={cronExpr}
              onChange={(e) => setCronExpr(e.target.value)}
              placeholder="e.g. 0 9 * * 1-5 (weekdays at 9 AM)"
              className="rounded-lg border border-input bg-background px-3 py-2 font-mono text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />
            <p className="text-xs text-muted-foreground">Standard 5-field cron expression</p>
          </div>

          {/* Quick presets */}
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Quick Presets</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Every hour', value: '0 * * * *' },
                { label: 'Every day 9 AM', value: '0 9 * * *' },
                { label: 'Every Monday', value: '0 8 * * 1' },
                { label: 'Every 30 min', value: '*/30 * * * *' },
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => setCronExpr(p.value)}
                  className={cn(
                    'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                    cronExpr === p.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background hover:bg-muted',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="mt-4 text-xs text-destructive">{error}</p>}

        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button
            className="flex-1"
            onClick={() => void handleSave()}
            disabled={isSaving || !workflowId || !cronExpr.trim()}
            id="save-new-job-button"
          >
            {isSaving ? <><Loader2 className="size-4 animate-spin" /> Saving…</> : 'Save Job'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function SchedulerPage() {
  const [jobs, setJobs] = useState<ScheduledJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch('/api/scheduler/jobs')
        if (!response.ok) throw new Error(await readError(response, 'Could not load scheduled jobs.'))
        const { jobs: rows } = (await response.json()) as { jobs: ScheduledJob[] }
        if (!cancelled) setJobs(rows)
      } catch (loadError) {
        if (!cancelled) setError((loadError as Error).message)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  async function toggleJob(id: string) {
    const previous = jobs
    // Flip immediately so the switch feels responsive, then reconcile with the
    // server's copy — or roll back if the request fails.
    setJobs((prev) => prev.map((job) => (job.id === id ? { ...job, isActive: !job.isActive } : job)))
    setError(null)

    try {
      const response = await fetch(`/api/scheduler/jobs/${id}`, { method: 'PATCH' })
      if (!response.ok) throw new Error(await readError(response, 'Could not update the job.'))

      const { job } = (await response.json()) as { job: ScheduledJob }
      setJobs((prev) => prev.map((existing) => (existing.id === id ? job : existing)))
    } catch (toggleError) {
      setJobs(previous)
      setError((toggleError as Error).message)
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Scheduler</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage automated job schedules and cron triggers
            </p>
          </div>
          <Button onClick={() => setShowModal(true)} id="new-scheduled-job-button">
            <Plus className="size-4" />
            New Job
          </Button>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Scheduled Jobs</CardTitle>
            <CardDescription>
              {error ??
                (isLoading
                  ? 'Loading…'
                  : `${jobs.length} jobs configured — ${jobs.filter((job) => job.isActive).length} active`)}
            </CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Workflow</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Cron</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Triggered By</TableHead>
                  <TableHead>Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id} id={`job-row-${job.id}`}>
                    <TableCell className="font-medium text-foreground">{job.workflowName}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{job.cronReadable}</TableCell>
                    <TableCell>
                      <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                        {job.cronExpr}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">{formatRunTime(job.nextRun)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">{formatRunTime(job.lastRun)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{job.triggeredBy}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <StatusToggle
                          active={job.isActive}
                          onChange={() => void toggleJob(job.id)}
                          id={`toggle-job-${job.id}`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {job.isActive ? (
                            <span className="flex items-center gap-1 text-success"><Play className="size-3" /> Active</span>
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground"><Pause className="size-3" /> Paused</span>
                          )}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && jobs.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      No scheduled jobs yet — create one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {showModal && (
        <NewJobModal
          onClose={() => setShowModal(false)}
          onCreated={(job) => setJobs((prev) => [...prev, job])}
        />
      )}
    </DashboardShell>
  )
}
