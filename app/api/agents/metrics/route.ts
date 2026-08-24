import { NextResponse } from 'next/server'

import { aggregateAgentLogs } from '@/lib/agents/metrics'
import { getCurrentUserId } from '@/lib/auth/session'
import { getAgentLogsCollection } from '@/lib/models/mongodb/agent-logs'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const agentId = searchParams.get('agentId')
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '1000') || 1000, 1), 5000)

  const collection = await getAgentLogsCollection()
  const filter = agentId ? { agentId } : {}
  const logs = await collection.find(filter).sort({ createdAt: -1 }).limit(limit).toArray()

  const metrics = aggregateAgentLogs(logs)

  return NextResponse.json({ metrics, sampleSize: logs.length })
}
