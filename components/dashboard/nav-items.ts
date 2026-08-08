import {
  BarChart3,
  Bell,
  CalendarClock,
  FileText,
  LayoutDashboard,
  LineChart,
  MessageSquare,
  ScrollText,
  Settings,
  Store,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

export type NavEntry = {
  label: string
  icon: LucideIcon
  href: string
}

export const navItems: NavEntry[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Workflows', icon: Workflow, href: '/workflows' },
  { label: 'Documents', icon: FileText, href: '/documents' },
  { label: 'Resumes', icon: ScrollText, href: '/resumes' },
  { label: 'Reports', icon: BarChart3, href: '/reports' },
  { label: 'AI Assistant', icon: MessageSquare, href: '/chat' },
  { label: 'Marketplace', icon: Store, href: '/marketplace' },
  { label: 'Notifications', icon: Bell, href: '/notifications' },
  { label: 'Scheduler', icon: CalendarClock, href: '/scheduler' },
  { label: 'Analytics', icon: LineChart, href: '/analytics' },
  { label: 'Settings', icon: Settings, href: '/settings' },
]
