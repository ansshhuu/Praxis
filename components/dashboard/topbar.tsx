'use client'

import { Bell, HelpCircle, Menu, Search, User, Settings, LogOut } from 'lucide-react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import React from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'

type TopbarProps = {
  onOpenMobileNav: () => void
}

function getBreadcrumbs(pathname: string) {
  if (pathname === '/dashboard') return [{ label: 'Dashboard', href: '/dashboard' }]
  if (pathname.startsWith('/workflows')) return [{ label: 'Workflows', href: '/workflows' }]
  if (pathname.startsWith('/documents')) return [{ label: 'Documents', href: '/documents' }]
  if (pathname.startsWith('/resumes')) return [{ label: 'Resumes', href: '/resumes' }]
  if (pathname.startsWith('/reports')) return [{ label: 'Reports', href: '/reports' }]
  if (pathname.startsWith('/chat')) return [{ label: 'AI Assistant', href: '/chat' }]
  if (pathname.startsWith('/marketplace')) return [{ label: 'Marketplace', href: '/marketplace' }]
  if (pathname.startsWith('/notifications')) return [{ label: 'Notifications', href: '/notifications' }]
  if (pathname.startsWith('/scheduler')) return [{ label: 'Scheduler', href: '/scheduler' }]
  if (pathname.startsWith('/analytics')) return [{ label: 'Analytics', href: '/analytics' }]
  if (pathname.startsWith('/settings')) return [{ label: 'Settings', href: '/settings' }]
  return []
}

export function Topbar({ onOpenMobileNav }: TopbarProps) {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbs(pathname)
  const { data: session } = useSession()

  const userName = session?.user?.name || 'Jane Smith'
  const userEmail = session?.user?.email || 'jane@xqora.ai'
  const initials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-gray-100 bg-white px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open navigation menu"
        onClick={onOpenMobileNav}
      >
        <Menu className="size-5" />
      </Button>

      {/* Breadcrumb / Page Title */}
      <div className="flex items-center gap-2 flex-1">
        {breadcrumbs.map((bc, idx) => (
          <React.Fragment key={bc.href}>
            <Link href={bc.href} className="text-sm font-semibold text-gray-900">
              {bc.label}
            </Link>
            {idx < breadcrumbs.length - 1 && <span className="text-gray-400">/</span>}
          </React.Fragment>
        ))}
      </div>

      {/* Right aligned actions */}
      <div className="ml-auto flex items-center gap-3">
        <div className="relative hidden md:block w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Search..."
            aria-label="Search"
            className="h-9 pl-9 rounded-full bg-gray-50 border-transparent focus-visible:ring-1 focus-visible:ring-gray-300"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="relative text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-full"
          aria-label="Notifications"
        >
          <Bell className="size-[18px]" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-red-500 ring-2 ring-white" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-full"
          aria-label="Help"
        >
          <HelpCircle className="size-[18px]" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300">
            <Avatar className="size-8 border border-gray-100 cursor-pointer">
              <AvatarImage src={session?.user?.image || ""} alt={userName} />
              <AvatarFallback className="bg-[#EAE3D9] text-[#66615B] text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="flex flex-col space-y-1 p-2">
              <p className="text-sm font-medium leading-none">{userName}</p>
              <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
              <p className="text-xs mt-1 font-semibold text-primary">Admin</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 size-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 size-4" />
              Settings
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
  )
}
