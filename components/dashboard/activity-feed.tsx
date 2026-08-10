'use client'

import { Loader2 } from 'lucide-react'
import Link from 'next/link'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import { UserAvatar } from './user-avatar'
import type { ActivityItem, ActivityTone } from '@/lib/dashboard/types'

const TONE_DOTS: Record<ActivityTone, string> = {
  success: 'bg-green-500',
  failed: 'bg-red-500',
  pending: 'bg-amber-500',
  info: 'bg-indigo-500',
}

function relativeTime(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function ActivityFeed({
  items,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  items: ActivityItem[]
  hasMore: boolean
  loadingMore: boolean
  onLoadMore: () => void
}) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between gap-4">
        <CardTitle>Recent Activity</CardTitle>
        <Link
          href="/notifications"
          className="shrink-0 text-[12.5px] font-semibold text-[#D4A017] hover:underline"
        >
          View All
        </Link>
      </CardHeader>

      <div className="flex flex-col px-6">
        {items.length === 0 && (
          <p className="py-10 text-center text-[13px] text-gray-400">No activity recorded yet.</p>
        )}

        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3 border-b border-gray-50 py-3 last:border-0">
            <span className={cn('mt-2 size-2 shrink-0 rounded-full', TONE_DOTS[item.tone])} />
            <UserAvatar name={item.actor} src={item.actorAvatar} className="size-7" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] leading-snug text-gray-700">
                <span className="font-semibold text-gray-900">{item.actor}</span>{' '}
                {item.description}
              </p>
              <p className="mt-0.5 text-[11.5px] text-gray-400">{relativeTime(item.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <div className="px-6 pb-1">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 py-2 text-[12.5px] font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:opacity-60"
          >
            {loadingMore && <Loader2 className="size-3.5 animate-spin" />}
            {loadingMore ? 'Loading…' : 'Load more activities'}
          </button>
        </div>
      )}
    </Card>
  )
}
