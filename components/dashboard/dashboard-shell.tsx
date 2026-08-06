'use client'

import { X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MobileTabBar } from './mobile-nav'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'

export function DashboardShell({
  children,
  mainClassName,
}: {
  children: React.ReactNode
  /** Override the default <main> padding — e.g. for full-bleed canvases. */
  mainClassName?: string
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  // Prevent body scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <div className="flex min-h-screen bg-background">
      {/* Tablet: icon-only sidebar */}
      <aside className="sticky top-0 hidden h-screen w-[72px] shrink-0 md:block lg:hidden">
        <Sidebar collapsed />
      </aside>

      {/* Desktop: full sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 md:hidden',
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            'absolute inset-0 bg-foreground/40 transition-opacity',
            mobileOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={() => setMobileOpen(false)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className={cn(
            'absolute inset-y-0 left-0 w-64 transition-transform duration-300',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close navigation menu"
            className="absolute top-3 right-3 z-10"
            onClick={() => setMobileOpen(false)}
          >
            <X className="size-5" />
          </Button>
          <Sidebar />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobileNav={() => setMobileOpen(true)} />
        <main
          className={cn(
            'flex-1',
            mainClassName ?? 'px-4 pb-24 pt-6 md:px-6 md:pb-8',
          )}
        >
          {children}
        </main>
      </div>

      <MobileTabBar onMore={() => setMobileOpen(true)} />
    </div>
  )
}
