'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'
import { NodePalette } from './node-palette'

const STORAGE_KEY = 'xqora.workflow.palette'

/** Width of the icon-only rail the palette snaps to when dragged narrow. */
export const PALETTE_RAIL_WIDTH = 64
/** Narrowest the labelled layout is allowed to get. */
export const PALETTE_MIN_WIDTH = 180
export const PALETTE_MAX_WIDTH = 400
export const PALETTE_DEFAULT_WIDTH = 224

/**
 * Drag below this and the palette snaps to the rail; drag back past it and the
 * labels come back. Sits between the rail and min widths so the snap has a
 * clear gap on either side rather than flickering at the boundary.
 */
const COLLAPSE_THRESHOLD = 120

/** Length of the snap animation — matches the CSS duration below. */
const SNAP_ANIMATION_MS = 220

/** Keyboard resize step for the focused edge. */
const KEY_STEP = 16

function isRail(width: number) {
  return width <= PALETTE_RAIL_WIDTH
}

/**
 * Map a raw dragged width onto the two valid bands: the rail, or anything
 * between the min and max labelled widths. Nothing lands in between.
 */
function snapWidth(raw: number): number {
  if (raw < COLLAPSE_THRESHOLD) return PALETTE_RAIL_WIDTH
  return Math.min(PALETTE_MAX_WIDTH, Math.max(PALETTE_MIN_WIDTH, Math.round(raw)))
}

/** Local UI preference only — never persisted to the DB. */
function readStoredWidth(): number | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { width?: unknown; collapsed?: unknown }
    // `collapsed` is from the previous shape of this key; honour it so an
    // existing preference doesn't reopen expanded on first load.
    if (parsed.collapsed === true) return PALETTE_RAIL_WIDTH
    return typeof parsed.width === 'number' ? snapWidth(parsed.width) : null
  } catch {
    return null
  }
}

export function PaletteSidebar() {
  const [width, setWidth] = useState(PALETTE_DEFAULT_WIDTH)
  const [hydrated, setHydrated] = useState(false)
  const [dragging, setDragging] = useState(false)
  /** True for one animation frame window while the rail snap plays out. */
  const [snapping, setSnapping] = useState(false)

  const widthRef = useRef(width)
  widthRef.current = width
  const snapTimer = useRef<number | null>(null)

  useEffect(() => {
    const stored = readStoredWidth()
    if (stored !== null) setWidth(stored)
    setHydrated(true)
  }, [])

  // Skip the first pass so an absent/failed read can't overwrite the stored
  // preference with the default.
  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ width }))
    } catch {
      // Private mode / quota — the session still works, it just won't persist.
    }
  }, [width, hydrated])

  useEffect(() => {
    return () => {
      if (snapTimer.current !== null) window.clearTimeout(snapTimer.current)
    }
  }, [])

  /**
   * Free dragging tracks the pointer 1:1 (a transition there would lag), but
   * crossing the collapse threshold jumps ~116px at once — so the transition
   * is switched on just for that jump.
   */
  const applyWidth = useCallback((next: number) => {
    const previous = widthRef.current
    if (next === previous) return

    if (isRail(next) !== isRail(previous)) {
      setSnapping(true)
      if (snapTimer.current !== null) window.clearTimeout(snapTimer.current)
      snapTimer.current = window.setTimeout(() => setSnapping(false), SNAP_ANIMATION_MS)
    }
    setWidth(next)
  }, [])

  const startDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      event.preventDefault()

      const startX = event.clientX
      const startWidth = widthRef.current
      setDragging(true)

      // Hold the resize cursor and kill text selection for the whole gesture,
      // even while the pointer is out over the canvas.
      const previousCursor = document.body.style.cursor
      const previousSelect = document.body.style.userSelect
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      const onMove = (moveEvent: PointerEvent) => {
        applyWidth(snapWidth(startWidth + moveEvent.clientX - startX))
      }
      const onUp = () => {
        setDragging(false)
        document.body.style.cursor = previousCursor
        document.body.style.userSelect = previousSelect
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    },
    [applyWidth],
  )

  const onEdgeKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()

      const current = widthRef.current
      const delta = event.key === 'ArrowLeft' ? -KEY_STEP : KEY_STEP
      // From the rail, one keypress right returns to the labelled layout
      // instead of nudging into the dead band between the two.
      const raw = isRail(current)
        ? delta > 0
          ? PALETTE_MIN_WIDTH
          : PALETTE_RAIL_WIDTH
        : current + delta
      applyWidth(snapWidth(raw))
    },
    [applyWidth],
  )

  const collapsed = isRail(width)

  return (
    <div
      className={cn(
        'relative flex shrink-0',
        // Animate on mount/restore and across the rail snap, but never during a
        // free drag — that would make the edge trail the pointer.
        (!dragging || snapping) && 'transition-[width] duration-200 ease-out',
      )}
      style={{ width }}
    >
      <NodePalette collapsed={collapsed} />

      {/*
        The resize affordance is the cursor, not a visible control: a
        transparent strip straddling the palette's right border. It only paints
        anything while a drag is actually in progress.
      */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize node palette"
        aria-valuemin={PALETTE_RAIL_WIDTH}
        aria-valuemax={PALETTE_MAX_WIDTH}
        aria-valuenow={width}
        tabIndex={0}
        onPointerDown={startDrag}
        onKeyDown={onEdgeKeyDown}
        className={cn(
          'absolute inset-y-0 right-0 z-20 w-2 translate-x-1/2 cursor-col-resize',
          'after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-primary after:opacity-0 after:transition-opacity',
          'focus-visible:outline-none focus-visible:after:opacity-100',
          dragging && 'after:opacity-100',
        )}
      />
    </div>
  )
}
