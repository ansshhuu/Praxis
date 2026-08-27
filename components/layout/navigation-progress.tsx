'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

const BAR_COLOR = '#F5CA50'

export function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const runningRef = useRef(false)
  const routeKeyRef = useRef(`${pathname}?${searchParams.toString()}`)

  useEffect(() => {
    function clearTimers() {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      intervalRef.current = null
      timeoutRef.current = null
    }

    function finish() {
      if (!runningRef.current) return
      runningRef.current = false
      clearTimers()
      setProgress(100)
      setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 220)
    }

    function start() {
      if (runningRef.current) return
      runningRef.current = true
      clearTimers()
      setVisible(true)
      setProgress(8)
      intervalRef.current = setInterval(() => {
        setProgress((current) => (current >= 90 ? current : current + (90 - current) * 0.12))
      }, 150)
      timeoutRef.current = setTimeout(finish, 8000)
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as HTMLElement)?.closest?.('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || anchor.target === '_blank' || anchor.hasAttribute('download')) return
      let url: URL
      try {
        url = new URL(href, window.location.href)
      } catch {
        return
      }
      if (url.origin !== window.location.origin) return
      if (url.pathname + url.search === window.location.pathname + window.location.search) return
      start()
    }

    const originalPushState = window.history.pushState.bind(window.history)
    const originalReplaceState = window.history.replaceState.bind(window.history)
    window.history.pushState = ((...args: Parameters<typeof window.history.pushState>) => {
      start()
      return originalPushState(...args)
    }) as typeof window.history.pushState
    window.history.replaceState = ((...args: Parameters<typeof window.history.replaceState>) => {
      start()
      return originalReplaceState(...args)
    }) as typeof window.history.replaceState

    document.addEventListener('click', onClick, true)
    window.addEventListener('popstate', start)

    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('popstate', start)
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
      clearTimers()
    }
  }, [])

  useEffect(() => {
    const key = `${pathname}?${searchParams.toString()}`
    if (key === routeKeyRef.current) return
    routeKeyRef.current = key
    if (!runningRef.current) return
    runningRef.current = false
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setProgress(100)
    const hideTimeout = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 220)
    return () => clearTimeout(hideTimeout)
  }, [pathname, searchParams])

  if (!visible) return null

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 1000, pointerEvents: 'none' }}>
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: BAR_COLOR,
          boxShadow: `0 0 8px ${BAR_COLOR}, 0 0 4px ${BAR_COLOR}`,
          transition: 'width 0.2s ease-out, opacity 0.2s ease-out',
        }}
      />
    </div>
  )
}
