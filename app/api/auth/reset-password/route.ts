import crypto from 'crypto'

import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)

    if (!body?.token || typeof body.token !== 'string' || !body?.newPassword || typeof body.newPassword !== 'string') {
      return NextResponse.json({ error: 'token and newPassword are required' }, { status: 400 })
    }

    const hashedToken = crypto.createHash('sha256').update(body.token).digest('hex')

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { gt: new Date() },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(body.newPassword, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    })

    return NextResponse.json({ message: 'Password has been reset successfully.' }, { status: 200 })
  } catch (error) {
    console.error('reset-password error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
