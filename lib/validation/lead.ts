import { validateNumericField } from '@/lib/validation/shared'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const FIT_NOTES_MAX_LENGTH = 2000
export const TIMELINE_MIN_DAYS = 1
export const TIMELINE_MAX_DAYS = 365
export const LEAD_BUDGET_MAX = 100_000_000

export function isValidLeadEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim())
}

export interface LeadFieldErrors {
  name?: string
  email?: string
  company?: string
  budget?: string
  timelineDays?: string
  fitNotes?: string
}

export interface LeadFormValues {
  name: string
  email: string
  company: string
  budget: string
  timelineDays: string
  fitNotes: string
}

export function validateLeadForm(values: LeadFormValues): LeadFieldErrors {
  const errors: LeadFieldErrors = {}

  if (!values.name.trim()) errors.name = 'Contact name is required.'
  if (!values.email.trim()) {
    errors.email = 'Email is required.'
  } else if (!isValidLeadEmail(values.email)) {
    errors.email = 'Enter a valid email address.'
  }
  if (!values.company.trim()) errors.company = 'Company is required.'

  errors.budget = validateNumericField(values.budget, {
    label: 'Budget',
    min: 0,
    rejectZero: true,
    max: LEAD_BUDGET_MAX,
    maxMessage: `Budget seems unrealistically high - enter a value under $${LEAD_BUDGET_MAX.toLocaleString('en-US')}.`,
  })

  const timelineError = validateNumericField(values.timelineDays, { label: 'Urgency', min: 0 })
  if (timelineError) {
    errors.timelineDays = timelineError
  } else {
    const timelineDays = Number(values.timelineDays.trim())
    if (timelineDays < TIMELINE_MIN_DAYS || timelineDays > TIMELINE_MAX_DAYS) {
      errors.timelineDays = `Enter a value between ${TIMELINE_MIN_DAYS} and ${TIMELINE_MAX_DAYS} days.`
    }
  }

  if (!values.fitNotes.trim()) {
    errors.fitNotes = 'Fit notes are required.'
  } else if (values.fitNotes.length > FIT_NOTES_MAX_LENGTH) {
    errors.fitNotes = `Fit notes must be ${FIT_NOTES_MAX_LENGTH} characters or fewer.`
  }

  return errors
}

export function hasLeadFieldErrors(errors: LeadFieldErrors): boolean {
  return Object.values(errors).some(Boolean)
}
