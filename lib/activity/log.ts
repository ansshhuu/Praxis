import type { Prisma } from '@prisma/client'

import { prisma } from '@/lib/db/prisma'
import type { ActivityAction, ActivityMeta } from '@/lib/activity/actions'

export async function logActivity(
  userId: string,
  action: ActivityAction,
  meta: ActivityMeta = {},
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: { userId, action, meta: meta as Prisma.InputJsonValue },
    })
  } catch (error) {
    console.error(`[activity] failed to log "${action}":`, error)
  }
}
