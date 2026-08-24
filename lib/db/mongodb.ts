import { MongoClient, type Db } from 'mongodb'

const globalForMongo = globalThis as unknown as {
  mongoClient: MongoClient | undefined
  mongoConnect: Promise<MongoClient> | undefined
}

function createClient(): MongoClient {
  const uri = process.env.MONGODB_URL
  if (!uri) {
    throw new Error('MONGODB_URL is not set')
  }

  return new MongoClient(uri, {
    maxPoolSize: 20,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 5000,
  })
}

/**
 * Cached across hot reloads in dev (mirrors lib/db/prisma.ts) so repeated
 * module loads reuse one pooled client instead of opening a new one each time.
 */
export async function getMongoClient(): Promise<MongoClient> {
  if (!globalForMongo.mongoClient) {
    globalForMongo.mongoClient = createClient()
  }
  if (!globalForMongo.mongoConnect) {
    globalForMongo.mongoConnect = globalForMongo.mongoClient.connect()
  }
  return globalForMongo.mongoConnect
}

export async function getMongoDb(): Promise<Db> {
  const client = await getMongoClient()
  const dbName = process.env.MONGODB_DB_NAME || 'praxis'
  return client.db(dbName)
}

/** Call from a shutdown hook (e.g. process 'SIGTERM') — not needed per-request. */
export async function closeMongoClient(): Promise<void> {
  if (globalForMongo.mongoClient) {
    await globalForMongo.mongoClient.close()
    globalForMongo.mongoClient = undefined
    globalForMongo.mongoConnect = undefined
  }
}

export async function pingMongo(): Promise<boolean> {
  try {
    const db = await getMongoDb()
    await db.command({ ping: 1 })
    return true
  } catch {
    return false
  }
}
