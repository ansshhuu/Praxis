'use client'

import { Inbox, MoreHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

import { UserAvatar } from './user-avatar'
import type { RunRow, RunStatus } from '@/lib/dashboard/types'

const STATUS_STYLES: Record<RunStatus, { pill: string; dot: string; label: string }> = {
  SUCCESS: { pill: 'bg-green-100 text-green-700', dot: 'bg-green-500', label: 'Success' },
  RUNNING: { pill: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500 animate-pulse', label: 'Running' },
  FAILED: { pill: 'bg-red-100 text-red-700', dot: 'bg-red-500', label: 'Failed' },
}

function StatusPill({ status }: { status: RunStatus }) {
  const style = STATUS_STYLES[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
        style.pill,
      )}
    >
      <span className={cn('size-1.5 rounded-full', style.dot)} />
      {style.label}
    </span>
  )
}

function formatDuration(ms: number | null): string {
  if (ms === null) return '-'
  if (ms < 1000) return `${ms}ms`
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`
}

function formatStarted(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function RecentRunsTable({
  rows,
  page,
  perPage,
  total,
  onPageChange,
}: {
  rows: RunRow[]
  page: number
  perPage: number
  total: number
  onPageChange: (page: number) => void
}) {
  const router = useRouter()
  const totalPages = Math.max(1, Math.ceil(total / perPage))
  const first = total === 0 ? 0 : (page - 1) * perPage + 1
  const last = Math.min(page * perPage, total)
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1,
  )

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent Workflow Runs</CardTitle>
        <p className="mt-1 text-[13px] text-gray-500">Latest automation executions across your workspace</p>
      </CardHeader>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-[#FFFAEC] text-[#D4A017]">
            <Inbox className="size-6" />
          </div>
          <p className="text-sm font-semibold text-gray-900">No workflow runs yet</p>
          <p className="max-w-sm text-[13px] text-gray-500">
            Once your automations start running, their execution history appears here.
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Workflow</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Executed By</TableHead>
                  <TableHead>Started At</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-semibold text-gray-900">{run.workflow}</TableCell>
                    <TableCell>
                      <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11.5px] font-medium text-gray-600">
                        {run.trigger}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusPill status={run.status} />
                    </TableCell>
                    <TableCell className="tabular-nums text-gray-500">
                      {formatDuration(run.durationMs)}
                    </TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <UserAvatar
                          name={run.executedBy}
                          src={run.executedByAvatar}
                          className="size-6"
                        />
                        <span className="text-gray-700">{run.executedBy}</span>
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-gray-500">
                      {formatStarted(run.startedAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          aria-label={`Actions for ${run.workflow}`}
                          className="flex size-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-50 hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:outline-none"
                        >
                          <MoreHorizontal className="size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => router.push('/workflows')}>
                            Open workflow
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push('/analytics')}>
                            View analytics
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-6 pt-4">
            <p className="text-[12.5px] text-gray-500">
              Showing {first}-{last} of {total.toLocaleString('en-US')} runs
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="rounded-md px-2.5 py-1 text-[12.5px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-40"
              >
                Prev
              </button>
              {pages.map((n, index) => (
                <span key={n} className="flex items-center gap-1">
                  {index > 0 && n - pages[index - 1] > 1 && (
                    <span className="px-1 text-[12.5px] text-gray-300">…</span>
                  )}
                  <button
                    type="button"
                    onClick={() => onPageChange(n)}
                    aria-current={n === page ? 'page' : undefined}
                    className={cn(
                      'min-w-7 rounded-md px-2 py-1 text-[12.5px] font-semibold transition-colors',
                      n === page
                        ? 'bg-[#FFFAEC] text-[#D4A017]'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                    )}
                  >
                    {n}
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="rounded-md px-2.5 py-1 text-[12.5px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 disabled:pointer-events-none disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}

export function RecentRunsTableSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <div className="space-y-3 px-6 pb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-40 flex-1" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="hidden h-4 w-14 sm:block" />
            <Skeleton className="hidden h-4 w-28 md:block" />
          </div>
        ))}
      </div>
    </Card>
  )
}
