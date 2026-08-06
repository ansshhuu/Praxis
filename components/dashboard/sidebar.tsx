'use client'

import { Sparkles } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { navItems } from './nav-items'

type SidebarProps = {
  /** icon-only collapsed mode (tablet) */
  collapsed?: boolean
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Primary"
      className="flex h-full flex-col border-r border-sidebar-border bg-sidebar"
    >
      <div
        className={cn(
          'flex h-16 items-center gap-2.5 border-b border-sidebar-border px-4',
          collapsed && 'justify-center px-0',
        )}
      >
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Sparkles className="size-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-sidebar-foreground">
              EAWMP
            </span>
            <span className="text-xs text-muted-foreground">
              AI Automation
            </span>
          </div>
        )}
      </div>

      <ul className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.href !== '#' && pathname === item.href
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-sidebar-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="size-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </li>
          )
        })}
      </ul>

      {!collapsed && (
        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-xl bg-accent p-3">
            <p className="text-xs font-medium text-accent-foreground">
              Enterprise plan
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              14,204 / 25,000 AI credits used
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primary/15">
              <div className="h-full w-[57%] rounded-full bg-primary" />
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
