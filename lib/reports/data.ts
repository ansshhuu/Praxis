/**
 * Report data collection — the real rows behind each report type.
 *
 * Every collector reads the database only; the single AI call per report
 * happens later, in the route, over the `ReportData` produced here.
 */

import type { ReportType } from '@prisma/client'

import { prisma } from '@/lib/db/prisma'

export interface ReportData {
  /** Document title, e.g. "Workflow Performance Report". */
  title: string
  /** Headline figures rendered above the table. */
  highlights: { label: string; value: string }[]
  /** Table header row. */
  columns: string[]
  /** Table body. Empty when the user has no data of this kind yet. */
  rows: (string | number)[][]
  /**
   * Caveat printed in the document and fed to the AI, used where a report
   * type has no first-class data source in the schema.
   */
  note?: string
}

export const REPORT_TITLES: Record<ReportType, string> = {
  EMPLOYEE: 'Employee Directory Report',
  WORKFLOW: 'Workflow Performance Report',
  SALES: 'Sales Activity Report',
  HR: 'HR Candidate Screening Report',
  AI_USAGE: 'AI Usage Report',
}

function formatDate(date: Date | null): string {
  return date ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '—'
  return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(1)} s`
}

/** Platform user directory, grouped by role. */
async function collectEmployee(): Promise<ReportData> {
  const [users, byRole] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { name: true, email: true, role: true, createdAt: true, lastLogin: true },
      take: 200,
    }),
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
  ])

  return {
    title: REPORT_TITLES.EMPLOYEE,
    highlights: [
      { label: 'Total Users', value: String(users.length) },
      ...byRole.map((group) => ({
        label: `${group.role} accounts`,
        value: String(group._count._all),
      })),
    ],
    columns: ['Name', 'Email', 'Role', 'Joined', 'Last Login'],
    rows: users.map((user) => [
      user.name,
      user.email,
      user.role,
      formatDate(user.createdAt),
      formatDate(user.lastLogin),
    ]),
  }
}

/** Per-workflow execution stats from workflow_runs. */
async function collectWorkflow(userId: string): Promise<ReportData> {
  const workflows = await prisma.workflow.findMany({
    where: { userId },
    select: {
      name: true,
      status: true,
      runs: { select: { status: true, startedAt: true, finishedAt: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  let totalRuns = 0
  let totalSuccess = 0
  let totalFailed = 0

  const rows = workflows.map((workflow) => {
    const runs = workflow.runs
    const success = runs.filter((run) => run.status === 'SUCCESS').length
    const failed = runs.filter((run) => run.status === 'FAILED').length
    const durations = runs
      .filter((run) => run.finishedAt)
      .map((run) => run.finishedAt!.getTime() - run.startedAt.getTime())
    const avg = durations.length
      ? durations.reduce((sum, value) => sum + value, 0) / durations.length
      : null

    totalRuns += runs.length
    totalSuccess += success
    totalFailed += failed

    const lastRun = runs.reduce<Date | null>(
      (latest, run) => (!latest || run.startedAt > latest ? run.startedAt : latest),
      null,
    )

    return [
      workflow.name,
      workflow.status,
      runs.length,
      success,
      failed,
      runs.length ? `${Math.round((success / runs.length) * 100)}%` : '—',
      formatDuration(avg),
      formatDate(lastRun),
    ]
  })

  return {
    title: REPORT_TITLES.WORKFLOW,
    highlights: [
      { label: 'Workflows', value: String(workflows.length) },
      { label: 'Total Runs', value: String(totalRuns) },
      { label: 'Successful', value: String(totalSuccess) },
      { label: 'Failed', value: String(totalFailed) },
      {
        label: 'Overall Success Rate',
        value: totalRuns ? `${Math.round((totalSuccess / totalRuns) * 100)}%` : '—',
      },
    ],
    columns: ['Workflow', 'Status', 'Runs', 'Success', 'Failed', 'Success Rate', 'Avg Duration', 'Last Run'],
    rows,
  }
}

/**
 * No sales system is connected to this platform and the schema has no orders,
 * deals or revenue. Rather than invent figures, this reports the document
 * pipeline activity that a sales report would normally be built from, and
 * says so in the document itself.
 */
async function collectSales(userId: string): Promise<ReportData> {
  const documents = await prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { fileName: true, fileType: true, status: true, tags: true, createdAt: true },
    take: 200,
  })

  const processed = documents.filter((doc) => doc.status === 'PROCESSED').length

  return {
    title: REPORT_TITLES.SALES,
    highlights: [
      { label: 'Documents in Pipeline', value: String(documents.length) },
      { label: 'Processed', value: String(processed) },
      { label: 'Awaiting Processing', value: String(documents.length - processed) },
    ],
    columns: ['Document', 'Type', 'Status', 'Tags', 'Received'],
    rows: documents.map((doc) => [
      doc.fileName,
      doc.fileType,
      doc.status,
      doc.tags.join(', ') || '—',
      formatDate(doc.createdAt),
    ]),
    note:
      'No sales or CRM system is connected to this platform, so this report covers document pipeline activity rather than revenue. Connect a sales data source to report on deals and revenue.',
  }
}

/** Candidate screening results from the Resumes module. */
async function collectHr(userId: string): Promise<ReportData> {
  const resumes = await prisma.resume.findMany({
    where: { document: { userId } },
    orderBy: [{ createdAt: 'desc' }, { ranking: 'asc' }],
    select: {
      candidateName: true,
      currentRole: true,
      yearsExperience: true,
      jdMatchScore: true,
      ranking: true,
      skills: true,
      createdAt: true,
    },
    take: 200,
  })

  const averageScore = resumes.length
    ? resumes.reduce((sum, resume) => sum + resume.jdMatchScore, 0) / resumes.length
    : 0
  const strongMatches = resumes.filter((resume) => resume.jdMatchScore >= 75).length

  return {
    title: REPORT_TITLES.HR,
    highlights: [
      { label: 'Candidates Screened', value: String(resumes.length) },
      { label: 'Average Match Score', value: resumes.length ? `${averageScore.toFixed(1)}%` : '—' },
      { label: 'Strong Matches (75%+)', value: String(strongMatches) },
    ],
    columns: ['Rank', 'Candidate', 'Current Role', 'Experience', 'Match Score', 'Top Skills', 'Screened'],
    rows: resumes.map((resume) => [
      resume.ranking,
      resume.candidateName,
      resume.currentRole ?? '—',
      resume.yearsExperience !== null ? `${resume.yearsExperience} yrs` : '—',
      `${resume.jdMatchScore.toFixed(1)}%`,
      resume.skills.slice(0, 5).join(', ') || '—',
      formatDate(resume.createdAt),
    ]),
  }
}

/**
 * AI consumption. There is no per-call usage ledger in the schema, so this
 * counts the operations that each spend exactly one model call: document
 * summarisation, resume scoring and assistant chat replies, alongside
 * workflow executions which may or may not invoke a model.
 */
async function collectAiUsage(userId: string): Promise<ReportData> {
  const [documentsProcessed, documentsTotal, resumes, assistantMessages, runs, runsFailed] =
    await Promise.all([
      prisma.document.count({ where: { userId, status: 'PROCESSED' } }),
      prisma.document.count({ where: { userId } }),
      prisma.resume.count({ where: { document: { userId } } }),
      prisma.chatMessage.count({ where: { userId, role: 'ASSISTANT' } }),
      prisma.workflowRun.count({ where: { workflow: { userId } } }),
      prisma.workflowRun.count({ where: { workflow: { userId }, status: 'FAILED' } }),
    ])

  const aiCalls = documentsProcessed + resumes + assistantMessages

  return {
    title: REPORT_TITLES.AI_USAGE,
    highlights: [
      { label: 'Estimated AI Calls', value: String(aiCalls) },
      { label: 'Documents Processed', value: String(documentsProcessed) },
      { label: 'Resumes Screened', value: String(resumes) },
      { label: 'Assistant Replies', value: String(assistantMessages) },
    ],
    columns: ['Module', 'Operation', 'Count', 'Spends an AI call'],
    rows: [
      ['Documents', 'Documents uploaded', documentsTotal, 'No'],
      ['Documents', 'Documents summarised', documentsProcessed, 'Yes — 1 per document'],
      ['Resumes', 'Candidates scored', resumes, 'Yes — 1 per screening batch'],
      ['Chat', 'Assistant replies', assistantMessages, 'Yes — 1 per message'],
      ['Workflows', 'Runs executed', runs, 'Only for AI nodes'],
      ['Workflows', 'Runs failed', runsFailed, '—'],
    ],
    note:
      'The platform does not record a per-call usage ledger, so AI call counts are derived from the operations known to spend exactly one model call each.',
  }
}

/** Fetches the real data behind `type` for the given user. */
export async function collectReportData(type: ReportType, userId: string): Promise<ReportData> {
  switch (type) {
    case 'EMPLOYEE':
      return collectEmployee()
    case 'WORKFLOW':
      return collectWorkflow(userId)
    case 'SALES':
      return collectSales(userId)
    case 'HR':
      return collectHr(userId)
    case 'AI_USAGE':
      return collectAiUsage(userId)
  }
}

/**
 * Compact text rendering of the collected data, used as the AI prompt context.
 * Row count is capped hard: the router's contract is short prompts, and a
 * 200-row table would blow the free-tier token budget in a single report.
 */
export function summarizeForPrompt(data: ReportData): string {
  const MAX_PROMPT_ROWS = 15
  const lines = [
    `Report: ${data.title}`,
    `Key figures: ${data.highlights.map((h) => `${h.label}=${h.value}`).join('; ') || 'none'}`,
    `Total rows: ${data.rows.length}`,
  ]

  if (data.rows.length) {
    lines.push(`Columns: ${data.columns.join(' | ')}`)
    lines.push(
      ...data.rows
        .slice(0, MAX_PROMPT_ROWS)
        .map((row) => row.map((cell) => String(cell)).join(' | ')),
    )
    if (data.rows.length > MAX_PROMPT_ROWS) {
      lines.push(`… ${data.rows.length - MAX_PROMPT_ROWS} further rows omitted`)
    }
  }

  if (data.note) lines.push(`Caveat: ${data.note}`)

  return lines.join('\n')
}
