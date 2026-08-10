'use client'

import {
  Download,
  FileSpreadsheet,
  FileText,
  FileType,
  Loader2,
  Plus,
  X,
  Clock,
  Share2,
  FileBarChart
} from 'lucide-react'
import { useEffect, useState } from 'react'
import React from 'react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

type ReportType = 'Employee' | 'Workflow' | 'Sales' | 'HR' | 'AI Usage'
type ReportFormat = 'PDF' | 'Word' | 'Excel'
type ReportStatus = 'Ready' | 'Generating' | 'Failed'

interface Report {
  id: string
  name: string
  type: ReportType
  format: ReportFormat
  status: ReportStatus
  generatedAt: string
  fileUrl: string
  generatedBy: string
}

const typeValues: Record<ReportType, string> = {
  Employee: 'EMPLOYEE',
  Workflow: 'WORKFLOW',
  Sales: 'SALES',
  HR: 'HR',
  'AI Usage': 'AI_USAGE',
}

const formatValues: Record<ReportFormat, string> = {
  PDF: 'PDF',
  Word: 'WORD',
  Excel: 'EXCEL',
}

function formatGeneratedAt(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null)
  return (body as { error?: string } | null)?.error ?? fallback
}

const typeColors: Record<ReportType, string> = {
  Employee: 'bg-blue-50 text-blue-700 border border-blue-100',
  Workflow: 'bg-violet-50 text-violet-700 border border-violet-100',
  Sales: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  HR: 'bg-pink-50 text-pink-700 border border-pink-100',
  'AI Usage': 'bg-[#FFFAEC] text-[#D4A017] border border-[#F5CA50]/30',
}

function TypeBadge({ type }: { type: ReportType }) {
  return (
    <span className={cn('inline-flex rounded-md px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide', typeColors[type])}>
      {type}
    </span>
  )
}

function StatusBadge({ status }: { status: ReportStatus }) {
  const s = status.toLowerCase()
  let variant = "bg-gray-50 text-gray-600 border border-gray-200"
  let dot = "bg-gray-400"

  if (s === 'ready') {
    variant = "bg-green-50 text-green-700 border border-green-100"
    dot = "bg-green-500"
  } else if (s === 'generating') {
    variant = "bg-[#FFFAEC] text-[#D4A017] border border-[#F5CA50]/30"
    dot = "bg-[#F5CA50] animate-pulse"
  } else if (s === 'failed') {
    variant = "bg-red-50 text-red-700 border border-red-100"
    dot = "bg-red-500"
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide", variant)}>
      <span className={cn("size-1.5 rounded-full", dot)} />
      {status}
    </span>
  )
}

function FormatIcon({ format }: { format: ReportFormat }) {
  if (format === 'Excel') return <FileSpreadsheet className="size-4 text-green-600" />
  if (format === 'Word') return <FileType className="size-4 text-blue-600" />
  return <FileText className="size-4 text-red-500" />
}

const reportTypes: ReportType[] = ['Employee', 'Workflow', 'Sales', 'HR', 'AI Usage']
const reportFormats: ReportFormat[] = ['PDF', 'Word', 'Excel']

