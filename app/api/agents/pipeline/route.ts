import { randomUUID } from 'crypto'

import { NextResponse } from 'next/server'

import { getAgentRegistry } from '@/lib/agents/agent-registry'
import type { AgentInput } from '@/lib/agents/base-agent'
import { recordAgentExecution } from '@/lib/agents/log'
import { runPipeline, type PipelineStage } from '@/lib/agents/orchestrator'
import { getCurrentUserId } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

function parseStep(value: unknown): { agentId: string; input: AgentInput } | null {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  const agentId = typeof record.agentId === 'string' ? record.agentId : ''
  const prompt = typeof record.prompt === 'string' ? record.prompt : ''
  if (!agentId || !prompt) return null
  const data = record.data && typeof record.data === 'object' ? (record.data as Record<string, unknown>) : undefined
  return { agentId, input: { prompt, data } }
}

function parseStages(raw: unknown): PipelineStage[] | null {
  if (!Array.isArray(raw)) return null

  const stages: PipelineStage[] = []
  for (const entry of raw) {
    if (entry && typeof entry === 'object' && Array.isArray((entry as Record<string, unknown>).parallel)) {
      const parallel = (entry as Record<string, unknown>).parallel as unknown[]
      const parsedParallel = parallel.map(parseStep)
      if (parsedParallel.some((step) => step === null)) return null
      stages.push({ parallel: parsedParallel as { agentId: string; input: AgentInput }[] })
      continue
    }

    const step = parseStep(entry)
    if (!step) return null
    stages.push(step)
  }

  return stages
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { name?: unknown; stages?: unknown; retryPolicy?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const stages = parseStages(body.stages)
  if (!stages || stages.length === 0) {
    return NextResponse.json({ error: 'stages must be a non-empty array of pipeline steps' }, { status: 400 })
  }

  const retryPolicy =
    body.retryPolicy && typeof body.retryPolicy === 'object'
      ? (body.retryPolicy as { maxAttempts?: number; backoffMs?: number })
      : undefined

  const pipelineId = randomUUID()
  const runId = randomUUID()

  const result = await runPipeline(
    {
      id: pipelineId,
      name: typeof body.name === 'string' ? body.name : 'ad-hoc pipeline',
      stages,
      retryPolicy:
        retryPolicy && typeof retryPolicy.maxAttempts === 'number' && typeof retryPolicy.backoffMs === 'number'
          ? { maxAttempts: retryPolicy.maxAttempts, backoffMs: retryPolicy.backoffMs }
          : undefined,
    },
    getAgentRegistry(),
    { userId, runId },
  )

  const flattenedInputs = stages.flatMap((stage) =>
    'parallel' in stage ? stage.parallel.map((step) => step.input) : [stage.input],
  )
  await Promise.all(
    result.steps.map((step, index) =>
      recordAgentExecution(flattenedInputs[index] ?? { prompt: '' }, step).catch(() => undefined),
    ),
  )

  return NextResponse.json({ result }, { status: result.status === 'failed' ? 502 : 200 })
}
