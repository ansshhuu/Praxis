import { NextResponse } from 'next/server'

import { ACTIVITY_ACTIONS } from '@/lib/activity/actions'
import { logActivity } from '@/lib/activity/log'
import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { analyzeAndSave } from '@/lib/meetings/process'
import { toDetail } from '@/lib/meetings/serialize'
import { transcribeAudio } from '@/lib/meetings/transcribe'
import { MEETINGS_BUCKET, createReadUrl } from '@/lib/storage/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.meeting.findFirst({
    where: { id, userId },
    select: { id: true, fileUrl: true, storagePath: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
  }

  if (!existing.storagePath && !existing.fileUrl) {
    return NextResponse.json(
      { error: 'This meeting has no audio — paste a transcript instead' },
      { status: 400 },
    )
  }

  const claimed = await prisma.meeting.updateMany({
    where: { id, userId, status: { not: 'TRANSCRIBING' } },
    data: { status: 'TRANSCRIBING', statusMessage: null },
  })

  if (claimed.count === 0) {
    return NextResponse.json(
      { error: 'This meeting is already being processed' },
      { status: 409 },
    )
  }

  let transcript: string
  try {
    const readUrl = existing.storagePath
      ? await createReadUrl(existing.storagePath, MEETINGS_BUCKET)
      : existing.fileUrl
    transcript = await transcribeAudio(readUrl)
  } catch (error) {
    console.error(`[meetings/process] transcription failed for ${id}:`, error)
    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        status: 'FAILED',
        statusMessage: (error as Error).message.slice(0, 500),
      },
    })
    await logActivity(userId, ACTIVITY_ACTIONS.meetingProcessed, {
      meetingId: meeting.id,
      name: meeting.fileName,
      status: 'FAILED',
      error: (error as Error).message.slice(0, 300),
    })
    return NextResponse.json({ meeting: toDetail(meeting) })
  }

  await prisma.meeting.update({ where: { id }, data: { transcript } })

  const meeting = await analyzeAndSave(id, transcript)

  await logActivity(userId, ACTIVITY_ACTIONS.meetingProcessed, {
    meetingId: meeting.id,
    name: meeting.fileName,
    status: meeting.status,
    actionItems: Array.isArray(meeting.actionItems) ? meeting.actionItems.length : null,
  })

  return NextResponse.json({ meeting: toDetail(meeting) })
}
