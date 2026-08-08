'use client'

import { Loader2, Pause, Play, Plus, X, CalendarClock, Power } from 'lucide-react'
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
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5CA50]',
        active ? 'bg-green-500' : 'bg-gray-200',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform',
          active ? 'translate-x-6' : 'translate-x-1',
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
    return () => { cancelled = true }
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
      if (!response.ok) throw new Error(await readError(response, 'Could not save the job.'))

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
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 md:p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">New Scheduled Job</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="size-5 text-gray-500" />
          </Button>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-gray-900 uppercase tracking-wide" htmlFor="new-job-workflow">Workflow</label>
            <select
              id="new-job-workflow"
              value={workflowId}
              onChange={(e) => setWorkflowId(e.target.value)}
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14px] font-medium text-gray-700 outline-none focus:ring-1 focus:ring-[#F5CA50] focus:border-[#F5CA50] shadow-sm transition-all"
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

          <div className="flex flex-col gap-2">
            <label className="text-[13px] font-bold text-gray-900 uppercase tracking-wide" htmlFor="new-job-cron">Cron Expression</label>
            <input
              id="new-job-cron"
              value={cronExpr}
              onChange={(e) => setCronExpr(e.target.value)}
              placeholder="e.g. 0 9 * * 1-5"
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 font-mono text-[14px] outline-none placeholder:text-gray-400 focus:ring-1 focus:ring-[#F5CA50] focus:border-[#F5CA50] shadow-sm transition-all"
            />
            <p className="text-[12px] font-medium text-gray-500">Standard 5-field cron expression (minute hour day month day-of-week)</p>
          </div>

          <div>
            <p className="mb-3 text-[13px] font-bold text-gray-500 uppercase tracking-wide">Quick Presets</p>
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
                    'rounded-xl border px-3 py-2 text-[13px] font-bold transition-all',
                    cronExpr === p.value
                      ? 'border-[#F5CA50] bg-[#FFFAEC] text-gray-900 shadow-sm ring-1 ring-[#F5CA50]/50'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="mt-4 text-[13px] font-bold text-red-500 text-center">{error}</p>}

        <div className="mt-8 flex gap-3">
          <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button
            className="flex-1 rounded-xl h-12 font-bold bg-[#F5CA50] text-[#111111] hover:brightness-95"
            onClick={() => void handleSave()}
            disabled={isSaving || !workflowId || !cronExpr.trim()}
          >
            {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : <CalendarClock className="size-4 mr-2" />}
            {isSaving ? 'Saving…' : 'Save Job'}
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
    return () => { cancelled = true }
  }, [])

  async function toggleJob(id: string) {
    const previous = jobs
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
      <div className="mx-auto flex max-w-7xl flex-col gap-6 md:p-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Scheduler</h1>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Manage automated job schedules and cron triggers
            </p>
          </div>
          <Button 
            className="bg-[#F5CA50] text-[#111111] hover:brightness-95 font-bold"
            onClick={() => setShowModal(true)}
          >
            <Plus className="size-4 mr-2" />
            Create Schedule
          </Button>
        </div>

        <Card className="overflow-hidden">
          <div className="p-5 md:p-6 border-b border-gray-100 bg-white">
            <CardTitle className="text-xl">Scheduled Jobs</CardTitle>
            <CardDescription className="mt-1 font-medium">
              {error ??
                (isLoading
                  ? 'Loading…'
                  : `${jobs.length} jobs configured — ${jobs.filter((job) => job.isActive).length} active`)}
            </CardDescription>
          </div>
          <div className="overflow-x-auto bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Workflow</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Cron</TableHead>
                  <TableHead>Next Run</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Triggered By</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="pr-6"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="pl-6 font-bold text-gray-900">{job.workflowName}</TableCell>
                    <TableCell className="text-[13px] font-bold text-gray-700">{job.cronReadable}</TableCell>
                    <TableCell>
                      <span className="rounded-md bg-gray-50 border border-gray-100 px-2 py-1 font-mono text-[11px] font-bold text-gray-600">
                        {job.cronExpr}
                      </span>
                    </TableCell>
                    <TableCell className="text-[13px] font-medium text-gray-500 tabular-nums">{formatRunTime(job.nextRun)}</TableCell>
                    <TableCell className="text-[13px] font-medium text-gray-500 tabular-nums">{formatRunTime(job.lastRun)}</TableCell>
                    <TableCell className="text-[13px] font-medium text-gray-500">{job.triggeredBy}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <StatusToggle
                          active={job.isActive}
                          onChange={() => void toggleJob(job.id)}
                          id={`toggle-job-${job.id}`}
                        />
                        <span className="text-[11px] font-bold uppercase tracking-wider">
                          {job.isActive ? (
                            <span className="flex items-center gap-1.5 text-green-600"><Play className="size-3.5" /> Active</span>
                          ) : (
                            <span className="flex items-center gap-1.5 text-gray-400"><Pause className="size-3.5" /> Paused</span>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                       <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900 rounded-full">
                          <Power className="size-4" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && jobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-20 text-center">
                       <div className="flex flex-col items-center justify-center text-gray-400">
                          <CalendarClock className="size-10 mb-3 opacity-30" />
                          <p className="text-[14px] font-bold text-gray-600">No scheduled jobs</p>
                          <p className="text-[13px] font-medium text-gray-500 mt-1">Create a schedule to automate your workflows.</p>
                       </div>
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
