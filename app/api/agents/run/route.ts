import { randomUUID } from 'crypto'

import { NextResponse } from 'next/server'

import { getAgentRegistry } from '@/lib/agents/agent-registry'
import { recordAgentExecution } from '@/lib/agents/log'
import { getCurrentUserId } from '@/lib/auth/session'
import { enforceRateLimit } from '@/lib/security/rate-limit'

export const dynamic = 'force-dynamic'

const AGENT_RUN_RATE_LIMIT = 20
const AGENT_RUN_RATE_WINDOW_SECONDS = 60

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const denied = await enforceRateLimit('agents-run', userId, AGENT_RUN_RATE_LIMIT, AGENT_RUN_RATE_WINDOW_SECONDS)
  if (denied) {
    return NextResponse.json(denied.body, { status: denied.status })
  }

  let body: { agentId?: unknown; prompt?: unknown; data?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const agentId = typeof body.agentId === 'string' ? body.agentId : ''
  const prompt = typeof body.prompt === 'string' ? body.prompt : ''
  if (!agentId || !prompt) {
    return NextResponse.json({ error: 'agentId and prompt are required' }, { status: 400 })
  }

  const agent = getAgentRegistry().get(agentId)
  if (!agent) {
    return NextResponse.json({ error: `Unknown agent "${agentId}"` }, { status: 404 })
  }

  const input = {
    prompt,
    data: body.data && typeof body.data === 'object' ? (body.data as Record<string, unknown>) : undefined,
  }

  let result
  try {
    result = await agent.execute(input, { userId, runId: randomUUID() })
  } catch (error) {
    console.error(`[agents/run] agent "${agentId}" threw during execute:`, error)
    const message = error instanceof Error ? error.message : 'Agent execution failed'
    return NextResponse.json({ error: `Agent run failed: ${message}` }, { status: 502 })
  }

  try {
    await recordAgentExecution(input, result, userId)
  } catch (error) {
    console.error(`[agents/run] failed to record execution log for agent "${agentId}":`, error)
  }

  if (result.status !== 'success') {
    return NextResponse.json(
      { error: `Agent run failed: ${result.error ?? 'unknown error'}`, result },
      { status: 502 },
    )
  }

  return NextResponse.json({ result }, { status: 200 })
}
