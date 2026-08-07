import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { toSummary } from '@/lib/documents/serialize'

export const dynamic = 'force-dynamic'

/**
 * GET /api/documents — the logged-in user's documents, newest first.
 *
 * Metadata only: `extracted_text` is deliberately not selected so a list of
 * large documents doesn't ship megabytes to the table view.
 */
export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rows = await prisma.document.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      fileName: true,
      fileType: true,
      fileSize: true,
      createdAt: true,
      status: true,
      statusMessage: true,
      aiSummary: true,
    },
  })

  return NextResponse.json({ documents: rows.map(toSummary) })
}
