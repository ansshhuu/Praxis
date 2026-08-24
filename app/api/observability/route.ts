import { NextResponse } from 'next/server'

import { getAgentRegistry } from '@/lib/agents/agent-registry'
import { aggregateAgentLogs, aggregateByProvider, buildLatencyHistogram } from '@/lib/agents/metrics'
import { getCurrentUserId } from '@/lib/auth/session'
import { pingMongo } from '@/lib/db/mongodb'
import { prisma } from '@/lib/db/prisma'
import { pingRedis } from '@/lib/db/redis'
import { pingChroma } from '@/lib/db/vector-db'
import { getAgentLogsCollection } from '@/lib/models/mongodb/agent-logs'
import { getWorkflowRunTracesCollection } from '@/lib/models/mongodb/workflow-runs'
import { bucketWorkflowRunsByDay, summarizeWorkflowRuns } from '@/lib/observability/aggregate'

export const dynamic = 'force-dynamic'

type ServiceStatus = 'up' | 'down' | 'not_configured'

async function checkPostgres(): Promise<ServiceStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return 'up'
  } catch {
    return 'down'
  }
}

async function checkMongo(): Promise<ServiceStatus> {
  if (!process.env.MONGODB_URL) return 'not_configured'
  return (await pingMongo()) ? 'up' : 'down'
}

async function checkRedis(): Promise<ServiceStatus> {
  if (!process.env.REDIS_URL) return 'not_configured'
  return (await pingRedis()) ? 'up' : 'down'
}

async function checkChroma(): Promise<ServiceStatus> {
  return (await pingChroma()) ? 'up' : 'down'
}

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [postgres, mongodb, redis, chromadb, agentLogs, traces] = await Promise.all([
    checkPostgres(),
    checkMongo(),
    checkRedis(),
    checkChroma(),
    getAgentLogsCollection().then((c) => c.find({}).sort({ createdAt: -1 }).limit(1000).toArray()),
    getWorkflowRunTracesCollection().then((c) => c.find({}).sort({ createdAt: -1 }).limit(500).toArray()),
  ])

  const registry = getAgentRegistry()
  const agentSnapshot = registry.listSnapshot().map(({ metadata, health }) => ({
    id: metadata.id,
    name: metadata.name,
    category: metadata.category,
    status: health.status,
    lastLatencyMs: health.lastLatencyMs,
  }))

  return NextResponse.json({
    health: { postgres, mongodb, redis, chromadb },
    agents: {
      total: agentSnapshot.length,
      snapshot: agentSnapshot,
      metrics: aggregateAgentLogs(agentLogs),
      providers: aggregateByProvider(agentLogs),
      latencyHistogram: buildLatencyHistogram(agentLogs),
    },
    workflows: {
      stats: summarizeWorkflowRuns(traces),
      dailyTrend: bucketWorkflowRunsByDay(traces, 14),
    },
  })
}
