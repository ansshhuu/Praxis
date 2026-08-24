import { describe, expect, it } from 'vitest'

import { aggregateAgentLogs, estimateTokenCount } from '@/lib/agents/metrics'
import type { AgentLog } from '@/lib/models/mongodb/agent-logs'

function log(overrides: Partial<AgentLog>): AgentLog {
  return {
    agentId: 'a',
    runId: 'r',
    promptTokens: 10,
    completionTokens: 20,
    cost: 0.01,
    latencyMs: 100,
    status: 'success',
    logs: [],
    createdAt: new Date(),
    ...overrides,
  }
}

describe('estimateTokenCount', () => {
  it('estimates roughly one token per four characters', () => {
    expect(estimateTokenCount('')).toBe(0)
    expect(estimateTokenCount('12345678')).toBe(2)
  })
})

describe('aggregateAgentLogs', () => {
  it('returns an empty array for no logs', () => {
    expect(aggregateAgentLogs([])).toEqual([])
  })

  it('groups by agent and computes averages and error rate', () => {
    const logs = [
      log({ agentId: 'a', latencyMs: 100, status: 'success' }),
      log({ agentId: 'a', latencyMs: 200, status: 'failed' }),
      log({ agentId: 'b', latencyMs: 50, status: 'success' }),
    ]

    const metrics = aggregateAgentLogs(logs)
    const a = metrics.find((m) => m.agentId === 'a')
    const b = metrics.find((m) => m.agentId === 'b')

    expect(a?.runCount).toBe(2)
    expect(a?.errorCount).toBe(1)
    expect(a?.errorRate).toBeCloseTo(0.5)
    expect(a?.avgLatencyMs).toBeCloseTo(150)

    expect(b?.runCount).toBe(1)
    expect(b?.errorRate).toBe(0)
  })

  it('sorts agents by run count descending', () => {
    const logs = [
      log({ agentId: 'low', runId: '1' }),
      log({ agentId: 'high', runId: '2' }),
      log({ agentId: 'high', runId: '3' }),
    ]
    const metrics = aggregateAgentLogs(logs)
    expect(metrics[0].agentId).toBe('high')
  })
})
