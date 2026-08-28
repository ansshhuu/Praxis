import crypto from 'crypto'

import { NextResponse } from 'next/server'

import { prisma } from '@/lib/db/prisma'
import { sendEmail } from '@/lib/email/send'

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000

const GENERIC_RESPONSE = {
  message: 'If an account exists for that email, a password reset link has been sent.',
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null)

    if (!body?.email || typeof body.email !== 'string') {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email: body.email } })

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex')
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      })

      const baseUrl = process.env.FRONTEND_URL || process.env.NEXTAUTH_URL
      const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`

      const result = await sendEmail({
        to: user.email,
        subject: 'Reset your Praxis password',
        label: 'Password Reset',
        body: `We received a request to reset your password. Click the link below to choose a new one — it expires in 15 minutes.\n\n${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`,
      })

      if (!result.success) {
        console.error('forgot-password: failed to send reset email:', result.error)
      }
    }

    return NextResponse.json(GENERIC_RESPONSE, { status: 200 })
  } catch (error) {
    console.error('forgot-password error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
