import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { parseInvoice } from '@/lib/automation/finance-service'
import { toSafeErrorMessage } from '@/lib/security/error-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 120

const MAX_FILE_BYTES = 15 * 1024 * 1024

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
      { error: 'Expected multipart/form-data with an "invoice" file' },
      { status: 400 },
    )
  }

  const file = form.get('invoice')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'No invoice file provided' }, { status: 400 })
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'File exceeds the 15 MB limit' }, { status: 413 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    const invoice = await parseInvoice({ buffer, mimeType: file.type || 'image/png' })
    return NextResponse.json({ invoice })
  } catch (error) {
    return NextResponse.json(
      { error: toSafeErrorMessage(error, 'Failed to parse invoice') },
      { status: 502 },
    )
  }
}
