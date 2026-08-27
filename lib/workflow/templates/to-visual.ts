import type { Edge, Node } from '@xyflow/react'

import type { ScaledNode, ScaledWorkflowDefinition } from '@/lib/workflow/engine'
import type { NodeTypeKey } from '@/components/workflow/node-catalog'

const TYPE_MAP: Record<Exclude<ScaledNode['type'], 'end'>, NodeTypeKey> = {
  trigger: 'webhook-trigger',
  llm: 'ai-classify',
  action: 'notify',
  condition: 'condition',
  delay: 'delay',
  loop: 'loop',
  webhook: 'api-call',
  parallel: 'api-call',
}

const COLUMN_WIDTH = 280
const ROW_HEIGHT = 150

export function convertTemplateToVisual(definition: ScaledWorkflowDefinition): { nodes: Node[]; edges: Edge[] } {
  const nodeById = new Map(definition.nodes.map((node) => [node.id, node]))
  const nodes: Node[] = []
  const edges: Edge[] = []
  const columnByNode = new Map<string, number>()
  const rowsUsedByColumn = new Map<number, number>()

  function place(id: string, column: number): { x: number; y: number } | null {
    if (columnByNode.has(id)) return null
    columnByNode.set(id, column)
    const row = rowsUsedByColumn.get(column) ?? 0
    rowsUsedByColumn.set(column, row + 1)
    return { x: column * COLUMN_WIDTH, y: row * ROW_HEIGHT }
  }

  function addNode(node: ScaledNode, column: number) {
    if (node.type === 'end') return
    const position = place(node.id, column)
    if (!position) return
    nodes.push({
      id: node.id,
      type: 'workflow',
      position,
      data: { typeKey: TYPE_MAP[node.type], label: node.label },
    })
  }

  function addEdge(source: string, target: string, sourceHandle?: string, label?: string) {
    const targetNode = nodeById.get(target)
    if (!targetNode || targetNode.type === 'end') return
    edges.push({
      id: `e-${source}-${target}-${sourceHandle ?? 'default'}`,
      source,
      target,
      ...(sourceHandle ? { sourceHandle } : {}),
      ...(label ? { label } : {}),
    })
  }

  function walk(id: string | undefined, column: number, visited: Set<string>) {
    if (!id || visited.has(id)) return
    visited.add(id)
    const node = nodeById.get(id)
    if (!node) return
    addNode(node, column)

    if (node.type === 'condition') {
      if (node.trueNext) {
        addEdge(node.id, node.trueNext, 'true', 'Yes')
        walk(node.trueNext, column + 1, visited)
      }
      if (node.falseNext) {
        addEdge(node.id, node.falseNext, 'false', 'No')
        walk(node.falseNext, column + 1, visited)
      }
      return
    }

    if (node.type === 'loop') {
      const body = node.body ?? []
      for (const childId of body) {
        addEdge(node.id, childId)
        walk(childId, column + 1, visited)
      }
      if (node.next) {
        addEdge(node.id, node.next)
        walk(node.next, column + 1 + body.length, visited)
      }
      return
    }

    if (node.type === 'parallel') {
      const branches = node.branches ?? []
      for (const branch of branches) {
        let prev = node.id
        let branchColumn = column + 1
        for (const childId of branch) {
          addEdge(prev, childId)
          walk(childId, branchColumn, visited)
          prev = childId
          branchColumn += 1
        }
      }
      if (node.next) {
        const longestBranch = Math.max(0, ...branches.map((branch) => branch.length))
        addEdge(node.id, node.next)
        walk(node.next, column + 1 + longestBranch, visited)
      }
      return
    }

    if (node.next) {
      addEdge(node.id, node.next)
      walk(node.next, column + 1, visited)
    }
  }

  walk(definition.startNodeId, 0, new Set())

  return { nodes, edges }
}
