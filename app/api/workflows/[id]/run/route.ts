import type { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import {
  executeWorkflow,
  type FlowEdge,
  type FlowNode,
} from '@/lib/workflows/engine'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

/**
 * POST /api/workflows/[id]/run — execute the workflow once.
 *
 * Creates a RUNNING workflow_runs row up-front so a crash mid-execution still
 * leaves a trace, then settles it to SUCCESS or FAILED. The engine guarantees
 * at most one AI provider call for the whole run.
 */
export async function POST(request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const workflow = await prisma.workflow.findFirst({ where: { id, userId } })
  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
  }

  // Optional trigger payload; the builder's Run button sends nothing.
  let input: Record<string, unknown> = {}
  try {
    const body = await request.json()
    if (body && typeof body === 'object') input = body as Record<string, unknown>
  } catch {
    // no body — fine
  }

  const nodes = (Array.isArray(workflow.nodes) ? workflow.nodes : []) as unknown as FlowNode[]
  const edges = (Array.isArray(workflow.edges) ? workflow.edges : []) as unknown as FlowEdge[]

  const run = await prisma.workflowRun.create({
    data: {
      workflowId: id,
      status: 'RUNNING',
      input: input as Prisma.InputJsonValue,
      startedAt: new Date(),
    },
  })

  try {
    const result = await executeWorkflow(id, userId, nodes, edges, input)

    const finished = await prisma.workflowRun.update({
      where: { id: run.id },
      data: {
        status: 'SUCCESS',
        output: {
          steps: result.steps,
          aiCalls: result.aiCalls,
          result: result.finalOutput,
        } as unknown as Prisma.InputJsonValue,
        finishedAt: new Date(),
      },
    })

    return NextResponse.json({ run: finished, steps: result.steps, aiCalls: result.aiCalls })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Workflow execution failed'

    const failed = await prisma.workflowRun.update({
      where: { id: run.id },
      data: { status: 'FAILED', error: message, finishedAt: new Date() },
    })

    return NextResponse.json({ run: failed, error: message }, { status: 500 })
  }
}
