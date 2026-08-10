import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { toDetail } from '@/lib/meetings/serialize'
import { MEETINGS_BUCKET, removeDocument } from '@/lib/storage/supabase'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const meeting = await prisma.meeting.findFirst({ where: { id, userId } })

  if (!meeting) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
  }

  return NextResponse.json({ meeting: toDetail(meeting) })
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.meeting.findFirst({
    where: { id, userId },
    select: { id: true, storagePath: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
  }

  await prisma.meeting.delete({ where: { id } })

  if (existing.storagePath) {
    await removeDocument(existing.storagePath, MEETINGS_BUCKET).catch(() => {})
  }

  return NextResponse.json({ success: true })
}
