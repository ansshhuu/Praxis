import { NextResponse } from 'next/server'

import { buildAnalytics } from '@/lib/analytics/aggregate'
import { getCurrentUserId } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/analytics — aggregated platform metrics for the signed-in user.
 *
 * Pure database aggregation: no AI call belongs on this path, since every
 * figure is a count or a percentile over rows the other modules already wrote.
 */
export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const analytics = await buildAnalytics(userId)
  return NextResponse.json({ analytics })
}
