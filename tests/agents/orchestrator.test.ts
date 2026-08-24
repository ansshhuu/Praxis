import { describe, expect, it } from 'vitest'

import type { AgentContext, AgentExecutionResult, AgentHealth, AgentInput, AgentMetadata, IAgent } from '@/lib/agents/base-agent'
import { isParallelStage, runPipeline, type AgentRegistryLike, type PipelineDefinition } from '@/lib/agents/orchestrator'

function makeAgent(
  id: string,
  behavior: 'success' | 'fail' | 'fail-then-succeed',
): IAgent {
  let calls = 0
  return {
    async execute(input: AgentInput, context: AgentContext): Promise<AgentExecutionResult> {
      calls += 1
      const base = {
        agentId: id,
        runId: context.runId,
        latencyMs: 1,
        provider: 'stub',
        model: 'stub',
      }
      if (behavior === 'success') {
        return { ...base, output: `${id}-output`, data: { echoed: input.prompt }, status: 'success' }
      }
      if (behavior === 'fail') {
        return { ...base, output: '', data: {}, status: 'error', error: `${id} always fails` }
      }
      if (calls === 1) {
        return { ...base, output: '', data: {}, status: 'error', error: `${id} first attempt fails` }
      }
      return { ...base, output: `${id}-recovered`, data: {}, status: 'success' }
    },
    getHealth(): AgentHealth {
      return { status: 'idle', lastRunAt: null, lastLatencyMs: null, lastError: null }
    },
    getCapabilities(): string[] {
      return []
    },
    getMetadata(): AgentMetadata {
      return { id, name: id, category: 'development', description: '' }
    },
  }
}

function registryOf(...agents: IAgent[]): AgentRegistryLike {
  const map = new Map(agents.map((agent) => [agent.getMetadata().id, agent]))
  return { get: (agentId: string) => map.get(agentId) }
}

describe('isParallelStage', () => {
  it('detects a parallel stage', () => {
    expect(isParallelStage({ parallel: [] })).toBe(true)
    expect(isParallelStage({ agentId: 'a', input: { prompt: 'x' } })).toBe(false)
  })
})

describe('runPipeline', () => {
  it('runs sequential stages and aggregates state', async () => {
    const registry = registryOf(makeAgent('a', 'success'), makeAgent('b', 'success'))
    const definition: PipelineDefinition = {
      id: 'p1',
      name: 'sequential',
      stages: [
        { agentId: 'a', input: { prompt: 'step a' } },
        { agentId: 'b', input: { prompt: 'step b' } },
      ],
    }

    const result = await runPipeline(definition, registry, { userId: 'u1', runId: 'r1' })

    expect(result.status).toBe('success')
    expect(result.steps.map((step) => step.agentId)).toEqual(['a', 'b'])
    expect(result.checkpoints.length).toBe(2)
    expect(result.aggregatedOutput['a.output']).toBe('a-output')
  })

  it('runs a parallel stage and captures both branch results', async () => {
    const registry = registryOf(makeAgent('a', 'success'), makeAgent('b', 'success'))
    const definition: PipelineDefinition = {
      id: 'p2',
      name: 'parallel',
      stages: [{ parallel: [{ agentId: 'a', input: { prompt: 'x' } }, { agentId: 'b', input: { prompt: 'y' } }] }],
    }

    const result = await runPipeline(definition, registry, { userId: 'u1', runId: 'r2' })

    expect(result.status).toBe('success')
    expect(result.steps).toHaveLength(2)
    expect(result.steps.every((step) => step.stageIndex === 0)).toBe(true)
  })

  it('retries a failing step until it succeeds', async () => {
    const registry = registryOf(makeAgent('a', 'fail-then-succeed'))
    const definition: PipelineDefinition = {
      id: 'p3',
      name: 'retry',
      stages: [{ agentId: 'a', input: { prompt: 'x' } }],
      retryPolicy: { maxAttempts: 3, backoffMs: 0 },
    }

    const result = await runPipeline(definition, registry, { userId: 'u1', runId: 'r3' })

    expect(result.status).toBe('success')
    expect(result.steps[0].attempts).toBe(2)
    expect(result.steps[0].output).toBe('a-recovered')
  })

  it('marks the pipeline partial when some steps fail after exhausting retries', async () => {
    const registry = registryOf(makeAgent('a', 'success'), makeAgent('b', 'fail'))
    const definition: PipelineDefinition = {
      id: 'p4',
      name: 'partial',
      stages: [{ parallel: [{ agentId: 'a', input: { prompt: 'x' } }, { agentId: 'b', input: { prompt: 'y' } }] }],
      retryPolicy: { maxAttempts: 2, backoffMs: 0 },
    }

    const result = await runPipeline(definition, registry, { userId: 'u1', runId: 'r4' })

    expect(result.status).toBe('partial')
    const failedStep = result.steps.find((step) => step.agentId === 'b')
    expect(failedStep?.status).toBe('error')
    expect(failedStep?.attempts).toBe(2)
  })

  it('reports an unknown agent id as a failed step without throwing', async () => {
    const registry = registryOf(makeAgent('a', 'success'))
    const definition: PipelineDefinition = {
      id: 'p5',
      name: 'unknown-agent',
      stages: [{ agentId: 'missing', input: { prompt: 'x' } }],
    }

    const result = await runPipeline(definition, registry, { userId: 'u1', runId: 'r5' })

    expect(result.status).toBe('failed')
    expect(result.steps[0].error).toContain('Unknown agent')
  })
})
