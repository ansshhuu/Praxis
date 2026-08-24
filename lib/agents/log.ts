import { randomUUID } from 'crypto'

import type { AgentExecutionResult, AgentInput } from '@/lib/agents/base-agent'
import { estimateTokenCount } from '@/lib/agents/metrics'
import { getAgentLogsCollection } from '@/lib/models/mongodb/agent-logs'

export async function recordAgentExecution(
  input: AgentInput,
  result: AgentExecutionResult,
): Promise<void> {
  const collection = await getAgentLogsCollection()
  await collection.insertOne({
    agentId: result.agentId,
    runId: `${result.runId}:${result.agentId}:${randomUUID()}`,
    provider: result.provider,
    model: result.model,
    promptTokens: estimateTokenCount(input.prompt),
    completionTokens: estimateTokenCount(result.output),
    cost: 0,
    latencyMs: result.latencyMs,
    status: result.status === 'success' ? 'success' : 'failed',
    logs: result.error ? [result.error] : [],
    createdAt: new Date(),
  })
}
