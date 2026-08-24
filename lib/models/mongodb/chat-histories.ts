import type { Collection, ObjectId } from 'mongodb'
import { getMongoDb } from '@/lib/db/mongodb'

export const CHAT_HISTORIES_COLLECTION = 'chat_histories'

export type ChatTurnRole = 'user' | 'assistant' | 'tool' | 'system'

export interface ToolCallPayload {
  toolName: string
  arguments: Record<string, unknown>
  result?: unknown
  error?: string
}

export interface ChatTurn {
  role: ChatTurnRole
  content: string
  toolCalls?: ToolCallPayload[]
  createdAt: Date
}

export interface ChatHistory {
  _id?: ObjectId
  sessionId: string
  userId: string
  title?: string
  turns: ChatTurn[]
  createdAt: Date
  updatedAt: Date
}

export async function getChatHistoriesCollection(): Promise<Collection<ChatHistory>> {
  const db = await getMongoDb()
  return db.collection<ChatHistory>(CHAT_HISTORIES_COLLECTION)
}

export async function ensureChatHistoriesIndexes(): Promise<void> {
  const collection = await getChatHistoriesCollection()
  await collection.createIndexes([
    { key: { sessionId: 1 }, unique: true },
    { key: { userId: 1, updatedAt: -1 } },
  ])
}
