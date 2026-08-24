import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redisClient: Redis | undefined
}

export function getRedisClient(): Redis {
  if (!globalForRedis.redisClient) {
    const url = process.env.REDIS_URL
    if (!url) {
      throw new Error('REDIS_URL is not set')
    }
    globalForRedis.redisClient = new Redis(url, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    })
  }
  return globalForRedis.redisClient
}

export async function pingRedis(): Promise<boolean> {
  try {
    const reply = await getRedisClient().ping()
    return reply === 'PONG'
  } catch {
    return false
  }
}
