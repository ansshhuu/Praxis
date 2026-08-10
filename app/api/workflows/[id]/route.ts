import { WorkflowStatus } from '@prisma/client'
import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const workflow = await prisma.workflow.findFirst({
    where: { id, userId },
    select: {
      id: true,
      name: true,
      status: true,
      nodes: true,
      edges: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
  }

  return NextResponse.json({ workflow })
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.workflow.findFirst({
    where: { id, userId },
    select: { id: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
  }

  let body: { name?: unknown; nodes?: unknown; edges?: unknown; status?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'name must be a non-empty string' }, { status: 400 })
    }
    data.name = body.name.trim()
  }

  if (body.nodes !== undefined) {
    if (!Array.isArray(body.nodes)) {
      return NextResponse.json({ error: 'nodes must be an array' }, { status: 400 })
    }
    data.nodes = body.nodes
  }

  if (body.edges !== undefined) {
    if (!Array.isArray(body.edges)) {
      return NextResponse.json({ error: 'edges must be an array' }, { status: 400 })
    }
    data.edges = body.edges
  }

  if (body.status !== undefined) {
    const status = String(body.status).toUpperCase()
    if (!(status in WorkflowStatus)) {
      return NextResponse.json(
        { error: `status must be one of ${Object.keys(WorkflowStatus).join(', ')}` },
        { status: 400 },
      )
    }
    data.status = status as WorkflowStatus
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 })
  }

  const workflow = await prisma.workflow.update({ where: { id }, data })

  return NextResponse.json({ workflow })
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.workflow.findFirst({
    where: { id, userId },
    select: { id: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
  }

  await prisma.workflow.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
