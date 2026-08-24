import type { AgentContext, AgentExecutionResult, AgentInput, IAgent } from '@/lib/agents/base-agent'

export interface AgentRegistryLike {
  get(agentId: string): IAgent | undefined
}

export interface PipelineStepDefinition {
  agentId: string
  input: AgentInput
}

export interface PipelineStageDefinition {
  parallel: PipelineStepDefinition[]
}

export type PipelineStage = PipelineStepDefinition | PipelineStageDefinition

export interface RetryPolicy {
  maxAttempts: number
  backoffMs: number
}

export interface PipelineDefinition {
  id: string
  name: string
  stages: PipelineStage[]
  retryPolicy?: RetryPolicy
}

export interface PipelineStepResult extends AgentExecutionResult {
  stageIndex: number
  attempts: number
}

export interface PipelineCheckpoint {
  stageIndex: number
  completedAt: Date
  state: Record<string, unknown>
}

export type PipelineStatus = 'success' | 'partial' | 'failed'

export interface PipelineRunResult {
  pipelineId: string
  runId: string
  status: PipelineStatus
  steps: PipelineStepResult[]
  checkpoints: PipelineCheckpoint[]
  aggregatedOutput: Record<string, unknown>
}

const DEFAULT_RETRY_POLICY: RetryPolicy = { maxAttempts: 1, backoffMs: 0 }

export function isParallelStage(stage: PipelineStage): stage is PipelineStageDefinition {
  return 'parallel' in stage
}

function stepsOf(stage: PipelineStage): PipelineStepDefinition[] {
  return isParallelStage(stage) ? stage.parallel : [stage]
}

async function wait(ms: number): Promise<void> {
  if (ms <= 0) return
  await new Promise((resolve) => setTimeout(resolve, ms))
}

async function runStepWithRetry(
  registry: AgentRegistryLike,
  step: PipelineStepDefinition,
  stageIndex: number,
  context: AgentContext,
  retryPolicy: RetryPolicy,
): Promise<PipelineStepResult> {
  const agent = registry.get(step.agentId)
  if (!agent) {
    return {
      agentId: step.agentId,
      runId: context.runId,
      output: '',
      data: {},
      latencyMs: 0,
      provider: 'none',
      model: 'none',
      status: 'error',
      error: `Unknown agent "${step.agentId}"`,
      stageIndex,
      attempts: 0,
    }
  }

  const maxAttempts = Math.max(1, retryPolicy.maxAttempts)
  let attempts = 0
  let lastResult: AgentExecutionResult | null = null

  while (attempts < maxAttempts) {
    attempts += 1
    lastResult = await agent.execute(step.input, context)
    if (lastResult.status === 'success') break
    if (attempts < maxAttempts) await wait(retryPolicy.backoffMs)
  }

  return { ...(lastResult as AgentExecutionResult), stageIndex, attempts }
}

export async function runPipeline(
  definition: PipelineDefinition,
  registry: AgentRegistryLike,
  baseContext: Omit<AgentContext, 'pipelineId'>,
): Promise<PipelineRunResult> {
  const retryPolicy = definition.retryPolicy ?? DEFAULT_RETRY_POLICY
  const steps: PipelineStepResult[] = []
  const checkpoints: PipelineCheckpoint[] = []
  let sharedState: Record<string, unknown> = { ...(baseContext.sharedState ?? {}) }

  for (let stageIndex = 0; stageIndex < definition.stages.length; stageIndex += 1) {
    const stage = definition.stages[stageIndex]
    const stageSteps = stepsOf(stage)
    const context: AgentContext = { ...baseContext, pipelineId: definition.id, sharedState }

    const results = await Promise.all(
      stageSteps.map((step) => runStepWithRetry(registry, step, stageIndex, context, retryPolicy)),
    )

    for (const result of results) {
      steps.push(result)
      if (result.status === 'success') {
        sharedState = { ...sharedState, [result.agentId]: result.data, [`${result.agentId}.output`]: result.output }
      }
    }

    checkpoints.push({ stageIndex, completedAt: new Date(), state: sharedState })
  }

  const successCount = steps.filter((step) => step.status === 'success').length
  const status: PipelineStatus =
    successCount === steps.length ? 'success' : successCount === 0 ? 'failed' : 'partial'

  return {
    pipelineId: definition.id,
    runId: baseContext.runId,
    status,
    steps,
    checkpoints,
    aggregatedOutput: sharedState,
  }
}
