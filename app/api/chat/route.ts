import { NextResponse } from 'next/server'

import { callAI } from '@/lib/ai/ai-router'
import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

const HISTORY_TURNS = 5

const CONTEXT_DOCUMENTS = 3

const SUMMARY_BUDGET = 320

const MAX_MESSAGE_LENGTH = 4000

interface ChatMessagePayload {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
}

function toPayload(message: {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  createdAt: Date
}): ChatMessagePayload {
  return {
    id: message.id,
    role: message.role === 'USER' ? 'user' : 'assistant',
    content: message.content,
    createdAt: message.createdAt.toISOString(),
  }
}

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const messages = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, role: true, content: true, createdAt: true },
  })

  return NextResponse.json({ messages: messages.map(toPayload) })
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { message?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const message = typeof body.message === 'string' ? body.message.trim() : ''
  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `message must be ${MAX_MESSAGE_LENGTH} characters or fewer` },
      { status: 400 },
    )
  }

  const [priorMessages, documents] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: HISTORY_TURNS,
      select: { role: true, content: true },
    }),
    prisma.document.findMany({
      where: { userId, aiSummary: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: CONTEXT_DOCUMENTS,
      select: { fileName: true, aiSummary: true },
    }),
  ])

  const userMessage = await prisma.chatMessage.create({
    data: { userId, role: 'USER', content: message },
    select: { id: true, role: true, content: true, createdAt: true },
  })

  let answer: string
  try {
    answer = await callAI(buildPrompt(message, priorMessages.reverse(), documents))
  } catch (error) {
    console.error('[chat] AI call failed:', error)
    return NextResponse.json(
      {
        error: (error as Error).message || 'The assistant is unavailable right now.',
        userMessage: toPayload(userMessage),
      },
      { status: 502 },
    )
  }

  const assistantMessage = await prisma.chatMessage.create({
    data: { userId, role: 'ASSISTANT', content: answer },
    select: { id: true, role: true, content: true, createdAt: true },
  })

  return NextResponse.json(
    {
      userMessage: toPayload(userMessage),
      assistantMessage: toPayload(assistantMessage),
    },
    { status: 201 },
  )
}

function buildPrompt(
  message: string,
  history: { role: 'USER' | 'ASSISTANT'; content: string }[],
  documents: { fileName: string; aiSummary: string | null }[],
): string {
  const sections: string[] = [
    'You are the built-in assistant for EAWMP, an enterprise workflow and document automation platform.',
    'You help the user with their documents, workflows, resume screenings, reports and platform data.',
    'Answer in plain prose, at most a short paragraph or a few bullet points. Use **bold** for key figures.',
    'If the answer depends on data you have not been given, say so plainly instead of guessing.',
  ]

  if (documents.length) {
    const context = documents
      .map((doc) => `- ${doc.fileName}: ${(doc.aiSummary ?? '').slice(0, SUMMARY_BUDGET)}`)
      .join('\n')
    sections.push(
      `The user has recently uploaded these documents. Reference them only if they are relevant to the question:\n${context}`,
    )
  } else {
    sections.push('The user has no processed documents yet.')
  }

  if (history.length) {
    const transcript = history
      .map((turn) => `${turn.role === 'USER' ? 'User' : 'Assistant'}: ${turn.content}`)
      .join('\n')
    sections.push(`Recent conversation:\n${transcript}`)
  }

  sections.push(`User's new message: ${message}`)
  sections.push('Reply as the assistant. Do not prefix your reply with "Assistant:".')

  return sections.join('\n\n')
}
