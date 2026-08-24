import { Queue, Worker, type Job, type Processor } from 'bullmq'
import IORedis from 'ioredis'

export const WORKFLOW_QUEUE_NAME = 'workflow-execution'

export interface WorkflowJobPayload {
  workflowId: string
  runId: string
  templateId: string | null
  input: Record<string, unknown>
  triggeredBy: string
}

const globalForWorkflowQueue = globalThis as unknown as {
  workflowQueueConnection: IORedis | undefined
  workflowQueue: Queue<WorkflowJobPayload> | undefined
}

function getQueueConnection(): IORedis {
  if (!globalForWorkflowQueue.workflowQueueConnection) {
    const url = process.env.REDIS_URL
    if (!url) {
      throw new Error('REDIS_URL is not set')
    }
    globalForWorkflowQueue.workflowQueueConnection = new IORedis(url, {
      maxRetriesPerRequest: null,
    })
  }
  return globalForWorkflowQueue.workflowQueueConnection
}

export function getWorkflowQueue(): Queue<WorkflowJobPayload> {
  if (!globalForWorkflowQueue.workflowQueue) {
    globalForWorkflowQueue.workflowQueue = new Queue<WorkflowJobPayload>(WORKFLOW_QUEUE_NAME, {
      connection: getQueueConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 500,
      },
    })
  }
  return globalForWorkflowQueue.workflowQueue
}

export async function enqueueWorkflowRun(
  payload: WorkflowJobPayload,
): Promise<{ jobId: string }> {
  const job = await getWorkflowQueue().add(WORKFLOW_QUEUE_NAME, payload, { jobId: payload.runId })
  return { jobId: job.id ?? payload.runId }
}

export function createWorkflowWorker(
  processor: Processor<WorkflowJobPayload>,
): Worker<WorkflowJobPayload> {
  return new Worker<WorkflowJobPayload>(WORKFLOW_QUEUE_NAME, processor, {
    connection: getQueueConnection(),
    concurrency: 5,
  })
}

export type { Job }
