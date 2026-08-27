import type { Collection, ObjectId } from 'mongodb'
import { getMongoDb } from '@/lib/db/mongodb'

export const CRM_LEADS_COLLECTION = 'crm_leads'

export type QualificationBand = 'hot' | 'warm' | 'cold'

export interface CrmLead {
  _id?: ObjectId
  userId: string
  orgId: string
  name: string
  email: string
  company: string
  budget: number
  timelineDays: number
  fitNotes: string
  source: string
  qualificationScore: number
  qualificationBand: QualificationBand
  status: string
  createdAt: Date
}

export async function getCrmLeadsCollection(): Promise<Collection<CrmLead>> {
  const db = await getMongoDb()
  return db.collection<CrmLead>(CRM_LEADS_COLLECTION)
}

export async function ensureCrmLeadsIndexes(): Promise<void> {
  const collection = await getCrmLeadsCollection()
  await collection.createIndexes([
    { key: { userId: 1, createdAt: -1 } },
    { key: { email: 1, createdAt: -1 } },
    { key: { qualificationScore: -1 } },
  ])
}
