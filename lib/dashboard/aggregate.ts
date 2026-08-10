import { describeActivity } from '@/lib/activity/actions'
import { avatarSelect, effectiveAvatar } from '@/lib/auth/avatar'
import { prisma } from '@/lib/db/prisma'
import type { FlowNode } from '@/lib/workflows/engine'
import {
  RUNS_PER_PAGE,
  type ActivityItem,
  type DashboardPayload,
  type DashboardRange,
  type DashboardStats,
  type ModuleUsage,
  type RunRow,
  type SuccessRatePoint,
  type Trend,
} from '@/lib/dashboard/types'

export * from '@/lib/dashboard/types'

const TRIGGER_LABELS: Record<string, string> = {
  'email-trigger': 'Email',
  'schedule-trigger': 'Schedule',
  'webhook-trigger': 'Webhook',
}

const MODULE_COLORS = {
  workflows: '#D4A017',
  documents: '#6366f1',
  resumes: '#16a34a',
  chat: '#ea580c',
} as const

function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(0, 0, 0, 0)
  return copy
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function rangeStart(days: number): Date {
  const start = startOfDay(new Date())
  start.setDate(start.getDate() - (days - 1))
  return start
}

function trendBetween(current: number, previous: number): Trend {
  if (previous === 0) return current === 0 ? null : { pct: 100, direction: 'up' }
  const change = ((current - previous) / previous) * 100
  return {
    pct: Math.abs(Math.round(change * 10) / 10),
    direction: change < 0 ? 'down' : 'up',
  }
}

function triggerFor(nodes: unknown): string {
  if (!Array.isArray(nodes)) return 'Manual'
  for (const node of nodes as FlowNode[]) {
    const key = typeof node?.data?.typeKey === 'string' ? node.data.typeKey : ''
    if (TRIGGER_LABELS[key]) return TRIGGER_LABELS[key]
  }
  return 'Manual'
}

async function buildStats(userId: string): Promise<DashboardStats> {
  const now = new Date()
  const todayStart = startOfDay(now)
  const yesterdayStart = new Date(todayStart)
  yesterdayStart.setDate(yesterdayStart.getDate() - 1)
  const activeSince = new Date(now)
  activeSince.setDate(activeSince.getDate() - 7)
  const uptimeSince = new Date(now)
  uptimeSince.setDate(uptimeSince.getDate() - 30)
  const lastHour = new Date(now.getTime() - 60 * 60 * 1000)

  const aiWhereToday = { gte: todayStart }
  const aiWhereYesterday = { gte: yesterdayStart, lt: todayStart }

  const [
    activeUsers,
    totalUsers,
    runningRuns,
    scheduledJobs,
    docsToday,
    resumesToday,
    chatToday,
    meetingsToday,
    docsYesterday,
    resumesYesterday,
    chatYesterday,
    meetingsYesterday,
    successLast30,
    failedLast30,
    failedLastHour,
  ] = await Promise.all([
    prisma.user.count({ where: { lastLogin: { gte: activeSince } } }),
    prisma.user.count(),
    prisma.workflowRun.count({ where: { workflow: { userId }, status: 'RUNNING' } }),
    prisma.scheduledJob.count({ where: { workflow: { userId }, isActive: true } }),
    prisma.document.count({ where: { userId, createdAt: aiWhereToday } }),
    prisma.resume.count({ where: { document: { userId }, createdAt: aiWhereToday } }),
    prisma.chatMessage.count({ where: { userId, role: 'ASSISTANT', createdAt: aiWhereToday } }),
    prisma.meeting.count({ where: { userId, createdAt: aiWhereToday } }),
    prisma.document.count({ where: { userId, createdAt: aiWhereYesterday } }),
    prisma.resume.count({ where: { document: { userId }, createdAt: aiWhereYesterday } }),
    prisma.chatMessage.count({ where: { userId, role: 'ASSISTANT', createdAt: aiWhereYesterday } }),
    prisma.meeting.count({ where: { userId, createdAt: aiWhereYesterday } }),
    prisma.workflowRun.count({
      where: { workflow: { userId }, status: 'SUCCESS', startedAt: { gte: uptimeSince } },
    }),
    prisma.workflowRun.count({
      where: { workflow: { userId }, status: 'FAILED', startedAt: { gte: uptimeSince } },
    }),
    prisma.workflowRun.count({
      where: { workflow: { userId }, status: 'FAILED', startedAt: { gte: lastHour } },
    }),
  ])

  const aiToday = docsToday + resumesToday + chatToday + meetingsToday
  const aiYesterday = docsYesterday + resumesYesterday + chatYesterday + meetingsYesterday
  const settled = successLast30 + failedLast30

  return {
    activeUsers: { value: activeUsers, totalUsers, trend: null },
    pendingWorkflows: { value: runningRuns, scheduled: scheduledJobs, trend: null },
    aiRequestsToday: { value: aiToday, trend: trendBetween(aiToday, aiYesterday) },
    uptime: {
      pct: settled === 0 ? 100 : Math.round((successLast30 / settled) * 1000) / 10,
      operational: failedLastHour === 0,
    },
  }
}

