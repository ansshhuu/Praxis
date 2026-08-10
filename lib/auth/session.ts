import type { Role } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db/prisma'

export type SessionUser = { id: string; role: Role }

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.id ?? null
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  return { id: session.user.id, role: session.user.role }
}

export async function requireAdmin(): Promise<
  { ok: true; user: SessionUser } | { ok: false; status: 401 | 403; error: string }
> {
  const session = await getCurrentUser()
  if (!session) return { ok: false, status: 401, error: 'Unauthorized' }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, role: true },
  })
  if (!user) return { ok: false, status: 401, error: 'Unauthorized' }
  if (user.role !== 'ADMIN') return { ok: false, status: 403, error: 'Admin access required' }

  return { ok: true, user }
}
