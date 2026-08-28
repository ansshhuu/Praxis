import { NextResponse } from 'next/server'

import { isValidEmail, sendEmail } from '@/lib/email/send'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_NAME = 120
const MAX_EMAIL = 200
const MAX_MESSAGE = 4000
const MAX_INTERESTS = 10

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

const recentSubmissions = new Map<string, number[]>()

function isRateLimited(key: string): boolean {
  const now = Date.now()
  const fresh = (recentSubmissions.get(key) ?? []).filter(
    (at) => now - at < RATE_LIMIT_WINDOW_MS,
  )

  if (fresh.length >= RATE_LIMIT_MAX) {
    recentSubmissions.set(key, fresh)
    return true
  }

  fresh.push(now)
  recentSubmissions.set(key, fresh)
  return false
}

function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
}

export async function POST(request: Request) {
  const inbox = process.env.CONTACT_INBOX_EMAIL?.trim() || process.env.BREVO_SENDER_EMAIL?.trim()
  if (!inbox) {
    console.error('[contact] no destination: set CONTACT_INBOX_EMAIL or BREVO_SENDER_EMAIL')
    return NextResponse.json(
      { error: 'The contact form is not configured right now.' },
      { status: 503 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof body.company === 'string' && body.company.trim()) {
    return NextResponse.json({ ok: true }, { status: 202 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const interests = Array.isArray(body.interests)
    ? body.interests
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, MAX_INTERESTS)
    : []

  if (!name) return NextResponse.json({ error: 'Please tell us your name.' }, { status: 400 })
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
  }
  if (!message) {
    return NextResponse.json({ error: 'Please include a message.' }, { status: 400 })
  }
  if (name.length > MAX_NAME || email.length > MAX_EMAIL || message.length > MAX_MESSAGE) {
    return NextResponse.json({ error: 'That submission is too long.' }, { status: 413 })
  }

  if (isRateLimited(clientKey(request))) {
    return NextResponse.json(
      { error: 'Too many messages from this address. Please try again later.' },
      { status: 429 },
    )
  }

  const result = await sendEmail({
    to: inbox,
    subject: `New Praxis enquiry from ${name}`,
    label: 'Contact Form',
    body: [
      `Name: ${name}`,
      `Email: ${email}`,
      `Interested in: ${interests.length ? interests.join(', ') : '-'}`,
      '',
      message,
    ].join('\n'),
  })

  if (!result.success) {
    console.error('[contact] send failed:', result.error)
    return NextResponse.json(
      { error: 'We could not send your message. Please email us directly.' },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true }, { status: 201 })
}
