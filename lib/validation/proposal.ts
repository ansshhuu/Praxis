import { validateNumericField } from '@/lib/validation/shared'

export const PROPOSAL_REQUIREMENTS_MAX_LENGTH = 4000
export const PROPOSAL_BUDGET_MAX = 100_000_000

export interface ProposalFieldErrors {
  leadName?: string
  company?: string
  requirements?: string
  budget?: string
}

export interface ProposalFormValues {
  leadName: string
  company: string
  requirements: string
  budget: string
}

export function validateProposalForm(values: ProposalFormValues): ProposalFieldErrors {
  const errors: ProposalFieldErrors = {}

  if (!values.leadName.trim()) errors.leadName = 'Lead name is required.'
  if (!values.company.trim()) errors.company = 'Company is required.'
  if (!values.requirements.trim()) {
    errors.requirements = 'Requirements/scope description is required.'
  } else if (values.requirements.length > PROPOSAL_REQUIREMENTS_MAX_LENGTH) {
    errors.requirements = `Requirements must be ${PROPOSAL_REQUIREMENTS_MAX_LENGTH} characters or fewer.`
  }

  errors.budget = validateNumericField(values.budget, {
    label: 'Budget',
    min: 0,
    max: PROPOSAL_BUDGET_MAX,
    maxMessage: `Budget seems unrealistically high — enter a value under $${PROPOSAL_BUDGET_MAX.toLocaleString('en-US')}.`,
  })

  return errors
}

export function hasProposalFieldErrors(errors: ProposalFieldErrors): boolean {
  return Object.values(errors).some(Boolean)
}
