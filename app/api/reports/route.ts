import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { toReportSummary } from '@/lib/reports/serialize'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reports = await prisma.report.findMany({
    where: { userId },
    orderBy: { generatedAt: 'desc' },
    select: {
      id: true,
      type: true,
      fileUrl: true,
      generatedAt: true,
      user: { select: { name: true } },
    },
  })

  return NextResponse.json({ reports: reports.map(toReportSummary) })
}
