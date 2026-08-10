const BREVO_URL = 'https://api.brevo.com/v3/smtp/email'
const REQUEST_TIMEOUT_MS = 15_000

export type SendEmailInput = {
  to: string
  subject: string
  body: string
  label?: string
}

const DEFAULT_LABEL = 'Workflow Notification'

const FONT_STACK = 'Arial,Helvetica,sans-serif'
const AMBER = '#D4A017'
const SAND = '#EAE3D9'
const SAND_BORDER = '#DFD6C9'
const CHARCOAL = '#111111'
const PAGE_BG = '#F7F7F6'
const MUTED = '#8C857D'

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

function toMessageHtml(body: string): string {
  const paragraphStyle = `margin:0 0 14px;font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:${CHARCOAL}`

  const paragraphs = body
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p style="${paragraphStyle}">${escapeHtml(block).replace(/\n/g, '<br />')}</p>`)

  return paragraphs.length > 0 ? paragraphs.join('\n') : `<p style="${paragraphStyle}"></p>`
}

function toHtml(body: string, subject: string, label: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:${PAGE_BG};">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${PAGE_BG};margin:0;padding:0;">
  <tr>
    <td align="center" style="padding:24px 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:100%;max-width:560px;border:1px solid ${SAND_BORDER};border-radius:12px;overflow:hidden;background-color:#ffffff;">
        <tr>
          <td align="center" style="background-color:${SAND};padding:22px 24px;border-bottom:1px solid ${SAND_BORDER};border-radius:12px 12px 0 0;">
            <span style="font-family:${FONT_STACK};font-size:19px;font-weight:bold;letter-spacing:3px;color:${AMBER};">&#9728; PRAXIS</span>
          </td>
        </tr>
        <tr>
          <td style="background-color:#ffffff;padding:28px 32px;">
            <p style="margin:0 0 10px;font-family:${FONT_STACK};font-size:11px;font-weight:bold;letter-spacing:1.2px;text-transform:uppercase;color:${AMBER};">${escapeHtml(label)}</p>
${toMessageHtml(body)}
          </td>
        </tr>
        <tr>
          <td align="center" style="background-color:#ffffff;padding:0 32px 26px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="border-top:1px solid ${SAND};padding-top:16px;">
                  <p style="margin:0;font-family:${FONT_STACK};font-size:11.5px;line-height:1.5;color:${MUTED};text-align:center;">Sent by Praxis &middot; Enterprise AI Automation Platform</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
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

export async function sendEmail({
  to,
  subject,
  body,
  label = DEFAULT_LABEL,
}: SendEmailInput): Promise<SendEmailResult> {
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
        htmlContent: toHtml(body, subject, label),
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
