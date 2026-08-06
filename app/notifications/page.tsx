'use client'

import {
  Bell,
  Mail,
  MessageSquare,
  Phone,
  Slack,
} from 'lucide-react'
import { useState } from 'react'

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
import {
  getChannelSettings,
  getNotifications,
  type ChannelSettings,
  type Notification,
  type NotificationChannel,
  type NotificationStatus,
} from '@/lib/mock-data/notifications'

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  Skipped: 'bg-muted text-muted-foreground',
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
          status === 'Skipped' && 'bg-muted-foreground',
        )}
      />
      {status}
    </span>
  )
}

// ─── Toggle Switch ─────────────────────────────────────────────────────────────

function Toggle({ enabled, onChange, id }: { enabled: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        enabled ? 'bg-primary' : 'bg-muted',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform',
          enabled ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

// ─── Channel Settings ──────────────────────────────────────────────────────────

function ChannelSettingsSection() {
  const initial = getChannelSettings()
  const [settings, setSettings] = useState<ChannelSettings[]>(initial)

  function toggle(channel: NotificationChannel) {
    setSettings((prev) =>
      prev.map((s) => (s.channel === channel ? { ...s, enabled: !s.enabled } : s)),
    )
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Notification Channels</CardTitle>
        <CardDescription>Enable or disable delivery channels for system notifications</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {settings.map((s) => (
          <div key={s.channel} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn('flex size-9 items-center justify-center rounded-lg', channelColors[s.channel])}>
                {channelIcons[s.channel]}
              </div>
              <div>
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
            </div>
            <Toggle
              enabled={s.enabled}
              onChange={() => toggle(s.channel)}
              id={`toggle-${s.channel}`}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// ─── Notification Log ─────────────────────────────────────────────────────────

function NotificationLog({ notifications }: { notifications: Notification[] }) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Notification Log</CardTitle>
        <CardDescription>{notifications.length} recent notifications across all channels</CardDescription>
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
            {notifications.map((n) => (
              <TableRow key={n.id} id={`notification-row-${n.id}`}>
                <TableCell><ChannelChip channel={n.channel} /></TableCell>
                <TableCell className="max-w-xs">
                  <p className="truncate text-sm font-medium text-foreground">{n.message}</p>
                  {n.workflowName && (
                    <p className="text-xs text-muted-foreground">{n.workflowName}</p>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{n.recipient}</TableCell>
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

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const notifications = getNotifications()

  return (
    <DashboardShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage delivery channels and view notification history
          </p>
        </div>

        <ChannelSettingsSection />
        <NotificationLog notifications={notifications} />
      </div>
    </DashboardShell>
  )
}
