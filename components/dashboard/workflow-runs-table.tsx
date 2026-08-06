import { Inbox, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
import { workflowRuns, type RunStatus } from '@/lib/dashboard-data'

const statusStyles: Record<RunStatus, string> = {
  Success: 'bg-success/10 text-success',
  Failed: 'bg-destructive/10 text-destructive',
  Running: 'bg-warning/15 text-warning',
}

function StatusBadge({ status }: { status: RunStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status],
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          status === 'Success' && 'bg-success',
          status === 'Failed' && 'bg-destructive',
          status === 'Running' && 'animate-pulse bg-warning',
        )}
      />
      {status}
    </span>
  )
}

export function WorkflowRunsTable() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Recent Workflow Runs</CardTitle>
        <CardDescription>Latest automation executions across your workspace</CardDescription>
      </CardHeader>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Status</TableHead>
              <TableHead>Workflow Name</TableHead>
              <TableHead>Triggered By</TableHead>
              <TableHead>Started At</TableHead>
              <TableHead className="text-right">Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflowRuns.map((run) => (
              <TableRow key={run.id}>
                <TableCell>
                  <StatusBadge status={run.status} />
                </TableCell>
                <TableCell className="font-medium text-foreground">
                  {run.name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {run.triggeredBy}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {run.startedAt}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {run.duration}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}

export function WorkflowRunsTableSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-72" />
      </CardHeader>
      <div className="space-y-3 px-6 pb-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-4 w-48 flex-1" />
            <Skeleton className="hidden h-4 w-24 sm:block" />
            <Skeleton className="hidden h-4 w-24 md:block" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </Card>
  )
}

export function WorkflowRunsEmptyState() {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Recent Workflow Runs</CardTitle>
        <CardDescription>Latest automation executions across your workspace</CardDescription>
      </CardHeader>
      <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Inbox className="size-7" />
        </div>
        <div className="space-y-1">
          <p className="text-base font-medium text-foreground">
            No workflow runs yet
          </p>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            Once your automations start running, their execution history will
            appear here.
          </p>
        </div>
        <Button>
          <Plus className="size-4" />
          Create workflow
        </Button>
      </div>
    </Card>
  )
}
