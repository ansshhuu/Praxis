import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { toDetail } from '@/lib/documents/serialize'
import { createReadUrl, removeDocument } from '@/lib/storage/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ id: string }> }

/** GET /api/documents/[id] — full detail including extracted text + summary. */
export async function GET(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const document = await prisma.document.findFirst({ where: { id, userId } })

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  const detail = toDetail(document)

  // Hand back a signed URL when we can, so the link works whether or not the
  // bucket is public. Falls back to the stored URL if signing is unavailable.
  if (document.storagePath) {
    try {
      detail.fileUrl = await createReadUrl(document.storagePath)
    } catch (error) {
      console.error(`[documents/${id}] could not sign file URL:`, error)
    }
  }

  return NextResponse.json({ document: detail })
}

/** DELETE /api/documents/[id] — removes the stored object and the row. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const document = await prisma.document.findFirst({
    where: { id, userId },
    select: { id: true, storagePath: true },
  })

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  // Storage first: an orphaned row is recoverable, an orphaned object is not
  // discoverable. `removeDocument` logs rather than throws on a missing object.
  if (document.storagePath) {
    await removeDocument(document.storagePath).catch((error) => {
      console.error(`[documents/${id}] storage delete failed:`, error)
    })
  }

  await prisma.document.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
