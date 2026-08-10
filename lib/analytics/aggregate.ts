import { prisma } from '@/lib/db/prisma'

export const TREND_DAYS = 7

const DEFAULT_QUOTA_MB = 5120

export interface TrendPoint {
  label: string
  value: number
}

export interface WorkflowStatusPoint {
  name: string
  success: number
  failed: number
}

export interface ApiCallPoint {
  date: string
  calls: number
}

export interface ResponseTimePoint {
  date: string
  p50: number
  p95: number
  p99: number
}

export interface StorageUsage {
  label: string
  used: number
  total: number
  unit: string
}

export interface AnalyticsPayload {
  totals: {
    workflowRuns: number
    workflowSuccess: number
    workflowFailed: number
    documentsProcessed: number
    resumesScreened: number
    chatMessages: number
  }
  aiUsageOverTime: TrendPoint[]
  workflowStatus: WorkflowStatusPoint[]
  responseTime: ResponseTimePoint[]
  apiCalls: ApiCallPoint[]
  storage: StorageUsage
}

function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

type DayBucket = { key: string; label: string; weekday: string }

function buildDayBuckets(): DayBucket[] {
  const today = startOfDay(new Date())
  return Array.from({ length: TREND_DAYS }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (TREND_DAYS - 1 - index))
    return {
      key: dayKey(date),
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      weekday: date.toLocaleDateString('en-US', { weekday: 'short' }),
    }
  })
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const rank = Math.ceil((p / 100) * sorted.length) - 1
  return Math.round(sorted[Math.min(Math.max(rank, 0), sorted.length - 1)])
}

export async function buildAnalytics(userId: string): Promise<AnalyticsPayload> {
  const buckets = buildDayBuckets()
  const since = startOfDay(new Date())
  since.setDate(since.getDate() - (TREND_DAYS - 1))

  const [runs, documents, resumes, chatMessages, storageAgg, totalCounts] = await Promise.all([
    prisma.workflowRun.findMany({
      where: { workflow: { userId }, startedAt: { gte: since } },
      select: { status: true, startedAt: true, finishedAt: true },
    }),
    prisma.document.findMany({
      where: { userId, createdAt: { gte: since } },
      select: { createdAt: true, status: true },
    }),
    prisma.resume.findMany({
      where: { document: { userId }, createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.chatMessage.findMany({
      where: { userId, createdAt: { gte: since }, role: 'ASSISTANT' },
      select: { createdAt: true },
    }),
    prisma.document.aggregate({ where: { userId }, _sum: { fileSize: true } }),
    Promise.all([
      prisma.workflowRun.count({ where: { workflow: { userId } } }),
      prisma.workflowRun.count({ where: { workflow: { userId }, status: 'SUCCESS' } }),
      prisma.workflowRun.count({ where: { workflow: { userId }, status: 'FAILED' } }),
      prisma.document.count({ where: { userId, status: 'PROCESSED' } }),
      prisma.resume.count({ where: { document: { userId } } }),
      prisma.chatMessage.count({ where: { userId } }),
    ]),
  ])

  const [
    workflowRuns,
    workflowSuccess,
    workflowFailed,
    documentsProcessed,
    resumesScreened,
    chatMessagesTotal,
  ] = totalCounts

  const empty = () => new Map(buckets.map((b) => [b.key, 0]))
  const successByDay = empty()
  const failedByDay = empty()
  const runsByDay = empty()
  const docsByDay = empty()
  const resumesByDay = empty()
  const chatByDay = empty()
  const durationsByDay = new Map<string, number[]>(buckets.map((b) => [b.key, []]))

  for (const run of runs) {
    const key = dayKey(run.startedAt)
    if (!runsByDay.has(key)) continue
    runsByDay.set(key, runsByDay.get(key)! + 1)
    if (run.status === 'SUCCESS') successByDay.set(key, successByDay.get(key)! + 1)
    if (run.status === 'FAILED') failedByDay.set(key, failedByDay.get(key)! + 1)
    if (run.finishedAt) {
      durationsByDay.get(key)!.push(run.finishedAt.getTime() - run.startedAt.getTime())
    }
  }

  for (const doc of documents) {
    const key = dayKey(doc.createdAt)
    if (docsByDay.has(key)) docsByDay.set(key, docsByDay.get(key)! + 1)
  }
  for (const resume of resumes) {
    const key = dayKey(resume.createdAt)
    if (resumesByDay.has(key)) resumesByDay.set(key, resumesByDay.get(key)! + 1)
  }
  for (const message of chatMessages) {
    const key = dayKey(message.createdAt)
    if (chatByDay.has(key)) chatByDay.set(key, chatByDay.get(key)! + 1)
  }

  const aiUsageOverTime = buckets.map((b) => ({
    label: b.label,
    value: docsByDay.get(b.key)! + resumesByDay.get(b.key)! + chatByDay.get(b.key)!,
  }))

  const apiCalls = buckets.map((b) => ({
    date: b.label,
    calls:
      docsByDay.get(b.key)! +
      resumesByDay.get(b.key)! +
      chatByDay.get(b.key)! +
      runsByDay.get(b.key)!,
  }))

  const workflowStatus = buckets.map((b) => ({
    name: b.weekday,
    success: successByDay.get(b.key)!,
    failed: failedByDay.get(b.key)!,
  }))

  const responseTime = buckets.map((b) => {
    const sorted = [...durationsByDay.get(b.key)!].sort((a, c) => a - c)
    return {
      date: b.label,
      p50: percentile(sorted, 50),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99),
    }
  })

  const quotaMb = Number(process.env.STORAGE_QUOTA_MB) || DEFAULT_QUOTA_MB
  const usedMb = (storageAgg._sum.fileSize ?? 0) / (1024 * 1024)

  return {
    totals: {
      workflowRuns,
      workflowSuccess,
      workflowFailed,
      documentsProcessed,
      resumesScreened,
      chatMessages: chatMessagesTotal,
    },
    aiUsageOverTime,
    workflowStatus,
    responseTime,
    apiCalls,
    storage: {
      label: 'Storage',
      used: Math.round(usedMb * 100) / 100,
      total: quotaMb,
      unit: 'MB',
    },
  }
}
