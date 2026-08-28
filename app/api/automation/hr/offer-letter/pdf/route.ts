import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { NextResponse } from 'next/server'

import { requireResumeAccess } from '@/lib/auth/session'
import { toSafeErrorMessage } from '@/lib/security/error-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89
const MARGIN = 64

function toWinAnsi(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–-]/g, '-')
    .replace(/…/g, '...')
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, '?')
}

export async function POST(request: Request) {
  const auth = await requireResumeAccess()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: { letter?: unknown; candidateName?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const letter = typeof body.letter === 'string' ? body.letter.trim() : ''
  const candidateName = typeof body.candidateName === 'string' ? body.candidateName.trim() : 'candidate'
  if (!letter) {
    return NextResponse.json({ error: 'letter is required' }, { status: 400 })
  }

  try {
    const pdf = await PDFDocument.create()
    const font = await pdf.embedFont(StandardFonts.TimesRoman)
    const contentWidth = PAGE_WIDTH - MARGIN * 2
    const size = 11
    const lineHeight = size * 1.5

    let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    let y = PAGE_HEIGHT - MARGIN

    function ensureSpace(needed: number) {
      if (y - needed >= MARGIN) return
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      y = PAGE_HEIGHT - MARGIN
    }

    for (const paragraph of letter.split(/\n+/)) {
      const text = toWinAnsi(paragraph.trim())
      if (!text) {
        ensureSpace(lineHeight)
        y -= lineHeight
        continue
      }
      const words = text.split(/\s+/)
      let line = ''
      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word
        if (font.widthOfTextAtSize(candidate, size) <= contentWidth) {
          line = candidate
        } else {
          ensureSpace(lineHeight)
          y -= lineHeight
          page.drawText(line, { x: MARGIN, y, size, font, color: rgb(0.1, 0.1, 0.12) })
          line = word
        }
      }
      if (line) {
        ensureSpace(lineHeight)
        y -= lineHeight
        page.drawText(line, { x: MARGIN, y, size, font, color: rgb(0.1, 0.1, 0.12) })
      }
      ensureSpace(lineHeight)
      y -= lineHeight * 0.5
    }

    const bytes = await pdf.save()
    const fileName = `offer-letter-${candidateName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'candidate'}.pdf`

    return new NextResponse(bytes as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: toSafeErrorMessage(error, 'Could not generate the offer letter PDF') },
      { status: 500 },
    )
  }
}
