export type NotificationChannel = 'email' | 'sms' | 'push' | 'slack'
export type NotificationStatus = 'Sent' | 'Pending' | 'Failed' | 'Skipped'

export interface Notification {
  id: string
  channel: NotificationChannel
  message: string
  recipient: string
  status: NotificationStatus
  timestamp: string
  workflowName?: string
}

export interface ChannelSettings {
  channel: NotificationChannel
  label: string
  enabled: boolean
  description: string
}

const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    channel: 'email',
    message: 'Invoice OCR Extraction completed successfully for Q3_Invoice_Batch.pdf',
    recipient: 'ava.chen@company.com',
    status: 'Sent',
    timestamp: 'Aug 7, 09:43',
    workflowName: 'Invoice OCR Extraction',
  },
  {
    id: 'notif-2',
    channel: 'slack',
    message: 'Contract Summarizer workflow failed — check logs for details',
    recipient: '#workflows-alerts',
    status: 'Sent',
    timestamp: 'Aug 7, 09:21',
    workflowName: 'Contract Summarizer',
  },
  {
    id: 'notif-3',
    channel: 'push',
    message: 'Resume ranking complete: 5 candidates ranked for Senior ML Engineer role',
    recipient: 'All Admins',
    status: 'Sent',
    timestamp: 'Aug 7, 09:00',
    workflowName: 'Resume Ranking Pipeline',
  },
  {
    id: 'notif-4',
    channel: 'sms',
    message: 'URGENT: System health alert — API latency spike detected (P95: 4.2s)',
    recipient: '+1-555-0147',
    status: 'Sent',
    timestamp: 'Aug 6, 22:15',
  },
  {
    id: 'notif-5',
    channel: 'email',
    message: 'Weekly AI Usage Report ready for download',
    recipient: 'all-managers@company.com',
    status: 'Sent',
    timestamp: 'Aug 6, 08:00',
    workflowName: 'AI Credit Usage Report',
  },
  {
    id: 'notif-6',
    channel: 'slack',
    message: 'New document uploaded: Audit_Report_Jul2026.pdf — processing failed',
    recipient: '#documents-ops',
    status: 'Failed',
    timestamp: 'Aug 3, 14:22',
    workflowName: 'Document Ingestion',
  },
  {
    id: 'notif-7',
    channel: 'push',
    message: 'Leave request from Marcus Reed is awaiting your approval',
    recipient: 'manager-group',
    status: 'Skipped',
    timestamp: 'Aug 2, 10:05',
  },
  {
    id: 'notif-8',
    channel: 'email',
    message: 'Monthly payroll report generated and ready for review',
    recipient: 'finance@company.com',
    status: 'Pending',
    timestamp: 'Aug 7, 10:30',
  },
]

const mockChannelSettings: ChannelSettings[] = [
  {
    channel: 'email',
    label: 'Email Notifications',
    enabled: true,
    description: 'Send workflow events and reports via email',
  },
  {
    channel: 'sms',
    label: 'SMS Alerts',
    enabled: true,
    description: 'Send critical system alerts via SMS',
  },
  {
    channel: 'push',
    label: 'Push Notifications',
    enabled: true,
    description: 'In-app and browser push notifications',
  },
  {
    channel: 'slack',
    label: 'Slack Integration',
    enabled: false,
    description: 'Post notifications to Slack channels',
  },
]

export function getNotifications(): Notification[] {
  return mockNotifications
}

export function getChannelSettings(): ChannelSettings[] {
  return mockChannelSettings
}
