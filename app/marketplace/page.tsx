'use client'

import {
  Archive,
  BookOpen,
  Brain,
  CalendarCheck,
  Clock,
  Cloud,
  CreditCard,
  FileCheck,
  HardDrive,
  Mail,
  MessageCircle,
  Receipt,
  Send,
  Star,
  UserPlus,
  Users,
} from 'lucide-react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getTemplates, type MarketplaceTemplate, type TemplateCategory } from '@/lib/mock-data/marketplace'

// ─── Icon map ─────────────────────────────────────────────────────────────────

const iconMap: Record<string, React.ReactNode> = {
  receipt: <Receipt className="size-6" />,
  'file-user': <FileCheck className="size-6" />,
  'calendar-check': <CalendarCheck className="size-6" />,
  'user-plus': <UserPlus className="size-6" />,
  'credit-card': <CreditCard className="size-6" />,
  mail: <Mail className="size-6" />,
  'file-check': <FileCheck className="size-6" />,
  clock: <Clock className="size-6" />,
  brain: <Brain className="size-6" />,
  'hard-drive': <HardDrive className="size-6" />,
  'message-circle': <MessageCircle className="size-6" />,
  'book-open': <BookOpen className="size-6" />,
  cloud: <Cloud className="size-6" />,
  users: <Users className="size-6" />,
  archive: <Archive className="size-6" />,
  send: <Send className="size-6" />,
}

// ─── Category badge colors ────────────────────────────────────────────────────

const categoryColors: Record<TemplateCategory, string> = {
  Finance: 'bg-emerald-100 text-emerald-700',
  HR: 'bg-blue-100 text-blue-700',
  Sales: 'bg-violet-100 text-violet-700',
  Operations: 'bg-orange-100 text-orange-700',
  Communication: 'bg-pink-100 text-pink-700',
  Compliance: 'bg-amber-100 text-amber-700',
}

// ─── Template Card ────────────────────────────────────────────────────────────

function TemplateCard({ template }: { template: MarketplaceTemplate }) {
  const icon = iconMap[template.icon] ?? <FileCheck className="size-6" />
  const categoryColor = categoryColors[template.category]

  return (
    <Card className="group flex flex-col shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <CardHeader className="pb-3">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            {icon}
          </div>
          <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', categoryColor)}>
            {template.category}
          </span>
        </div>
        <CardTitle className="text-base leading-tight">{template.name}</CardTitle>
        <CardDescription className="text-xs leading-relaxed line-clamp-2">
          {template.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto pt-0">
        {/* Rating + usage */}
        <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Star className="size-3 fill-amber-400 text-amber-400" />
            <span className="font-medium text-foreground">{template.rating}</span>
          </span>
          <span>{template.usageCount.toLocaleString()} uses</span>
        </div>
        <Button
          className="w-full"
          size="sm"
          id={`use-template-${template.id}`}
        >
          Use Template
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const templates = getTemplates()

  return (
    <DashboardShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Marketplace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pre-built workflow templates to jump-start your automations
          </p>
        </div>

        {/* Category filter chips */}
        <div className="flex flex-wrap gap-2" role="list" aria-label="Template categories">
          {(['All', 'Finance', 'HR', 'Sales', 'Operations', 'Communication', 'Compliance'] as const).map((cat) => (
            <button
              key={cat}
              id={`filter-${cat.toLowerCase()}`}
              role="listitem"
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                cat === 'All'
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:border-primary hover:bg-primary/5 hover:text-primary',
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      </div>
    </DashboardShell>
  )
}