function GenerateReportModal({
  onClose,
  onGenerated,
}: {
  onClose: () => void
  onGenerated: (report: Report) => void
}) {
  const [selectedType, setSelectedType] = useState<ReportType>('Employee')
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>('PDF')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    if (isGenerating) return
    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: typeValues[selectedType],
          format: formatValues[selectedFormat],
        }),
      })

      if (!response.ok) {
        throw new Error(await readError(response, 'Report generation failed.'))
      }

      const { report } = (await response.json()) as { report: Report }
      onGenerated(report)
      onClose()
    } catch (generateError) {
      setError((generateError as Error).message)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 md:p-8 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Generate Report</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="size-5" />
          </Button>
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <p className="mb-2 text-[13px] font-bold text-gray-900 uppercase tracking-wide">Report Type</p>
            <div className="grid grid-cols-2 gap-2">
              {reportTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={cn(
                    'rounded-xl border px-3 py-2.5 text-[14px] font-bold transition-all',
                    selectedType === t
                      ? 'border-[#F5CA50] bg-[#FFFAEC] text-gray-900 shadow-sm ring-1 ring-[#F5CA50]/50'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-bold text-gray-900 uppercase tracking-wide">Format</p>
            <div className="flex gap-2">
              {reportFormats.map((f) => (
                <button
                  key={f}
                  onClick={() => setSelectedFormat(f)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-[14px] font-bold transition-all',
                    selectedFormat === f
                      ? 'border-[#F5CA50] bg-[#FFFAEC] text-gray-900 shadow-sm ring-1 ring-[#F5CA50]/50'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  <FormatIcon format={f} />
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="mt-4 text-[13px] font-bold text-red-500 text-center">{error}</p>}

        <div className="mt-8 flex gap-3">
          <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold" onClick={onClose} disabled={isGenerating}>Cancel</Button>
          <Button
            className="flex-1 rounded-xl h-12 font-bold bg-[#F5CA50] text-[#111111] hover:brightness-95"
            onClick={() => void handleGenerate()}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 className="size-4 animate-spin mr-2" /> : <FileBarChart className="size-4 mr-2" />}
            {isGenerating ? 'Generating…' : 'Generate'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'scheduled' | 'shared'>('all')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const response = await fetch('/api/reports')
        if (!response.ok) throw new Error(await readError(response, 'Could not load reports.'))
        const { reports: rows } = (await response.json()) as { reports: Report[] }
        if (!cancelled) setReports(rows)
      } catch (error) {
        if (!cancelled) setLoadError((error as Error).message)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  return (
    <DashboardShell>
      <div className="mx-auto flex max-w-[1400px] w-full flex-col gap-6 md:p-6 p-4">

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reports</h1>
            <p className="mt-1 text-sm font-medium text-gray-500">
              Generate and download automated reports from your platform data
            </p>
          </div>
          <Button
            className="bg-[#F5CA50] text-[#111111] hover:brightness-95 font-bold shrink-0"
            onClick={() => setShowModal(true)}
          >
            <Plus className="size-4 mr-1.5" />
            Generate Report
          </Button>
        </div>

        <div className="flex border-b border-gray-200">
           {([
             { id: 'all', label: 'All Reports', icon: FileBarChart },
             { id: 'scheduled', label: 'Scheduled', icon: Clock },
             { id: 'shared', label: 'Shared with Me', icon: Share2 },
           ] as const).map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id)}
               className={cn(
                 "flex items-center gap-2 px-5 py-3 text-[14px] font-bold transition-colors border-b-2 relative -bottom-px",
                 activeTab === tab.id
                   ? "border-[#F5CA50] text-[#111111]"
                   : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
               )}
             >
               <tab.icon className={cn("size-4", activeTab === tab.id ? "text-[#D4A017]" : "text-gray-400")} />
               {tab.label}
             </button>
           ))}
        </div>

        {activeTab === 'all' && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Generated At</TableHead>
                    <TableHead>Generated By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="pl-6">
                        <span className="font-bold text-gray-900 block truncate max-w-[200px] xl:max-w-xs">{report.name}</span>
                      </TableCell>
                      <TableCell><TypeBadge type={report.type} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FormatIcon format={report.format} />
                          <span className="text-[13px] font-bold text-gray-700">{report.format}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500 font-medium">{formatGeneratedAt(report.generatedAt)}</TableCell>
                      <TableCell className="text-gray-500 font-medium">{report.generatedBy}</TableCell>
                      <TableCell><StatusBadge status={report.status} /></TableCell>
                      <TableCell className="pr-6 text-right">
                        <a
                          href={report.fileUrl}
                          download={report.name}
                          target="_blank"
                          rel="noreferrer"
                          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-lg border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-bold')}
                        >
                          <Download className="size-3.5 mr-1.5" /> Download
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!isLoading && loadError && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-20 text-center">
                        <div role="alert" className="flex flex-col items-center justify-center">
                          <p className="text-[14px] font-bold text-red-600">Could not load reports</p>
                          <p className="mt-1 max-w-sm text-[13px] font-medium text-gray-500">{loadError}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  {!isLoading && !loadError && reports.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-20 text-center">
                         <div className="flex flex-col items-center justify-center text-gray-400">
                            <FileBarChart className="size-10 mb-3 opacity-30" />
                            <p className="text-[14px] font-bold text-gray-600">No reports generated yet</p>
                            <p className="text-[13px] font-medium text-gray-500 mt-1 max-w-sm mx-auto">Generate your first report to gain insights into your platform data.</p>
                         </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}

        {activeTab !== 'all' && (
          <Card className="flex flex-col items-center justify-center py-20 text-center">
            <div className="size-16 rounded-full bg-gray-50 flex items-center justify-center mb-4 border border-gray-100">
               {activeTab === 'scheduled' ? <Clock className="size-6 text-gray-400" /> : <Share2 className="size-6 text-gray-400" />}
            </div>
            <p className="text-[15px] font-bold text-gray-900">No {activeTab} reports</p>
            <p className="text-[13.5px] font-medium text-gray-500 mt-1">
               {activeTab === 'scheduled' ? 'Scheduled reports will appear here.' : 'Reports shared with you will appear here.'}
            </p>
          </Card>
        )}
      </div>

      {showModal && (
        <GenerateReportModal
          onClose={() => setShowModal(false)}
          onGenerated={(report) => {
            setReports((prev) => [report, ...prev])
            setActiveTab('all')
          }}
        />
      )}
    </DashboardShell>
  )
}
