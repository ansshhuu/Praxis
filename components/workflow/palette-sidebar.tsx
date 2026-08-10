'use client'

import { ResizeHandle, useResizablePanel } from '@/components/ui/resizable-panel'
import { NodePalette } from './node-palette'

const STORAGE_KEY = 'xqora.workflow.palette'

export const PALETTE_RAIL_WIDTH = 64
export const PALETTE_MIN_WIDTH = 180
export const PALETTE_MAX_WIDTH = 400
export const PALETTE_DEFAULT_WIDTH = 224

const COLLAPSE_THRESHOLD = 120

export function PaletteSidebar() {
  const panel = useResizablePanel({
    storageKey: STORAGE_KEY,
    railWidth: PALETTE_RAIL_WIDTH,
    minWidth: PALETTE_MIN_WIDTH,
    maxWidth: PALETTE_MAX_WIDTH,
    defaultWidth: PALETTE_DEFAULT_WIDTH,
    collapseThreshold: COLLAPSE_THRESHOLD,
  })

  return (
    <div className={panel.containerClassName} style={{ width: panel.width }}>
      <NodePalette collapsed={panel.collapsed} />
      <ResizeHandle panel={panel} label="Resize node palette" />
    </div>
  )
}
