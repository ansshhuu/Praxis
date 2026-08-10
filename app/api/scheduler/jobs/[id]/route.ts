import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { nextRunFor } from '@/lib/scheduler/cron'
import { jobSelect, toJobPayload } from '@/lib/scheduler/serialize'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

async function findOwnedJob(id: string, userId: string) {
  return prisma.scheduledJob.findFirst({
    where: { id, workflow: { userId } },
    select: { id: true, cronExpr: true, isActive: true },
  })
}

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

  const body = (await request.json().catch(() => ({}))) as { is_active?: unknown }
  if (body.is_active !== undefined && typeof body.is_active !== 'boolean') {
    return NextResponse.json({ error: 'is_active must be a boolean' }, { status: 400 })
  }

  const isActive = typeof body.is_active === 'boolean' ? body.is_active : !job.isActive

  const updated = await prisma.scheduledJob.update({
    where: { id },
    data: {
      isActive,
      ...(isActive ? { nextRun: nextRunFor(job.cronExpr) } : {}),
    },
    select: jobSelect,
  })

  return NextResponse.json({ job: toJobPayload(updated) })
}

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
