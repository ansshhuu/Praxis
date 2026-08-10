import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { buildDashboard } from '@/lib/dashboard/aggregate'
import {
  ACTIVITY_MAX,
  ACTIVITY_PAGE_SIZE,
  isDashboardRange,
  type DashboardRange,
} from '@/lib/dashboard/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)

  const rawRange = searchParams.get('range')
  const range: DashboardRange = isDashboardRange(rawRange) ? (Number(rawRange) as DashboardRange) : 7

  const rawPage = Number(searchParams.get('runsPage'))
  const runsPage = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1

  const rawActivity = Number(searchParams.get('activityLimit'))
  const activityLimit =
    Number.isFinite(rawActivity) && rawActivity >= ACTIVITY_PAGE_SIZE
      ? Math.min(Math.floor(rawActivity), ACTIVITY_MAX)
      : ACTIVITY_PAGE_SIZE

  const dashboard = await buildDashboard(userId, { range, runsPage, activityLimit })
  return NextResponse.json({ dashboard })
}
