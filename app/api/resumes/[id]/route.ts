import { NextResponse } from 'next/server'

import { requireResumeAccess } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { toCandidateDetail } from '@/lib/resumes/serialize'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const auth = await requireResumeAccess()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }
  const userId = auth.user.id

  const { id } = await params
  const resume = await prisma.resume.findFirst({
    where: { id, document: { userId } },
    include: { document: { select: { fileName: true, fileUrl: true, extractedText: true } } },
  })

  if (!resume) {
    return NextResponse.json({ error: 'Candidate not found' }, { status: 404 })
  }

  return NextResponse.json({ candidate: toCandidateDetail(resume) })
}
