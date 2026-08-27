import { describe, expect, it } from 'vitest'

import { hasLeadFieldErrors, isValidLeadEmail, validateLeadForm } from '@/lib/validation/lead'

const VALID_FORM = {
  name: 'Jordan Rivera',
  email: 'jordan.rivera@example.com',
  company: 'Rivera Logistics',
  budget: '50000',
  timelineDays: '30',
  fitNotes: 'Decision maker with budget approved, urgent replacement needed.',
}

describe('validateLeadForm', () => {
  it('accepts a fully valid form', () => {
    const errors = validateLeadForm(VALID_FORM)
    expect(hasLeadFieldErrors(errors)).toBe(false)
  })

  it('rejects all-empty fields with per-field errors', () => {
    const errors = validateLeadForm({ name: '', email: '', company: '', budget: '', timelineDays: '', fitNotes: '' })
    expect(errors.name).toBeTruthy()
    expect(errors.email).toBeTruthy()
    expect(errors.company).toBeTruthy()
    expect(errors.budget).toBeTruthy()
    expect(errors.timelineDays).toBeTruthy()
    expect(errors.fitNotes).toBeTruthy()
  })

  it.each(['hello', 'rahul@'])('rejects invalid email %s', (email) => {
    const errors = validateLeadForm({ ...VALID_FORM, email })
    expect(errors.email).toBe('Enter a valid email address.')
  })

  it('rejects non-numeric budget', () => {
    const errors = validateLeadForm({ ...VALID_FORM, budget: 'abc' })
    expect(errors.budget).toBe('Budget must be a number.')
  })

  it('rejects negative budget', () => {
    const errors = validateLeadForm({ ...VALID_FORM, budget: '-5000' })
    expect(errors.budget).toBe("Budget can't be negative.")
  })

  it('rejects zero budget', () => {
    const errors = validateLeadForm({ ...VALID_FORM, budget: '0' })
    expect(errors.budget).toBe('Budget must be greater than 0.')
  })

  it('rejects negative urgency', () => {
    const errors = validateLeadForm({ ...VALID_FORM, timelineDays: '-1' })
    expect(errors.timelineDays).toBe("Urgency can't be negative.")
  })

  it('rejects an unreasonably large urgency value', () => {
    const errors = validateLeadForm({ ...VALID_FORM, timelineDays: '999999' })
    expect(errors.timelineDays).toBe('Enter a value between 1 and 365 days.')
  })

  it('rejects fit notes over the max length', () => {
    const errors = validateLeadForm({ ...VALID_FORM, fitNotes: 'a'.repeat(2001) })
    expect(errors.fitNotes).toBe('Fit notes must be 2000 characters or fewer.')
  })
})

describe('isValidLeadEmail', () => {
  it('accepts well-formed emails', () => {
    expect(isValidLeadEmail('a@b.com')).toBe(true)
  })

  it.each(['hello', 'rahul@', '@example.com', 'a@b'])('rejects malformed email %s', (email) => {
    expect(isValidLeadEmail(email)).toBe(false)
  })
})
