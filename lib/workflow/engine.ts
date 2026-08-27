import { generateText } from '@/lib/ai/llm-gateway'
import type { NodeExecutionRecord, WorkflowRunTraceStatus } from '@/lib/models/mongodb/workflow-runs'

export type ScaledNodeType =
  | 'trigger'
  | 'action'
  | 'condition'
  | 'loop'
  | 'delay'
  | 'parallel'
  | 'llm'
  | 'webhook'
  | 'end'

export interface RetryPolicy {
  maxAttempts: number
  backoffMs: number
}

export interface ConditionExpression {
  field: string
  operator: 'equals' | 'not equals' | 'contains' | 'greater than' | 'less than'
  value: string
}

export interface ScaledNode {
  id: string
  type: ScaledNodeType
  label: string
  config?: Record<string, unknown>
  next?: string
  trueNext?: string
  falseNext?: string
  condition?: ConditionExpression
  body?: string[]
  maxIterations?: number
  branches?: string[][]
  retryPolicy?: RetryPolicy
  continueOnError?: boolean
}

export interface ScaledWorkflowDefinition {
  id: string
  name: string
  nodes: ScaledNode[]
  startNodeId: string
}

export interface EngineDeps {
  runLlm: (prompt: string, config: Record<string, unknown>) => Promise<string>
  callWebhook: (
    url: string,
    method: string,
    body: unknown,
  ) => Promise<{ status: number; body: unknown }>
  delay: (ms: number) => Promise<void>
}

export const defaultEngineDeps: EngineDeps = {
  runLlm: async (prompt) => (await generateText({ messages: [{ role: 'user', content: prompt }], task: 'workflow-step' })).text,
  callWebhook: async (url, method, body) => {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const payload = await response.json().catch(() => null)
    return { status: response.status, body: payload }
  },
  delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}

export interface ScaledRunResult {
  status: WorkflowRunTraceStatus
  nodeExecutionTree: NodeExecutionRecord[]
  finalContext: Record<string, unknown>
  error: string | null
}

const DEFAULT_RETRY_POLICY: RetryPolicy = { maxAttempts: 1, backoffMs: 0 }

export function resolveField(field: string, context: Record<string, unknown>): unknown {
  return field.split('.').reduce<unknown>((current, segment) => {
    if (current && typeof current === 'object' && segment in (current as object)) {
      return (current as Record<string, unknown>)[segment]
    }
    return undefined
  }, context)
}

export function evaluateCondition(
  expression: ConditionExpression,
  context: Record<string, unknown>,
): boolean {
  const actual = resolveField(expression.field, context)
  const actualText = actual === undefined || actual === null ? '' : String(actual)
  const expected = expression.value

  switch (expression.operator) {
    case 'not equals':
      return actualText.toLowerCase() !== expected.toLowerCase()
    case 'contains':
      return actualText.toLowerCase().includes(expected.toLowerCase())
    case 'greater than':
      return Number(actualText) > Number(expected)
    case 'less than':
      return Number(actualText) < Number(expected)
    default:
      return actualText.toLowerCase() === expected.toLowerCase()
  }
}

async function runWithRetry<T>(
  fn: () => Promise<T>,
  policy: RetryPolicy,
  deps: EngineDeps,
): Promise<T> {
  const maxAttempts = Math.max(1, policy.maxAttempts)
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < maxAttempts) await deps.delay(policy.backoffMs)
    }
  }
  throw lastError
}

class MaxStepsExceededError extends Error {}

