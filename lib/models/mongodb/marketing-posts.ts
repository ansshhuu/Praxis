import type { Collection, ObjectId } from 'mongodb'
import { getMongoDb } from '@/lib/db/mongodb'

export const MARKETING_POSTS_COLLECTION = 'marketing_posts'

export type MarketingPlatform = 'linkedin' | 'twitter'

export interface MarketingPost {
  _id?: ObjectId
  platform: MarketingPlatform
  topic: string
  content: string
  hashtags: string[]
  tone: string
  createdAt: Date
}

export async function getMarketingPostsCollection(): Promise<Collection<MarketingPost>> {
  const db = await getMongoDb()
  return db.collection<MarketingPost>(MARKETING_POSTS_COLLECTION)
}

export async function ensureMarketingPostsIndexes(): Promise<void> {
  const collection = await getMarketingPostsCollection()
  await collection.createIndexes([{ key: { platform: 1, createdAt: -1 } }])
}
