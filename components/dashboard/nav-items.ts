import {
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  CalendarClock,
  Camera,
  DollarSign,
  FileText,
  Headset,
  LayoutDashboard,
  LibraryBig,
  LineChart,
  Mic,
  MessageSquare,
  Settings,
  Sparkles,
  Store,
  UsersRound,
  Workflow,
  type LucideIcon,
} from 'lucide-react'

import { canAccessRoute } from '@/lib/auth/route-roles'

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
    match: ['/scheduler'],
    items: [
      { label: 'All Workflows', icon: Workflow, href: '/workflows', hint: 'Build and run pipelines' },
      { label: 'Scheduler', icon: CalendarClock, href: '/scheduler', hint: 'Cron jobs and retries' },
      { label: 'Marketplace', icon: Store, href: '/workflows/templates', hint: '102 prebuilt automations' },
    ],
  },
  {
    label: 'Agents',
    icon: Bot,
    href: '/agents',
    items: [
      { label: 'Agent Directory', icon: Bot, href: '/agents', hint: '26 specialized AI agents' },
      { label: 'Pipeline Builder', icon: Workflow, href: '/agents/pipelines', hint: 'Chain agents together' },
    ],
  },
  {
    label: 'Automation',
    icon: Briefcase,
    href: '/crm',
    match: ['/hr', '/finance', '/support'],
    items: [
      { label: 'CRM', icon: Briefcase, href: '/crm', hint: 'Leads and proposals' },
      { label: 'HR & Recruitment', icon: UsersRound, href: '/hr', hint: 'Screening and offers' },
      { label: 'Finance & Invoices', icon: DollarSign, href: '/finance', hint: 'OCR and anomalies' },
      { label: 'Support & Tickets', icon: Headset, href: '/support', hint: 'Triage and replies' },
    ],
  },
  {
    label: 'Documents',
    icon: FileText,
    href: '/documents',
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
    match: ['/meetings', '/knowledge', '/multimodal'],
    items: [
      { label: 'AI Assistant', icon: MessageSquare, href: '/chat', hint: 'Ask about your data' },
      { label: 'Meetings', icon: Mic, href: '/meetings', hint: 'Transcripts and actions' },
      { label: 'Knowledge Base', icon: LibraryBig, href: '/knowledge', hint: 'RAG search and citations' },
      { label: 'Multimodal Lab', icon: Camera, href: '/multimodal', hint: 'Voice and vision AI' },
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

export function visibleNavSections(role: string | undefined | null): NavSection[] {
  return navSections.reduce<NavSection[]>((visible, section) => {
    if (!section.items) {
      if (canAccessRoute(section.href, role)) visible.push(section)
      return visible
    }

    const items = section.items.filter((item) => canAccessRoute(item.href, role))
    if (items.length) visible.push({ ...section, items })
    return visible
  }, [])
}

export function findActiveSection(
  pathname: string,
  sections: NavSection[] = navSections,
): NavSection | undefined {
  return sections.find((section) =>
    [section.href, ...(section.match ?? [])].some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    ),
  )
}

export function isEntryActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`)
}
