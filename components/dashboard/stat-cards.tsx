import { TrendingDown, TrendingUp } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { statCards } from '@/lib/dashboard-data'

export function StatCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statCards.map((stat) => {
        const Icon = stat.icon
        const up = stat.trendDirection === 'up'
        const TrendIcon = up ? TrendingUp : TrendingDown
        return (
          <Card key={stat.id}>
            <CardContent className="flex flex-col gap-4 py-5 px-6">
              <div className="flex items-start justify-between">
                <div className="flex size-10 items-center justify-center rounded-xl bg-[#FFFAEC] text-[#D4A017] border border-[#F5CA50]/30">
                  <Icon className="size-5" />
                </div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                    up
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700',
                  )}
                >
                  <TrendIcon className="size-3" />
                  {stat.trend}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-3xl font-bold tracking-tight text-gray-900">
                  {stat.value}
                </p>
                <p className="text-sm font-medium text-gray-500">
                  {stat.label}
                </p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="shadow-sm">
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="flex items-start justify-between">
              <Skeleton className="size-10 rounded-lg" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-4 w-28" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
