import { NextResponse } from 'next/server'

import { planFollowUp } from '@/lib/automation/crm-service'
import { getCurrentUserId } from '@/lib/auth/session'
import type { QualificationBand } from '@/lib/models/mongodb/crm-leads'

export const dynamic = 'force-dynamic'

const VALID_BANDS: QualificationBand[] = ['hot', 'warm', 'cold']

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { band?: unknown; lastContactedAt?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const band = VALID_BANDS.find((value) => value === body.band)
  if (!band) {
    return NextResponse.json({ error: 'band must be one of hot, warm, cold' }, { status: 400 })
  }

  const lastContactedAt =
    typeof body.lastContactedAt === 'string' && !Number.isNaN(Date.parse(body.lastContactedAt))
      ? new Date(body.lastContactedAt)
      : new Date()

  const plan = planFollowUp(band, lastContactedAt)
  return NextResponse.json({ plan })
}
