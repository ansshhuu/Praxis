// Route-handler dependencies for the hybrid data infra (Mongo, Chroma, Redis).
// Next.js has no DI container equivalent to FastAPI's `Depends` — route
// handlers just call these directly, e.g.:
//
//   import { getDb, getVectorClient } from '@/lib/api/deps'
//   const db = await getDb()

import { getMongoDb } from '@/lib/db/mongodb'
import { getChromaClient, getCollection } from '@/lib/db/vector-db'
import { getRedisClient } from '@/lib/db/redis'

export const getDb = getMongoDb
export const getVectorClient = getChromaClient
export const getVectorCollection = getCollection
export const getCache = getRedisClient
