import { NextResponse } from 'next/server'

import { ACTIVITY_ACTIONS } from '@/lib/activity/actions'
import { logActivity } from '@/lib/activity/log'
import { callAI } from '@/lib/ai/ai-router'
import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { collectReportData, summarizeForPrompt } from '@/lib/reports/data'
import { generateReportFile, isReportFormat } from '@/lib/reports/generate'
import { buildReportFileName, isReportType, toReportSummary } from '@/lib/reports/serialize'
import { uploadDocument } from '@/lib/storage/supabase'

export const dynamic = 'force-dynamic'

const REPORTS_FOLDER = 'reports'

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { type?: unknown; format?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!isReportType(body.type)) {
    return NextResponse.json(
      { error: 'type must be one of EMPLOYEE, WORKFLOW, SALES, HR, AI_USAGE' },
      { status: 400 },
    )
  }
  if (!isReportFormat(body.format)) {
    return NextResponse.json(
      { error: 'format must be one of PDF, WORD, EXCEL' },
      { status: 400 },
    )
  }

  const { type, format } = body
  const generatedAt = new Date()

  const data = await collectReportData(type, userId)

  let aiSummary: string
  try {
    aiSummary = await callAI(buildSummaryPrompt(summarizeForPrompt(data)))
  } catch (error) {
    console.error('[reports] AI summary failed:', error)
    return NextResponse.json(
      {
        error: `Could not generate the report summary — ${(error as Error).message}`,
      },
      { status: 502 },
    )
  }

  let fileUrl: string
  try {
    const file = await generateReportFile(format, data, aiSummary, generatedAt)
    const uploaded = await uploadDocument(
      userId,
      new File([file.bytes as BlobPart], buildReportFileName(type, format, generatedAt), {
        type: file.mimeType,
      }),
      REPORTS_FOLDER,
    )
    fileUrl = uploaded.publicUrl
  } catch (error) {
    console.error('[reports] file generation or upload failed:', error)
    return NextResponse.json(
      { error: `Could not save the report file — ${(error as Error).message}` },
      { status: 500 },
    )
  }

  const report = await prisma.report.create({
    data: { userId, type, fileUrl, generatedAt },
    select: {
      id: true,
      type: true,
      fileUrl: true,
      generatedAt: true,
      user: { select: { name: true } },
    },
  })

  await logActivity(userId, ACTIVITY_ACTIONS.reportGenerated, {
    reportId: report.id,
    type,
    format,
    fileUrl: report.fileUrl,
  })

  return NextResponse.json({ report: toReportSummary(report) }, { status: 201 })
}

function buildSummaryPrompt(digest: string): string {
  return [
    'You are writing the "Summary & Insights" section of a business report for an enterprise workflow platform.',
    'Below is the real data collected for this report.',
    '',
    digest,
    '',
    'Write 2-4 short paragraphs of plain prose summarising what this data shows and what stands out.',
    'Reference the actual figures. If the data is empty or sparse, say so directly rather than padding.',
    'Respect any caveat given above. Do not invent numbers, do not use markdown, and do not add a heading.',
  ].join('\n')
}
