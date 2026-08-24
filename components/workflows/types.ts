export type WorkflowTemplateCategory = 'HR' | 'Sales' | 'IT' | 'DevOps' | 'Marketing' | 'Support'

export interface WorkflowTemplateView {
  id: string
  name: string
  category: WorkflowTemplateCategory
  description: string
  tags: string[]
  nodeCount: number
}

export type NodeExecutionStatus = 'running' | 'success' | 'failed'

export interface NodeExecutionRecordView {
  nodeId: string
  status: NodeExecutionStatus
  startedAt: string
  finishedAt?: string
  input?: unknown
  output?: unknown
  children?: NodeExecutionRecordView[]
}

export interface WorkflowRunTraceView {
  _id?: string
  workflowId: string
  runId: string
  triggeredBy: string
  status: NodeExecutionStatus
  nodeExecutionTree: NodeExecutionRecordView[]
  executionTime: number
  errorDetails: string | null
  createdAt: string
}

export const WORKFLOW_CATEGORIES: WorkflowTemplateCategory[] = ['HR', 'Sales', 'IT', 'DevOps', 'Marketing', 'Support']
