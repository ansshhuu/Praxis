const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g

const SSN_PATTERN = /\b\d{3}-\d{2}-\d{4}\b/g

const DIGIT_GROUP_PATTERN = /\+?\(?\d{2,4}\)?(?:[\s.-]\d{2,4}){2,6}/g

export type PiiKind = 'email' | 'phone' | 'credit_card' | 'ssn'

export interface PiiMaskResult {
  maskedText: string
  found: PiiKind[]
}

function luhnValid(digits: string): boolean {
  let sum = 0
  let shouldDouble = false
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i])
    if (shouldDouble) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
    shouldDouble = !shouldDouble
  }
  return sum % 10 === 0
}

export function maskPii(text: string): PiiMaskResult {
  const found = new Set<PiiKind>()
  let masked = text

  masked = masked.replace(SSN_PATTERN, () => {
    found.add('ssn')
    return '[REDACTED_SSN]'
  })

  masked = masked.replace(DIGIT_GROUP_PATTERN, (match) => {
    const digits = match.replace(/\D/g, '')
    if (digits.length >= 13 && digits.length <= 19) {
      if (!luhnValid(digits)) return match
      found.add('credit_card')
      return '[REDACTED_CARD]'
    }
    if (digits.length >= 7 && digits.length <= 12) {
      found.add('phone')
      return '[REDACTED_PHONE]'
    }
    return match
  })

  masked = masked.replace(EMAIL_PATTERN, () => {
    found.add('email')
    return '[REDACTED_EMAIL]'
  })

  return { maskedText: masked, found: Array.from(found) }
}

const INJECTION_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/i, reason: 'instruction override attempt' },
  { pattern: /disregard\s+(all\s+)?(previous|prior|above)/i, reason: 'instruction override attempt' },
  { pattern: /you\s+are\s+now\s+(in\s+)?(developer|debug|admin|jailbreak|dan)\s+mode/i, reason: 'mode-switch jailbreak attempt' },
  { pattern: /forget\s+(everything|all)\s+(you\s+)?(were\s+told|know)/i, reason: 'instruction override attempt' },
  { pattern: /reveal\s+(your\s+)?(system\s+prompt|instructions)/i, reason: 'system prompt extraction attempt' },
  { pattern: /print\s+(your\s+)?(system\s+prompt|instructions)/i, reason: 'system prompt extraction attempt' },
  { pattern: /act\s+as\s+(if\s+you\s+(are|were)\s+)?(an?\s+)?unrestricted/i, reason: 'restriction bypass attempt' },
  { pattern: /\bDAN\b.{0,20}\bmode\b/i, reason: 'jailbreak persona attempt' },
  { pattern: /<\s*system\s*>/i, reason: 'fake system tag injection' },
  { pattern: /\[\s*system\s*\]/i, reason: 'fake system tag injection' },
]

export interface InjectionScanResult {
  flagged: boolean
  reasons: string[]
}

export function detectPromptInjection(text: string): InjectionScanResult {
  const reasons: string[] = []
  for (const { pattern, reason } of INJECTION_PATTERNS) {
    if (pattern.test(text) && !reasons.includes(reason)) {
      reasons.push(reason)
    }
  }
  return { flagged: reasons.length > 0, reasons }
}

export interface GuardrailResult {
  sanitizedText: string
  piiFound: PiiKind[]
  injectionFlagged: boolean
  injectionReasons: string[]
}

export function applyGuardrails(text: string): GuardrailResult {
  const injection = detectPromptInjection(text)
  const pii = maskPii(text)
  return {
    sanitizedText: pii.maskedText,
    piiFound: pii.found,
    injectionFlagged: injection.flagged,
    injectionReasons: injection.reasons,
  }
}
