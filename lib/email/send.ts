const BREVO_URL = 'https://api.brevo.com/v3/smtp/email'
const REQUEST_TIMEOUT_MS = 15_000

export type SendEmailInput = {
  to: string
  subject: string
  body: string
}

export type SendEmailResult = {
  success: boolean
  error?: string
  messageId?: string
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && EMAIL_PATTERN.test(value.trim())
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function toHtml(body: string): string {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br />')}</p>`)

  const content = paragraphs.length > 0 ? paragraphs.join('\n') : '<p></p>'
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#111111">\n${content}\n</div>`
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: unknown; code?: unknown }
    if (typeof payload?.message === 'string' && payload.message.trim()) {
      return payload.message.trim()
    }
  } catch {
    try {
      const text = (await response.text()).trim()
      if (text) return text.slice(0, 300)
    } catch {
      return `HTTP ${response.status}`
    }
  }
  return `HTTP ${response.status}`
}

export async function sendEmail({ to, subject, body }: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.BREVO_API_KEY?.trim()
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim()

  if (!apiKey) {
    return { success: false, error: 'BREVO_API_KEY is not set' }
  }
  if (!senderEmail) {
    return { success: false, error: 'BREVO_SENDER_EMAIL is not set' }
  }
  if (!isValidEmail(to)) {
    return { success: false, error: `Invalid recipient email: "${to}"` }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(BREVO_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: senderEmail, name: process.env.BREVO_SENDER_NAME?.trim() || 'Praxis' },
        to: [{ email: to.trim() }],
        subject,
        htmlContent: toHtml(body),
        textContent: body,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      return { success: false, error: `Brevo rejected the request — ${await readErrorMessage(response)}` }
    }

    const payload = (await response.json().catch(() => ({}))) as { messageId?: unknown }
    return {
      success: true,
      messageId: typeof payload?.messageId === 'string' ? payload.messageId : undefined,
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { success: false, error: `Brevo request timed out after ${REQUEST_TIMEOUT_MS / 1000}s` }
    }
    return { success: false, error: (error as Error).message || 'Email send failed' }
  } finally {
    clearTimeout(timer)
  }
}
