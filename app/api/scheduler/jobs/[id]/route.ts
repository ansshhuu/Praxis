import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { nextRunFor } from '@/lib/scheduler/cron'
import { jobSelect, toJobPayload } from '@/lib/scheduler/serialize'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

/** Resolves a job id to a job the caller actually owns, via its workflow. */
async function findOwnedJob(id: string, userId: string) {
  return prisma.scheduledJob.findFirst({
    where: { id, workflow: { userId } },
    select: { id: true, cronExpr: true, isActive: true },
  })
}

/**
 * PATCH /api/scheduler/jobs/[id] — pause or resume a job.
 *
 * `is_active` may be given explicitly; omitting it flips the current value,
 * which is what the list's toggle switch does.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const job = await findOwnedJob(id, userId)
  if (!job) {
    return NextResponse.json({ error: 'Scheduled job not found' }, { status: 404 })
  }

  // An empty body is valid here — it means "toggle".
  const body = (await request.json().catch(() => ({}))) as { is_active?: unknown }
  if (body.is_active !== undefined && typeof body.is_active !== 'boolean') {
    return NextResponse.json({ error: 'is_active must be a boolean' }, { status: 400 })
  }

  const isActive = typeof body.is_active === 'boolean' ? body.is_active : !job.isActive

  const updated = await prisma.scheduledJob.update({
    where: { id },
    data: {
      isActive,
      // Resuming a job that sat paused past its fire time would otherwise keep
      // a stale next_run on the record.
      ...(isActive ? { nextRun: nextRunFor(job.cronExpr) } : {}),
    },
    select: jobSelect,
  })

  return NextResponse.json({ job: toJobPayload(updated) })
}

/** DELETE /api/scheduler/jobs/[id] — remove a schedule. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const job = await findOwnedJob(id, userId)
  if (!job) {
    return NextResponse.json({ error: 'Scheduled job not found' }, { status: 404 })
  }

  await prisma.scheduledJob.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
