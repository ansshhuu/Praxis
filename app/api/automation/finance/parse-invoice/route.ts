import { createHash } from 'node:crypto'

import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { findFinanceRecordByHash, InvoiceParseError, parseInvoice } from '@/lib/automation/finance-service'
import { toClassifiedErrorMessage } from '@/lib/security/error-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 120

const MAX_FILE_BYTES = 15 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

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
    return NextResponse.json({ error: 'File too large - max 15MB' }, { status: 413 })
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Please upload an image (JPG, PNG, or WebP) invoice' },
      { status: 415 },
    )
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const invoiceHash = createHash('sha256').update(buffer).digest('hex')

  const allowDuplicateParam = new URL(request.url).searchParams.get('allowDuplicate')
  if (allowDuplicateParam !== 'true') {
    const existing = await findFinanceRecordByHash(userId, invoiceHash)
    if (existing) {
      return NextResponse.json(
        {
          duplicate: true,
          error: 'This invoice appears to already be uploaded - add anyway?',
          existing: { vendor: existing.vendor, amount: existing.amount, createdAt: existing.createdAt },
        },
        { status: 409 },
      )
    }
  }

  try {
    const invoice = await parseInvoice({ buffer, mimeType: file.type })
    return NextResponse.json({ invoice, invoiceHash })
  } catch (error) {
    const message = toClassifiedErrorMessage(error, 'Failed to parse invoice', (err) => {
      if (err instanceof InvoiceParseError) {
        switch (err.code) {
          case 'ocr_failed':
            return 'Failed to parse invoice: could not read the image'
          case 'ocr_empty':
            return 'Failed to parse invoice: no readable text found - try a clearer photo or scan'
          case 'llm_failed':
            return 'Failed to parse invoice: OCR service timeout'
          case 'unparseable_response':
            return 'Failed to parse invoice: unexpected response format'
        }
      }
      return null
    })
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
