import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

import { ACTIVITY_ACTIONS } from '@/lib/activity/actions'
import { logActivity } from '@/lib/activity/log'
import { avatarSelect, effectiveAvatar } from '@/lib/auth/avatar'
import { requireAdmin } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

const userSelect = {
  id: true,
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
  avatarUrl: string | null
  oauthAvatarUrl: string | null
}

function toUser({ oauthAvatarUrl, ...user }: UserRow) {
  return { ...user, avatarUrl: effectiveAvatar({ avatarUrl: user.avatarUrl, oauthAvatarUrl }) }
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: userSelect,
  })

  return NextResponse.json({ users: users.map(toUser) })
}

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let body: { name?: unknown; email?: unknown; password?: unknown; role?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: 'name, email, and password are required' },
      { status: 400 },
    )
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: 'password must be at least 8 characters' },
      { status: 400 },
    )
  }

  const role = body.role === undefined ? Role.EMPLOYEE : String(body.role).toUpperCase()
  if (!(role in Role)) {
    return NextResponse.json(
      { error: `role must be one of ${Object.keys(Role).join(', ')}` },
      { status: 400 },
    )
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) {
    return NextResponse.json(
      { error: 'A user with this email already exists' },
      { status: 409 },
    )
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: role as Role },
    select: userSelect,
  })

  await logActivity(auth.user.id, ACTIVITY_ACTIONS.userCreated, {
    createdUserId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })

  return NextResponse.json({ user: toUser(user) }, { status: 201 })
}
