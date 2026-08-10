import { Role } from '@prisma/client'
import { NextResponse } from 'next/server'

import { avatarSelect, effectiveAvatar } from '@/lib/auth/avatar'
import { requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ id: string }> }

const userSelect = {
  name: true,
  email: true,
  role: true,
  createdAt: true,
  lastLogin: true,
  ...avatarSelect,
} as const

type UserRow = {
  id: string
  name: string
  email: string
  role: Role
  createdAt: Date
  lastLogin: Date | null
  avatarPath: string | null
  oauthAvatarUrl: string | null
}

function toUser({ oauthAvatarUrl, avatarPath, ...user }: UserRow) {
  return {
    ...user,
    avatarUrl: effectiveAvatar({ id: user.id, avatarPath, oauthAvatarUrl }),
  }
}

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

  return NextResponse.json({ user: toUser(user) })
}

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
    return NextResponse.json(
      { error: 'This user still owns workflows or documents and cannot be removed' },
      { status: 409 },
    )
  }

  return NextResponse.json({ success: true })
}
