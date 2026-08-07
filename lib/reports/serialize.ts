/**
 * Shapes a Report row for the client.
 *
 * The `reports` table stores only type, file URL and timestamp, so the display
 * name and format are derived from the generated file name — which is why
 * `buildReportFileName` below is the single place that name is constructed.
 */

import type { Report, ReportType, User } from '@prisma/client'

import { REPORT_TITLES } from './data'
import type { ReportFormat } from './generate'
import { formatMeta } from './generate'

/** Labels the UI shows for each report type. */
export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  EMPLOYEE: 'Employee',
  WORKFLOW: 'Workflow',
  SALES: 'Sales',
  HR: 'HR',
  AI_USAGE: 'AI Usage',
}

/** Reverse of the above, for turning a UI selection back into an enum value. */
export const REPORT_TYPES = Object.keys(REPORT_TYPE_LABELS) as ReportType[]

export function isReportType(value: unknown): value is ReportType {
  return typeof value === 'string' && (REPORT_TYPES as string[]).includes(value)
}

const EXTENSION_TO_FORMAT: Record<string, string> = {
  pdf: 'PDF',
  docx: 'Word',
  xlsx: 'Excel',
}

/**
 * `{Title} - {Mon D, YYYY}.{ext}`, sanitised for use as a storage object key.
 * The date is embedded so two reports of the same type stay distinguishable in
 * the list without an extra database column.
 */
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
  // Storage keys are URL-encoded and prefixed with the user folder; the last
  // segment is the sanitised `{uuid}-{fileName}` written at upload time.
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
    // A row is only written after the file is generated and uploaded, so
    // anything present in the table is downloadable.
    status: 'Ready',
    generatedAt: report.generatedAt.toISOString(),
    fileUrl: report.fileUrl,
    generatedBy: report.user?.name ?? 'Unknown',
  }
}
