'use client'

import {
  Bell,
  Loader2,
  Mail,
  MessageSquare,
  Phone,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

type NotificationChannel = 'email' | 'sms' | 'push' | 'slack'
type NotificationStatus = 'Sent' | 'Pending' | 'Failed'

type ChannelSettings = {
  channel: NotificationChannel
  label: string
  description: string
}

const CHANNELS: ChannelSettings[] = [
  {
    channel: 'email',
    label: 'Email Notifications',
    description: 'Sent through Brevo by Notify and Email Action nodes',
  },
  {
    channel: 'sms',
    label: 'SMS Alerts',
    description: 'No SMS provider is connected yet',
  },
  {
    channel: 'push',
    label: 'Push Notifications',
    description: 'Recorded in the notification log only',
  },
  {
    channel: 'slack',
    label: 'Slack Integration',
    description: 'No Slack workspace is connected yet',
  },
]

interface ApiNotification {
  id: string
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'SLACK'
  message: string
  recipient: string | null
  status: 'PENDING' | 'SENT' | 'FAILED'
  createdAt: string
}

interface Notification {
  id: string
  channel: NotificationChannel
  message: string
  recipient: string | null
  status: NotificationStatus
  timestamp: string
}

const channelByType: Record<ApiNotification['type'], NotificationChannel> = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  SLACK: 'slack',
}

const statusByApiStatus: Record<ApiNotification['status'], NotificationStatus> = {
  SENT: 'Sent',
  PENDING: 'Pending',
  FAILED: 'Failed',
}

function toNotification(row: ApiNotification): Notification {
  return {
    id: row.id,
    channel: channelByType[row.type] ?? 'push',
    message: row.message,
    recipient: row.recipient?.trim() ? row.recipient.trim() : null,
    status: statusByApiStatus[row.status] ?? 'Pending',
    timestamp: new Date(row.createdAt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}

const channelIcons: Record<NotificationChannel, React.ReactNode> = {
  email: <Mail className="size-4" />,
  sms: <Phone className="size-4" />,
  push: <Bell className="size-4" />,
  slack: <MessageSquare className="size-4" />,
}

const channelColors: Record<NotificationChannel, string> = {
  email: 'bg-blue-100 text-blue-600',
  sms: 'bg-green-100 text-green-600',
  push: 'bg-violet-100 text-violet-600',
  slack: 'bg-pink-100 text-pink-600',
}

const statusStyles: Record<NotificationStatus, string> = {
  Sent: 'bg-success/10 text-success',
  Pending: 'bg-warning/15 text-warning',
  Failed: 'bg-destructive/10 text-destructive',
}

function ChannelChip({ channel }: { channel: NotificationChannel }) {
  return (
    <span className={cn('flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', channelColors[channel])}>
      {channelIcons[channel]}
      {channel.charAt(0).toUpperCase() + channel.slice(1)}
    </span>
  )
}

function StatusBadge({ status }: { status: NotificationStatus }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium', statusStyles[status])}>
      <span
        className={cn(
          'size-1.5 rounded-full',
          status === 'Sent' && 'bg-success',
          status === 'Pending' && 'animate-pulse bg-warning',
          status === 'Failed' && 'bg-destructive',
        )}
      />
      {status}
    </span>
  )
}

function ChannelSettingsSection({ notifications }: { notifications: Notification[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Notification Channels</CardTitle>
        <CardDescription>Delivery activity recorded against each channel</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {CHANNELS.map((channel) => {
          const rows = notifications.filter((n) => n.channel === channel.channel)
          const sent = rows.filter((n) => n.status === 'Sent').length
          const failed = rows.filter((n) => n.status === 'Failed').length

          return (
            <div key={channel.channel} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={cn('flex size-9 items-center justify-center rounded-lg', channelColors[channel.channel])}>
                  {channelIcons[channel.channel]}
                </div>
                <div>
                  <p className="text-sm font-medium">{channel.label}</p>
                  <p className="text-xs text-muted-foreground">{channel.description}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold tabular-nums text-foreground">
                  {sent} sent
                </p>
                <p className="text-xs tabular-nums text-muted-foreground">
                  {failed > 0 ? `${failed} failed` : rows.length === 0 ? 'no activity' : 'no failures'}
                </p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function NotificationLog({
  notifications,
  loading,
  error,
}: {
  notifications: Notification[]
  loading: boolean
  error: string | null
}) {
  const description = loading
    ? 'Loading notifications…'
    : error
      ? error
      : `${notifications.length} recent notifications across all channels`

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Notification Log</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Channel</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Loading notifications…
                  </span>
                </TableCell>
              </TableRow>
            )}
            {!loading && notifications.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No notifications yet - run a workflow with a Notify node to see them here.
                </TableCell>
              </TableRow>
            )}
            {notifications.map((n) => (
              <TableRow key={n.id} id={`notification-row-${n.id}`}>
                <TableCell><ChannelChip channel={n.channel} /></TableCell>
                <TableCell className="max-w-xs">
                  <p className="truncate text-sm font-medium text-foreground">{n.message}</p>
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                  {n.recipient ?? 'You'}
                </TableCell>
                <TableCell><StatusBadge status={n.status} /></TableCell>
                <TableCell className="text-sm text-muted-foreground tabular-nums">{n.timestamp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch('/api/notifications')
        const body = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(body.error ?? 'Could not load notifications.')
        if (!cancelled) {
          setNotifications((body.notifications as ApiNotification[]).map(toNotification))
        }
      } catch (loadError) {
        if (!cancelled) setError((loadError as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <DashboardShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage delivery channels and view notification history
          </p>
        </div>

        <ChannelSettingsSection notifications={notifications} />
        <NotificationLog notifications={notifications} loading={loading} error={error} />
      </div>
    </DashboardShell>
  )
}
