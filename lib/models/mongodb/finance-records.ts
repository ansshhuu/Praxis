import type { Collection, ObjectId } from 'mongodb'
import { getMongoDb } from '@/lib/db/mongodb'

export const FINANCE_RECORDS_COLLECTION = 'finance_records'

export type FinanceRecordType = 'invoice' | 'expense'

export interface FinanceRecord {
  _id?: ObjectId
  userId: string
  orgId: string
  type: FinanceRecordType
  vendor: string
  category: string
  amount: number
  tax: number
  dueDate: Date | null
  description: string
  anomaly: boolean
  createdAt: Date
}

export async function getFinanceRecordsCollection(): Promise<Collection<FinanceRecord>> {
  const db = await getMongoDb()
  return db.collection<FinanceRecord>(FINANCE_RECORDS_COLLECTION)
}

export async function ensureFinanceRecordsIndexes(): Promise<void> {
  const collection = await getFinanceRecordsCollection()
  await collection.createIndexes([
    { key: { userId: 1, createdAt: -1 } },
    { key: { type: 1, createdAt: -1 } },
    { key: { category: 1 } },
  ])
}
