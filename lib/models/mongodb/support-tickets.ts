import type { Collection, ObjectId } from 'mongodb'
import { getMongoDb } from '@/lib/db/mongodb'

export const SUPPORT_TICKETS_COLLECTION = 'support_tickets'

export type TicketUrgency = 'low' | 'medium' | 'high' | 'critical'

export type TicketSentimentLabel = 'positive' | 'neutral' | 'negative'

export interface SupportTicket {
  _id?: ObjectId
  subject: string
  message: string
  category: string
  sentimentScore: number
  sentimentLabel: TicketSentimentLabel
  urgency: TicketUrgency
  escalate: boolean
  status: string
  createdAt: Date
}

export async function getSupportTicketsCollection(): Promise<Collection<SupportTicket>> {
  const db = await getMongoDb()
  return db.collection<SupportTicket>(SUPPORT_TICKETS_COLLECTION)
}

export async function ensureSupportTicketsIndexes(): Promise<void> {
  const collection = await getSupportTicketsCollection()
  await collection.createIndexes([
    { key: { urgency: 1, createdAt: -1 } },
    { key: { status: 1 } },
  ])
}
