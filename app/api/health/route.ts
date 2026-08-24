import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db/prisma'
import { pingMongo } from '@/lib/db/mongodb'
import { pingChroma } from '@/lib/db/vector-db'
import { pingRedis } from '@/lib/db/redis'

export const dynamic = 'force-dynamic'

type ServiceStatus = 'up' | 'down' | 'not_configured'

async function checkPostgres(): Promise<ServiceStatus> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return 'up'
  } catch {
    return 'down'
  }
}

async function checkMongo(): Promise<ServiceStatus> {
  if (!process.env.MONGODB_URL) return 'not_configured'
  return (await pingMongo()) ? 'up' : 'down'
}

async function checkRedis(): Promise<ServiceStatus> {
  if (!process.env.REDIS_URL) return 'not_configured'
  return (await pingRedis()) ? 'up' : 'down'
}

async function checkChroma(): Promise<ServiceStatus> {
  return (await pingChroma()) ? 'up' : 'down'
}

export async function GET() {
  const [postgres, mongodb, redis, chromadb] = await Promise.all([
    checkPostgres(),
    checkMongo(),
    checkRedis(),
    checkChroma(),
  ])

  const services = { postgres, mongodb, redis, chromadb }
  const healthy = Object.values(services).every((s) => s !== 'down')

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services,
    },
    { status: healthy ? 200 : 503 },
  )
}
