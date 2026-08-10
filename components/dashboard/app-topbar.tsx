'use client'

import { HelpCircle, LogOut, Menu, Search, User } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import { findActiveSection, visibleNavSections } from './nav-items'

const roleLabels: Record<string, string> = {
  ADMIN: 'Admin',
  HR: 'HR',
  MANAGER: 'Manager',
  EMPLOYEE: 'Employee',
}

function PraxisIcon({ size = 16, color = '#D4A017' }: { size?: number; color?: string }) {
  const c = size / 2
  const rays = 8
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden="true" className="shrink-0">
      {Array.from({ length: rays }, (_, i) => {
        const rad = ((i * 360) / rays) * (Math.PI / 180)
        const inner = c * 0.35
        const outer = c * 0.82
        return (
          <line
            key={i}
            x1={c + inner * Math.cos(rad)} y1={c + inner * Math.sin(rad)}
            x2={c + outer * Math.cos(rad)} y2={c + outer * Math.sin(rad)}
            stroke={color} strokeWidth={size * 0.09} strokeLinecap="round"
          />
        )
      })}
      <circle cx={c} cy={c} r={c * 0.28} fill={color} />
    </svg>
  )
}

export function AppTopbar({
  onOpenMobileNav,
  onOpenHelp,
  helpOpen,
}: {
  onOpenMobileNav: () => void
  onOpenHelp: () => void
  helpOpen: boolean
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const sections = useMemo(() => visibleNavSections(session?.user?.role), [session?.user?.role])
  const activeSection = findActiveSection(pathname, sections)

  const userName = session?.user?.name || 'Jane Smith'
  const userEmail = session?.user?.email || 'jane@xqora.ai'
  const initials = userName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
  const roleLabel = session?.user?.role ? roleLabels[session.user.role] : null

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-3 border-b border-[#DFD6C9] bg-[#EAE3D9]/85 px-3 shadow-[0_1px_3px_rgba(17,17,17,0.05),0_1px_12px_rgba(17,17,17,0.04)] backdrop-blur-xl md:px-4">
        <Button
          variant="ghost"
          size="icon"
          className="text-[#66615B] hover:bg-white/60 hover:text-[#111111] lg:hidden"
          aria-label="Open navigation menu"
          onClick={onOpenMobileNav}
        >
          <Menu className="size-5" />
        </Button>

        <Link href="/dashboard" className="flex shrink-0 items-center gap-2.5 pr-1">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-[#F5CA50]/30 bg-[#FFFAEC]">
            <PraxisIcon size={16} />
          </div>
          <span className="hidden text-sm font-bold tracking-wide text-gray-900 sm:inline">PRAXIS</span>
        </Link>

        <nav aria-label="Primary" className="hidden min-w-0 items-center gap-0.5 lg:flex">
          {sections.map((section) => {
            const Icon = section.icon
            const isActive = section.label === activeSection?.label
            return (
              <Link
                key={section.label}
                href={section.href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-[13.5px] font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'border border-[#F5CA50]/40 bg-[#FFFAEC] text-[#D4A017] shadow-sm'
                    : 'border border-transparent text-[#66615B] hover:bg-white/60 hover:text-[#111111]',
                )}
              >
                <Icon className={cn('size-4 shrink-0', isActive ? 'text-[#D4A017]' : 'text-[#8C857D]')} />
                {section.label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <div className="relative hidden w-56 xl:block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#8C857D]" />
            <Input
              type="search"
              placeholder="Search..."
              aria-label="Search"
              className="h-9 rounded-full border-white/70 bg-white/70 pl-9 placeholder:text-[#8C857D] focus-visible:ring-1 focus-visible:ring-[#F5CA50]/60"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="hidden rounded-full text-[#66615B] hover:bg-white/60 hover:text-[#111111] sm:inline-flex"
            aria-label="Help and instructions"
            aria-haspopup="dialog"
            aria-expanded={helpOpen}
            onClick={onOpenHelp}
          >
            <HelpCircle className="size-[18px]" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger className="rounded-full focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:outline-none">
              <Avatar className="size-8 cursor-pointer border border-white/70 shadow-sm">
                <AvatarImage src={session?.user?.image || ''} alt={userName} />
                <AvatarFallback className="bg-white text-xs font-bold text-[#66615B]">{initials}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex flex-col space-y-1 p-2">
                <p className="text-sm leading-none font-medium">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                {roleLabel && <p className="mt-1 text-xs font-semibold text-primary">{roleLabel}</p>}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <User className="mr-2 size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
                <LogOut className="mr-2 size-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </>
  )
}
