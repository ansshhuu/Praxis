export type ServiceStatus = 'up' | 'down' | 'not_configured'

export interface AgentSnapshotView {
  id: string
  name: string
  category: string
  status: 'active' | 'idle' | 'error' | 'paused'
  lastLatencyMs: number | null
}

export interface AgentMetricView {
  agentId: string
  runCount: number
  successCount: number
  errorCount: number
  errorRate: number
  avgLatencyMs: number
  totalTokens: number
  totalCost: number
}

export interface ProviderMetricView {
  provider: string
  runCount: number
  avgLatencyMs: number
  totalTokens: number
}

export interface LatencyBucketView {
  label: string
  count: number
}

export interface WorkflowStatsView {
  total: number
  success: number
  failed: number
  running: number
  successRate: number
  avgExecutionTimeMs: number
}

export interface WorkflowDailyPointView {
  date: string
  success: number
  failed: number
}

export interface ObservabilitySnapshot {
  health: { postgres: ServiceStatus; mongodb: ServiceStatus; redis: ServiceStatus; chromadb: ServiceStatus }
  agents: {
    total: number
    snapshot: AgentSnapshotView[]
    metrics: AgentMetricView[]
    providers: ProviderMetricView[]
    latencyHistogram: LatencyBucketView[]
  }
  workflows: {
    stats: WorkflowStatsView
    dailyTrend: WorkflowDailyPointView[]
  }
}
