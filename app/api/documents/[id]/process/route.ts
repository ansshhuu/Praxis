import { NextResponse } from 'next/server'

import { ACTIVITY_ACTIONS } from '@/lib/activity/actions'
import { logActivity } from '@/lib/activity/log'
import { callAI } from '@/lib/ai/ai-router'
import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import {
  PPT_UNSUPPORTED_NOTE,
  SCANNED_PDF_NOTE,
  extractText,
} from '@/lib/documents/extract'
import { toDetail } from '@/lib/documents/serialize'
import { createReadUrl } from '@/lib/storage/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 300

const SUMMARY_INPUT_CHARS = 3000

const MIN_TEXT_FOR_SUMMARY = 40

type RouteContext = { params: Promise<{ id: string }> }

const PLACEHOLDER_TEXTS = new Set([PPT_UNSUPPORTED_NOTE, SCANNED_PDF_NOTE])

function buildSummaryPrompt(text: string): string {
  const truncated = text.length > SUMMARY_INPUT_CHARS
  const excerpt = truncated ? text.slice(0, SUMMARY_INPUT_CHARS) : text

  return [
    truncated
      ? 'Summarise this partial excerpt from the beginning of a document in 2-3 sentences.'
      : 'Summarise this document in 2-3 sentences.',
    'Reply with the summary only — no preamble, no bullet points.',
    '',
    excerpt,
  ].join('\n')
}

export async function POST(_request: Request, { params }: RouteContext) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const existing = await prisma.document.findFirst({
    where: { id, userId },
    select: { id: true, fileType: true, fileUrl: true, storagePath: true, status: true },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  const claimed = await prisma.document.updateMany({
    where: { id, userId, status: { not: 'PROCESSING' } },
    data: { status: 'PROCESSING', statusMessage: null },
  })

  if (claimed.count === 0) {
    return NextResponse.json(
      { error: 'This document is already being processed' },
      { status: 409 },
    )
  }

  let text: string
  try {
    const readUrl = existing.storagePath
      ? await createReadUrl(existing.storagePath)
      : existing.fileUrl
    text = await extractText(readUrl, existing.fileType)
  } catch (error) {
    console.error(`[documents/process] extraction failed for ${id}:`, error)
    const document = await prisma.document.update({
      where: { id },
      data: {
        extractedText: null,
        aiSummary: null,
        status: 'FAILED',
        statusMessage: (error as Error).message.slice(0, 500),
      },
    })
    await logActivity(userId, ACTIVITY_ACTIONS.documentProcessed, {
      documentId: document.id,
      name: document.fileName,
      status: 'FAILED',
      error: (error as Error).message.slice(0, 300),
    })
    return NextResponse.json({ document: toDetail(document) })
  }

  const isPlaceholder = PLACEHOLDER_TEXTS.has(text)
  const summarisable = !isPlaceholder && text.trim().length >= MIN_TEXT_FOR_SUMMARY

  if (!summarisable) {
    const document = await prisma.document.update({
      where: { id },
      data: {
        extractedText: text || null,
        aiSummary: null,
        status: 'PROCESSED',
        statusMessage: isPlaceholder
          ? text
          : 'No readable text found in this document, so no summary was generated.',
      },
    })
    await logActivity(userId, ACTIVITY_ACTIONS.documentProcessed, {
      documentId: document.id,
      name: document.fileName,
      status: 'PROCESSED',
      summarised: false,
    })
    return NextResponse.json({ document: toDetail(document) })
  }

  let summary: string | null = null
  let summaryError: string | null = null
  try {
    summary = (await callAI(buildSummaryPrompt(text))).trim() || null
  } catch (error) {
    console.error(`[documents/process] summary failed for ${id}:`, error)
    summaryError = `AI summary unavailable: ${(error as Error).message}`.slice(0, 500)
  }

  const document = await prisma.document.update({
    where: { id },
    data: {
      extractedText: text,
      aiSummary: summary,
      status: 'PROCESSED',
      statusMessage: summaryError,
    },
  })

  await logActivity(userId, ACTIVITY_ACTIONS.documentProcessed, {
    documentId: document.id,
    name: document.fileName,
    status: 'PROCESSED',
    summarised: Boolean(summary),
  })

  return NextResponse.json({ document: toDetail(document) })
}
