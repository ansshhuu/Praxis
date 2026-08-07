import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { toCandidateDetail } from '@/lib/resumes/serialize'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

/** GET /api/resumes/[id] — full candidate detail including the resume text. */
export async function GET(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const resume = await prisma.resume.findFirst({
    // Ownership lives on the linked document — resumes have no user of their own.
    where: { id, document: { userId } },
    include: { document: { select: { fileName: true, fileUrl: true, extractedText: true } } },
  })

  if (!resume) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
  }

  return NextResponse.json({ candidate: toCandidateDetail(resume) })
}