async function buildSuccessRate(userId: string, range: DashboardRange): Promise<SuccessRatePoint[]> {
  const since = rangeStart(range)
  const runs = await prisma.workflowRun.findMany({
    where: { workflow: { userId }, startedAt: { gte: since }, status: { in: ['SUCCESS', 'FAILED'] } },
    select: { status: true, startedAt: true },
  })

  const buckets = new Map<string, { success: number; failed: number; label: string }>()
  const today = startOfDay(new Date())
  for (let i = range - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(today.getDate() - i)
    buckets.set(dayKey(date), {
      success: 0,
      failed: 0,
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    })
  }

  for (const run of runs) {
    const bucket = buckets.get(dayKey(run.startedAt))
    if (!bucket) continue
    if (run.status === 'SUCCESS') bucket.success += 1
    else bucket.failed += 1
  }

  return [...buckets.entries()].map(([key, bucket]) => {
    const total = bucket.success + bucket.failed
    return {
      key,
      label: bucket.label,
      rate: total === 0 ? 0 : Math.round((bucket.success / total) * 1000) / 10,
      runs: total,
    }
  })
}

async function buildModuleUsage(userId: string, range: DashboardRange): Promise<ModuleUsage[]> {
  const since = rangeStart(range)
  const [workflows, documents, resumes, chat] = await Promise.all([
    prisma.workflowRun.count({ where: { workflow: { userId }, startedAt: { gte: since } } }),
    prisma.document.count({ where: { userId, createdAt: { gte: since } } }),
    prisma.resume.count({ where: { document: { userId }, createdAt: { gte: since } } }),
    prisma.chatMessage.count({ where: { userId, role: 'ASSISTANT', createdAt: { gte: since } } }),
  ])

  const rows = [
    { id: 'workflows', label: 'Workflow Builder', count: workflows, color: MODULE_COLORS.workflows },
    { id: 'documents', label: 'Document Intelligence', count: documents, color: MODULE_COLORS.documents },
    { id: 'resumes', label: 'Resume Screening', count: resumes, color: MODULE_COLORS.resumes },
    { id: 'chat', label: 'AI Assistant', count: chat, color: MODULE_COLORS.chat },
  ]

  const total = rows.reduce((sum, row) => sum + row.count, 0)
  return rows.map((row) => ({
    ...row,
    pct: total === 0 ? 0 : Math.round((row.count / total) * 1000) / 10,
  }))
}

async function buildRuns(userId: string, page: number) {
  const where = { workflow: { userId } }
  const [total, records] = await Promise.all([
    prisma.workflowRun.count({ where }),
    prisma.workflowRun.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      skip: (page - 1) * RUNS_PER_PAGE,
      take: RUNS_PER_PAGE,
      select: {
        id: true,
        status: true,
        startedAt: true,
        finishedAt: true,
        workflow: {
          select: {
            id: true,
            name: true,
            nodes: true,
            user: { select: { name: true, ...avatarSelect } },
          },
        },
      },
    }),
  ])

  const rows: RunRow[] = records.map((run) => ({
    id: run.id,
    workflowId: run.workflow.id,
    workflow: run.workflow.name,
    trigger: triggerFor(run.workflow.nodes),
    status: run.status,
    durationMs: run.finishedAt ? run.finishedAt.getTime() - run.startedAt.getTime() : null,
    executedBy: run.workflow.user.name,
    executedByAvatar: effectiveAvatar(run.workflow.user),
    startedAt: run.startedAt.toISOString(),
  }))

  return { rows, page, perPage: RUNS_PER_PAGE, total }
}

async function buildActivity(userId: string, limit: number) {
  const rows = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    select: {
      id: true,
      action: true,
      meta: true,
      createdAt: true,
      user: { select: { name: true, ...avatarSelect } },
    },
  })

  const items: ActivityItem[] = rows.slice(0, limit).map((row) => {
    const meta =
      row.meta && typeof row.meta === 'object' && !Array.isArray(row.meta)
        ? (row.meta as Record<string, unknown>)
        : {}
    const described = describeActivity(row.action, meta)
    return {
      id: row.id,
      actor: row.user.name,
      actorAvatar: effectiveAvatar(row.user),
      description: described.text,
      createdAt: row.createdAt.toISOString(),
      tone: described.tone,
    }
  })

  return { items, hasMore: rows.length > limit }
}

export async function buildDashboard(
  userId: string,
  { range, runsPage, activityLimit }: { range: DashboardRange; runsPage: number; activityLimit: number },
): Promise<DashboardPayload> {
  const [stats, successRate, moduleUsage, runs, activity] = await Promise.all([
    buildStats(userId),
    buildSuccessRate(userId, range),
    buildModuleUsage(userId, range),
    buildRuns(userId, runsPage),
    buildActivity(userId, activityLimit),
  ])

  return {
    range,
    generatedAt: new Date().toISOString(),
    stats,
    successRate,
    moduleUsage,
    runs,
    activity,
  }
}
