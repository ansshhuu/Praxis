export type AgentCategory = 'development' | 'operations' | 'business' | 'marketing' | 'content'

export type AgentStatus = 'active' | 'idle' | 'error' | 'paused'

export interface AgentHealthView {
  status: AgentStatus
  lastRunAt: string | null
  lastLatencyMs: number | null
  lastError: string | null
}

export interface AgentMetricsView {
  agentId: string
  runCount: number
  successCount: number
  errorCount: number
  errorRate: number
  avgLatencyMs: number
  totalTokens: number
  totalCost: number
}

export interface AgentView {
  id: string
  name: string
  category: AgentCategory
  description: string
  capabilities: string[]
  health: AgentHealthView
  metrics: AgentMetricsView
}

export interface AgentExecutionResultView {
  agentId: string
  runId: string
  output: string
  data: Record<string, unknown>
  latencyMs: number
  provider: string
  model: string
  status: 'success' | 'error'
  error?: string
}

export const AGENT_CATEGORY_LABELS: Record<AgentCategory, string> = {
  development: 'Development',
  operations: 'Operations',
  business: 'Business',
  marketing: 'Marketing',
  content: 'Content',
}
