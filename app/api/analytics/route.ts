import { NextResponse } from 'next/server'

import { buildAnalytics } from '@/lib/analytics/aggregate'
import { getCurrentUserId } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const analytics = await buildAnalytics(userId)
  return NextResponse.json({ analytics })
}
