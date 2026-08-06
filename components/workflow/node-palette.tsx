'use client'

import { categoryStyles, paletteGroups, type NodeTypeDef } from './node-catalog'

function PaletteCard({ def }: { def: NodeTypeDef }) {
  const style = categoryStyles[def.category]
  const Icon = def.icon

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/reactflow', def.key)
        e.dataTransfer.effectAllowed = 'move'
      }}
      title={def.description}
      className="flex cursor-grab items-center gap-2.5 rounded-lg border border-border bg-card px-2.5 py-2 shadow-xs transition-colors hover:border-primary/40 hover:bg-accent active:cursor-grabbing"
    >
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-md"
        style={{ background: style.tint, color: style.color }}
      >
        <Icon className="size-4" />
      </span>
      <span className="truncate text-sm font-medium text-foreground">
        {def.label}
      </span>
    </div>
  )
}

export function NodePalette() {
  return (
    <div className="flex h-full w-full flex-col overflow-y-auto border-r border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Nodes</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Drag onto the canvas
        </p>
      </div>
      <div className="flex flex-col gap-5 p-3">
        {paletteGroups.map((group) => (
          <div key={group.category}>
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {group.category === 'action'
                ? 'Actions'
                : `${categoryStyles[group.category].label}s`}
            </p>
            <div className="flex flex-col gap-1.5">
              {group.items.map((def) => (
                <PaletteCard key={def.key} def={def} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
