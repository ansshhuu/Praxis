import type { Collection, ObjectId } from 'mongodb'
import { getMongoDb } from '@/lib/db/mongodb'

export const SUPPORT_TICKETS_COLLECTION = 'support_tickets'

export type TicketUrgency = 'low' | 'medium' | 'high' | 'critical'

export type TicketSentimentLabel = 'positive' | 'neutral' | 'negative'

export type TicketReplyStatus = 'none' | 'sent'

export interface SupportTicket {
  _id?: ObjectId
  userId: string
  orgId: string
  subject: string
  message: string
  category: string
  sentimentScore: number
  sentimentLabel: TicketSentimentLabel
  urgency: TicketUrgency
  escalate: boolean
  status: string
  reply: string | null
  replyStatus: TicketReplyStatus
  repliedAt?: Date
  createdAt: Date
}

export async function getSupportTicketsCollection(): Promise<Collection<SupportTicket>> {
  const db = await getMongoDb()
  return db.collection<SupportTicket>(SUPPORT_TICKETS_COLLECTION)
}

export async function ensureSupportTicketsIndexes(): Promise<void> {
  const collection = await getSupportTicketsCollection()
  await collection.createIndexes([
    { key: { userId: 1, createdAt: -1 } },
    { key: { urgency: 1, createdAt: -1 } },
    { key: { status: 1 } },
  ])
}
