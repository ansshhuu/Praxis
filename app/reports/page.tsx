'use client'

import {
  Download,
  FileSpreadsheet,
  FileText,
  FileType,
  Loader2,
  Plus,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportType = 'Employee' | 'Workflow' | 'Sales' | 'HR' | 'AI Usage'
type ReportFormat = 'PDF' | 'Word' | 'Excel'
type ReportStatus = 'Ready' | 'Generating' | 'Failed'

/** Wire format returned by /api/reports. */
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

/** UI label → the enum values the API accepts. */
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const typeColors: Record<ReportType, string> = {
  Employee: 'bg-blue-100 text-blue-700',
  Workflow: 'bg-violet-100 text-violet-700',
  Sales: 'bg-emerald-100 text-emerald-700',
  HR: 'bg-pink-100 text-pink-700',
  'AI Usage': 'bg-amber-100 text-amber-700',
}

const statusStyles: Record<ReportStatus, string> = {
  Ready: 'bg-success/10 text-success',
  Generating: 'bg-warning/15 text-warning',
  Failed: 'bg-destructive/10 text-destructive',
}

function TypeBadge({ type }: { type: ReportType }) {
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', typeColors[type])}>
      {type}
    </span>
  )
}

function StatusBadge({ status }: { status: ReportStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status],
      )}
    >
      <span
        className={cn(
          'size-1.5 rounded-full',
          status === 'Ready' && 'bg-success',
          status === 'Generating' && 'animate-pulse bg-warning',
          status === 'Failed' && 'bg-destructive',
        )}
      />
      {status}
    </span>
  )
}

function FormatIcon({ format }: { format: ReportFormat }) {
  if (format === 'Excel') return <FileSpreadsheet className="size-4 text-green-600" />
  if (format === 'Word') return <FileType className="size-4 text-blue-600" />
  return <FileText className="size-4 text-red-500" />
}

// ─── Generate Report Modal ─────────────────────────────────────────────────────

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
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Generate New Report</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close modal">
            <X className="size-4" />
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-sm font-medium">Report Type</p>
            <div className="grid grid-cols-2 gap-2">
              {reportTypes.map((t) => (
                <button
                  key={t}
                  id={`report-type-${t.toLowerCase().replace(' ', '-')}`}
                  onClick={() => setSelectedType(t)}
                  className={cn(
                    'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    selectedType === t
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-foreground hover:bg-muted',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Format</p>
            <div className="flex gap-2">
              {reportFormats.map((f) => (
                <button
                  key={f}
                  id={`report-format-${f.toLowerCase()}`}
                  onClick={() => setSelectedFormat(f)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                    selectedFormat === f
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-foreground hover:bg-muted',
                  )}
                >
                  <FormatIcon format={f} />
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <p className="mt-4 text-xs text-destructive">{error}</p>}

        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isGenerating}>Cancel</Button>
          <Button
            className="flex-1"
            onClick={() => void handleGenerate()}
            disabled={isGenerating}
            id="generate-report-confirm-button"
          >
            {isGenerating ? (
              <><Loader2 className="size-4 animate-spin" /> Generating…</>
            ) : (
              'Generate'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

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
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <DashboardShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Generate and download automated reports from your platform data
            </p>
          </div>
          <Button onClick={() => setShowModal(true)} id="generate-new-report-button">
            <Plus className="size-4" />
            Generate New Report
          </Button>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>All Reports</CardTitle>
            <CardDescription>
              {loadError ?? (isLoading ? 'Loading…' : `${reports.length} reports generated`)}
            </CardDescription>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Generated At</TableHead>
                  <TableHead>Generated By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} id={`report-row-${report.id}`}>
                    <TableCell className="font-medium text-foreground max-w-64">
                      <div className="truncate">{report.name}</div>
                    </TableCell>
                    <TableCell><TypeBadge type={report.type} /></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <FormatIcon format={report.format} />
                        <span className="text-sm text-muted-foreground">{report.format}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatGeneratedAt(report.generatedAt)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{report.generatedBy}</TableCell>
                    <TableCell><StatusBadge status={report.status} /></TableCell>
                    <TableCell>
                      <a
                        href={report.fileUrl}
                        download={report.name}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Download ${report.name}`}
                        id={`download-report-${report.id}`}
                        className={cn(buttonVariants({ variant: 'ghost', size: 'icon' }), 'size-8')}
                      >
                        <Download className="size-4 text-foreground" />
                      </a>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && reports.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      No reports yet — generate one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {showModal && (
        <GenerateReportModal
          onClose={() => setShowModal(false)}
          onGenerated={(report) => setReports((prev) => [report, ...prev])}
        />
      )}
    </DashboardShell>
  )
}
