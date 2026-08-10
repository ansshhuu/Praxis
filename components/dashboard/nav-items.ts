import {
  BarChart3,
  Bell,
  CalendarClock,
  FileText,
  LayoutDashboard,
  LineChart,
  Mic,
  MessageSquare,
  ScrollText,
  Settings,
  Sparkles,
  Store,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

export type NavEntry = {
  label: string
  icon: LucideIcon
  href: string
  hint?: string
}

export type NavSection = NavEntry & {
  match?: string[]
  items?: NavEntry[]
}

export const navSections: NavSection[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    label: 'Workflows',
    icon: Workflow,
    href: '/workflows',
    match: ['/scheduler', '/marketplace'],
    items: [
      { label: 'All Workflows', icon: Workflow, href: '/workflows', hint: 'Build and run pipelines' },
      { label: 'Scheduler', icon: CalendarClock, href: '/scheduler', hint: 'Cron jobs and retries' },
      { label: 'Marketplace', icon: Store, href: '/marketplace', hint: 'Prebuilt templates' },
    ],
  },
  {
    label: 'Documents',
    icon: FileText,
    href: '/documents',
    match: ['/resumes'],
    items: [
      { label: 'All Documents', icon: FileText, href: '/documents', hint: 'OCR and extraction' },
      { label: 'Resumes', icon: ScrollText, href: '/resumes', hint: 'Candidate screening' },
    ],
  },
  {
    label: 'Insights',
    icon: BarChart3,
    href: '/analytics',
    match: ['/reports'],
    items: [
      { label: 'Analytics', icon: LineChart, href: '/analytics', hint: 'Execution trends' },
      { label: 'Reports', icon: BarChart3, href: '/reports', hint: 'Generated summaries' },
    ],
  },
  {
    label: 'AI',
    icon: Sparkles,
    href: '/chat',
    match: ['/meetings'],
    items: [
      { label: 'AI Assistant', icon: MessageSquare, href: '/chat', hint: 'Ask about your data' },
      { label: 'Meetings', icon: Mic, href: '/meetings', hint: 'Transcripts and actions' },
    ],
  },
  {
    label: 'Notifications',
    icon: Bell,
    href: '/notifications',
  },
]

export const settingsEntry: NavEntry = {
  label: 'Settings',
  icon: Settings,
  href: '/settings',
}

export function findActiveSection(pathname: string): NavSection | undefined {
  return navSections.find((section) =>
    [section.href, ...(section.match ?? [])].some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    ),
  )
}

export function isEntryActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}
