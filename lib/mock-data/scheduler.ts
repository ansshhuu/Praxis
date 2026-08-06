export type JobStatus = 'Active' | 'Paused'

export interface ScheduledJob {
  id: string
  workflowName: string
  cronExpression: string
  cronReadable: string
  nextRun: string
  lastRun: string
  status: JobStatus
  triggeredBy: string
}

const mockScheduledJobs: ScheduledJob[] = [
  {
    id: 'job-1',
    workflowName: 'Invoice OCR Extraction',
    cronExpression: '0 9 * * 1-5',
    cronReadable: 'Every weekday at 9:00 AM',
    nextRun: 'Aug 8, 2026 09:00',
    lastRun: 'Aug 7, 2026 09:00',
    status: 'Active',
    triggeredBy: 'System',
  },
  {
    id: 'job-2',
    workflowName: 'Resume Ranking Pipeline',
    cronExpression: '0 8 * * *',
    cronReadable: 'Every day at 8:00 AM',
    nextRun: 'Aug 8, 2026 08:00',
    lastRun: 'Aug 7, 2026 08:00',
    status: 'Active',
    triggeredBy: 'System',
  },
  {
    id: 'job-3',
    workflowName: 'Weekly Sales Report',
    cronExpression: '0 7 * * 1',
    cronReadable: 'Every Monday at 7:00 AM',
    nextRun: 'Aug 10, 2026 07:00',
    lastRun: 'Aug 3, 2026 07:00',
    status: 'Active',
    triggeredBy: 'Marcus Reed',
  },
  {
    id: 'job-4',
    workflowName: 'Database Backup',
    cronExpression: '0 2 * * *',
    cronReadable: 'Every day at 2:00 AM',
    nextRun: 'Aug 8, 2026 02:00',
    lastRun: 'Aug 7, 2026 02:00',
    status: 'Active',
    triggeredBy: 'System',
  },
  {
    id: 'job-5',
    workflowName: 'AI Credit Usage Report',
    cronExpression: '0 8 1 * *',
    cronReadable: '1st of every month at 8:00 AM',
    nextRun: 'Sep 1, 2026 08:00',
    lastRun: 'Aug 1, 2026 08:00',
    status: 'Active',
    triggeredBy: 'System',
  },
  {
    id: 'job-6',
    workflowName: 'Email Sentiment Analysis',
    cronExpression: '*/30 * * * *',
    cronReadable: 'Every 30 minutes',
    nextRun: 'Aug 7, 10:30',
    lastRun: 'Aug 7, 10:00',
    status: 'Paused',
    triggeredBy: 'Diego Alvarez',
  },
  {
    id: 'job-7',
    workflowName: 'Knowledge Base Sync',
    cronExpression: '0 */4 * * *',
    cronReadable: 'Every 4 hours',
    nextRun: 'Aug 7, 12:00',
    lastRun: 'Aug 7, 08:00',
    status: 'Active',
    triggeredBy: 'System',
  },
  {
    id: 'job-8',
    workflowName: 'Attendance Reminder',
    cronExpression: '0 9 * * 1-5',
    cronReadable: 'Every weekday at 9:00 AM',
    nextRun: 'Aug 8, 2026 09:00',
    lastRun: 'Aug 7, 2026 09:00',
    status: 'Paused',
    triggeredBy: 'Priya Nair',
  },
]

export function getScheduledJobs(): ScheduledJob[] {
  return mockScheduledJobs
}
