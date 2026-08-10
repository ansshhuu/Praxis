import type { ActivityTone } from '@/lib/dashboard/types'

export const ACTIVITY_ACTIONS = {
  workflowCreated: 'workflow.created',
  workflowRunStarted: 'workflow.run.started',
  workflowRunCompleted: 'workflow.run.completed',
  workflowRunFailed: 'workflow.run.failed',
  documentUploaded: 'document.uploaded',
  documentProcessed: 'document.processed',
  resumeScreeningCompleted: 'resume.screening.completed',
  meetingUploaded: 'meeting.uploaded',
  meetingProcessed: 'meeting.processed',
  reportGenerated: 'report.generated',
  notificationSent: 'notification.sent',
  userCreated: 'user.created',
  userLogin: 'user.login',
} as const

export type ActivityAction = (typeof ACTIVITY_ACTIONS)[keyof typeof ACTIVITY_ACTIONS]

export type ActivityMeta = Record<string, unknown>

function text(meta: ActivityMeta, key: string, fallback: string): string {
  const value = meta[key]
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function num(meta: ActivityMeta, key: string): number | null {
  const value = meta[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function describeActivity(
  action: string,
  meta: ActivityMeta,
): { text: string; tone: ActivityTone } {
  const status = text(meta, 'status', '').toUpperCase()

  switch (action) {
    case ACTIVITY_ACTIONS.workflowCreated:
      return { text: `created workflow “${text(meta, 'name', 'Untitled')}”`, tone: 'info' }

    case ACTIVITY_ACTIONS.workflowRunStarted:
      return { text: `started workflow “${text(meta, 'name', 'Untitled')}”`, tone: 'pending' }

    case ACTIVITY_ACTIONS.workflowRunCompleted: {
      const steps = num(meta, 'steps')
      const suffix = steps === null ? '' : ` (${steps} ${steps === 1 ? 'step' : 'steps'})`
      return { text: `completed workflow “${text(meta, 'name', 'Untitled')}”${suffix}`, tone: 'success' }
    }

    case ACTIVITY_ACTIONS.workflowRunFailed:
      return {
        text: `workflow “${text(meta, 'name', 'Untitled')}” failed — ${text(meta, 'error', 'unknown error')}`,
        tone: 'failed',
      }

    case ACTIVITY_ACTIONS.documentUploaded:
      return { text: `uploaded document “${text(meta, 'name', 'a file')}”`, tone: 'info' }

    case ACTIVITY_ACTIONS.documentProcessed:
      return status === 'FAILED'
        ? {
            text: `document “${text(meta, 'name', 'a file')}” failed to process — ${text(meta, 'error', 'unknown error')}`,
            tone: 'failed',
          }
        : { text: `processed document “${text(meta, 'name', 'a file')}”`, tone: 'success' }

    case ACTIVITY_ACTIONS.resumeScreeningCompleted: {
      const count = num(meta, 'candidates')
      const label = count === null ? 'candidates' : `${count} ${count === 1 ? 'candidate' : 'candidates'}`
      return { text: `screened ${label} against a job description`, tone: 'success' }
    }

    case ACTIVITY_ACTIONS.meetingUploaded:
      return { text: `uploaded meeting “${text(meta, 'name', 'a recording')}”`, tone: 'info' }

    case ACTIVITY_ACTIONS.meetingProcessed:
      return status === 'FAILED'
        ? {
            text: `meeting “${text(meta, 'name', 'a recording')}” failed to process — ${text(meta, 'error', 'unknown error')}`,
            tone: 'failed',
          }
        : { text: `analysed meeting “${text(meta, 'name', 'a recording')}”`, tone: 'success' }

    case ACTIVITY_ACTIONS.reportGenerated:
      return {
        text: `generated a ${text(meta, 'type', 'workflow').toLowerCase()} report (${text(meta, 'format', 'PDF')})`,
        tone: 'success',
      }

    case ACTIVITY_ACTIONS.notificationSent:
      return status === 'FAILED'
        ? {
            text: `notification email failed — ${text(meta, 'error', 'unknown error')}`,
            tone: 'failed',
          }
        : { text: `sent a notification to ${text(meta, 'to', 'a recipient')}`, tone: 'success' }

    case ACTIVITY_ACTIONS.userCreated:
      return {
        text: `added ${text(meta, 'name', 'a user')} as ${text(meta, 'role', 'EMPLOYEE')}`,
        tone: 'info',
      }

    case ACTIVITY_ACTIONS.userLogin:
      return { text: 'signed in', tone: 'info' }

    default:
      return { text: action, tone: 'info' }
  }
}
