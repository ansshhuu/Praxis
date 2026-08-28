import { describe, expect, it } from 'vitest'

import {
  extractBalanced,
  parseJsonArray,
  parseJsonObject,
  repairTruncatedArray,
  stripFences,
  tryParse,
} from '@/lib/ai/json'

describe('stripFences', () => {
  it('removes a fenced json block', () => {
    expect(stripFences('```json\n{"a":1}\n```')).toBe('{"a":1}')
  })

  it('removes bare and javascript-tagged fences', () => {
    expect(stripFences('```\n[1,2]\n```')).toBe('[1,2]')
    expect(stripFences('```javascript\n[1]\n```')).toBe('[1]')
  })

  it('leaves unfenced text untouched apart from trimming', () => {
    expect(stripFences('  {"a":1}  ')).toBe('{"a":1}')
  })
})

describe('tryParse', () => {
  it('parses valid JSON', () => {
    expect(tryParse('{"a":1}')).toEqual({ a: 1 })
  })

  it('returns undefined instead of throwing on malformed JSON', () => {
    expect(tryParse('{oops')).toBeUndefined()
  })
})

describe('extractBalanced', () => {
  it('pulls an array out of surrounding prose', () => {
    expect(extractBalanced('Here you go: [1, 2, 3] - hope that helps', '[')).toBe('[1, 2, 3]')
  })

  it('pulls an object out of surrounding prose', () => {
    expect(extractBalanced('Result: {"a":1} done', '{')).toBe('{"a":1}')
  })

  it('handles nesting rather than stopping at the first close', () => {
    expect(extractBalanced('x [1, [2, 3], 4] y', '[')).toBe('[1, [2, 3], 4]')
  })

  it('ignores brackets that appear inside strings', () => {
    expect(extractBalanced('[{"note":"a ] bracket"}]', '[')).toBe('[{"note":"a ] bracket"}]')
  })

  it('ignores escaped quotes inside strings', () => {
    expect(extractBalanced('[{"note":"say \\"hi\\" ]"}]', '[')).toBe('[{"note":"say \\"hi\\" ]"}]')
  })

  it('returns null when the opening character is absent', () => {
    expect(extractBalanced('no brackets here', '[')).toBeNull()
  })

  it('returns null when the structure never closes', () => {
    expect(extractBalanced('[1, 2, 3', '[')).toBeNull()
  })
})

describe('repairTruncatedArray', () => {
  it('recovers the complete objects from a response cut off mid-stream', () => {
    const truncated = '[{"name":"A","score":90},{"name":"B","score":80},{"name":"C","sco'
    expect(repairTruncatedArray(truncated)).toEqual([
      { name: 'A', score: 90 },
      { name: 'B', score: 80 },
    ])
  })

  it('returns null when not even one object completed', () => {
    expect(repairTruncatedArray('[{"name":"A","sc')).toBeNull()
  })

  it('returns null when there is no array at all', () => {
    expect(repairTruncatedArray('just prose')).toBeNull()
  })
})

describe('parseJsonArray', () => {
  it('parses a clean array', () => {
    expect(parseJsonArray('[{"a":1}]')).toEqual([{ a: 1 }])
  })

  it('parses a fenced array', () => {
    expect(parseJsonArray('```json\n[{"a":1}]\n```')).toEqual([{ a: 1 }])
  })

  it('parses an array buried in prose', () => {
    expect(parseJsonArray('Sure! Here are the results:\n[{"a":1}]\nLet me know.')).toEqual([
      { a: 1 },
    ])
  })

  it('unwraps a wrapper object under known keys', () => {
    expect(parseJsonArray('{"candidates":[{"a":1}]}')).toEqual([{ a: 1 }])
    expect(parseJsonArray('{"results":[{"b":2}]}')).toEqual([{ b: 2 }])
  })

  it('wraps a single bare object into a one-item array', () => {
    expect(parseJsonArray('{"name":"solo"}')).toEqual([{ name: 'solo' }])
  })

  it('falls back to repair when the response is truncated', () => {
    const truncated = '[{"name":"A","score":90},{"name":"B","sco'
    expect(parseJsonArray(truncated)).toEqual([{ name: 'A', score: 90 }])
  })

  it('returns null for empty or unparseable input', () => {
    expect(parseJsonArray('')).toBeNull()
    expect(parseJsonArray('   ')).toBeNull()
    expect(parseJsonArray('I could not complete that request.')).toBeNull()
  })
})

describe('parseJsonObject', () => {
  it('parses a clean object', () => {
    expect(parseJsonObject('{"a":1}')).toEqual({ a: 1 })
  })

  it('parses a fenced object', () => {
    expect(parseJsonObject('```json\n{"a":1}\n```')).toEqual({ a: 1 })
  })

  it('parses an object buried in prose', () => {
    expect(parseJsonObject('Here: {"a":1} done')).toEqual({ a: 1 })
  })

  it('wraps a bare array of primitives under action_items', () => {
    expect(parseJsonObject('["call Ana","send deck"]')).toEqual({
      action_items: ['call Ana', 'send deck'],
    })
  })

  it('returns only the FIRST object when given a bare array of objects', () => {
    
    
    
    expect(parseJsonObject('[{"task":"a"},{"task":"b"}]')).toEqual({ task: 'a' })
  })

  it('returns null when there is nothing usable', () => {
    expect(parseJsonObject('')).toBeNull()
    expect(parseJsonObject('sorry, no')).toBeNull()
  })
})
