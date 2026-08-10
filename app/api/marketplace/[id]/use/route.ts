import type { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const template = await prisma.marketplaceTemplate.findUnique({
    where: { id },
    select: { name: true, workflowJson: true },
  })

  if (!template) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const graph = (template.workflowJson ?? {}) as { nodes?: unknown; edges?: unknown }
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : []
  const edges = Array.isArray(graph.edges) ? graph.edges : []

  const workflow = await prisma.workflow.create({
    data: {
      userId,
      name: `${template.name} (Copy)`,
      nodes: nodes as Prisma.InputJsonValue,
      edges: edges as Prisma.InputJsonValue,
      status: 'DRAFT',
    },
    select: { id: true, name: true, status: true },
  })

  return NextResponse.json({ workflow, id: workflow.id }, { status: 201 })
}
