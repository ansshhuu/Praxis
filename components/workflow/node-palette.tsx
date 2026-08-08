'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

import { categoryStyles, nodeColor, nodeTint, paletteGroups, type NodeTypeDef } from './node-catalog'
import { cn } from '@/lib/utils'

function groupLabel(category: NodeTypeDef['category']) {
  if (category === 'trigger') return 'Triggers'
  if (category === 'action') return 'Actions'
  if (category === 'integration') return 'Integrations'
  if (category === 'logic') return 'Logic'
  return `${categoryStyles[category].label}s`
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
      className="flex cursor-grab items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm transition-colors hover:border-[#F5CA50]/50 hover:bg-[#FFFAEC] active:cursor-grabbing"
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm border border-black/5"
        style={{ background: tint, color }}
      >
        <Icon className="size-4" strokeWidth={2} />
      </span>
      <span className="truncate text-[13px] font-bold text-gray-900">
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
      className="flex size-12 cursor-grab items-center justify-center rounded-xl transition-colors hover:bg-gray-50 active:cursor-grabbing"
    >
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-xl shadow-sm border border-black/5"
        style={{ background: tint, color }}
      >
        <Icon className="size-4" strokeWidth={2} />
      </span>
    </div>
  )
}

function PaletteRail() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  return (
    <>
      <div
        className="flex h-full w-full flex-col items-center gap-2 overflow-y-auto border-r border-gray-100 bg-white py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onMouseLeave={() => setTooltip(null)}
      >
        {paletteGroups.map((group, index) => (
          <div key={group.category} className="flex w-full flex-col items-center gap-1.5">
            {index > 0 && <span className="my-1.5 h-px w-8 rounded-full bg-gray-100" />}
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
          className="pointer-events-none fixed z-50 -translate-y-1/2 whitespace-nowrap rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-gray-900 shadow-md uppercase tracking-wide"
        >
          {tooltip.label}
        </div>
      )}
    </>
  )
}

export function NodePalette({ collapsed = false }: { collapsed?: boolean }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const acc: Record<string, boolean> = {}
    for (const group of paletteGroups) {
      acc[group.category] = true
    }
    return acc
  })

  const toggleCategory = (category: string) => {
    setExpanded(prev => ({ ...prev, [category]: !prev[category] }))
  }

  if (collapsed) return <PaletteRail />

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto border-r border-gray-100 bg-white [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="border-b border-gray-100 px-5 py-4 shrink-0">
        <h2 className="text-[15px] font-bold text-gray-900">Nodes</h2>
        <p className="mt-0.5 text-[12px] font-medium text-gray-500">
          Drag onto the canvas
        </p>
      </div>
      <div className="flex flex-col">
        {paletteGroups.map((group) => {
          const isExpanded = expanded[group.category]
          return (
            <div key={group.category} className="border-b border-gray-100">
              <button
                onClick={() => toggleCategory(group.category)}
                className="flex w-full items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <span className="text-[12px] font-bold uppercase tracking-widest text-gray-900">
                  {groupLabel(group.category)}
                </span>
                <span className="text-gray-400">
                  {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </span>
              </button>
              {isExpanded && (
                <div className="flex flex-col gap-2 px-4 pb-4">
                  {group.items.map((def) => (
                    <PaletteCard key={def.key} def={def} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
