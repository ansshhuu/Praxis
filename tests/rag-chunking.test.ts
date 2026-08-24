import { describe, expect, it } from 'vitest'

import { chunkText } from '@/lib/ai/rag-engine'

describe('chunkText', () => {
  it('returns an empty array for blank input', () => {
    expect(chunkText('')).toEqual([])
    expect(chunkText('   ')).toEqual([])
  })

  it('returns a single chunk when text fits within chunkSize', () => {
    const text = 'A short paragraph of text.'
    expect(chunkText(text, 800, 100)).toEqual([text])
  })

  it('splits long text into multiple chunks', () => {
    const paragraph = 'word '.repeat(50).trim()
    const text = Array.from({ length: 20 }, (_, i) => `Section ${i}: ${paragraph}`).join('\n\n')
    const chunks = chunkText(text, 200, 20)
    expect(chunks.length).toBeGreaterThan(1)
    for (const chunk of chunks) {
      expect(chunk.length).toBeGreaterThan(0)
    }
  })

  it('never produces empty chunks', () => {
    const text = 'x'.repeat(3000)
    const chunks = chunkText(text, 500, 50)
    expect(chunks.every((chunk) => chunk.trim().length > 0)).toBe(true)
  })
})
