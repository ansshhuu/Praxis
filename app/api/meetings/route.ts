import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { toSummary } from '@/lib/meetings/serialize'

export const dynamic = 'force-dynamic'

const summarySelect = {
  id: true,
  fileName: true,
  createdAt: true,
  status: true,
  statusMessage: true,
  durationSeconds: true,
  attendees: true,
  summary: true,
  transcript: true,
  actionItems: true,
} as const

/** GET /api/meetings — the caller's meetings, newest first. */
export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const meetings = await prisma.meeting.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: summarySelect,
  })

  return NextResponse.json({ meetings: meetings.map(toSummary) })
}

/**
 * POST /api/meetings — create a transcript-only meeting (no audio).
 *
 * The entry point for the "paste a transcript instead" flow: it mints the row
 * that POST /api/meetings/[id]/manual-transcript then analyses. Audio-backed
 * meetings come from /api/meetings/upload instead.
 */
export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { name?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const meeting = await prisma.meeting.create({
    data: {
      userId,
      fileName: name.slice(0, 200),
      // No audio object behind a pasted transcript.
      fileUrl: '',
      storagePath: null,
      status: 'PENDING',
      attendees: [],
    },
  })

  return NextResponse.json({ meeting: toSummary(meeting) }, { status: 201 })
}
