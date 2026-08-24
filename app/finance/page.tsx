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

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null)
  return (body as { error?: string } | null)?.error ?? fallback
}

export default function FinancePage() {
  const [report, setReport] = useState<BudgetReport | null>(null)
  const [invoice, setInvoice] = useState<ParsedInvoice | null>(null)
  const [records, setRecords] = useState<FinanceRecord[]>([])
  const [isParsing, setIsParsing] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const response = await fetch('/api/automation/finance/budget-report')
        if (!response.ok || cancelled) return
        const { report: data } = (await response.json()) as { report: BudgetReport }
        if (!cancelled) setReport(data)
      } catch {}
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [records])

  async function handleUpload(file: File) {
    setIsParsing(true)
    setError(null)
    setInvoice(null)
    try {
      const form = new FormData()
      form.append('invoice', file)
      const response = await fetch('/api/automation/finance/parse-invoice', { method: 'POST', body: form })
      if (!response.ok) {
        setError(await readError(response, 'Could not parse invoice'))
        return
      }
      const { invoice: parsed } = (await response.json()) as { invoice: ParsedInvoice }
      setInvoice(parsed)
    } catch (uploadError) {
      setError((uploadError as Error).message)
    } finally {
      setIsParsing(false)
    }
  }

  async function recordExpense() {
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
        }),
      })
      if (!response.ok) {
        setError(await readError(response, 'Could not record expense'))
        return
      }
      const { record } = (await response.json()) as { record: FinanceRecord }
      setRecords((prev) => [record, ...prev])
      setInvoice(null)
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
                onClick={() => inputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 py-10 transition-colors hover:border-[#F5CA50]/50 hover:bg-[#FFFAEC]"
              >
                {isParsing ? <Loader2 className="size-6 animate-spin text-gray-400" /> : <Upload className="size-6 text-gray-400" />}
                <p className="text-[13.5px] font-bold text-gray-900">{isParsing ? 'Extracting…' : 'Drop invoice or click to browse'}</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
              </div>
              {error && <p className="text-[13px] font-bold text-red-500">{error}</p>}

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
                  <Button className="bg-[#F5CA50] font-bold text-[#111111] hover:brightness-95" disabled={isRecording} onClick={recordExpense}>
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
