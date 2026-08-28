import type { Meeting, MeetingStatus } from '@prisma/client'

import type { ActionItem } from '@/lib/meetings/analyze'

export function formatDuration(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds <= 0) return '-'
  const total = Math.round(seconds)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60

  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`
  if (minutes > 0) return `${minutes}m ${String(secs).padStart(2, '0')}s`
  return `${secs}s`
}

export function readActionItems(value: unknown): ActionItem[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const row = entry as Record<string, unknown>
    if (typeof row.task !== 'string' || !row.task.trim()) return []
    return [
      {
        task: row.task,
        assignee_guess:
          typeof row.assignee_guess === 'string' ? row.assignee_guess : null,
        deadline_guess:
          typeof row.deadline_guess === 'string' ? row.deadline_guess : null,
      },
    ]
  })
}

export type MeetingSummary = {
  id: string
  fileName: string
  createdAt: string
  status: MeetingStatus
  statusMessage: string | null
  duration: string
  durationSeconds: number | null
  attendees: string[]
  actionItemCount: number
  hasSummary: boolean
  hasTranscript: boolean
}

export type MeetingDetail = MeetingSummary & {
  fileUrl: string
  transcript: string | null
  summary: string | null
  actionItems: ActionItem[]
}

type SummaryRow = Pick<
  Meeting,
  | 'id'
  | 'fileName'
  | 'createdAt'
  | 'status'
  | 'statusMessage'
  | 'durationSeconds'
  | 'attendees'
> & { summary?: string | null; transcript?: string | null; actionItems?: unknown }

export function toSummary(meeting: SummaryRow): MeetingSummary {
  return {
    id: meeting.id,
    fileName: meeting.fileName,
    createdAt: meeting.createdAt.toISOString(),
    status: meeting.status,
    statusMessage: meeting.statusMessage,
    duration: formatDuration(meeting.durationSeconds),
    durationSeconds: meeting.durationSeconds,
    attendees: meeting.attendees,
    actionItemCount: readActionItems(meeting.actionItems).length,
    hasSummary: Boolean(meeting.summary),
    hasTranscript: Boolean(meeting.transcript),
  }
}

export function toDetail(meeting: Meeting): MeetingDetail {
  return {
    ...toSummary(meeting),
    fileUrl: meeting.fileUrl,
    transcript: meeting.transcript,
    summary: meeting.summary,
    actionItems: readActionItems(meeting.actionItems),
  }
}
