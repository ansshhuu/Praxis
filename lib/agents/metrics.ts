import type { AgentLog } from '@/lib/models/mongodb/agent-logs'

export interface AgentMetricSummary {
  agentId: string
  runCount: number
  successCount: number
  errorCount: number
  errorRate: number
  avgLatencyMs: number
  totalTokens: number
  totalCost: number
}

export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4)
}

export function aggregateAgentLogs(logs: AgentLog[]): AgentMetricSummary[] {
  const byAgent = new Map<string, AgentLog[]>()
  for (const log of logs) {
    const list = byAgent.get(log.agentId) ?? []
    list.push(log)
    byAgent.set(log.agentId, list)
  }

  return [...byAgent.entries()]
    .map(([agentId, entries]) => {
      const runCount = entries.length
      const errorCount = entries.filter((entry) => entry.status !== 'success').length
      const successCount = runCount - errorCount
      const totalLatency = entries.reduce((sum, entry) => sum + entry.latencyMs, 0)
      const totalTokens = entries.reduce((sum, entry) => sum + entry.promptTokens + entry.completionTokens, 0)
      const totalCost = entries.reduce((sum, entry) => sum + entry.cost, 0)

      return {
        agentId,
        runCount,
        successCount,
        errorCount,
        errorRate: runCount === 0 ? 0 : errorCount / runCount,
        avgLatencyMs: runCount === 0 ? 0 : totalLatency / runCount,
        totalTokens,
        totalCost,
      }
    })
    .sort((a, b) => b.runCount - a.runCount)
}
