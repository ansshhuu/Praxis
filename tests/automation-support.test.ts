import { describe, expect, it } from 'vitest'

import {
  classifyTicket,
  classifyTicketCategory,
  computeSentimentScore,
  computeUrgency,
} from '@/lib/automation/support-service'

describe('classifyTicketCategory', () => {
  it('classifies billing issues', () => {
    expect(classifyTicketCategory('I was double charged on my invoice')).toBe('billing')
  })

  it('falls back to general', () => {
    expect(classifyTicketCategory('Just saying hello')).toBe('general')
  })
})

describe('computeSentimentScore', () => {
  it('detects positive sentiment', () => {
    const result = computeSentimentScore('Thank you so much, this is awesome and I love it')
    expect(result.label).toBe('positive')
  })

  it('detects negative sentiment', () => {
    const result = computeSentimentScore('This is terrible and I am furious, worst experience')
    expect(result.label).toBe('negative')
  })

  it('defaults to neutral', () => {
    const result = computeSentimentScore('Can you help me reset my password')
    expect(result.label).toBe('neutral')
  })
})

describe('computeUrgency', () => {
  it('marks urgent negative messages as critical', () => {
    const sentiment = computeSentimentScore('This outage is unacceptable and urgent')
    const urgency = computeUrgency('This outage is unacceptable and urgent', sentiment)
    expect(urgency).toBe('critical')
  })

  it('marks calm, positive messages as low urgency', () => {
    const sentiment = computeSentimentScore('Thanks for the great support')
    const urgency = computeUrgency('Thanks for the great support', sentiment)
    expect(urgency).toBe('low')
  })
})

describe('classifyTicket', () => {
  it('flags escalation for critical urgency', () => {
    const result = classifyTicket({
      subject: 'Production down',
      message: 'This is an emergency outage, completely unacceptable, need help immediately',
    })
    expect(result.escalate).toBe(true)
    expect(result.urgency).toBe('critical')
  })

  it('does not escalate low-urgency tickets', () => {
    const result = classifyTicket({ subject: 'Question', message: 'How do I export my data?' })
    expect(result.escalate).toBe(false)
  })
})
