import type { Collection, ObjectId } from 'mongodb'
import { getMongoDb } from '@/lib/db/mongodb'

export const WORKFLOW_RUN_TRACES_COLLECTION = 'workflow_run_traces'

export type WorkflowRunTraceStatus = 'running' | 'success' | 'failed'

export interface NodeExecutionRecord {
  nodeId: string
  status: WorkflowRunTraceStatus
  startedAt: Date
  finishedAt?: Date
  input?: unknown
  output?: unknown
  children?: NodeExecutionRecord[]
}

export interface WorkflowRunTrace {
  _id?: ObjectId
  workflowId: string
  runId: string
  triggeredBy: string
  status: WorkflowRunTraceStatus
  nodeExecutionTree: NodeExecutionRecord[]
  executionTime: number
  errorDetails?: string | null
  createdAt: Date
}

export async function getWorkflowRunTracesCollection(): Promise<Collection<WorkflowRunTrace>> {
  const db = await getMongoDb()
  return db.collection<WorkflowRunTrace>(WORKFLOW_RUN_TRACES_COLLECTION)
}

export async function ensureWorkflowRunTracesIndexes(): Promise<void> {
  const collection = await getWorkflowRunTracesCollection()
  await collection.createIndexes([
    { key: { workflowId: 1, createdAt: -1 } },
    { key: { runId: 1 }, unique: true },
  ])
}
