export const DASHBOARD_RANGES = [7, 30, 90] as const
export type DashboardRange = (typeof DASHBOARD_RANGES)[number]

export const RUNS_PER_PAGE = 6
export const ACTIVITY_PAGE_SIZE = 6
export const ACTIVITY_MAX = 60

export function isDashboardRange(value: unknown): value is DashboardRange {
  return DASHBOARD_RANGES.includes(Number(value) as DashboardRange)
}

export type Trend = { pct: number; direction: 'up' | 'down' } | null

export interface DashboardStats {
  activeUsers: { value: number; totalUsers: number; trend: Trend }
  pendingWorkflows: { value: number; scheduled: number; trend: Trend }
  aiRequestsToday: { value: number; trend: Trend }
  uptime: { pct: number; operational: boolean }
}

export interface SuccessRatePoint {
  key: string
  label: string
  rate: number
  runs: number
}

export interface ModuleUsage {
  id: string
  label: string
  count: number
  pct: number
  color: string
}

export type RunStatus = 'SUCCESS' | 'FAILED' | 'RUNNING'

export interface RunRow {
  id: string
  workflowId: string
  workflow: string
  trigger: string
  status: RunStatus
  durationMs: number | null
  executedBy: string
  startedAt: string
}

export type ActivityTone = 'success' | 'failed' | 'info' | 'pending'

export interface ActivityItem {
  id: string
  actor: string
  description: string
  createdAt: string
  tone: ActivityTone
}

export interface DashboardPayload {
  range: DashboardRange
  generatedAt: string
  stats: DashboardStats
  successRate: SuccessRatePoint[]
  moduleUsage: ModuleUsage[]
  runs: { rows: RunRow[]; page: number; perPage: number; total: number }
  activity: { items: ActivityItem[]; hasMore: boolean }
}
