import type { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'

import { getCurrentUserId, requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

/** GET /api/marketplace — every published template, for the gallery. */
export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const templates = await prisma.marketplaceTemplate.findMany({
    orderBy: { name: 'asc' },
    // workflowJson is deliberately omitted — the gallery never renders the
    // graph, and /use reads it server-side.
    select: { id: true, name: true, description: true, category: true },
  })

  return NextResponse.json({ templates })
}

/** POST /api/marketplace — publish a template (admin only). */
export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: {
    name?: unknown
    description?: unknown
    category?: unknown
    workflow_json?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const description = typeof body.description === 'string' ? body.description.trim() : ''
  const category = typeof body.category === 'string' ? body.category.trim() : ''

  if (!name || !description || !category) {
    return NextResponse.json(
      { error: 'name, description, and category are required' },
      { status: 400 },
    )
  }

  const workflowJson = body.workflow_json
  if (!workflowJson || typeof workflowJson !== 'object' || Array.isArray(workflowJson)) {
    return NextResponse.json(
      { error: 'workflow_json must be an object with nodes and edges' },
      { status: 400 },
    )
  }

  const { nodes, edges } = workflowJson as { nodes?: unknown; edges?: unknown }
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return NextResponse.json(
      { error: 'workflow_json.nodes and workflow_json.edges must be arrays' },
      { status: 400 },
    )
  }

  const template = await prisma.marketplaceTemplate.create({
    data: {
      name,
      description,
      category,
      workflowJson: workflowJson as Prisma.InputJsonValue,
      createdBy: auth.user.id,
    },
    select: { id: true, name: true, description: true, category: true },
  })

  return NextResponse.json({ template }, { status: 201 })
}
