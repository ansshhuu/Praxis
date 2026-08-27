export interface NumericFieldRule {
  required?: boolean
  min?: number
  max?: number
  rejectZero?: boolean
  label: string
  maxMessage?: string
}

export function validateNumericField(raw: string, rule: NumericFieldRule): string | undefined {
  const trimmed = raw.trim()
  if (!trimmed) {
    return rule.required === false ? undefined : `${rule.label} is required.`
  }

  const value = Number(trimmed)
  if (!Number.isFinite(value)) {
    return `${rule.label} must be a number.`
  }
  if (rule.min !== undefined && value < rule.min) {
    return rule.min === 0 ? `${rule.label} can't be negative.` : `${rule.label} must be at least ${rule.min}.`
  }
  if (rule.rejectZero && value === 0) {
    return `${rule.label} must be greater than 0.`
  }
  if (rule.max !== undefined && value > rule.max) {
    return rule.maxMessage ?? `${rule.label} must be ${rule.max} or less.`
  }
  return undefined
}
