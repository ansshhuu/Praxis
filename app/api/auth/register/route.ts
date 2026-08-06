import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/db/prisma'

const VALID_ROLES = ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] as const

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)

  if (!body?.email || !body?.password || !body?.name) {
    return NextResponse.json({ error: 'email, password, and name are required' }, { status: 400 })
  }

  const role = VALID_ROLES.includes(body.role) ? body.role : 'EMPLOYEE'

  const existing = await prisma.user.findUnique({ where: { email: body.email } })
  if (existing) {
    return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(body.password, 12)

  const user = await prisma.user.create({
    data: {
      email: body.email,
      passwordHash,
      name: body.name,
      role,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ user }, { status: 201 })
}
