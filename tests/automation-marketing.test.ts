import { describe, expect, it } from 'vitest'

import { findAvailableSlots, suggestHashtags } from '@/lib/automation/marketing-service'

describe('suggestHashtags', () => {
  it('extracts meaningful keywords as hashtags', () => {
    const tags = suggestHashtags('Launching our new automation platform for enterprise teams')
    expect(tags).toContain('#launching')
    expect(tags).toContain('#automation')
    expect(tags.every((tag) => tag.startsWith('#'))).toBe(true)
  })

  it('excludes stopwords and short words', () => {
    const tags = suggestHashtags('the and for our new app')
    expect(tags).not.toContain('#the')
    expect(tags).not.toContain('#and')
  })

  it('respects the maxTags limit', () => {
    const tags = suggestHashtags('platform growth marketing automation scaling revenue pipeline', 3)
    expect(tags.length).toBeLessThanOrEqual(3)
  })
})

describe('findAvailableSlots', () => {
  const workingHours = {
    start: new Date('2026-01-01T09:00:00.000Z'),
    end: new Date('2026-01-01T17:00:00.000Z'),
  }

  it('returns the full window when there are no busy slots', () => {
    const slots = findAvailableSlots([], workingHours, 30)
    expect(slots).toEqual([workingHours])
  })

  it('splits around a busy slot in the middle of the day', () => {
    const busy = [
      { start: new Date('2026-01-01T12:00:00.000Z'), end: new Date('2026-01-01T13:00:00.000Z') },
    ]
    const slots = findAvailableSlots(busy, workingHours, 30)
    expect(slots).toEqual([
      { start: workingHours.start, end: busy[0].start },
      { start: busy[0].end, end: workingHours.end },
    ])
  })

  it('excludes gaps shorter than the requested duration', () => {
    const busy = [
      { start: new Date('2026-01-01T09:00:00.000Z'), end: new Date('2026-01-01T09:10:00.000Z') },
      { start: new Date('2026-01-01T09:15:00.000Z'), end: new Date('2026-01-01T17:00:00.000Z') },
    ]
    const slots = findAvailableSlots(busy, workingHours, 30)
    expect(slots).toEqual([])
  })
})
