import { NextResponse } from 'next/server'

import { findAvailableSlots, scheduleMeeting } from '@/lib/automation/marketing-service'
import { getCurrentUserId } from '@/lib/auth/session'
import { toSafeErrorMessage } from '@/lib/security/error-handler'

export const dynamic = 'force-dynamic'

interface RawSlot {
  start?: unknown
  end?: unknown
}

function parseSlot(entry: unknown): { start: Date; end: Date } | null {
  if (!entry || typeof entry !== 'object') return null
  const raw = entry as RawSlot
  if (typeof raw.start !== 'string' || typeof raw.end !== 'string') return null
  const start = new Date(raw.start)
  const end = new Date(raw.end)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  return { start, end }
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    title?: unknown
    attendees?: unknown
    busySlots?: unknown
    workingHours?: unknown
    durationMinutes?: unknown
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  const attendees = Array.isArray(body.attendees)
    ? body.attendees.filter((entry): entry is string => typeof entry === 'string')
    : []

  const workingHours = parseSlot(body.workingHours)
  if (!workingHours) {
    return NextResponse.json(
      { error: 'workingHours must be an object with ISO "start" and "end" strings' },
      { status: 400 },
    )
  }

  const busySlots = Array.isArray(body.busySlots)
    ? body.busySlots.map(parseSlot).filter((slot): slot is { start: Date; end: Date } => slot !== null)
    : []

  const durationMinutes =
    typeof body.durationMinutes === 'number' && body.durationMinutes > 0 ? body.durationMinutes : 30

  const available = findAvailableSlots(busySlots, workingHours, durationMinutes)
  if (available.length === 0) {
    return NextResponse.json({ error: 'No available slots found in the given window' }, { status: 409 })
  }

  const chosen = available[0]

  try {
    const event = await scheduleMeeting({
      userId,
      title,
      attendees,
      startsAt: chosen.start,
      endsAt: new Date(chosen.start.getTime() + durationMinutes * 60 * 1000),
    })
    return NextResponse.json({ event, alternativeSlots: available.slice(1, 4) }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: toSafeErrorMessage(error, 'Failed to schedule meeting') },
      { status: 502 },
    )
  }
}
