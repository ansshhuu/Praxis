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
  Loader2,
  Mail,
  MessageCircle,
  Receipt,
  Send,
  Star,
  UserPlus,
  Users,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TEMPLATE_PRESENTATION, type TemplateCategory } from '@/lib/marketplace/templates'

// ─── Types ────────────────────────────────────────────────────────────────────

/** Row shape returned by GET /api/marketplace. */
interface MarketplaceTemplate {
  id: string
  name: string
  description: string
  category: string
}

/**
 * `marketplace_templates` stores no icon / rating / usage columns, so those
 * come from the shared catalogue, matched by name. Templates published later
 * through POST /api/marketplace fall back to neutral defaults.
 */
const presentationFallback = { icon: 'file-check', rating: 4.5, usageCount: 0 }

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

function TemplateCard({
  template,
  onUse,
  busy,
}: {
  template: MarketplaceTemplate
  onUse: (template: MarketplaceTemplate) => void
  busy: boolean
}) {
  const presentation = TEMPLATE_PRESENTATION[template.name] ?? presentationFallback
  const icon = iconMap[presentation.icon] ?? <FileCheck className="size-6" />
  const categoryColor =
    categoryColors[template.category as TemplateCategory] ?? 'bg-muted text-muted-foreground'

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
            <span className="font-medium text-foreground">{presentation.rating}</span>
          </span>
          <span>{presentation.usageCount.toLocaleString()} uses</span>
        </div>
        <Button
          className="w-full"
          size="sm"
          id={`use-template-${template.id}`}
          disabled={busy}
          onClick={() => onUse(template)}
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin mr-1.5" /> Opening…
            </>
          ) : (
            'Use Template'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<MarketplaceTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingId, setUsingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch('/api/marketplace')
        const body = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(body.error ?? 'Could not load templates.')
        if (!cancelled) setTemplates(body.templates ?? [])
      } catch (loadError) {
        if (!cancelled) setError((loadError as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  /** Fork the template server-side, then open the copy in the builder. */
  async function handleUse(template: MarketplaceTemplate) {
    if (usingId) return
    setUsingId(template.id)
    setError(null)

    try {
      const response = await fetch(`/api/marketplace/${template.id}/use`, { method: 'POST' })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error ?? 'Could not create a workflow from this template.')

      router.push(`/workflows?id=${body.workflow.id}`)
    } catch (useError) {
      setError((useError as Error).message)
      setUsingId(null)
    }
  }

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

        {error && (
          <p className="text-sm text-destructive" role="alert">{error}</p>
        )}

        {/* Template grid */}
        {loading ? (
          <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading templates…
          </div>
        ) : templates.length === 0 ? (
          <p className="py-12 text-sm text-muted-foreground">
            No templates published yet. Run <code>npm run seed</code> to load the starter catalogue.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={handleUse}
                busy={usingId === template.id}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
