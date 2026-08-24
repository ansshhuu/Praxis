import { describe, expect, it, vi } from 'vitest'

import { evaluateCondition, executeScaledWorkflow, resolveField, type EngineDeps, type ScaledWorkflowDefinition } from '@/lib/workflow/engine'

function fakeDeps(overrides: Partial<EngineDeps> = {}): EngineDeps {
  return {
    runLlm: vi.fn(async () => 'llm output'),
    callWebhook: vi.fn(async () => ({ status: 200, body: { ok: true } })),
    delay: vi.fn(async () => undefined),
    ...overrides,
  }
}

describe('resolveField', () => {
  it('resolves a nested path', () => {
    expect(resolveField('input.status', { input: { status: 'open' } })).toBe('open')
  })

  it('returns undefined for a missing path', () => {
    expect(resolveField('input.missing', { input: {} })).toBeUndefined()
  })
})

describe('evaluateCondition', () => {
  const context = { input: { status: 'approved', count: 5 } }

  it('evaluates equals', () => {
    expect(evaluateCondition({ field: 'input.status', operator: 'equals', value: 'approved' }, context)).toBe(true)
  })

  it('evaluates not equals', () => {
    expect(evaluateCondition({ field: 'input.status', operator: 'not equals', value: 'approved' }, context)).toBe(false)
  })

  it('evaluates contains', () => {
    expect(evaluateCondition({ field: 'input.status', operator: 'contains', value: 'prov' }, context)).toBe(true)
  })

  it('evaluates greater than and less than', () => {
    expect(evaluateCondition({ field: 'input.count', operator: 'greater than', value: '3' }, context)).toBe(true)
    expect(evaluateCondition({ field: 'input.count', operator: 'less than', value: '3' }, context)).toBe(false)
  })
})

