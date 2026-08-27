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

const URGENT_WORDS = ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'down', 'outage']

export function computeUrgency(text: string, sentiment: SentimentResult): TicketUrgency {
  const lower = text.toLowerCase()
  const hasUrgentWord = URGENT_WORDS.some((word) => lower.includes(word))
  if (hasUrgentWord && sentiment.label === 'negative') return 'critical'
  if (hasUrgentWord || sentiment.label === 'negative') return 'high'
  if (sentiment.label === 'neutral') return 'medium'
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

export async function ingestTicket(input: IngestTicketInput): Promise<SupportTicket> {
  const classification = classifyTicket(input)
  const collection = await getSupportTicketsCollection()

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
    createdAt: new Date(),
  }

  const result = await collection.insertOne(ticket)
  return { ...ticket, _id: result.insertedId }
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
