import { describe, expect, it } from 'vitest'

import { calculateQualificationScore, planFollowUp } from '@/lib/automation/crm-service'

describe('calculateQualificationScore', () => {
  it('scores a strong lead as hot', () => {
    const result = calculateQualificationScore({
      budget: 60000,
      timelineDays: 5,
      fitNotes: 'Enterprise decision maker, budget approved, needs urgent integration and scale.',
    })
    expect(result.band).toBe('hot')
    expect(result.totalScore).toBeGreaterThanOrEqual(75)
  })

  it('scores a weak lead as cold', () => {
    const result = calculateQualificationScore({ budget: 0, timelineDays: 400, fitNotes: '' })
    expect(result.band).toBe('cold')
    expect(result.totalScore).toBe(5)
  })

  it('caps the total score at 100', () => {
    const result = calculateQualificationScore({
      budget: 1_000_000,
      timelineDays: 1,
      fitNotes: FIT_NOTES_ALL,
    })
    expect(result.totalScore).toBeLessThanOrEqual(100)
  })

  it('never returns a negative component score', () => {
    const result = calculateQualificationScore({ budget: -50, timelineDays: -5, fitNotes: '' })
    expect(result.budgetScore).toBeGreaterThanOrEqual(0)
    expect(result.urgencyScore).toBeGreaterThanOrEqual(0)
    expect(result.fitScore).toBeGreaterThanOrEqual(0)
  })
})

describe('planFollowUp', () => {
  it('schedules hot leads for the next day with high priority', () => {
    const lastContactedAt = new Date('2026-01-01T00:00:00.000Z')
    const plan = planFollowUp('hot', lastContactedAt)
    expect(plan.priority).toBe('high')
    expect(plan.nextFollowUpAt.getTime() - lastContactedAt.getTime()).toBe(24 * 60 * 60 * 1000)
  })

  it('schedules cold leads a week out with low priority', () => {
    const lastContactedAt = new Date('2026-01-01T00:00:00.000Z')
    const plan = planFollowUp('cold', lastContactedAt)
    expect(plan.priority).toBe('low')
    expect(plan.nextFollowUpAt.getTime() - lastContactedAt.getTime()).toBe(7 * 24 * 60 * 60 * 1000)
  })
})

const FIT_NOTES_ALL =
  'enterprise decision maker budget approved urgent replace scale integration compliance automation growth'
