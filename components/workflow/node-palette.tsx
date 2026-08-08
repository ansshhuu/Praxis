'use client'

import { useState } from 'react'

import { categoryStyles, nodeColor, nodeTint, paletteGroups, type NodeTypeDef } from './node-catalog'

function groupLabel(category: NodeTypeDef['category']) {
  return category === 'action' ? 'Actions' : `${categoryStyles[category].label}s`
}

function PaletteCard({ def }: { def: NodeTypeDef }) {
  const color = nodeColor(def)
  const tint  = nodeTint(def)
  const Icon  = def.icon

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/reactflow', def.key)
        e.dataTransfer.effectAllowed = 'move'
      }}
      title={def.description}
      className="flex cursor-grab items-center gap-2.5 rounded-xl border border-border bg-card px-2.5 py-2 shadow-xs transition-colors hover:border-primary/40 hover:bg-accent active:cursor-grabbing"
    >
      {/* Icon badge: 36 × 36 px rounded-xl chip */}
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: tint, color }}
      >
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <span className="truncate text-sm font-medium text-foreground">
        {def.label}
      </span>
    </div>
  )
}

type TooltipState = { label: string; top: number; left: number }

function RailItem({
  def,
  onHover,
}: {
  def: NodeTypeDef
  onHover: (tooltip: TooltipState | null) => void
}) {
  const color = nodeColor(def)
  const tint  = nodeTint(def)
  const Icon  = def.icon

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/reactflow', def.key)
        e.dataTransfer.effectAllowed = 'move'
        onHover(null)
      }}
      onMouseEnter={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        onHover({
          label: def.label,
          top: rect.top + rect.height / 2,
          left: rect.right + 10,
        })
      }}
      onMouseLeave={() => onHover(null)}
      aria-label={def.label}
      className="flex size-12 cursor-grab items-center justify-center rounded-xl transition-colors hover:bg-accent active:cursor-grabbing"
    >
      {/* Icon badge: 36 × 36 px rounded-xl chip */}
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: tint, color }}
      >
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
    </div>
  )
}

/**
 * Icon-only rail shown when the sidebar is dragged to its minimum width.
 *
 * The tooltip is positioned `fixed` from the hovered item's rect rather than
 * nested inside it: the rail scrolls, so an absolutely positioned bubble would
 * be clipped by the scroll container.
 */
function PaletteRail() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  return (
    <>
      <div
        // Scrolling stays available for short viewports; the bar itself is
        // hidden so the narrow rail doesn't read as cramped.
        className="flex h-full w-full flex-col items-center gap-1 overflow-y-auto border-r border-border bg-card py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onMouseLeave={() => setTooltip(null)}
      >
        {paletteGroups.map((group, index) => (
          <div key={group.category} className="flex w-full flex-col items-center gap-1">
            {index > 0 && <span className="my-1.5 h-px w-6 rounded-full bg-border" />}
            <span className="sr-only">{groupLabel(group.category)}</span>
            {group.items.map((def) => (
              <RailItem key={def.key} def={def} onHover={setTooltip} />
            ))}
          </div>
        ))}
      </div>

      {tooltip && (
        <div
          role="tooltip"
          style={{ top: tooltip.top, left: tooltip.left }}
          className="pointer-events-none fixed z-50 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-md"
        >
          {tooltip.label}
        </div>
      )}
    </>
  )
}

export function NodePalette({ collapsed = false }: { collapsed?: boolean }) {
  if (collapsed) return <PaletteRail />

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto border-r border-border bg-card [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
              {groupLabel(group.category)}
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
