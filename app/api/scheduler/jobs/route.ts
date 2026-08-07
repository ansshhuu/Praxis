import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { validateCron } from '@/lib/scheduler/cron'
import { jobSelect, toJobPayload } from '@/lib/scheduler/serialize'

export const dynamic = 'force-dynamic'

/**
 * GET /api/scheduler/jobs — schedules for workflows the user owns.
 *
 * `scheduled_jobs` has no user column, so ownership is enforced through the
 * workflow relation on every read and write in this module.
 */
export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const jobs = await prisma.scheduledJob.findMany({
    where: { workflow: { userId } },
    orderBy: { nextRun: 'asc' },
    select: jobSelect,
  })

  return NextResponse.json({ jobs: jobs.map(toJobPayload) })
}

/** POST /api/scheduler/jobs — schedule one of the user's workflows. */
export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { workflow_id?: unknown; cron_expr?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const workflowId = typeof body.workflow_id === 'string' ? body.workflow_id.trim() : ''
  const cronExpr = typeof body.cron_expr === 'string' ? body.cron_expr.trim() : ''

  if (!workflowId) {
    return NextResponse.json({ error: 'workflow_id is required' }, { status: 400 })
  }

  const validation = validateCron(cronExpr)
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  // Scoped to the caller so a valid id belonging to someone else reads as 404.
  const workflow = await prisma.workflow.findFirst({
    where: { id: workflowId, userId },
    select: { id: true },
  })
  if (!workflow) {
    return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
  }

  const created = await prisma.scheduledJob.create({
    data: {
      workflowId,
      cronExpr: cronExpr.replace(/\s+/g, ' '),
      nextRun: validation.nextRun,
      isActive: true,
    },
    select: jobSelect,
  })

  return NextResponse.json({ job: toJobPayload(created) }, { status: 201 })
}
