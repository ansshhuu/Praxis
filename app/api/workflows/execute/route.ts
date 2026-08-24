import { randomUUID } from 'crypto'

import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { executeScaledWorkflow } from '@/lib/workflow/engine'
import { getWorkflowRunTracesCollection } from '@/lib/models/mongodb/workflow-runs'
import { enqueueWorkflowRun } from '@/lib/workflow/queue'
import { getWorkflowTemplateById } from '@/lib/workflow/templates'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { templateId?: unknown; input?: unknown; mode?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const templateId = typeof body.templateId === 'string' ? body.templateId : ''
  if (!templateId) {
    return NextResponse.json({ error: 'templateId is required' }, { status: 400 })
  }

  const template = getWorkflowTemplateById(templateId)
  if (!template) {
    return NextResponse.json({ error: `Unknown workflow template "${templateId}"` }, { status: 404 })
  }

  const input = body.input && typeof body.input === 'object' ? (body.input as Record<string, unknown>) : {}
  const mode = body.mode === 'queued' ? 'queued' : 'immediate'
  const runId = randomUUID()

  if (mode === 'queued') {
    const { jobId } = await enqueueWorkflowRun({
      workflowId: template.id,
      runId,
      templateId: template.id,
      input,
      triggeredBy: userId,
    })
    return NextResponse.json({ runId, jobId, status: 'queued' }, { status: 202 })
  }

  const startedAt = Date.now()
  const result = await executeScaledWorkflow(template.definition, input)

  const collection = await getWorkflowRunTracesCollection()
  await collection.insertOne({
    workflowId: template.id,
    runId,
    triggeredBy: userId,
    status: result.status,
    nodeExecutionTree: result.nodeExecutionTree,
    executionTime: Date.now() - startedAt,
    errorDetails: result.error,
    createdAt: new Date(),
  })

  return NextResponse.json(
    { runId, status: result.status, steps: result.nodeExecutionTree, error: result.error },
    { status: result.status === 'failed' ? 502 : 200 },
  )
}