async function executeNode(
  node: ScaledNode,
  nodeById: Map<string, ScaledNode>,
  context: Record<string, unknown>,
  deps: EngineDeps,
  guard: { count: number; max: number },
): Promise<NodeExecutionRecord> {
  guard.count += 1
  if (guard.count > guard.max) throw new MaxStepsExceededError('Workflow exceeded the maximum step count')

  const record: NodeExecutionRecord = {
    nodeId: node.id,
    status: 'running',
    startedAt: new Date(),
    input: node.config ?? null,
  }

  try {
    switch (node.type) {
      case 'trigger':
      case 'end': {
        record.output = { label: node.label }
        break
      }

      case 'action': {
        record.output = { label: node.label, config: node.config ?? {} }
        break
      }

      case 'llm': {
        const prompt = typeof node.config?.prompt === 'string' ? node.config.prompt : node.label
        const policy = node.retryPolicy ?? DEFAULT_RETRY_POLICY
        const text = await runWithRetry(() => deps.runLlm(prompt, node.config ?? {}), policy, deps)
        context[node.id] = text
        record.output = { text }
        break
      }

      case 'webhook': {
        const url = typeof node.config?.url === 'string' ? node.config.url : ''
        const method = typeof node.config?.method === 'string' ? node.config.method : 'POST'
        const policy = node.retryPolicy ?? DEFAULT_RETRY_POLICY
        const result = await runWithRetry(
          () => deps.callWebhook(url, method, node.config?.body),
          policy,
          deps,
        )
        context[node.id] = result
        record.output = result
        break
      }

      case 'delay': {
        const ms = typeof node.config?.durationMs === 'number' ? node.config.durationMs : 0
        await deps.delay(ms)
        record.output = { durationMs: ms }
        break
      }

      case 'condition': {
        const passed = node.condition ? evaluateCondition(node.condition, context) : false
        context[`${node.id}.result`] = passed
        record.output = { passed }
        break
      }

      case 'loop': {
        const iterations = Math.min(Math.max(node.maxIterations ?? 1, 0), 100)
        const children: NodeExecutionRecord[] = []
        for (let i = 0; i < iterations; i += 1) {
          for (const childId of node.body ?? []) {
            const child = nodeById.get(childId)
            if (!child) continue
            children.push(await executeNode(child, nodeById, context, deps, guard))
          }
        }
        record.children = children
        record.output = { iterations }
        break
      }

      case 'parallel': {
        const branchResults = await Promise.all(
          (node.branches ?? []).map(async (branch) => {
            const branchRecords: NodeExecutionRecord[] = []
            for (const childId of branch) {
              const child = nodeById.get(childId)
              if (!child) continue
              branchRecords.push(await executeNode(child, nodeById, context, deps, guard))
            }
            return branchRecords
          }),
        )
        record.children = branchResults.flat()
        record.output = { branchCount: branchResults.length }
        break
      }
    }

    record.status = 'success'
  } catch (error) {
    if (error instanceof MaxStepsExceededError) throw error
    record.status = node.continueOnError ? 'success' : 'failed'
    record.output = { error: error instanceof Error ? error.message : String(error) }
    record.finishedAt = new Date()
    if (!node.continueOnError) throw new NodeExecutionError(record, error)
  }

  record.finishedAt = new Date()
  return record
}

class NodeExecutionError extends Error {
  constructor(
    public readonly record: NodeExecutionRecord,
    public readonly cause: unknown,
  ) {
    super(cause instanceof Error ? cause.message : String(cause))
  }
}

export async function executeScaledWorkflow(
  definition: ScaledWorkflowDefinition,
  input: Record<string, unknown> = {},
  deps: EngineDeps = defaultEngineDeps,
): Promise<ScaledRunResult> {
  const nodeById = new Map(definition.nodes.map((node) => [node.id, node]))
  const context: Record<string, unknown> = { ...input }
  const nodeExecutionTree: NodeExecutionRecord[] = []
  const guard = { count: 0, max: 500 }

  let currentId: string | undefined = definition.startNodeId
  const visited = new Set<string>()

  try {
    while (currentId) {
      if (visited.has(currentId)) break
      visited.add(currentId)

      const node: ScaledNode | undefined = nodeById.get(currentId)
      if (!node) break

      const record = await executeNode(node, nodeById, context, deps, guard)
      nodeExecutionTree.push(record)

      if (node.type === 'condition') {
        currentId = context[`${node.id}.result`] ? node.trueNext : node.falseNext
      } else if (node.type === 'end') {
        currentId = undefined
      } else {
        currentId = node.next
      }
    }

    return { status: 'success', nodeExecutionTree, finalContext: context, error: null }
  } catch (error) {
    if (error instanceof NodeExecutionError) {
      nodeExecutionTree.push(error.record)
      return {
        status: 'failed',
        nodeExecutionTree,
        finalContext: context,
        error: error.message,
      }
    }
    const message = error instanceof Error ? error.message : 'Workflow execution failed'
    return { status: 'failed', nodeExecutionTree, finalContext: context, error: message }
  }
}
