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
import { useState } from 'react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Button } from '@/components/ui/button'
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
import { getReports, type Report, type ReportFormat, type ReportStatus, type ReportType } from '@/lib/mock-data/reports'

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

function GenerateReportModal({ onClose }: { onClose: () => void }) {
  const [selectedType, setSelectedType] = useState<ReportType>('Employee')
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat>('PDF')
  const [isGenerating, setIsGenerating] = useState(false)

  function handleGenerate() {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      onClose()
    }, 1500)
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

        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button
            className="flex-1"
            onClick={handleGenerate}
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
  const reports = getReports()
  const [showModal, setShowModal] = useState(false)

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
            <CardDescription>{reports.length} reports generated</CardDescription>
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
                    <TableCell className="text-muted-foreground text-sm">{report.generatedAt}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{report.generatedBy}</TableCell>
                    <TableCell><StatusBadge status={report.status} /></TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={report.status !== 'Ready'}
                        aria-label={`Download ${report.name}`}
                        id={`download-report-${report.id}`}
                        className="size-8"
                      >
                        {report.status === 'Generating' ? (
                          <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        ) : (
                          <Download className={cn('size-4', report.status === 'Ready' ? 'text-foreground' : 'text-muted-foreground/40')} />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {showModal && <GenerateReportModal onClose={() => setShowModal(false)} />}
    </DashboardShell>
  )
}
