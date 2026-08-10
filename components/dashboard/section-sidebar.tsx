'use client'

import Link from 'next/link'
import { useState } from 'react'

import { cn } from '@/lib/utils'

import { isEntryActive, type NavEntry, type NavSection } from './nav-items'

type TooltipState = { label: string; top: number; left: number }

function RailItem({
  item,
  active,
  onHover,
}: {
  item: NavEntry
  active: boolean
  onHover: (tooltip: TooltipState | null) => void
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
      onMouseEnter={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        onHover({ label: item.label, top: rect.top + rect.height / 2, left: rect.right + 10 })
      }}
      onMouseLeave={() => onHover(null)}
      onClick={() => onHover(null)}
      className={cn(
        'flex size-11 items-center justify-center rounded-xl transition-colors',
        active ? 'bg-[#FFFAEC] text-[#D4A017]' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900',
      )}
    >
      <Icon className="size-[18px]" strokeWidth={2} />
    </Link>
  )
}

function SectionRail({ section, pathname }: { section: NavSection; pathname: string }) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  return (
    <>
      <nav
        aria-label={`${section.label} navigation`}
        onMouseLeave={() => setTooltip(null)}
        className="flex h-full w-full flex-col items-center gap-1.5 overflow-y-auto border-r border-gray-100 bg-white py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <span className="sr-only">{section.label}</span>
        {section.items?.map((item) => (
          <RailItem
            key={item.href}
            item={item}
            active={isEntryActive(pathname, item.href)}
            onHover={setTooltip}
          />
        ))}
      </nav>

      {tooltip && (
        <div
          role="tooltip"
          style={{ top: tooltip.top, left: tooltip.left }}
          className="pointer-events-none fixed z-50 -translate-y-1/2 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-[11px] font-bold tracking-wide whitespace-nowrap text-gray-900 uppercase shadow-md"
        >
          {tooltip.label}
        </div>
      )}
    </>
  )
}

export function SectionSidebar({
  section,
  pathname,
  collapsed = false,
}: {
  section: NavSection
  pathname: string
  collapsed?: boolean
}) {
  if (collapsed) return <SectionRail section={section} pathname={pathname} />

  return (
    <nav
      aria-label={`${section.label} navigation`}
      className="flex h-full w-full flex-col overflow-hidden border-r border-gray-100 bg-white"
    >
      <div className="px-4 pt-5 pb-2">
        <span className="text-[11px] font-bold tracking-[0.08em] text-gray-400 uppercase">
          {section.label}
        </span>
      </div>

      <ul className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pb-4">
        {section.items?.map((item) => {
          const Icon = item.icon
          const isActive = isEntryActive(pathname, item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-start gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors',
                  isActive
                    ? 'bg-[#FFFAEC] text-[#D4A017]'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                )}
              >
                <Icon className={cn('mt-0.5 size-4 shrink-0', isActive ? 'text-[#D4A017]' : 'text-gray-400')} />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{item.label}</span>
                  {item.hint && (
                    <span className="mt-0.5 truncate text-[11px] font-normal text-gray-400">
                      {item.hint}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
