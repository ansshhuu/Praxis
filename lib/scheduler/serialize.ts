import { describeCron, nextRunFor } from './cron'

export interface ScheduledJobPayload {
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

export const jobSelect = {
  id: true,
  workflowId: true,
  cronExpr: true,
  nextRun: true,
  isActive: true,
  workflow: {
    select: {
      name: true,
      user: { select: { name: true } },
      runs: { orderBy: { startedAt: 'desc' }, take: 1, select: { startedAt: true } },
    },
  },
} as const

export type JobRow = {
  id: string
  workflowId: string
  cronExpr: string
  nextRun: Date
  isActive: boolean
  workflow: {
    name: string
    user: { name: string }
    runs: { startedAt: Date }[]
  }
}

export function toJobPayload(job: JobRow): ScheduledJobPayload {
  const nextRun = job.nextRun.getTime() > Date.now() ? job.nextRun : nextRunFor(job.cronExpr)

  return {
    id: job.id,
    workflowId: job.workflowId,
    workflowName: job.workflow.name,
    cronExpr: job.cronExpr,
    cronReadable: describeCron(job.cronExpr),
    nextRun: nextRun.toISOString(),
    lastRun: job.workflow.runs[0]?.startedAt.toISOString() ?? null,
    isActive: job.isActive,
    triggeredBy: job.workflow.user.name,
  }
}
