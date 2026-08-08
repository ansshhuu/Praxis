'use client'

import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { navItems } from './nav-items'

type SidebarProps = {
  /** icon-only collapsed mode (tablet) */
  collapsed?: boolean
}

function PraxisIcon({ size = 22, color = '#F5CA50' }: { size?: number; color?: string }) {
  const s = size
  const c = s / 2
  const rays = 8
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} fill="none" aria-hidden="true" className="shrink-0">
      {Array.from({ length: rays }, (_, i) => {
        const angle = (i * 360) / rays
        const rad = (angle * Math.PI) / 180
        const inner = c * 0.35
        const outer = c * 0.82
        const x1 = c + inner * Math.cos(rad)
        const y1 = c + inner * Math.sin(rad)
        const x2 = c + outer * Math.cos(rad)
        const y2 = c + outer * Math.sin(rad)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={s * 0.09} strokeLinecap="round" />
      })}
      <circle cx={c} cy={c} r={c * 0.28} fill={color} />
    </svg>
  )
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname()
  
  return (
    <nav
      aria-label="Primary"
      className="flex h-full flex-col border-r border-gray-100 bg-white"
    >
      <div
        className={cn(
          'flex h-16 items-center gap-2.5 px-4',
          collapsed && 'justify-center px-0',
        )}
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#FFFAEC] border border-[#F5CA50]/30">
          <PraxisIcon size={16} color="#D4A017" />
        </div>
        {!collapsed && (
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold tracking-wide text-gray-900">
              PRAXIS
            </span>
          </div>
        )}
      </div>

      <ul className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.href !== '#' && pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard')
          
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-[#FFFAEC] text-[#D4A017]'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                )}
              >
                <Icon className={cn("size-4 shrink-0", isActive ? "text-[#D4A017]" : "text-gray-400")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            </li>
          )
        })}
      </ul>

      {!collapsed && (
        <div className="p-4 mt-auto">
          <div className="flex items-center gap-3 rounded-xl border border-gray-100 p-2 hover:bg-gray-50 cursor-pointer transition-colors">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#EAE3D9] text-[#66615B] font-bold text-sm">
              JS
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-gray-900 truncate">Jane Smith</span>
              <span className="text-[11px] font-medium text-gray-500">Admin</span>
            </div>
            <ChevronDown className="size-4 text-gray-400 shrink-0" />
          </div>
        </div>
      )}
      
      {collapsed && (
        <div className="p-2 mt-auto flex justify-center">
           <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#EAE3D9] text-[#66615B] font-bold text-xs cursor-pointer hover:opacity-80">
              JS
            </div>
        </div>
      )}
    </nav>
  )
}
