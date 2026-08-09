import { Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

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
} as const

/** GET /api/users — full user directory (admin only). */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: userSelect,
  })

  return NextResponse.json({ users })
}

/**
 * POST /api/users — admin creates an account directly.
 *
 * Unlike /api/auth/register (which force-assigns EMPLOYEE), this endpoint
 * accepts a role, which is exactly why it is admin-gated.
 */
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

  // Same cost factor as /api/auth/register so hashes stay interchangeable.
  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: role as Role },
    select: userSelect,
  })

  return NextResponse.json({ user }, { status: 201 })
}
