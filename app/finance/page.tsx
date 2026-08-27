'use client'

import { AlertTriangle, DollarSign, FileText, Loader2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface ParsedInvoice {
  vendor: string
  lineItems: { description: string; amount: number }[]
  tax: number
  dueDate: string | null
  total: number
  lowConfidence: boolean
  warnings: string[]
}

interface FinanceRecord {
  vendor: string
  category: string
  amount: number
  anomaly: boolean
  description: string
  createdAt: string
}

interface BudgetReport {
  totalSpend: number
  byCategory: Record<string, number>
  anomalyCount: number
}

const CHART_COLORS = ['#F5CA50', '#D4A017', '#84cc16', '#38bdf8', '#a78bfa', '#f472b6', '#f97316']
const MAX_FILE_BYTES = 15 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null)
  return (body as { error?: string } | null)?.error ?? fallback
}

export default function FinancePage() {
  const [report, setReport] = useState<BudgetReport | null>(null)
  const [invoice, setInvoice] = useState<ParsedInvoice | null>(null)
  const [invoiceHash, setInvoiceHash] = useState<string | null>(null)
  const [pendingDuplicateFile, setPendingDuplicateFile] = useState<File | null>(null)
  const [records, setRecords] = useState<FinanceRecord[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [reportResponse, recordsResponse] = await Promise.all([
          fetch('/api/automation/finance/budget-report'),
          fetch('/api/automation/finance/records'),
        ])
        if (cancelled) return
        if (reportResponse.ok) {
          const { report: data } = (await reportResponse.json()) as { report: BudgetReport }
          if (!cancelled) setReport(data)
        }
        if (recordsResponse.ok) {
          const { records: data } = (await recordsResponse.json()) as { records: FinanceRecord[] }
          if (!cancelled) setRecords(data)
        }
      } catch {}
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  function validateFile(file: File): string | null {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return 'Please upload an image (JPG, PNG, or WebP) invoice'
    }
    if (file.size > MAX_FILE_BYTES) {
      return 'File too large — max 15MB'
    }
    return null
  }

  async function handleUpload(file: File, allowDuplicate = false) {
    if (isParsing) return
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsParsing(true)
    setError(null)
    setDuplicateWarning(null)
    setInvoice(null)
    setInvoiceHash(null)
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const form = new FormData()
      form.append('invoice', file)
      const url = `/api/automation/finance/parse-invoice${allowDuplicate ? '?allowDuplicate=true' : ''}`
      const response = await fetch(url, { method: 'POST', body: form, signal: controller.signal })
      if (response.status === 409) {
        setPendingDuplicateFile(file)
        setDuplicateWarning(await readError(response, 'This invoice appears to already be uploaded — add anyway?'))
        return
      }
      if (!response.ok) {
        setError(await readError(response, 'Could not parse invoice'))
        return
      }
      const { invoice: parsed, invoiceHash: hash } = (await response.json()) as {
        invoice: ParsedInvoice
        invoiceHash: string
      }
      setInvoice(parsed)
      setInvoiceHash(hash)
    } catch (uploadError) {
      if ((uploadError as Error).name === 'AbortError') return
      setError((uploadError as Error).message)
    } finally {
      if (abortRef.current === controller) {
        setIsParsing(false)
        abortRef.current = null
      }
    }
  }

  async function recordExpense(allowDuplicate = false) {
    if (!invoice || isRecording) return
    setIsRecording(true)
    try {
      const response = await fetch('/api/automation/finance/categorize-expense', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor: invoice.vendor,
          description: invoice.lineItems.map((item) => item.description).join(', ') || invoice.vendor,
          amount: invoice.total,
          tax: invoice.tax,
          dueDate: invoice.dueDate,
          budgetThreshold: 5000,
          historicalAverage: report && Object.keys(report.byCategory).length > 0
            ? report.totalSpend / Math.max(records.length, 1)
            : 0,
          invoiceHash,
          allowDuplicate,
        }),
      })
      if (response.status === 409) {
        setDuplicateWarning(await readError(response, 'This invoice appears to already be uploaded — add anyway?'))
        return
      }
      if (!response.ok) {
        setError(await readError(response, 'Could not record expense'))
        return
      }
      const { record } = (await response.json()) as { record: FinanceRecord }
      setRecords((prev) => [record, ...prev])
      setInvoice(null)
      setInvoiceHash(null)
      setDuplicateWarning(null)
      const reportResponse = await fetch('/api/automation/finance/budget-report')
      if (reportResponse.ok) {
        const { report: data } = (await reportResponse.json()) as { report: BudgetReport }
        setReport(data)
      }
    } catch (recordError) {
      setError((recordError as Error).message)
    } finally {
      setIsRecording(false)
    }
  }

  const pieData = report ? Object.entries(report.byCategory).map(([name, value]) => ({ name, value })) : []
  const anomalies = records.filter((r) => r.anomaly)

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
            <DollarSign className="size-6 text-[#D4A017]" /> Finance & Invoice Hub
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">OCR invoice extraction, expense categorization and anomaly detection.</p>
        </div>

        {report && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
            <StatCard title="Total Spend (30d)" value={`$${report.totalSpend.toLocaleString()}`} icon={DollarSign} />
            <StatCard title="Categories" value={Object.keys(report.byCategory).length.toString()} icon={FileText} />
            <StatCard title="Anomalies Flagged" value={report.anomalyCount.toString()} icon={AlertTriangle} iconColor={report.anomalyCount > 0 ? 'text-red-600' : undefined} iconBg={report.anomalyCount > 0 ? 'bg-red-50' : undefined} />
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Invoice Dropzone</CardTitle>
              <CardDescription>Upload an invoice image for OCR extraction.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div
                onClick={() => !isParsing && inputRef.current?.click()}
                aria-disabled={isParsing}
                className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-10 transition-colors ${
                  isParsing ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:border-[#F5CA50]/50 hover:bg-[#FFFAEC]'
                }`}
              >
                {isParsing ? <Loader2 className="size-6 animate-spin text-gray-400" /> : <Upload className="size-6 text-gray-400" />}
                <p className="text-[13.5px] font-bold text-gray-900">{isParsing ? 'Extracting…' : 'Drop invoice or click to browse'}</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={isParsing}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (file) void handleUpload(file)
                  }}
                />
              </div>
              {error && <p className="text-[13px] font-bold text-red-500">{error}</p>}

              {duplicateWarning && (
                <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-[13px] font-bold text-amber-700">{duplicateWarning}</p>
                  <div className="flex gap-2">
                    <Button
                      className="h-8 bg-amber-400 px-3 text-[12px] font-bold text-[#111111] hover:brightness-95"
                      onClick={() => {
                        if (pendingDuplicateFile) {
                          void handleUpload(pendingDuplicateFile, true)
                          setPendingDuplicateFile(null)
                        } else {
                          void recordExpense(true)
                        }
                      }}
                    >
                      Add anyway
                    </Button>
                    <Button
                      className="h-8 border border-gray-200 bg-white px-3 text-[12px] font-bold text-gray-700 hover:bg-gray-50"
                      onClick={() => {
                        setDuplicateWarning(null)
                        setPendingDuplicateFile(null)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {invoice?.lowConfidence && (
                <p className="text-[13px] font-bold text-amber-600">
                  Some fields couldn&apos;t be read clearly — please verify {invoice.warnings.length > 0 ? invoice.warnings.join(', ') : 'the extracted values'} before saving.
                </p>
              )}

              {invoice && (
                <div className="flex flex-col gap-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Line item</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.lineItems.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right tabular-nums">${item.amount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex items-center justify-between text-[13px] font-bold text-gray-900">
                    <span>{invoice.vendor || 'Unknown vendor'}</span>
                    <span>${invoice.total.toFixed(2)}</span>
                  </div>
                  <Button className="bg-[#F5CA50] font-bold text-[#111111] hover:brightness-95" disabled={isRecording} onClick={() => recordExpense(false)}>
                    {isRecording && <Loader2 className="size-4 animate-spin" />}
                    Record as expense
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Expense Category Breakdown</CardTitle>
              <CardDescription>Last 30 days of recorded spend</CardDescription>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <p className="py-16 text-center text-[13px] font-medium text-gray-400">No expenses recorded yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2}>
                      {pieData.map((entry, i) => (
                        <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Anomaly Alerts</CardTitle>
            <CardDescription>Expenses flagged for exceeding budget or historical norms this session</CardDescription>
          </CardHeader>
          <CardContent>
            {anomalies.length === 0 ? (
              <p className="py-8 text-center text-[13px] font-medium text-gray-400">No anomalies detected.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {anomalies.map((record, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-3">
                    <AlertTriangle className="size-4 shrink-0 text-red-500" />
                    <div className="flex-1">
                      <p className="text-[13px] font-bold text-red-700">{record.vendor || record.description}</p>
                      <p className="text-[12px] font-medium text-red-600">${record.amount.toFixed(2)} · {record.category}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  )
}
