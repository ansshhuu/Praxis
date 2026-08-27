import type { Collection, ObjectId } from 'mongodb'
import { getMongoDb } from '@/lib/db/mongodb'

export const HR_CANDIDATES_COLLECTION = 'hr_candidates'

export interface HrCandidate {
  _id?: ObjectId
  userId: string
  orgId: string
  jobId: string
  name: string
  email: string
  resumeExcerpt: string
  matchScore: number
  rank: number
  createdAt: Date
}

export async function getHrCandidatesCollection(): Promise<Collection<HrCandidate>> {
  const db = await getMongoDb()
  return db.collection<HrCandidate>(HR_CANDIDATES_COLLECTION)
}

export async function ensureHrCandidatesIndexes(): Promise<void> {
  const collection = await getHrCandidatesCollection()
  await collection.createIndexes([
    { key: { userId: 1, createdAt: -1 } },
    { key: { jobId: 1, matchScore: -1 } },
  ])
}
