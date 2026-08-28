import { describe, expect, it } from 'vitest'

import { hasProposalFieldErrors, validateProposalForm } from '@/lib/validation/proposal'

const VALID_FORM = {
  leadName: 'Jordan Rivera',
  company: 'Rivera Logistics',
  requirements: 'Need a CRM integration with urgent timeline and enterprise scale.',
  budget: '50000',
}

describe('validateProposalForm', () => {
  it('accepts a fully valid form', () => {
    const errors = validateProposalForm(VALID_FORM)
    expect(hasProposalFieldErrors(errors)).toBe(false)
  })

  it('rejects all-empty fields with per-field errors', () => {
    const errors = validateProposalForm({ leadName: '', company: '', requirements: '', budget: '' })
    expect(errors.leadName).toBeTruthy()
    expect(errors.company).toBeTruthy()
    expect(errors.requirements).toBeTruthy()
    expect(errors.budget).toBeTruthy()
  })

  it('flags only lead name when it alone is missing', () => {
    const errors = validateProposalForm({ ...VALID_FORM, leadName: '' })
    expect(errors.leadName).toBe('Lead name is required.')
    expect(errors.company).toBeUndefined()
    expect(errors.requirements).toBeUndefined()
    expect(errors.budget).toBeUndefined()
  })

  it('flags requirements when only name and budget are filled', () => {
    const errors = validateProposalForm({ leadName: 'Jordan Rivera', company: '', requirements: '', budget: '50000' })
    expect(errors.requirements).toBe('Requirements/scope description is required.')
  })

  it('rejects non-numeric budget', () => {
    const errors = validateProposalForm({ ...VALID_FORM, budget: 'hello' })
    expect(errors.budget).toBe('Budget must be a number.')
  })

  it('rejects negative budget', () => {
    const errors = validateProposalForm({ ...VALID_FORM, budget: '-50000' })
    expect(errors.budget).toBe("Budget can't be negative.")
  })

  it('rejects a currency-formatted budget string', () => {
    const errors = validateProposalForm({ ...VALID_FORM, budget: '$50,000' })
    expect(errors.budget).toBe('Budget must be a number.')
  })

  it('caps an unrealistically large budget', () => {
    const errors = validateProposalForm({ ...VALID_FORM, budget: '999999999999999999' })
    expect(errors.budget).toBe('Budget seems unrealistically high - enter a value under $100,000,000.')
  })

  it('rejects requirements over the max length', () => {
    const errors = validateProposalForm({ ...VALID_FORM, requirements: 'a'.repeat(4001) })
    expect(errors.requirements).toBe('Requirements must be 4000 characters or fewer.')
  })
})
