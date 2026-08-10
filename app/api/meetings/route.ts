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
      fileUrl: '',
      storagePath: null,
      status: 'PENDING',
      attendees: [],
    },
  })

  return NextResponse.json({ meeting: toSummary(meeting) }, { status: 201 })
}
