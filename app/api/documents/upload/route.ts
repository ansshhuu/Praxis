import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { toSummary } from '@/lib/documents/serialize'
import { uploadDocument } from '@/lib/storage/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Matches the limit advertised in the upload dropzone. */
const MAX_FILE_BYTES = 50 * 1024 * 1024

const ALLOWED_EXTENSIONS = new Set([
  'pdf',
  'doc',
  'docx',
  'ppt',
  'pptx',
  'xls',
  'xlsx',
  'csv',
  'txt',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'bmp',
  'tiff',
])

function extensionOf(name: string): string {
  const parts = name.toLowerCase().split('.')
  return parts.length > 1 ? parts[parts.length - 1] : ''
}

/**
 * POST /api/documents/upload — stores the file and creates its row.
 *
 * Deliberately does NOT extract text: extraction can take tens of seconds for
 * a scanned image, so the client gets the record back immediately and then
 * calls POST /api/documents/[id]/process.
 */
export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json(
      { error: 'Expected multipart/form-data with a "file" field' },
      { status: 400 },
    )
  }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `File is larger than the ${MAX_FILE_BYTES / 1024 / 1024} MB limit` },
      { status: 413 },
    )
  }

  const extension = extensionOf(file.name)
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return NextResponse.json(
      { error: `Unsupported file type ".${extension || 'unknown'}"` },
      { status: 415 },
    )
  }

  let stored
  try {
    stored = await uploadDocument(userId, file)
  } catch (error) {
    console.error('[documents/upload] storage failed:', error)
    return NextResponse.json({ error: (error as Error).message }, { status: 502 })
  }

  try {
    const document = await prisma.document.create({
      data: {
        userId,
        fileName: file.name,
        fileUrl: stored.publicUrl,
        storagePath: stored.path,
        // Extension rather than the browser-supplied MIME type: browsers omit
        // or mislabel it often enough that the extractor cannot rely on it.
        fileType: extension,
        fileSize: file.size,
        status: 'PENDING',
        tags: [],
      },
    })

    return NextResponse.json({ document: toSummary(document) }, { status: 201 })
  } catch (error) {
    console.error('[documents/upload] db insert failed:', error)
    // Don't leave the object orphaned in the bucket when the row never landed.
    const { removeDocument } = await import('@/lib/storage/supabase')
    await removeDocument(stored.path).catch(() => {})
    return NextResponse.json({ error: 'Could not save the document record' }, { status: 500 })
  }
}
