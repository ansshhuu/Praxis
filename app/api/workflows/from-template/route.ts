import type { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'

import { ACTIVITY_ACTIONS } from '@/lib/activity/actions'
import { logActivity } from '@/lib/activity/log'
import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { getWorkflowTemplateById } from '@/lib/workflow/templates'
import { convertTemplateToVisual } from '@/lib/workflow/templates/to-visual'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { templateId?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const templateId = typeof body.templateId === 'string' ? body.templateId : null
  if (!templateId) {
    return NextResponse.json({ error: 'templateId is required' }, { status: 400 })
  }

  const template = getWorkflowTemplateById(templateId)
  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const { nodes, edges } = convertTemplateToVisual(template.definition)

  const workflow = await prisma.workflow.create({
    data: {
      userId,
      name: template.name,
      nodes: nodes as unknown as Prisma.InputJsonValue,
      edges: edges as unknown as Prisma.InputJsonValue,
      status: 'DRAFT',
    },
  })

  await logActivity(userId, ACTIVITY_ACTIONS.workflowCreated, {
    workflowId: workflow.id,
    name: workflow.name,
    nodeCount: nodes.length,
    fromTemplateId: template.id,
  })

  return NextResponse.json({ workflow }, { status: 201 })
}
