import type { Job, Worker } from 'bullmq'

import { executeScaledWorkflow } from '@/lib/workflow/engine'
import { getWorkflowRunTracesCollection } from '@/lib/models/mongodb/workflow-runs'
import { createWorkflowWorker, type WorkflowJobPayload } from '@/lib/workflow/queue'
import { getWorkflowTemplateById } from '@/lib/workflow/templates'

export async function processWorkflowJob(job: Job<WorkflowJobPayload>): Promise<void> {
  const { workflowId, runId, templateId, input, triggeredBy } = job.data
  const template = templateId ? getWorkflowTemplateById(templateId) : undefined
  const collection = await getWorkflowRunTracesCollection()
  const startedAt = Date.now()

  if (!template) {
    await collection.insertOne({
      workflowId,
      runId,
      triggeredBy,
      status: 'failed',
      nodeExecutionTree: [],
      executionTime: Date.now() - startedAt,
      errorDetails: `Unknown workflow template "${templateId}"`,
      createdAt: new Date(),
    })
    return
  }

  const result = await executeScaledWorkflow(template.definition, input)

  await collection.insertOne({
    workflowId,
    runId,
    triggeredBy,
    status: result.status,
    nodeExecutionTree: result.nodeExecutionTree,
    executionTime: Date.now() - startedAt,
    errorDetails: result.error,
    createdAt: new Date(),
  })
}

export function startWorkflowWorker(): Worker<WorkflowJobPayload> {
  return createWorkflowWorker(processWorkflowJob)
}
