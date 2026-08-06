import {
  Activity,
  Cpu,
  ShieldCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'

export type StatCard = {
  id: string
  label: string
  value: string
  icon: LucideIcon
  trend: string
  trendDirection: 'up' | 'down'
}

export const statCards: StatCard[] = [
  {
    id: 'active-users',
    label: 'Active Users',
    value: '2,847',
    icon: Users,
    trend: '+12% this week',
    trendDirection: 'up',
  },
  {
    id: 'pending-workflows',
    label: 'Pending Workflows',
    value: '38',
    icon: Activity,
    trend: '-4% this week',
    trendDirection: 'down',
  },
  {
    id: 'ai-requests',
    label: 'AI Requests Today',
    value: '19,204',
    icon: Cpu,
    trend: '+23% vs yesterday',
    trendDirection: 'up',
  },
  {
    id: 'system-health',
    label: 'System Health',
    value: '99.9%',
    icon: ShieldCheck,
    trend: '+0.2% this week',
    trendDirection: 'up',
  },
]

export type SuccessRatePoint = {
  day: string
  rate: number
}

export const successRateData: SuccessRatePoint[] = [
  { day: 'Mon', rate: 92 },
  { day: 'Tue', rate: 95 },
  { day: 'Wed', rate: 91 },
  { day: 'Thu', rate: 97 },
  { day: 'Fri', rate: 94 },
  { day: 'Sat', rate: 98 },
  { day: 'Sun', rate: 96 },
]

export type UsagePoint = {
  module: string
  requests: number
}

export const aiUsageData: UsagePoint[] = [
  { module: 'Documents', requests: 6200 },
  { module: 'Resumes', requests: 4800 },
  { module: 'Chat', requests: 3900 },
  { module: 'Reports', requests: 2600 },
  { module: 'Scheduler', requests: 1500 },
]

export type RunStatus = 'Success' | 'Failed' | 'Running'

export type WorkflowRun = {
  id: string
  status: RunStatus
  name: string
  triggeredBy: string
  startedAt: string
  duration: string
}

export const workflowRuns: WorkflowRun[] = [
  {
    id: 'run-1',
    status: 'Success',
    name: 'Invoice OCR Extraction',
    triggeredBy: 'Ava Chen',
    startedAt: 'Aug 7, 09:42',
    duration: '1m 12s',
  },
  {
    id: 'run-2',
    status: 'Running',
    name: 'Resume Ranking Pipeline',
    triggeredBy: 'System Scheduler',
    startedAt: 'Aug 7, 09:38',
    duration: '—',
  },
  {
    id: 'run-3',
    status: 'Failed',
    name: 'Contract Summarizer',
    triggeredBy: 'Marcus Reed',
    startedAt: 'Aug 7, 09:20',
    duration: '0m 47s',
  },
  {
    id: 'run-4',
    status: 'Success',
    name: 'Support Ticket Triage',
    triggeredBy: 'Priya Nair',
    startedAt: 'Aug 7, 08:55',
    duration: '2m 03s',
  },
  {
    id: 'run-5',
    status: 'Success',
    name: 'Sales Report Generation',
    triggeredBy: 'System Scheduler',
    startedAt: 'Aug 7, 08:30',
    duration: '3m 41s',
  },
  {
    id: 'run-6',
    status: 'Failed',
    name: 'Email Sentiment Analysis',
    triggeredBy: 'Diego Alvarez',
    startedAt: 'Aug 7, 08:12',
    duration: '0m 19s',
  },
  {
    id: 'run-7',
    status: 'Success',
    name: 'Knowledge Base Sync',
    triggeredBy: 'System Scheduler',
    startedAt: 'Aug 7, 07:50',
    duration: '4m 27s',
  },
  {
    id: 'run-8',
    status: 'Running',
    name: 'Compliance Audit Scan',
    triggeredBy: 'Ava Chen',
    startedAt: 'Aug 7, 07:44',
    duration: '—',
  },
]

export type NavItem = {
  label: string
  icon: string
}
