import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'

export const dynamic = 'force-dynamic'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_NAME_LENGTH = 120

export async function PATCH(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { name?: unknown; email?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

  if (!name) {
    return NextResponse.json({ error: 'Display name is required' }, { status: 400 })
  }
  if (name.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: `Display name must be ${MAX_NAME_LENGTH} characters or fewer` },
      { status: 400 },
    )
  }
  if (!email) {
    return NextResponse.json({ error: 'Email address is required' }, { status: 400 })
  }
  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  }

  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, passwordHash: true },
  })
  if (!current) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!current.passwordHash && email !== current.email) {
    return NextResponse.json(
      { error: 'Email is managed by your Google account and cannot be changed here' },
      { status: 403 },
    )
  }

  const clash = await prisma.user.findFirst({
    where: { email, NOT: { id: userId } },
    select: { id: true },
  })
  if (clash) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, email },
      select: { id: true, name: true, email: true, role: true },
    })
    return NextResponse.json({ user })
  } catch (error) {
    console.error('[profile] update failed:', error)
    return NextResponse.json({ error: 'Could not save your profile' }, { status: 500 })
  }
}
