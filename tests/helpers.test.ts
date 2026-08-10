import { describe, expect, it } from 'vitest'

import { isDashboardRange } from '@/lib/dashboard/types'
import { displayType, formatSize } from '@/lib/documents/serialize'
import { isValidEmail } from '@/lib/email/send'
import { formatDuration, readActionItems } from '@/lib/meetings/serialize'
import { sanitizeFileName } from '@/lib/storage/supabase'

describe('isValidEmail', () => {
  it('accepts ordinary addresses', () => {
    expect(isValidEmail('jane@company.com')).toBe(true)
    expect(isValidEmail('jane.doe+tag@sub.company.co.uk')).toBe(true)
  })

  it('rejects malformed addresses', () => {
    expect(isValidEmail('jane@')).toBe(false)
    expect(isValidEmail('@company.com')).toBe(false)
    expect(isValidEmail('jane company.com')).toBe(false)
    expect(isValidEmail('jane@company')).toBe(false)
    expect(isValidEmail('')).toBe(false)
  })

  it('rejects non-string values', () => {
    expect(isValidEmail(null)).toBe(false)
    expect(isValidEmail(undefined)).toBe(false)
    expect(isValidEmail(42)).toBe(false)
    expect(isValidEmail({})).toBe(false)
  })
})

describe('sanitizeFileName', () => {
  it('keeps a simple name intact', () => {
    expect(sanitizeFileName('report.pdf')).toBe('report.pdf')
  })

  it('strips directory components — no path traversal into the bucket', () => {
    expect(sanitizeFileName('../../etc/passwd')).toBe('passwd')
    expect(sanitizeFileName('C:\\Users\\me\\secret.txt')).toBe('secret.txt')
    expect(sanitizeFileName('nested/dir/file.pdf')).toBe('file.pdf')
  })

  it('replaces characters that are unsafe in an object key', () => {
    expect(sanitizeFileName('my report (final).pdf')).toBe('my_report_final_.pdf')
  })

  it('collapses runs of underscores', () => {
    expect(sanitizeFileName('a###b.pdf')).toBe('a_b.pdf')
  })

  it('caps the length', () => {
    expect(sanitizeFileName(`${'a'.repeat(300)}.pdf`).length).toBeLessThanOrEqual(120)
  })

  it('never returns an empty name', () => {
    expect(sanitizeFileName('///')).toBe('file')
  })
})

describe('displayType', () => {
  it('prefers the file extension over the mime type', () => {
    expect(displayType('application/pdf', 'report.pdf')).toBe('PDF')
    expect(displayType('application/octet-stream', 'sheet.xlsx')).toBe('XLSX')
  })

  it('falls back to the mime type when there is no extension', () => {
    expect(displayType('application/pdf', 'report')).toBe('PDF')
  })

  it('normalises known aliases', () => {
    expect(displayType('image/jpeg', 'photo.jpeg')).toBe('JPG')
    expect(displayType('text/plain', 'notes')).toBe('TXT')
  })
})

describe('formatSize', () => {
  it('shows a dash when the size is unknown', () => {
    expect(formatSize(null)).toBe('—')
    expect(formatSize(Number.NaN)).toBe('—')
  })

  it('shows bytes below one kilobyte', () => {
    expect(formatSize(0)).toBe('0 B')
    expect(formatSize(512)).toBe('512 B')
  })

  it('scales into larger units', () => {
    expect(formatSize(2048)).toMatch(/KB$/)
    expect(formatSize(5 * 1024 * 1024)).toMatch(/MB$/)
    expect(formatSize(3 * 1024 * 1024 * 1024)).toMatch(/GB$/)
  })
})

describe('formatDuration', () => {
  it('shows a dash for missing or nonsensical durations', () => {
    expect(formatDuration(null)).toBe('—')
    expect(formatDuration(0)).toBe('—')
    expect(formatDuration(-5)).toBe('—')
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('—')
  })

  it('formats seconds, minutes and hours', () => {
    expect(formatDuration(45)).toBe('45s')
    expect(formatDuration(90)).toBe('1m 30s')
    expect(formatDuration(3720)).toBe('1h 02m')
  })
})

describe('readActionItems', () => {
  it('returns an empty list for anything that is not an array', () => {
    expect(readActionItems(null)).toEqual([])
    expect(readActionItems('nope')).toEqual([])
    expect(readActionItems({ task: 'x' })).toEqual([])
  })

  it('keeps well-formed items and fills missing guesses with null', () => {
    expect(readActionItems([{ task: 'Send the deck' }])).toEqual([
      { task: 'Send the deck', assignee_guess: null, deadline_guess: null },
    ])
  })

  it('drops entries without a usable task — AI output is not trusted', () => {
    expect(readActionItems([{ task: '' }, { task: '   ' }, { notTask: 'x' }, null, 7])).toEqual([])
  })

  it('preserves assignee and deadline when they are strings', () => {
    expect(
      readActionItems([{ task: 'Ship', assignee_guess: 'Ana', deadline_guess: 'Friday' }]),
    ).toEqual([{ task: 'Ship', assignee_guess: 'Ana', deadline_guess: 'Friday' }])
  })
})

describe('isDashboardRange', () => {
  it('accepts the supported windows, as numbers or strings', () => {
    expect(isDashboardRange(7)).toBe(true)
    expect(isDashboardRange('30')).toBe(true)
    expect(isDashboardRange(90)).toBe(true)
  })

  it('rejects anything else — query params are untrusted', () => {
    expect(isDashboardRange(1)).toBe(false)
    expect(isDashboardRange('abc')).toBe(false)
    expect(isDashboardRange(null)).toBe(false)
  })
})
