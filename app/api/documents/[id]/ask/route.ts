import { NextResponse } from 'next/server'

import { callAI } from '@/lib/ai/ai-router'
import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { toSafeErrorMessage } from '@/lib/security/error-handler'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_CONTEXT_CHARS = 6000

const MAX_QUESTION_CHARS = 500

type RouteContext = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { question?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const question =
    typeof body.question === 'string' ? body.question.trim().slice(0, MAX_QUESTION_CHARS) : ''
  if (!question) {
    return NextResponse.json({ error: 'question must be a non-empty string' }, { status: 400 })
  }

  const { id } = await params
  const document = await prisma.document.findFirst({
    where: { id, userId },
    select: { fileName: true, extractedText: true, aiSummary: true, status: true },
  })

  if (!document) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  const extracted = document.extractedText?.trim() ?? ''
  const summary = document.aiSummary?.trim() ?? ''

  let context: string
  let contextKind: 'text' | 'summary' | 'excerpt'
  if (extracted && extracted.length <= MAX_CONTEXT_CHARS) {
    context = extracted
    contextKind = 'text'
  } else if (summary) {
    context = summary
    contextKind = 'summary'
  } else if (extracted) {
    context = extracted.slice(0, MAX_CONTEXT_CHARS)
    contextKind = 'excerpt'
  } else {
    return NextResponse.json(
      {
        error:
          document.status === 'FAILED'
            ? 'Text extraction failed for this document, so it cannot answer questions.'
            : 'This document has no extracted text yet — process it first.',
      },
      { status: 409 },
    )
  }

  const contextLabel = {
    text: 'Document text',
    summary: 'Document summary (the full text was too long to include)',
    excerpt: 'Excerpt from the start of the document',
  }[contextKind]

  const prompt = [
    `Answer the question using only the document context below. If the answer is not in the context, say so plainly.`,
    `Be direct and concise — no preamble.`,
    '',
    `Document: ${document.fileName}`,
    `${contextLabel}:`,
    context,
    '',
    `Question: ${question}`,
  ].join('\n')

  try {
    const answer = await callAI(prompt, userId)
    return NextResponse.json({ answer: answer.trim(), contextKind })
  } catch (error) {
    return NextResponse.json(
      { error: toSafeErrorMessage(error, 'Failed to answer the question') },
      { status: 502 },
    )
  }
}