describe('executeScaledWorkflow', () => {
  it('runs a simple linear graph to completion', async () => {
    const definition: ScaledWorkflowDefinition = {
      id: 'wf1',
      name: 'linear',
      startNodeId: 'trigger',
      nodes: [
        { id: 'trigger', type: 'trigger', label: 'start', next: 'action1' },
        { id: 'action1', type: 'action', label: 'do something', next: 'end' },
        { id: 'end', type: 'end', label: 'done' },
      ],
    }

    const result = await executeScaledWorkflow(definition, {}, fakeDeps())

    expect(result.status).toBe('success')
    expect(result.nodeExecutionTree.map((step) => step.nodeId)).toEqual(['trigger', 'action1', 'end'])
  })

  it('follows the true branch of a condition node', async () => {
    const definition: ScaledWorkflowDefinition = {
      id: 'wf2',
      name: 'conditional',
      startNodeId: 'trigger',
      nodes: [
        { id: 'trigger', type: 'trigger', label: 'start', next: 'check' },
        {
          id: 'check',
          type: 'condition',
          label: 'check status',
          condition: { field: 'input.status', operator: 'equals', value: 'approved' },
          trueNext: 'approve',
          falseNext: 'reject',
        },
        { id: 'approve', type: 'action', label: 'approve', next: 'end' },
        { id: 'reject', type: 'action', label: 'reject', next: 'end' },
        { id: 'end', type: 'end', label: 'done' },
      ],
    }

    const result = await executeScaledWorkflow(definition, { input: { status: 'approved' } }, fakeDeps())

    expect(result.nodeExecutionTree.map((step) => step.nodeId)).toEqual(['trigger', 'check', 'approve', 'end'])
  })

  it('runs a loop node body for the configured number of iterations', async () => {
    const definition: ScaledWorkflowDefinition = {
      id: 'wf3',
      name: 'loop',
      startNodeId: 'trigger',
      nodes: [
        { id: 'trigger', type: 'trigger', label: 'start', next: 'loop1' },
        { id: 'loop1', type: 'loop', label: 'process items', body: ['item'], maxIterations: 3, next: 'end' },
        { id: 'item', type: 'action', label: 'process one item' },
        { id: 'end', type: 'end', label: 'done' },
      ],
    }

    const result = await executeScaledWorkflow(definition, {}, fakeDeps())
    const loopRecord = result.nodeExecutionTree.find((step) => step.nodeId === 'loop1')

    expect(loopRecord?.children).toHaveLength(3)
  })

  it('runs parallel branches and joins into the next node', async () => {
    const definition: ScaledWorkflowDefinition = {
      id: 'wf4',
      name: 'parallel',
      startNodeId: 'trigger',
      nodes: [
        { id: 'trigger', type: 'trigger', label: 'start', next: 'fanout' },
        { id: 'fanout', type: 'parallel', label: 'fan out', branches: [['a'], ['b']], next: 'end' },
        { id: 'a', type: 'action', label: 'branch a' },
        { id: 'b', type: 'action', label: 'branch b' },
        { id: 'end', type: 'end', label: 'done' },
      ],
    }

    const result = await executeScaledWorkflow(definition, {}, fakeDeps())
    const fanoutRecord = result.nodeExecutionTree.find((step) => step.nodeId === 'fanout')

    expect(fanoutRecord?.children?.map((child) => child.nodeId).sort()).toEqual(['a', 'b'])
  })

  it('calls the injected delay function for a delay node', async () => {
    const deps = fakeDeps()
    const definition: ScaledWorkflowDefinition = {
      id: 'wf5',
      name: 'delay',
      startNodeId: 'trigger',
      nodes: [
        { id: 'trigger', type: 'trigger', label: 'start', next: 'wait' },
        { id: 'wait', type: 'delay', label: 'wait', config: { durationMs: 500 }, next: 'end' },
        { id: 'end', type: 'end', label: 'done' },
      ],
    }

    await executeScaledWorkflow(definition, {}, deps)
    expect(deps.delay).toHaveBeenCalledWith(500)
  })

  it('retries an llm node before succeeding', async () => {
    let calls = 0
    const deps = fakeDeps({
      runLlm: vi.fn(async () => {
        calls += 1
        if (calls === 1) throw new Error('transient failure')
        return 'recovered'
      }),
    })

    const definition: ScaledWorkflowDefinition = {
      id: 'wf6',
      name: 'retry',
      startNodeId: 'trigger',
      nodes: [
        { id: 'trigger', type: 'trigger', label: 'start', next: 'summarize' },
        {
          id: 'summarize',
          type: 'llm',
          label: 'summarize',
          config: { prompt: 'summarize this' },
          retryPolicy: { maxAttempts: 2, backoffMs: 0 },
          next: 'end',
        },
        { id: 'end', type: 'end', label: 'done' },
      ],
    }

    const result = await executeScaledWorkflow(definition, {}, deps)

    expect(result.status).toBe('success')
    expect(deps.runLlm).toHaveBeenCalledTimes(2)
    expect(result.finalContext.summarize).toBe('recovered')
  })

  it('fails the run when a node exhausts its retries', async () => {
    const deps = fakeDeps({
      runLlm: vi.fn(async () => {
        throw new Error('permanent failure')
      }),
    })

    const definition: ScaledWorkflowDefinition = {
      id: 'wf7',
      name: 'exhausted-retry',
      startNodeId: 'trigger',
      nodes: [
        { id: 'trigger', type: 'trigger', label: 'start', next: 'summarize' },
        {
          id: 'summarize',
          type: 'llm',
          label: 'summarize',
          retryPolicy: { maxAttempts: 2, backoffMs: 0 },
          next: 'end',
        },
        { id: 'end', type: 'end', label: 'done' },
      ],
    }

    const result = await executeScaledWorkflow(definition, {}, deps)

    expect(result.status).toBe('failed')
    expect(result.error).toContain('permanent failure')
    expect(deps.runLlm).toHaveBeenCalledTimes(2)
  })
})
