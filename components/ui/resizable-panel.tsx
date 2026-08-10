'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

const SNAP_ANIMATION_MS = 220
const KEY_STEP = 16

export type ResizablePanelOptions = {
  storageKey: string
  railWidth: number
  minWidth: number
  maxWidth: number
  defaultWidth: number
  collapseThreshold: number
}

export type ResizablePanel = {
  width: number
  collapsed: boolean
  dragging: boolean
  snapping: boolean
  containerClassName: string
  handleProps: {
    role: 'separator'
    'aria-orientation': 'vertical'
    'aria-valuemin': number
    'aria-valuemax': number
    'aria-valuenow': number
    tabIndex: 0
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>) => void
    onKeyDown: (event: React.KeyboardEvent) => void
  }
}

export function useResizablePanel({
  storageKey,
  railWidth,
  minWidth,
  maxWidth,
  defaultWidth,
  collapseThreshold,
}: ResizablePanelOptions): ResizablePanel {
  const [width, setWidth] = useState(defaultWidth)
  const [hydrated, setHydrated] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [snapping, setSnapping] = useState(false)

  const widthRef = useRef(width)
  widthRef.current = width
  const snapTimer = useRef<number | null>(null)

  const isRail = useCallback((value: number) => value <= railWidth, [railWidth])

  const snapWidth = useCallback(
    (raw: number) => {
      if (raw < collapseThreshold) return railWidth
      return Math.min(maxWidth, Math.max(minWidth, Math.round(raw)))
    },
    [collapseThreshold, railWidth, minWidth, maxWidth],
  )

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as { width?: unknown; collapsed?: unknown }
        if (parsed.collapsed === true) setWidth(railWidth)
        else if (typeof parsed.width === 'number') setWidth(snapWidth(parsed.width))
      }
    } catch {
    }
    setHydrated(true)
  }, [storageKey, railWidth, snapWidth])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ width }))
    } catch {
    }
  }, [width, hydrated, storageKey])

  useEffect(() => {
    return () => {
      if (snapTimer.current !== null) window.clearTimeout(snapTimer.current)
    }
  }, [])

  const applyWidth = useCallback(
    (next: number) => {
      const previous = widthRef.current
      if (next === previous) return

      if (isRail(next) !== isRail(previous)) {
        setSnapping(true)
        if (snapTimer.current !== null) window.clearTimeout(snapTimer.current)
        snapTimer.current = window.setTimeout(() => setSnapping(false), SNAP_ANIMATION_MS)
      }
      setWidth(next)
    },
    [isRail],
  )

  const startDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return
      event.preventDefault()

      const startX = event.clientX
      const startWidth = widthRef.current
      setDragging(true)

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
    [applyWidth, snapWidth],
  )

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      event.preventDefault()

      const current = widthRef.current
      const delta = event.key === 'ArrowLeft' ? -KEY_STEP : KEY_STEP
      const raw = isRail(current)
        ? delta > 0
          ? minWidth
          : railWidth
        : current + delta
      applyWidth(snapWidth(raw))
    },
    [applyWidth, isRail, snapWidth, minWidth, railWidth],
  )

  return {
    width,
    collapsed: isRail(width),
    dragging,
    snapping,
    containerClassName: cn(
      'relative flex shrink-0',
      (!dragging || snapping) && 'transition-[width] duration-200 ease-out',
    ),
    handleProps: {
      role: 'separator',
      'aria-orientation': 'vertical',
      'aria-valuemin': railWidth,
      'aria-valuemax': maxWidth,
      'aria-valuenow': width,
      tabIndex: 0,
      onPointerDown: startDrag,
      onKeyDown,
    },
  }
}

export function ResizeHandle({
  panel,
  label,
  className,
}: {
  panel: ResizablePanel
  label: string
  className?: string
}) {
  return (
    <div
      {...panel.handleProps}
      aria-label={label}
      className={cn(
        'absolute inset-y-0 right-0 z-20 w-2 translate-x-1/2 cursor-col-resize',
        'after:absolute after:inset-y-0 after:left-1/2 after:w-px after:-translate-x-1/2 after:bg-primary after:opacity-0 after:transition-opacity',
        'focus-visible:outline-none focus-visible:after:opacity-100',
        panel.dragging && 'after:opacity-100',
        className,
      )}
    />
  )
}
