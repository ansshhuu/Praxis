import type { Collection, ObjectId } from 'mongodb'
import { getMongoDb } from '@/lib/db/mongodb'

export const CALENDAR_EVENTS_COLLECTION = 'calendar_events'

export interface CalendarEvent {
  _id?: ObjectId
  userId: string
  orgId: string
  title: string
  attendees: string[]
  startsAt: Date
  endsAt: Date
  createdAt: Date
}

export async function getCalendarEventsCollection(): Promise<Collection<CalendarEvent>> {
  const db = await getMongoDb()
  return db.collection<CalendarEvent>(CALENDAR_EVENTS_COLLECTION)
}

export async function ensureCalendarEventsIndexes(): Promise<void> {
  const collection = await getCalendarEventsCollection()
  await collection.createIndexes([
    { key: { userId: 1, createdAt: -1 } },
    { key: { startsAt: 1 } },
  ])
}
