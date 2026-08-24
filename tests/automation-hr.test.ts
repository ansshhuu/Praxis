import { describe, expect, it } from 'vitest'

import { cosineSimilarity, rankCandidates } from '@/lib/automation/hr-service'

describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1)
  })

  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0)
  })

  it('returns 0 for mismatched or empty vectors', () => {
    expect(cosineSimilarity([], [1])).toBe(0)
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0)
  })

  it('returns 0 when a vector is all zeros', () => {
    expect(cosineSimilarity([0, 0], [1, 2])).toBe(0)
  })
})

describe('rankCandidates', () => {
  it('sorts candidates by descending score and assigns rank', () => {
    const ranked = rankCandidates([
      { candidateId: 'a', name: 'Alice', score: 60 },
      { candidateId: 'b', name: 'Bob', score: 90 },
      { candidateId: 'c', name: 'Cara', score: 75 },
    ])
    expect(ranked.map((c) => c.candidateId)).toEqual(['b', 'c', 'a'])
    expect(ranked.map((c) => c.rank)).toEqual([1, 2, 3])
  })

  it('handles an empty list', () => {
    expect(rankCandidates([])).toEqual([])
  })
})
