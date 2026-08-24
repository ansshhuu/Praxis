import { randomUUID } from 'crypto'

import { NextResponse } from 'next/server'

import { getAgentRegistry } from '@/lib/agents/agent-registry'
import { recordAgentExecution } from '@/lib/agents/log'
import { getCurrentUserId } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

  const result = await agent.execute(input, { userId, runId: randomUUID() })
  await recordAgentExecution(input, result)

  return NextResponse.json({ result }, { status: result.status === 'success' ? 200 : 502 })
}
