import { ObjectId } from 'mongodb'

import { applyGuardrails } from '@/lib/ai/guardrails'
import { generateText } from '@/lib/ai/llm-gateway'
import {
  getSupportTicketsCollection,
  type SupportTicket,
  type TicketUrgency,
} from '@/lib/models/mongodb/support-tickets'

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  billing: ['invoice', 'charge', 'payment', 'refund', 'subscription', 'billing'],
  technical: ['error', 'bug', 'crash', 'not working', 'broken', 'issue', 'fail'],
  account: ['login', 'password', 'account', 'access', 'locked'],
  feature: ['feature', 'request', 'suggestion', 'idea'],
}

export function classifyTicketCategory(text: string): string {
  const lower = text.toLowerCase()
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) return category
  }
  return 'general'
}

const POSITIVE_WORDS = ['thank', 'great', 'love', 'awesome', 'happy', 'excellent', 'appreciate']
const NEGATIVE_WORDS = [
  'angry',
  'terrible',
  'awful',
  'hate',
  'worst',
  'disappointed',
  'frustrat',
  'unacceptable',
  'furious',
]

export interface SentimentResult {
  score: number
  label: 'positive' | 'neutral' | 'negative'
}

export function computeSentimentScore(text: string): SentimentResult {
  const lower = text.toLowerCase()
  const positiveHits = POSITIVE_WORDS.filter((word) => lower.includes(word)).length
  const negativeHits = NEGATIVE_WORDS.filter((word) => lower.includes(word)).length
  const raw = positiveHits - negativeHits
  const score = Math.max(-1, Math.min(1, raw / 3))
  const label = score > 0.15 ? 'positive' : score < -0.15 ? 'negative' : 'neutral'
  return { score, label }
}

const CRITICAL_WORDS = ['outage', 'down', 'emergency', 'critical', 'all users affected', 'system down', 'unusable', 'data loss']
const HIGH_URGENCY_WORDS = ['urgent', 'asap', 'immediately', 'blocked', 'blocking', 'cannot access', "can't access", 'unable to access']

/**
 * Urgency is a measure of how time-critical the underlying issue is, kept
 * independent of sentiment — a calmly-worded outage report is still critical,
 * and an angry but low-stakes complaint isn't. Sentiment only escalates a
 * tie (medium) up one level, never overrides an explicit severity signal.
 */
export function computeUrgency(text: string, sentiment: SentimentResult): TicketUrgency {
  const lower = text.toLowerCase()
  const hasCriticalWord = CRITICAL_WORDS.some((word) => lower.includes(word))
  const hasHighWord = HIGH_URGENCY_WORDS.some((word) => lower.includes(word))

  if (hasCriticalWord) return 'critical'
  if (hasHighWord) return 'high'
  if (sentiment.label === 'negative') return 'medium'
  return 'low'
}

export interface ClassifyTicketInput {
  subject: string
  message: string
}

export interface IngestTicketInput extends ClassifyTicketInput {
  userId: string
}

export interface ClassifyTicketResult {
  category: string
  sentiment: SentimentResult
  urgency: TicketUrgency
  escalate: boolean
}

export function classifyTicket(input: ClassifyTicketInput): ClassifyTicketResult {
  const combined = `${input.subject} ${input.message}`
  const category = classifyTicketCategory(combined)
  const sentiment = computeSentimentScore(combined)
  const urgency = computeUrgency(combined, sentiment)
  const escalate = urgency === 'critical' || (urgency === 'high' && sentiment.label === 'negative')
  return { category, sentiment, urgency, escalate }
}

export class TicketIngestError extends Error {
  constructor(public readonly code: 'classification_failed' | 'db_insert_failed', message: string) {
    super(message)
    this.name = 'TicketIngestError'
  }
}

export async function ingestTicket(input: IngestTicketInput): Promise<SupportTicket> {
  let classification: ClassifyTicketResult
  try {
    classification = classifyTicket(input)
  } catch (error) {
    throw new TicketIngestError('classification_failed', `Ticket classification failed: ${(error as Error).message}`)
  }

  const ticket: SupportTicket = {
    userId: input.userId,
    orgId: input.userId,
    subject: input.subject,
    message: applyGuardrails(input.message).sanitizedText,
    category: classification.category,
    sentimentScore: classification.sentiment.score,
    sentimentLabel: classification.sentiment.label,
    urgency: classification.urgency,
    escalate: classification.escalate,
    status: classification.escalate ? 'escalated' : 'open',
    reply: null,
    replyStatus: 'none',
    createdAt: new Date(),
  }

  try {
    const collection = await getSupportTicketsCollection()
    const result = await collection.insertOne(ticket)
    return { ...ticket, _id: result.insertedId }
  } catch (error) {
    throw new TicketIngestError('db_insert_failed', `Failed to save ticket: ${(error as Error).message}`)
  }
}

export interface GenerateReplyOptions {
  subject: string
  message: string
  category: string
  escalate: boolean
}

export interface GenerateReplyResult {
  reply: string
  escalate: boolean
}

export async function generateResolutionReply(options: GenerateReplyOptions): Promise<GenerateReplyResult> {
  if (options.escalate) {
    return {
      reply:
        'Thank you for reaching out. Your request has been escalated to a specialist who will follow up shortly.',
      escalate: true,
    }
  }

  const { text } = await generateText({
    messages: [
      {
        role: 'system',
        content: `You are a helpful, empathetic customer support agent responding to a "${options.category}" ticket. Keep replies under 150 words and end with a clear next step.`,
      },
      { role: 'user', content: `Subject: ${options.subject}\n\nMessage: ${options.message}` },
    ],
    task: 'support-reply',
    maxTokens: 400,
  })

  return { reply: text, escalate: false }
}

const URGENCY_RANK: Record<TicketUrgency, number> = { critical: 3, high: 2, medium: 1, low: 0 }

export async function listTickets(userId: string): Promise<SupportTicket[]> {
  const collection = await getSupportTicketsCollection()
  const tickets = await collection.find({ userId }).sort({ createdAt: -1 }).toArray()
  return tickets.sort((a, b) => URGENCY_RANK[b.urgency] - URGENCY_RANK[a.urgency])
}

export class TicketNotFoundError extends Error {
  constructor() {
    super('Ticket not found')
    this.name = 'TicketNotFoundError'
  }
}

export async function sendTicketReply(userId: string, ticketId: string, reply: string): Promise<SupportTicket> {
  const collection = await getSupportTicketsCollection()
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(ticketId), userId },
    { $set: { reply, replyStatus: 'sent', repliedAt: new Date() } },
    { returnDocument: 'after' },
  )
  if (!result) {
    throw new TicketNotFoundError()
  }
  return result
}

export async function translateMessage(text: string, targetLanguage: string): Promise<string> {
  const { text: translated } = await generateText({
    messages: [
      {
        role: 'system',
        content: `Translate the user's message into ${targetLanguage}. Respond with only the translation.`,
      },
      { role: 'user', content: text },
    ],
    task: 'support-translate',
    maxTokens: 500,
    temperature: 0,
  })
  return translated
}
