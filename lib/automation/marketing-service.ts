import { generateText } from '@/lib/ai/llm-gateway'
import { getCalendarEventsCollection, type CalendarEvent } from '@/lib/models/mongodb/calendar-events'
import {
  getMarketingPostsCollection,
  type MarketingPlatform,
  type MarketingPost,
} from '@/lib/models/mongodb/marketing-posts'

const PLATFORM_LIMITS: Record<MarketingPlatform, number> = {
  linkedin: 3000,
  twitter: 280,
}

const STOPWORDS = new Set(['the', 'and', 'for', 'with', 'that', 'this', 'from', 'your', 'you', 'are', 'our'])

export function suggestHashtags(topic: string, maxTags = 5): string[] {
  const words = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !STOPWORDS.has(word))

  const unique = Array.from(new Set(words))
  return unique.slice(0, maxTags).map((word) => `#${word}`)
}

export interface GeneratePostOptions {
  userId: string
  platform: MarketingPlatform
  topic: string
  tone: string
}

export async function generatePost(options: GeneratePostOptions): Promise<MarketingPost> {
  const limit = PLATFORM_LIMITS[options.platform]
  const hashtags = suggestHashtags(options.topic)

  const { text } = await generateText({
    messages: [
      {
        role: 'system',
        content: `Write a ${options.platform} post in a ${options.tone} tone, under ${limit} characters, about the given topic. Do not include hashtags in the body - they are added separately.`,
      },
      { role: 'user', content: options.topic },
    ],
    task: 'marketing-post',
    maxTokens: 400,
  })

  const collection = await getMarketingPostsCollection()
  const post: MarketingPost = {
    userId: options.userId,
    orgId: options.userId,
    platform: options.platform,
    topic: options.topic,
    content: text.slice(0, limit),
    hashtags,
    tone: options.tone,
    createdAt: new Date(),
  }

  const result = await collection.insertOne(post)
  return { ...post, _id: result.insertedId }
}

export interface TimeSlot {
  start: Date
  end: Date
}

export function findAvailableSlots(
  busySlots: TimeSlot[],
  workingHours: TimeSlot,
  durationMinutes: number,
): TimeSlot[] {
  const durationMs = durationMinutes * 60 * 1000
  const sorted = [...busySlots].sort((a, b) => a.start.getTime() - b.start.getTime())
  const available: TimeSlot[] = []
  let cursor = workingHours.start

  for (const busy of sorted) {
    if (busy.start.getTime() - cursor.getTime() >= durationMs) {
      available.push({ start: cursor, end: busy.start })
    }
    if (busy.end.getTime() > cursor.getTime()) {
      cursor = busy.end
    }
  }

  if (workingHours.end.getTime() - cursor.getTime() >= durationMs) {
    available.push({ start: cursor, end: workingHours.end })
  }

  return available
}

export interface ScheduleMeetingInput {
  userId: string
  title: string
  attendees: string[]
  startsAt: Date
  endsAt: Date
}

export async function scheduleMeeting(input: ScheduleMeetingInput): Promise<CalendarEvent> {
  const collection = await getCalendarEventsCollection()
  const event: CalendarEvent = {
    userId: input.userId,
    orgId: input.userId,
    title: input.title,
    attendees: input.attendees,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    createdAt: new Date(),
  }
  const result = await collection.insertOne(event)
  return { ...event, _id: result.insertedId }
}
