import { generateText } from '@/lib/ai/llm-gateway'
import { parseJsonObject } from '@/lib/ai/json'
import { ocrImage } from '@/lib/ai/vision-service'
import {
  getFinanceRecordsCollection,
  type FinanceRecord,
} from '@/lib/models/mongodb/finance-records'

export interface ParsedInvoiceLineItem {
  description: string
  amount: number
}

export interface ParsedInvoice {
  vendor: string
  lineItems: ParsedInvoiceLineItem[]
  tax: number
  dueDate: string | null
  total: number
}

const INVOICE_SCHEMA_PROMPT = [
  'Extract structured invoice data from the text below and respond with ONLY a JSON object matching this shape:',
  '{"vendor": string, "lineItems": [{"description": string, "amount": number}], "tax": number, "dueDate": string | null, "total": number}',
  'Use ISO 8601 (YYYY-MM-DD) for dueDate, or null if not present.',
].join('\n')

export async function parseInvoice(options: { buffer: Buffer; mimeType: string }): Promise<ParsedInvoice> {
  const ocr = await ocrImage({ buffer: options.buffer, mimeType: options.mimeType })
  const { text } = await generateText({
    messages: [
      { role: 'system', content: INVOICE_SCHEMA_PROMPT },
      { role: 'user', content: ocr.text },
    ],
    task: 'finance-invoice',
    maxTokens: 700,
    temperature: 0,
  })

  const parsed = parseJsonObject(text)
  if (!parsed) {
    throw new Error('Invoice parsing returned an unparseable response')
  }

  const lineItems: ParsedInvoiceLineItem[] = Array.isArray(parsed.lineItems)
    ? (parsed.lineItems as unknown[])
        .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
        .map((entry) => ({
          description: typeof entry.description === 'string' ? entry.description : '',
          amount: typeof entry.amount === 'number' ? entry.amount : 0,
        }))
    : []

  return {
    vendor: typeof parsed.vendor === 'string' ? parsed.vendor : '',
    lineItems,
    tax: typeof parsed.tax === 'number' ? parsed.tax : 0,
    dueDate: typeof parsed.dueDate === 'string' ? parsed.dueDate : null,
    total: typeof parsed.total === 'number' ? parsed.total : 0,
  }
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  travel: ['flight', 'hotel', 'uber', 'lyft', 'airfare', 'taxi', 'train'],
  software: ['saas', 'subscription', 'license', 'software', 'cloud', 'hosting'],
  meals: ['restaurant', 'meal', 'catering', 'coffee', 'lunch', 'dinner'],
  office: ['office', 'supplies', 'furniture', 'stationery'],
  marketing: ['ad', 'advertising', 'marketing', 'sponsorship', 'campaign'],
  utilities: ['electric', 'water', 'internet', 'phone bill', 'utility'],
}

export function categorizeExpense(description: string): string {
  const text = description.toLowerCase()
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category
    }
  }
  return 'general'
}

export interface AnomalyCheck {
  isAnomaly: boolean
  reason: string | null
}

export function detectBudgetAnomaly(
  amount: number,
  threshold: number,
  historicalAverage: number,
): AnomalyCheck {
  if (amount > threshold) {
    return { isAnomaly: true, reason: `Amount $${amount} exceeds budget threshold of $${threshold}` }
  }
  if (historicalAverage > 0 && amount > historicalAverage * 3) {
    return {
      isAnomaly: true,
      reason: `Amount $${amount} is more than 3x the historical average of $${historicalAverage.toFixed(2)}`,
    }
  }
  return { isAnomaly: false, reason: null }
}

export interface RecordFinanceEntryInput {
  userId: string
  vendor: string
  description: string
  amount: number
  tax: number
  dueDate: Date | null
  budgetThreshold: number
  historicalAverage: number
  type: FinanceRecord['type']
}

export async function recordFinanceEntry(input: RecordFinanceEntryInput): Promise<FinanceRecord> {
  const category = categorizeExpense(input.description)
  const anomaly = detectBudgetAnomaly(input.amount, input.budgetThreshold, input.historicalAverage)
  const collection = await getFinanceRecordsCollection()

  const record: FinanceRecord = {
    userId: input.userId,
    orgId: input.userId,
    type: input.type,
    vendor: input.vendor,
    category,
    amount: input.amount,
    tax: input.tax,
    dueDate: input.dueDate,
    description: input.description,
    anomaly: anomaly.isAnomaly,
    createdAt: new Date(),
  }

  const result = await collection.insertOne(record)
  return { ...record, _id: result.insertedId }
}

export interface BudgetReport {
  totalSpend: number
  byCategory: Record<string, number>
  anomalyCount: number
}

export async function buildBudgetReport(userId: string, since: Date): Promise<BudgetReport> {
  const collection = await getFinanceRecordsCollection()
  const records = await collection.find({ userId, createdAt: { $gte: since } }).toArray()

  const byCategory: Record<string, number> = {}
  let totalSpend = 0
  let anomalyCount = 0

  for (const record of records) {
    totalSpend += record.amount
    byCategory[record.category] = (byCategory[record.category] ?? 0) + record.amount
    if (record.anomaly) anomalyCount += 1
  }

  return { totalSpend, byCategory, anomalyCount }
}
