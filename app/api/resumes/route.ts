import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { toCandidateSummary } from '@/lib/resumes/serialize'

export const dynamic = 'force-dynamic'

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
