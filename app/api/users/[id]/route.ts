import { Role } from '@prisma/client'
import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  lastLogin: true,
} as const

/** PATCH /api/users/[id] — change a user's role (admin only). */
export async function PATCH(request: Request, { params }: RouteContext) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params

  let body: { role?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const role = typeof body.role === 'string' ? body.role.toUpperCase() : ''
  if (!(role in Role)) {
    return NextResponse.json(
      { error: `role must be one of ${Object.keys(Role).join(', ')}` },
      { status: 400 },
    )
  }

  // Demoting yourself would lock the console's last admin out of its own
  // controls mid-session, so it is refused the same way self-delete is.
  if (id === auth.user.id && role !== Role.ADMIN) {
    return NextResponse.json({ error: 'You cannot change your own role' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } })
  if (!existing) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const user = await prisma.user.update({
    where: { id },
    data: { role: role as Role },
    select: userSelect,
  })

  return NextResponse.json({ user })
}

/** DELETE /api/users/[id] — remove a user (admin only, never yourself). */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  if (id === auth.user.id) {
    return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } })
  if (!existing) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  try {
    await prisma.user.delete({ where: { id } })
  } catch {
    // workflows / documents / reports reference users without onDelete rules,
    // so Postgres rejects the delete rather than orphaning their records.
    return NextResponse.json(
      { error: 'This user still owns workflows or documents and cannot be removed' },
      { status: 409 },
    )
  }

  return NextResponse.json({ success: true })
}
