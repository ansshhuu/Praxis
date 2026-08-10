import { NextResponse } from 'next/server'

import { ACTIVITY_ACTIONS } from '@/lib/activity/actions'
import { logActivity } from '@/lib/activity/log'
import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const workflows = await prisma.workflow.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, name: true, status: true, updatedAt: true },
  })

  return NextResponse.json({ workflows })
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { name?: unknown; nodes?: unknown; edges?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : null
  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }
  if (!Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
    return NextResponse.json(
      { error: 'nodes and edges must be arrays' },
      { status: 400 },
    )
  }

  const workflow = await prisma.workflow.create({
    data: {
      userId,
      name,
      nodes: body.nodes,
      edges: body.edges,
      status: 'DRAFT',
    },
  })

  await logActivity(userId, ACTIVITY_ACTIONS.workflowCreated, {
    workflowId: workflow.id,
    name: workflow.name,
    nodeCount: body.nodes.length,
  })

  return NextResponse.json({ workflow }, { status: 201 })
}
