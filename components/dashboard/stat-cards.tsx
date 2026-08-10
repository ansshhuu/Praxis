'use client'

import { Activity, Cpu, ShieldCheck, TrendingDown, TrendingUp, Users, type LucideIcon } from 'lucide-react'

import { CountUp, StaggerGroup, StaggerItem, hoverCardClass } from '@/components/motion/primitives'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { DashboardStats, Trend } from '@/lib/dashboard/types'

type Tile = {
  id: string
  label: string
  icon: LucideIcon
  iconClass: string
  value: string
  trend: Trend
  note: string
  operational?: boolean
}

function buildTiles(stats: DashboardStats): Tile[] {
  return [
    {
      id: 'active-users',
      label: 'Active Users',
      icon: Users,
      iconClass: 'bg-[#FFFAEC] text-[#D4A017] border-[#F5CA50]/30',
      value: stats.activeUsers.value.toLocaleString('en-US'),
      trend: stats.activeUsers.trend,
      note: `of ${stats.activeUsers.totalUsers.toLocaleString('en-US')} total`,
    },
    {
      id: 'pending-workflows',
      label: 'Pending Workflows',
      icon: Activity,
      iconClass: 'bg-indigo-50 text-indigo-600 border-indigo-200/60',
      value: stats.pendingWorkflows.value.toLocaleString('en-US'),
      trend: stats.pendingWorkflows.trend,
      note: `${stats.pendingWorkflows.scheduled} scheduled`,
    },
    {
      id: 'ai-requests',
      label: 'AI Requests Today',
      icon: Cpu,
      iconClass: 'bg-orange-50 text-orange-600 border-orange-200/60',
      value: stats.aiRequestsToday.value.toLocaleString('en-US'),
      trend: stats.aiRequestsToday.trend,
      note: 'vs yesterday',
    },
    {
      id: 'uptime',
      label: 'Success Rate (30d)',
      icon: ShieldCheck,
      iconClass: 'bg-green-50 text-green-600 border-green-200/60',
      value: `${stats.uptime.pct}%`,
      trend: null,
      note: stats.uptime.operational ? 'Operational' : 'Degraded',
      operational: stats.uptime.operational,
    },
  ]
}

function TrendPill({ tile }: { tile: Tile }) {
  if (tile.operational !== undefined) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold',
          tile.operational ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
        )}
      >
        <span className={cn('size-1.5 rounded-full', tile.operational ? 'bg-green-500' : 'bg-red-500')} />
        {tile.note}
      </span>
    )
  }

  if (!tile.trend) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
        {tile.note}
      </span>
    )
  }

  const up = tile.trend.direction === 'up'
  const TrendIcon = up ? TrendingUp : TrendingDown
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
          up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700',
        )}
      >
        <TrendIcon className="size-3" />
        {tile.trend.pct}%
      </span>
      <span className="text-xs font-medium text-gray-400">{tile.note}</span>
    </span>
  )
}

export function StatCards({ stats }: { stats: DashboardStats }) {
  return (
    <StaggerGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" stagger={0.07}>
      {buildTiles(stats).map((tile) => {
        const Icon = tile.icon
        return (
          <StaggerItem key={tile.id} className="h-full">
            <Card className={cn('h-full', hoverCardClass)}>
              <CardContent className="flex flex-col gap-3.5 px-6 py-5">
                <div className="flex items-start justify-between">
                  <p className="text-[11px] font-bold tracking-[0.08em] text-gray-400 uppercase">
                    {tile.label}
                  </p>
                  <div className={cn('flex size-9 items-center justify-center rounded-full border', tile.iconClass)}>
                    <Icon className="size-[18px]" />
                  </div>
                </div>
                <p className="text-3xl font-bold tracking-tight text-gray-900">
                  <CountUp value={tile.value} />
                </p>
                <TrendPill tile={tile} />
              </CardContent>
            </Card>
          </StaggerItem>
        )
      })}
    </StaggerGroup>
  )
}

export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="flex flex-col gap-3.5 px-6 py-5">
            <div className="flex items-start justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="size-9 rounded-full" />
            </div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-5 w-28 rounded-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
