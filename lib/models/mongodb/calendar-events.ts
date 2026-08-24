import type { Collection, ObjectId } from 'mongodb'
import { getMongoDb } from '@/lib/db/mongodb'

export const CALENDAR_EVENTS_COLLECTION = 'calendar_events'

export interface CalendarEvent {
  _id?: ObjectId
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
  await collection.createIndexes([{ key: { startsAt: 1 } }])
}
