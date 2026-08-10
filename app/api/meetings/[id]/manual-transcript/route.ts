import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { MIN_TRANSCRIPT_CHARS } from '@/lib/meetings/analyze'
import { analyzeAndSave } from '@/lib/meetings/process'
import { toDetail } from '@/lib/meetings/serialize'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

const MAX_TRANSCRIPT_CHARS = 200_000

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: { transcript?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const transcript = typeof body.transcript === 'string' ? body.transcript.trim() : ''
  if (transcript.length < MIN_TRANSCRIPT_CHARS) {
    return NextResponse.json(
      {
        error: `Paste a longer transcript — at least ${MIN_TRANSCRIPT_CHARS} characters are needed to analyse it.`,
      },
      { status: 400 },
    )
  }
  if (transcript.length > MAX_TRANSCRIPT_CHARS) {
    return NextResponse.json(
      { error: `Transcript is longer than the ${MAX_TRANSCRIPT_CHARS.toLocaleString()} character limit` },
      { status: 413 },
    )
  }

  const existing = await prisma.meeting.findFirst({
    where: { id, userId },
    select: { id: true },
  })
  if (!existing) {
    return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
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

  const meeting = await analyzeAndSave(id, transcript)
  return NextResponse.json({ meeting: toDetail(meeting) })
}
