import type { Collection, ObjectId } from 'mongodb'
import { getMongoDb } from '@/lib/db/mongodb'

export const AGENT_LOGS_COLLECTION = 'agent_logs'

export type AgentRunStatus = 'running' | 'success' | 'failed' | 'timeout'

export interface AgentLog {
  _id?: ObjectId
  agentId: string
  runId: string
  promptTokens: number
  completionTokens: number
  cost: number
  latencyMs: number
  status: AgentRunStatus
  logs: string[]
  createdAt: Date
}

export async function getAgentLogsCollection(): Promise<Collection<AgentLog>> {
  const db = await getMongoDb()
  return db.collection<AgentLog>(AGENT_LOGS_COLLECTION)
}

export async function ensureAgentLogsIndexes(): Promise<void> {
  const collection = await getAgentLogsCollection()
  await collection.createIndexes([
    { key: { agentId: 1, createdAt: -1 } },
    { key: { runId: 1 }, unique: true },
  ])
}
