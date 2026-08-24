'use client'

import { LibraryBig } from 'lucide-react'
import { useState } from 'react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { RunHistoryPanel } from '@/components/workflows/run-history-panel'
import { TemplateMarketplace } from '@/components/workflows/template-marketplace'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'marketplace', label: 'Template Marketplace' },
  { id: 'history', label: 'Execution History' },
] as const

export default function WorkflowTemplatesPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('marketplace')

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
            <LibraryBig className="size-6 text-[#D4A017]" /> Workflow Automation Marketplace
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            102 prebuilt templates across HR, Sales, IT, DevOps, Marketing and Support
          </p>
        </div>

        <div className="flex gap-1 border-b border-gray-100">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'border-b-2 px-4 py-2.5 text-[13.5px] font-bold transition-colors',
                tab === t.id ? 'border-[#F5CA50] text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-900',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'marketplace' ? <TemplateMarketplace /> : <RunHistoryPanel />}
      </div>
    </DashboardShell>
  )
}
