import type { Report, ReportType, User } from '@prisma/client'

import { REPORT_TITLES } from './data'
import type { ReportFormat } from './generate'
import { formatMeta } from './generate'

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  EMPLOYEE: 'Employee',
  WORKFLOW: 'Workflow',
  SALES: 'Sales',
  HR: 'HR',
  AI_USAGE: 'AI Usage',
}

export const REPORT_TYPES = Object.keys(REPORT_TYPE_LABELS) as ReportType[]

export function isReportType(value: unknown): value is ReportType {
  return typeof value === 'string' && (REPORT_TYPES as string[]).includes(value)
}

const EXTENSION_TO_FORMAT: Record<string, string> = {
  pdf: 'PDF',
  docx: 'Word',
  xlsx: 'Excel',
}

export function buildReportFileName(
  type: ReportType,
  format: ReportFormat,
  generatedAt: Date,
): string {
  const date = generatedAt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return `${REPORT_TITLES[type]} - ${date}.${formatMeta(format).extension}`
}

export interface ReportSummary {
  id: string
  name: string
  type: string
  format: string
  status: 'Ready'
  generatedAt: string
  fileUrl: string
  generatedBy: string
}

type ReportRow = Pick<Report, 'id' | 'type' | 'fileUrl' | 'generatedAt'> & {
  user?: Pick<User, 'name'> | null
}

export function toReportSummary(report: ReportRow): ReportSummary {
  const lastSegment = decodeURIComponent(report.fileUrl.split('/').pop() ?? '')
  const withoutUuid = lastSegment.replace(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-/i,
    '',
  )
  const extension = withoutUuid.split('.').pop()?.toLowerCase() ?? ''

  const name = withoutUuid.replace(/\.[^.]+$/, '').replace(/_/g, ' ') ||
    `${REPORT_TITLES[report.type]}`

  return {
    id: report.id,
    name,
    type: REPORT_TYPE_LABELS[report.type],
    format: EXTENSION_TO_FORMAT[extension] ?? extension.toUpperCase(),
    status: 'Ready',
    generatedAt: report.generatedAt.toISOString(),
    fileUrl: report.fileUrl,
    generatedBy: report.user?.name ?? 'Unknown',
  }
}
