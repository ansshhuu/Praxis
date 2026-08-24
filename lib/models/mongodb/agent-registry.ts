import type { Collection } from 'mongodb'
import { getMongoDb } from '@/lib/db/mongodb'
import type { AgentCategory, AgentStatus } from '@/lib/agents/base-agent'

export const AGENT_REGISTRY_COLLECTION = 'agent_registry'

export interface AgentRegistryRecord {
  agentId: string
  name: string
  category: AgentCategory
  description: string
  capabilities: string[]
  status: AgentStatus
  lastRunAt: Date | null
  lastLatencyMs: number | null
  lastError: string | null
  updatedAt: Date
}

export async function getAgentRegistryCollection(): Promise<Collection<AgentRegistryRecord>> {
  const db = await getMongoDb()
  return db.collection<AgentRegistryRecord>(AGENT_REGISTRY_COLLECTION)
}

export async function ensureAgentRegistryIndexes(): Promise<void> {
  const collection = await getAgentRegistryCollection()
  await collection.createIndexes([
    { key: { agentId: 1 }, unique: true },
    { key: { category: 1 } },
    { key: { status: 1 } },
  ])
}

export async function upsertAgentRegistryRecord(record: AgentRegistryRecord): Promise<void> {
  const collection = await getAgentRegistryCollection()
  await collection.updateOne(
    { agentId: record.agentId },
    { $set: record },
    { upsert: true },
  )
}
