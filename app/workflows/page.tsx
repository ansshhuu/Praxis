import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { WorkflowBuilder } from '@/components/workflow/workflow-builder'

export default function WorkflowsPage() {
  return (
    <DashboardShell mainClassName="min-h-0 overflow-hidden">
      <WorkflowBuilder />
    </DashboardShell>
  )
}
