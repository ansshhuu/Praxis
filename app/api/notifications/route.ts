import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

/**
 * GET /api/notifications — the caller's notification log, newest first.
 *
 * Rows are written by the workflow engine's NOTIFY node
 * (`lib/workflows/engine.ts`), so an account that has never run a workflow
 * with a Notify node sees an empty list.
 */
export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, type: true, message: true, status: true, createdAt: true },
  })

  return NextResponse.json({ notifications })
}
