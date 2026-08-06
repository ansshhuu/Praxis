'use client'

import {
  Background,
  BackgroundVariant,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Maximize,
  MonitorPlay,
  MoveLeft,
  Play,
  Redo2,
  Save,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  categoryStyles,
  nodeTypesByKey,
  type NodeTypeKey,
} from './node-catalog'
import { NodeConfigDrawer } from './node-config-drawer'
import { NodePalette } from './node-palette'
import { WorkflowNode, type WorkflowNodeData } from './workflow-node'

const rfNodeTypes = { workflow: WorkflowNode }

const initialNodes: Node[] = [
  { id: 'n1', type: 'workflow', position: { x: 0, y: 170 }, data: { typeKey: 'email-trigger', label: 'Email Trigger' } },
  { id: 'n2', type: 'workflow', position: { x: 290, y: 170 }, data: { typeKey: 'ai-classify', label: 'AI Classify' } },
  { id: 'n3', type: 'workflow', position: { x: 580, y: 170 }, data: { typeKey: 'condition', label: 'Condition' } },
  { id: 'n4', type: 'workflow', position: { x: 880, y: 60 }, data: { typeKey: 'save-db', label: 'Save to DB' } },
  { id: 'n5', type: 'workflow', position: { x: 1170, y: 60 }, data: { typeKey: 'notify', label: 'Notify' } },
  { id: 'n6', type: 'workflow', position: { x: 880, y: 300 }, data: { typeKey: 'email-action', label: 'Escalate via Email' } },
]

const edgeBase = {
  type: 'default',
  markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
  style: { strokeWidth: 2, stroke: '#94a3b8' },
}

const initialEdges: Edge[] = [
  { id: 'e1', source: 'n1', target: 'n2', ...edgeBase },
  { id: 'e2', source: 'n2', target: 'n3', ...edgeBase },
  {
    id: 'e3',
    source: 'n3',
    sourceHandle: 'true',
    target: 'n4',
    label: 'Billing',
    ...edgeBase,
    style: { strokeWidth: 2, stroke: '#16a34a' },
  },
  { id: 'e4', source: 'n4', target: 'n5', ...edgeBase },
  {
    id: 'e5',
    source: 'n3',
    sourceHandle: 'false',
    target: 'n6',
    label: 'else',
    ...edgeBase,
    style: { strokeWidth: 2, stroke: '#ea580c' },
  },
]

type Snapshot = { nodes: Node[]; edges: Edge[] }

function ToolbarButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  )
}

