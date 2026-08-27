import { getRedisClient } from '@/lib/db/redis'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  limit: number
  resetSeconds: number
}

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  try {
    const redis = getRedisClient()
    const redisKey = `ratelimit:${key}`
    const count = await redis.incr(redisKey)
    if (count === 1) {
      await redis.expire(redisKey, windowSeconds)
    }
    const ttl = await redis.ttl(redisKey)
    const resetSeconds = ttl > 0 ? ttl : windowSeconds
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      limit,
      resetSeconds,
    }
  } catch (error) {
    console.error(`[rate-limit] Redis unavailable, allowing request for "${key}":`, error)
    return { allowed: true, remaining: limit, limit, resetSeconds: windowSeconds }
  }
}

export interface RateLimitDenied {
  status: 429
  body: { error: string; retryAfterSeconds: number }
}

export async function enforceRateLimit(
  scope: string,
  userId: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitDenied | null> {
  const result = await checkRateLimit(`${scope}:${userId}`, limit, windowSeconds)
  if (result.allowed) return null
  return {
    status: 429,
    body: {
      error: 'Too many requests. Please slow down and try again shortly.',
      retryAfterSeconds: result.resetSeconds,
    },
  }
}
