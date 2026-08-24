import type { WorkflowRunTrace } from '@/lib/models/mongodb/workflow-runs'

export interface WorkflowRunStats {
  total: number
  success: number
  failed: number
  running: number
  successRate: number
  avgExecutionTimeMs: number
}

export function summarizeWorkflowRuns(traces: Pick<WorkflowRunTrace, 'status' | 'executionTime'>[]): WorkflowRunStats {
  const total = traces.length
  const success = traces.filter((t) => t.status === 'success').length
  const failed = traces.filter((t) => t.status === 'failed').length
  const running = traces.filter((t) => t.status === 'running').length
  const avgExecutionTimeMs =
    total === 0 ? 0 : traces.reduce((sum, t) => sum + t.executionTime, 0) / total

  return {
    total,
    success,
    failed,
    running,
    successRate: total === 0 ? 0 : success / total,
    avgExecutionTimeMs,
  }
}

export interface WorkflowDailyPoint {
  date: string
  success: number
  failed: number
}

export function bucketWorkflowRunsByDay(
  traces: Pick<WorkflowRunTrace, 'status' | 'createdAt'>[],
  days: number,
): WorkflowDailyPoint[] {
  const buckets = new Map<string, WorkflowDailyPoint>()
  const now = new Date()

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const key = date.toISOString().slice(0, 10)
    buckets.set(key, { date: key, success: 0, failed: 0 })
  }

  for (const trace of traces) {
    const key = new Date(trace.createdAt).toISOString().slice(0, 10)
    const bucket = buckets.get(key)
    if (!bucket) continue
    if (trace.status === 'success') bucket.success += 1
    else if (trace.status === 'failed') bucket.failed += 1
  }

  return [...buckets.values()]
}
