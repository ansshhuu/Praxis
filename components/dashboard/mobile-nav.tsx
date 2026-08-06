'use client'

import {
  LayoutDashboard,
  MessageSquare,
  MoreHorizontal,
  Workflow,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

const tabs = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'Workflows', icon: Workflow, href: '/workflows' },
  { label: 'Chat', icon: MessageSquare, href: '/chat' },
  { label: 'More', icon: MoreHorizontal, href: '#' },
]

export function MobileTabBar({ onMore }: { onMore: () => void }) {
  const pathname = usePathname()
  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-card/95 backdrop-blur-sm md:hidden"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isMore = tab.label === 'More'
        const isActive = tab.href !== '#' && pathname === tab.href
        const className = cn(
          'flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
          isActive
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground',
        )

        if (isMore) {
          return (
            <button
              key={tab.label}
              type="button"
              onClick={onMore}
              className={className}
            >
              <Icon className="size-5" />
              {tab.label}
            </button>
          )
        }

        return (
          <Link
            key={tab.label}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={className}
          >
            <Icon className="size-5" />
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
