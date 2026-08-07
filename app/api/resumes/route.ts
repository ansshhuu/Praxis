import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { toCandidateSummary } from '@/lib/resumes/serialize'

export const dynamic = 'force-dynamic'

/**
 * GET /api/resumes — every candidate the user has screened, ranked.
 *
 * Newest screening first, then rank within it: each screening numbers its own
 * candidates from 1, so ordering by rank alone would interleave batches.
 * `screeningId` is included so the client can show just the latest run.
 */
export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resumes = await prisma.resume.findMany({
    where: { document: { userId } },
    orderBy: [{ createdAt: 'desc' }, { ranking: 'asc' }],
    include: { document: { select: { fileName: true, fileUrl: true, extractedText: true } } },
  })

  return NextResponse.json({ candidates: resumes.map(toCandidateSummary) })
}
