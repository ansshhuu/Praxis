import { describe, expect, it } from 'vitest'

import { categorizeExpense, detectBudgetAnomaly } from '@/lib/automation/finance-service'

describe('categorizeExpense', () => {
  it('categorizes travel expenses', () => {
    expect(categorizeExpense('Uber ride to the airport')).toBe('travel')
  })

  it('categorizes software subscriptions', () => {
    expect(categorizeExpense('Monthly SaaS subscription renewal')).toBe('software')
  })

  it('falls back to general when nothing matches', () => {
    expect(categorizeExpense('Miscellaneous item')).toBe('general')
  })
})

describe('detectBudgetAnomaly', () => {
  it('flags amounts over the threshold', () => {
    const result = detectBudgetAnomaly(5000, 1000, 200)
    expect(result.isAnomaly).toBe(true)
    expect(result.reason).toContain('exceeds budget threshold')
  })

  it('flags amounts far above the historical average', () => {
    const result = detectBudgetAnomaly(900, Infinity, 100)
    expect(result.isAnomaly).toBe(true)
    expect(result.reason).toContain('historical average')
  })

  it('does not flag normal spending', () => {
    const result = detectBudgetAnomaly(150, 1000, 100)
    expect(result.isAnomaly).toBe(false)
    expect(result.reason).toBeNull()
  })
})
