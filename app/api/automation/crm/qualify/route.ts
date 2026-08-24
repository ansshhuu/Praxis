import { NextResponse } from 'next/server'

import { calculateQualificationScore } from '@/lib/automation/crm-service'
import { getCurrentUserId } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { budget?: unknown; timelineDays?: unknown; fitNotes?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const budget = typeof body.budget === 'number' ? body.budget : 0
  const timelineDays = typeof body.timelineDays === 'number' ? body.timelineDays : 30
  const fitNotes = typeof body.fitNotes === 'string' ? body.fitNotes : ''

  const qualification = calculateQualificationScore({ budget, timelineDays, fitNotes })
  return NextResponse.json({ qualification })
}