function Flow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState<'Draft' | 'Active'>('Draft')
  const [name, setName] = useState('Untitled Workflow')
  const [past, setPast] = useState<Snapshot[]>([])
  const [future, setFuture] = useState<Snapshot[]>([])

  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow()
  const wrapperRef = useRef<HTMLDivElement>(null)

  const nodesRef = useRef(nodes)
  nodesRef.current = nodes
  const edgesRef = useRef(edges)
  edgesRef.current = edges

  const commit = useCallback(() => {
    setPast((p) => [...p, { nodes: nodesRef.current, edges: edgesRef.current }])
    setFuture([])
  }, [])

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p
      const prev = p[p.length - 1]
      setFuture((f) => [{ nodes: nodesRef.current, edges: edgesRef.current }, ...f])
      setNodes(prev.nodes)
      setEdges(prev.edges)
      setSelectedId(null)
      return p.slice(0, -1)
    })
  }, [setNodes, setEdges])

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f
      const next = f[0]
      setPast((p) => [...p, { nodes: nodesRef.current, edges: edgesRef.current }])
      setNodes(next.nodes)
      setEdges(next.edges)
      setSelectedId(null)
      return f.slice(1)
    })
  }, [setNodes, setEdges])

  const onConnect = useCallback(
    (connection: Connection) => {
      commit()
      setEdges((eds) => addEdge({ ...connection, ...edgeBase }, eds))
    },
    [commit, setEdges],
  )

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const key = event.dataTransfer.getData('application/reactflow') as NodeTypeKey
      if (!key || !nodeTypesByKey[key]) return
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY })
      const def = nodeTypesByKey[key]
      commit()
      setNodes((nds) =>
        nds.concat({
          id: `n-${Date.now()}`,
          type: 'workflow',
          position,
          data: { typeKey: key, label: def.label },
        }),
      )
    },
    [screenToFlowPosition, commit, setNodes],
  )

  const deleteNode = useCallback(
    (id: string) => {
      commit()
      setNodes((nds) => nds.filter((n) => n.id !== id))
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
      setSelectedId(null)
    },
    [commit, setNodes, setEdges],
  )

  // Sequential "running" animation across the nodes.
  useEffect(() => {
    if (!running) return
    const order = nodesRef.current.map((n) => n.id)
    if (order.length === 0) {
      setRunning(false)
      return
    }
    let i = 0
    const paint = () => {
      setNodes((nds) =>
        nds.map((n) => {
          const idx = order.indexOf(n.id)
          const nextStatus =
            idx === i ? 'running' : idx > -1 && idx < i ? 'done' : 'idle'
          return { ...n, data: { ...n.data, status: nextStatus } }
        }),
      )
    }
    setEdges((eds) => eds.map((e) => ({ ...e, animated: true })))
    paint()
    const interval = setInterval(() => {
      i += 1
      if (i >= order.length) {
        clearInterval(interval)
        setNodes((nds) =>
          nds.map((n) => ({ ...n, data: { ...n.data, status: 'done' } })),
        )
        window.setTimeout(() => {
          setRunning(false)
          setStatus('Active')
          setEdges((eds) => eds.map((e) => ({ ...e, animated: false })))
          setNodes((nds) =>
            nds.map((n) => ({ ...n, data: { ...n.data, status: 'idle' } })),
          )
        }, 1100)
        return
      }
      paint()
    }, 850)
    return () => clearInterval(interval)
  }, [running, setNodes, setEdges])

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null
  const isEmpty = nodes.length === 0

  const minimapColor = useMemo(
    () => (node: Node) => {
      const data = node.data as WorkflowNodeData
      const def = nodeTypesByKey[data.typeKey]
      return def ? categoryStyles[def.category].color : '#94a3b8'
    },
    [],
  )

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      {/* Page header */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border bg-card px-4 py-3 md:px-6">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Workflow name"
          className="h-9 w-48 border-transparent bg-transparent px-2 text-base font-semibold shadow-none hover:border-border focus-visible:border-ring md:w-64"
        />
        <Badge
          variant="outline"
          className={cn(
            'gap-1.5',
            status === 'Active'
              ? 'border-[#16a34a]/30 bg-[#16a34a]/10 text-[#16a34a]'
              : 'text-muted-foreground',
          )}
        >
          <span
            className={cn(
              'size-1.5 rounded-full',
              status === 'Active' ? 'bg-[#16a34a]' : 'bg-muted-foreground',
            )}
          />
          {status}
        </Badge>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => !running && setRunning(true)}
            disabled={running}
          >
            <Play className="size-4" />
            {running ? 'Running…' : 'Run'}
          </Button>
          <Button onClick={() => setStatus('Active')}>
            <Save className="size-4" />
            Save
          </Button>
        </div>
      </div>

      {/* Builder area */}
      <div className="flex min-h-0 flex-1">
        {/* Palette */}
        <div className="w-56 shrink-0">
          <NodePalette />
        </div>

        {/* Canvas */}
        <div className="relative min-w-0 flex-1" ref={wrapperRef}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            onPaneClick={() => setSelectedId(null)}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={rfNodeTypes}
            defaultEdgeOptions={edgeBase}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
            className="bg-background"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#cbd5e1" />
            <MiniMap
              position="bottom-right"
              pannable
              zoomable
              nodeColor={minimapColor}
              nodeStrokeWidth={2}
              className="!bottom-4 !right-4 overflow-hidden rounded-lg border border-border !bg-card shadow-sm"
            />

            {/* Floating toolbar */}
            <Panel position="bottom-left">
              <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-1 shadow-sm">
                <ToolbarButton label="Undo" onClick={undo} disabled={past.length === 0}>
                  <Undo2 className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Redo" onClick={redo} disabled={future.length === 0}>
                  <Redo2 className="size-4" />
                </ToolbarButton>
                <span className="mx-0.5 h-5 w-px bg-border" />
                <ToolbarButton label="Zoom in" onClick={() => zoomIn()}>
                  <ZoomIn className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Zoom out" onClick={() => zoomOut()}>
                  <ZoomOut className="size-4" />
                </ToolbarButton>
                <ToolbarButton label="Fit view" onClick={() => fitView({ padding: 0.2 })}>
                  <Maximize className="size-4" />
                </ToolbarButton>
              </div>
            </Panel>
          </ReactFlow>

          {/* Empty state overlay */}
          {isEmpty && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <MoveLeft className="size-6 animate-pulse" />
                  <span className="text-sm">Pick a node from the palette</span>
                </div>
                <div className="flex h-40 w-72 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card/50 px-6">
                  <p className="text-sm font-medium text-foreground">
                    Drag a node here to start building
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Triggers, actions and logic snap together
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Config drawer */}
          <NodeConfigDrawer
            nodeId={selectedId}
            data={(selectedNode?.data as WorkflowNodeData) ?? null}
            onClose={() => setSelectedId(null)}
            onDelete={deleteNode}
          />
        </div>
      </div>
    </div>
  )
}

export function WorkflowBuilder() {
  return (
    <>
      {/* Desktop / large screens: full builder */}
      <div className="hidden lg:block">
        <ReactFlowProvider>
          <Flow />
        </ReactFlowProvider>
      </div>

      {/* Mobile & tablet: not supported */}
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center px-6 lg:hidden">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <MonitorPlay className="size-7" />
          </span>
          <h2 className="text-lg font-semibold text-foreground text-balance">
            Workflow Builder works best on desktop
          </h2>
          <p className="text-sm text-muted-foreground text-pretty">
            The visual canvas needs a larger screen. Open this page on a desktop
            to design and connect your automation nodes.
          </p>
        </div>
      </div>
    </>
  )
}
