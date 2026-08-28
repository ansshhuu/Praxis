import type { Document, DocumentStatus } from '@prisma/client'

export function displayType(fileType: string, fileName: string): string {
  const fromName = fileName.includes('.') ? fileName.split('.').pop() : ''
  const raw = (fromName || fileType.split('/').pop() || fileType).toLowerCase()
  const alias: Record<string, string> = { jpeg: 'jpg', 'plain': 'txt' }
  return (alias[raw] ?? raw).toUpperCase().slice(0, 8)
}

export function formatSize(bytes: number | null): string {
  if (bytes === null || Number.isNaN(bytes)) return '-'
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[unit]}`
}

export type DocumentSummary = {
  id: string
  fileName: string
  fileType: string
  displayType: string
  size: string
  createdAt: string
  status: DocumentStatus
  statusMessage: string | null
  hasSummary: boolean
}

export type DocumentDetail = DocumentSummary & {
  fileUrl: string
  extractedText: string | null
  aiSummary: string | null
}

type SummaryRow = Pick<
  Document,
  'id' | 'fileName' | 'fileType' | 'fileSize' | 'createdAt' | 'status' | 'statusMessage'
> & { aiSummary?: string | null }

export function toSummary(doc: SummaryRow): DocumentSummary {
  return {
    id: doc.id,
    fileName: doc.fileName,
    fileType: doc.fileType,
    displayType: displayType(doc.fileType, doc.fileName),
    size: formatSize(doc.fileSize),
    createdAt: doc.createdAt.toISOString(),
    status: doc.status,
    statusMessage: doc.statusMessage,
    hasSummary: Boolean(doc.aiSummary),
  }
}

export function toDetail(doc: Document): DocumentDetail {
  return {
    ...toSummary(doc),
    fileUrl: doc.fileUrl,
    extractedText: doc.extractedText,
    aiSummary: doc.aiSummary,
  }
}
