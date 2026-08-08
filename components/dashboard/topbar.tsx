'use client'

import { Bell, HelpCircle, Menu, Search, User, Settings, LogOut } from 'lucide-react'
import { signOut } from 'next-auth/react'
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
            <Avatar className="size-8 border border-gray-100">
              <AvatarImage src="/professional-woman-avatar.png" alt="" />
              <AvatarFallback className="bg-[#EAE3D9] text-[#66615B] text-xs font-bold">JS</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
            <DropdownMenuItem onSelect={() => signOut({ callbackUrl: '/' })}>
              <LogOut className="mr-2 size-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
