import type { Role } from '@prisma/client'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db/prisma'

export type SessionUser = { id: string; role: Role }

/** Returns the logged-in user's id, or null when there is no session. */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions)
  return session?.user?.id ?? null
}

/** Returns the logged-in user's id and role, or null when there is no session. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null
  return { id: session.user.id, role: session.user.role }
}

/**
 * Guard for admin-only endpoints. Returns either the caller (when they are an
 * ADMIN) or the failure the route should hand back.
 *
 * The role is re-read from the database rather than taken off the JWT: the
 * token stamps the role at sign-in, so a demoted admin would otherwise keep
 * write access until their next login.
 */
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
