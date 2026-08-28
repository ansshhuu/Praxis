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
  lowConfidence: boolean
  warnings: string[]
}

const INVOICE_SCHEMA_PROMPT = [
  'Extract structured invoice data from the text below and respond with ONLY a JSON object matching this shape:',
  '{"vendor": string, "lineItems": [{"description": string, "amount": number}], "tax": number, "dueDate": string | null, "total": number}',
  'Use ISO 8601 (YYYY-MM-DD) for dueDate, or null if not present.',
].join('\n')

const MIN_OCR_CONFIDENCE = 55
const MIN_OCR_WORDS = 4

export class InvoiceParseError extends Error {
  constructor(public readonly code: 'ocr_failed' | 'ocr_empty' | 'llm_failed' | 'unparseable_response', message: string) {
    super(message)
    this.name = 'InvoiceParseError'
  }
}

export async function parseInvoice(options: { buffer: Buffer; mimeType: string }): Promise<ParsedInvoice> {
  let ocr: Awaited<ReturnType<typeof ocrImage>>
  try {
    ocr = await ocrImage({ buffer: options.buffer, mimeType: options.mimeType })
  } catch (error) {
    throw new InvoiceParseError('ocr_failed', `OCR failed to process the image: ${(error as Error).message}`)
  }

  if (!ocr.text || ocr.words < MIN_OCR_WORDS) {
    throw new InvoiceParseError('ocr_empty', 'OCR could not read any text from this image - it may be blank, too blurry, or not an invoice')
  }

  let text: string
  try {
    ;({ text } = await generateText({
      messages: [
        { role: 'system', content: INVOICE_SCHEMA_PROMPT },
        { role: 'user', content: ocr.text },
      ],
      task: 'finance-invoice',
      maxTokens: 700,
      temperature: 0,
    }))
  } catch (error) {
    throw new InvoiceParseError('llm_failed', `OCR service timeout or failure while extracting invoice fields: ${(error as Error).message}`)
  }

  const parsed = parseJsonObject(text)
  if (!parsed) {
    throw new InvoiceParseError('unparseable_response', 'Invoice parsing returned an unparseable response')
  }

  const lineItems: ParsedInvoiceLineItem[] = Array.isArray(parsed.lineItems)
    ? (parsed.lineItems as unknown[])
        .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
        .map((entry) => ({
          description: typeof entry.description === 'string' ? entry.description : '',
          amount: typeof entry.amount === 'number' ? entry.amount : 0,
        }))
    : []

  const vendor = typeof parsed.vendor === 'string' ? parsed.vendor : ''
  const total = typeof parsed.total === 'number' ? parsed.total : 0
  const dueDate = typeof parsed.dueDate === 'string' ? parsed.dueDate : null

  const warnings: string[] = []
  if (!vendor) warnings.push('vendor')
  if (!total) warnings.push('amount')
  if (lineItems.length === 0) warnings.push('line items')
  const lowConfidence = ocr.confidence < MIN_OCR_CONFIDENCE || warnings.length > 0

  return {
    vendor,
    lineItems,
    tax: typeof parsed.tax === 'number' ? parsed.tax : 0,
    dueDate,
    total,
    lowConfidence,
    warnings,
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
  invoiceHash?: string | null
  allowDuplicate?: boolean
}

export async function findFinanceRecordByHash(userId: string, invoiceHash: string): Promise<FinanceRecord | null> {
  const collection = await getFinanceRecordsCollection()
  return collection.findOne({ userId, invoiceHash })
}

export async function recordFinanceEntry(input: RecordFinanceEntryInput): Promise<FinanceRecord> {
  const category = categorizeExpense(input.description)
  const anomaly = detectBudgetAnomaly(input.amount, input.budgetThreshold, input.historicalAverage)
  const collection = await getFinanceRecordsCollection()
  const invoiceHash = input.invoiceHash ?? null

  if (invoiceHash && !input.allowDuplicate) {
    const existing = await collection.findOne({ userId: input.userId, invoiceHash })
    if (existing) {
      throw new DuplicateInvoiceError(existing)
    }
  }

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
    invoiceHash,
    createdAt: new Date(),
  }

  const result = await collection.insertOne(record)
  return { ...record, _id: result.insertedId }
}

export class DuplicateInvoiceError extends Error {
  constructor(public readonly existing: FinanceRecord) {
    super('This invoice appears to already be uploaded')
    this.name = 'DuplicateInvoiceError'
  }
}

export async function listFinanceRecords(userId: string, since: Date): Promise<FinanceRecord[]> {
  const collection = await getFinanceRecordsCollection()
  return collection.find({ userId, createdAt: { $gte: since } }).sort({ createdAt: -1 }).toArray()
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
