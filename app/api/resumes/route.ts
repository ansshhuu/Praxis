import { NextResponse } from 'next/server'

import { requireResumeAccess } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { toCandidateSummary } from '@/lib/resumes/serialize'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireResumeAccess()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const userId = auth.user.id

  const resumes = await prisma.resume.findMany({
    where: { document: { userId } },
    orderBy: [{ createdAt: 'desc' }, { ranking: 'asc' }],
    include: { document: { select: { fileName: true, fileUrl: true, extractedText: true } } },
  })

  return NextResponse.json({ candidates: resumes.map(toCandidateSummary) })
}
