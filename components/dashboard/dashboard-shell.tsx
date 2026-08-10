'use client'

import { HelpCircle, X } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { ResizeHandle, useResizablePanel } from '@/components/ui/resizable-panel'
import { cn } from '@/lib/utils'

import { AppTopbar } from './app-topbar'
import { HelpDrawer } from './help-drawer'
import { findActiveSection, isEntryActive, settingsEntry, visibleNavSections } from './nav-items'
import { SectionSidebar } from './section-sidebar'

const SIDEBAR_STORAGE_KEY = 'praxis:app.sidebar'

const SIDEBAR_RAIL_WIDTH = 64
const SIDEBAR_MIN_WIDTH = 180
const SIDEBAR_MAX_WIDTH = 400
const SIDEBAR_DEFAULT_WIDTH = 224
const SIDEBAR_COLLAPSE_THRESHOLD = 120

export function DashboardShell({
  children,
  mainClassName,
}: {
  children: React.ReactNode
  mainClassName?: string
}) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const sections = useMemo(() => visibleNavSections(session?.user?.role), [session?.user?.role])
  const activeSection = findActiveSection(pathname, sections)
  const hasSidebar = Boolean(activeSection?.items?.length)

  const [mobileOpen, setMobileOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  const sidebarPanel = useResizablePanel({
    storageKey: SIDEBAR_STORAGE_KEY,
    railWidth: SIDEBAR_RAIL_WIDTH,
    minWidth: SIDEBAR_MIN_WIDTH,
    maxWidth: SIDEBAR_MAX_WIDTH,
    defaultWidth: SIDEBAR_DEFAULT_WIDTH,
    collapseThreshold: SIDEBAR_COLLAPSE_THRESHOLD,
  })

  useEffect(() => {
    document.body.style.overflow = mobileOpen || helpOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen, helpOpen])

  useEffect(() => setMobileOpen(false), [pathname])

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppTopbar
        onOpenMobileNav={() => setMobileOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
        helpOpen={helpOpen}
      />

      <div className="flex min-h-0 flex-1">
        {hasSidebar && activeSection && (
          <aside
            className={cn(
              sidebarPanel.containerClassName,
              'sticky top-16 hidden h-[calc(100vh-64px)] lg:flex',
            )}
            style={{ width: sidebarPanel.width }}
          >
            <SectionSidebar
              section={activeSection}
              pathname={pathname}
              collapsed={sidebarPanel.collapsed}
            />
            <ResizeHandle panel={sidebarPanel} label={`Resize ${activeSection.label} sidebar`} />
          </aside>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <main className={cn('flex-1', mainClassName ?? 'px-4 pt-6 pb-8 md:px-6')}>
            {children}
          </main>
        </div>
      </div>

      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
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
            'absolute inset-y-0 left-0 w-72 overflow-y-auto bg-white transition-transform duration-300',
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

          <nav aria-label="All sections" className="flex flex-col gap-5 px-3 pt-16 pb-6">
            {sections.map((section) => {
              const SectionIcon = section.icon
              const entries = section.items ?? [section]
              return (
                <div key={section.label}>
                  <div className="flex items-center gap-2 px-3 pb-1.5">
                    <SectionIcon className="size-3.5 text-gray-400" />
                    <span className="text-[11px] font-bold tracking-[0.08em] text-gray-400 uppercase">
                      {section.label}
                    </span>
                  </div>
                  <ul className="flex flex-col gap-0.5">
                    {entries.map((item) => {
                      const Icon = item.icon
                      const isActive = isEntryActive(pathname, item.href)
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            aria-current={isActive ? 'page' : undefined}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors',
                              isActive
                                ? 'bg-[#FFFAEC] text-[#D4A017]'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                            )}
                          >
                            <Icon className={cn('size-4 shrink-0', isActive ? 'text-[#D4A017]' : 'text-gray-400')} />
                            {item.label}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )
            })}

            <Link
              href={settingsEntry.href}
              className={cn(
                'mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors',
                isEntryActive(pathname, settingsEntry.href)
                  ? 'bg-[#FFFAEC] text-[#D4A017]'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              <settingsEntry.icon className="size-4 shrink-0 text-gray-400" />
              {settingsEntry.label}
            </Link>

            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={helpOpen}
              onClick={() => {
                setMobileOpen(false)
                setHelpOpen(true)
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13.5px] font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
            >
              <HelpCircle className="size-4 shrink-0 text-gray-400" />
              Help
            </button>
          </nav>
        </div>
      </div>

      <HelpDrawer open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  )
}
