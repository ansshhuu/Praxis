import { NextResponse } from 'next/server'

import { getAgentRegistry } from '@/lib/agents/agent-registry'
import { aggregateAgentLogs } from '@/lib/agents/metrics'
import { getCurrentUserId } from '@/lib/auth/session'
import { getAgentLogsCollection } from '@/lib/models/mongodb/agent-logs'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const registry = getAgentRegistry()
  const snapshot = registry.listSnapshot()

  const collection = await getAgentLogsCollection()
  const recentLogs = await collection.find({}).sort({ createdAt: -1 }).limit(500).toArray()
  const metricsByAgent = new Map(aggregateAgentLogs(recentLogs).map((metric) => [metric.agentId, metric]))

  const agents = snapshot.map(({ metadata, capabilities, health }) => ({
    ...metadata,
    capabilities,
    health,
    metrics: metricsByAgent.get(metadata.id) ?? {
      agentId: metadata.id,
      runCount: 0,
      successCount: 0,
      errorCount: 0,
      errorRate: 0,
      avgLatencyMs: 0,
      totalTokens: 0,
      totalCost: 0,
    },
  }))

  return NextResponse.json({ agents, total: agents.length })
}
