import { describe, expect, it } from 'vitest'

import { aggregateAgentLogs, aggregateByProvider, buildLatencyHistogram, estimateTokenCount } from '@/lib/agents/metrics'
import type { AgentLog } from '@/lib/models/mongodb/agent-logs'

function log(overrides: Partial<AgentLog>): AgentLog {
  return {
    agentId: 'a',
    userId: 'u',
    runId: 'r',
    provider: 'openai',
    model: 'gpt-4o-mini',
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

describe('aggregateByProvider', () => {
  it('groups by provider and computes averages', () => {
    const logs = [
      log({ provider: 'openai', latencyMs: 100, promptTokens: 10, completionTokens: 10 }),
      log({ provider: 'openai', latencyMs: 200, promptTokens: 10, completionTokens: 10 }),
      log({ provider: 'gemini', latencyMs: 50, promptTokens: 5, completionTokens: 5 }),
    ]

    const metrics = aggregateByProvider(logs)
    const openai = metrics.find((m) => m.provider === 'openai')

    expect(openai?.runCount).toBe(2)
    expect(openai?.avgLatencyMs).toBeCloseTo(150)
    expect(openai?.totalTokens).toBe(40)
    expect(metrics[0].provider).toBe('openai')
  })

  it('falls back to "unknown" for logs without a provider', () => {
    const metrics = aggregateByProvider([log({ provider: '' })])
    expect(metrics[0].provider).toBe('unknown')
  })
})

describe('buildLatencyHistogram', () => {
  it('buckets logs into fixed latency ranges', () => {
    const logs = [
      log({ latencyMs: 100 }),
      log({ latencyMs: 300 }),
      log({ latencyMs: 9000 }),
    ]
    const histogram = buildLatencyHistogram(logs)

    expect(histogram.find((b) => b.label === '0-250ms')?.count).toBe(1)
    expect(histogram.find((b) => b.label === '250-500ms')?.count).toBe(1)
    expect(histogram.find((b) => b.label === '8000ms+')?.count).toBe(1)
    expect(histogram.reduce((sum, b) => sum + b.count, 0)).toBe(3)
  })
})
