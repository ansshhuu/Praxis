import { NextResponse } from 'next/server'

import { rankCandidates } from '@/lib/automation/hr-service'
import { getCurrentUserId } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { candidates?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!Array.isArray(body.candidates)) {
    return NextResponse.json({ error: 'candidates must be an array' }, { status: 400 })
  }

  const matches = (body.candidates as unknown[])
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
    .map((entry) => ({
      candidateId: typeof entry.candidateId === 'string' ? entry.candidateId : '',
      name: typeof entry.name === 'string' ? entry.name : '',
      score: typeof entry.score === 'number' ? entry.score : 0,
    }))
    .filter((match) => match.candidateId)

  const ranked = rankCandidates(matches)
  return NextResponse.json({ candidates: ranked })
}
