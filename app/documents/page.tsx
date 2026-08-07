'use client'

import {
  Bot,
  FileSpreadsheet,
  FileText,
  FileType,
  Image,
  Inbox,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Upload,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

// ─── Types & helpers ──────────────────────────────────────────────────────────

type DocumentStatus = 'Processed' | 'Processing' | 'Failed' | 'Pending'

/** Wire format returned by /api/documents. */
interface ApiDocument {
  id: string
  fileName: string
  fileType: string
  displayType: string
  size: string
  createdAt: string
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED'
  statusMessage: string | null
  hasSummary: boolean
}

interface ApiDocumentDetail extends ApiDocument {
  fileUrl: string
  extractedText: string | null
  aiSummary: string | null
}

const statusLabels: Record<ApiDocument['status'], DocumentStatus> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  PROCESSED: 'Processed',
  FAILED: 'Failed',
}

const statusStyles: Record<DocumentStatus, string> = {
  Processed: 'bg-success/10 text-success',
  Processing: 'bg-warning/15 text-warning',
  Failed: 'bg-destructive/10 text-destructive',
  Pending: 'bg-muted text-muted-foreground',
}

function formatUploadDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null)
  return (body as { error?: string } | null)?.error ?? fallback
}

function StatusBadge({ status }: { status: DocumentStatus }) {
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
          status === 'Processed' && 'bg-success',
          status === 'Processing' && 'animate-pulse bg-warning',
          status === 'Failed' && 'bg-destructive',
          status === 'Pending' && 'bg-muted-foreground',
        )}
      />
      {status}
    </span>
  )
}

function DocTypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    PDF: <FileText className="size-4 text-red-500" />,
    DOC: <FileType className="size-4 text-blue-500" />,
    DOCX: <FileType className="size-4 text-blue-500" />,
    PPT: <FileType className="size-4 text-orange-500" />,
    PPTX: <FileType className="size-4 text-orange-500" />,
    XLS: <FileSpreadsheet className="size-4 text-green-500" />,
    XLSX: <FileSpreadsheet className="size-4 text-green-500" />,
    CSV: <FileSpreadsheet className="size-4 text-emerald-500" />,
    TXT: <FileText className="size-4 text-muted-foreground" />,
    PNG: <Image className="size-4 text-purple-500" />,
    JPG: <Image className="size-4 text-pink-500" />,
    JPEG: <Image className="size-4 text-pink-500" />,
  }
  return (
    <span className="flex items-center gap-1.5">
      {icons[type] ?? <FileText className="size-4 text-muted-foreground" />}
      <span className="text-xs font-medium text-muted-foreground">{type}</span>
    </span>
  )
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({
  onClose,
  onUploaded,
}: {
  onClose: () => void
  /** Fires once per file, right after its record exists (before processing). */
  onUploaded: (doc: ApiDocument, processing: Promise<void>) => void
}) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function addFiles(list: FileList | null) {
    if (!list?.length) return
    setError(null)
    setFiles(Array.from(list))
  }

  /**
   * Two-step: upload returns as soon as the file is stored, then processing
   * (extraction + summary) runs separately so a slow OCR never blocks the
   * modal from closing.
   */
  async function handleUpload() {
    if (files.length === 0 || isUploading) return
    setIsUploading(true)
    setError(null)

    try {
      for (const file of files) {
        const form = new FormData()
        form.append('file', file)

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: form,
        })
        if (!response.ok) {
          throw new Error(await readError(response, `Upload failed for ${file.name}`))
        }

        const { document } = (await response.json()) as { document: ApiDocument }

        const processing = fetch(`/api/documents/${document.id}/process`, {
          method: 'POST',
        }).then(() => undefined)
        // Never let a rejected processing promise surface as unhandled — the
        // caller re-reads status from the server either way.
        processing.catch(() => {})

        onUploaded(document, processing)
      }
      onClose()
    } catch (uploadError) {
      setError((uploadError as Error).message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Upload Document</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close upload modal">
            <X className="size-4" />
          </Button>
        </div>

        <div
          id="upload-dropzone"
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed py-12 transition-colors',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border bg-muted/40 hover:border-primary/50 hover:bg-primary/5',
          )}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Upload className="size-6" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {files.length === 0
                ? 'Drop files here or click to browse'
                : files.length === 1
                  ? files[0].name
                  : `${files.length} files selected`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, XLSX, CSV, TXT, PNG — max 50 MB</p>
          </div>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            accept=".pdf,.docx,.xlsx,.csv,.txt,.png,.jpg"
            onChange={(e) => addFiles(e.target.files)}
          />
        </div>

        {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isUploading}>Cancel</Button>
          <Button
            className="flex-1"
            id="confirm-upload-button"
            onClick={handleUpload}
            disabled={isUploading || files.length === 0}
          >
            {isUploading && <Loader2 className="size-4 animate-spin" />}
            {isUploading ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Document Detail View ─────────────────────────────────────────────────────

interface ChatMsg { id: string; role: 'user' | 'assistant'; content: string }

function DocumentDetailView({
  documentId,
  summary,
  onBack,
}: {
  documentId: string
  /** List-row data, shown until the detail request resolves. */
  summary: ApiDocument
  onBack: () => void
}) {
  const [doc, setDoc] = useState<ApiDocumentDetail | null>(null)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isAsking, setIsAsking] = useState(false)

  const status = statusLabels[doc?.status ?? summary.status]
  const isProcessing = status === 'Processing' || status === 'Pending'

  // Re-fetch while the document is still processing so extracted text and the
  // summary appear as soon as the server finishes.
  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const response = await fetch(`/api/documents/${documentId}`)
        if (!response.ok || cancelled) return
        const { document } = (await response.json()) as { document: ApiDocumentDetail }
        if (!cancelled) setDoc(document)
      } catch {
        // Leave the list-row data in place; the poll will try again.
      }
    }

    void load()
    const interval = isProcessing ? setInterval(load, 3000) : null

    return () => {
      cancelled = true
      if (interval) clearInterval(interval)
    }
  }, [documentId, isProcessing])

  async function sendQuestion(e: React.FormEvent) {
    e.preventDefault()
    const question = inputValue.trim()
    if (!question || isAsking) return

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', content: question }])
    setInputValue('')
    setIsAsking(true)

    try {
      const response = await fetch(`/api/documents/${documentId}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const content = response.ok
        ? ((await response.json()) as { answer: string }).answer
        : await readError(response, 'The assistant could not answer that.')

      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content }])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: 'assistant', content: (error as Error).message },
      ])
    } finally {
      setIsAsking(false)
    }
  }

  const extractedText = doc?.extractedText ?? null
  const aiSummary = doc?.aiSummary ?? null
  const statusMessage = doc?.statusMessage ?? summary.statusMessage

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack} id="back-to-documents-button">
          ← Back
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{doc?.fileName ?? summary.fileName}</h2>
          <p className="text-sm text-muted-foreground">
            {formatUploadDate(doc?.createdAt ?? summary.createdAt)} · {doc?.size ?? summary.size}
          </p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* OCR Panel */}
        <Card className="shadow-sm lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Extracted Text</CardTitle>
            <CardDescription>Raw OCR output from document</CardDescription>
          </CardHeader>
          <CardContent>
            {isProcessing ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Loader2 className="size-4 animate-spin" />
                  Processing document…
                </div>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className={cn('h-4', i % 3 === 2 ? 'w-3/4' : 'w-full')} />
                ))}
              </div>
            ) : extractedText ? (
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/80 max-h-80 overflow-y-auto">
                {extractedText}
              </pre>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                <FileText className="size-8 opacity-30" />
                <p className="text-sm">
                  {status === 'Failed'
                    ? 'Text extraction failed for this document.'
                    : 'No text could be extracted from this document.'}
                </p>
                {statusMessage && <p className="max-w-md text-xs">{statusMessage}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* AI Summary */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bot className="size-4" />
                </div>
                <CardTitle className="text-base">AI Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {isProcessing ? (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className={cn('h-4', i === 2 ? 'w-2/3' : 'w-full')} />
                  ))}
                </div>
              ) : aiSummary ? (
                <p className="text-sm leading-relaxed text-foreground/80">{aiSummary}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Summary not available.</p>
              )}
            </CardContent>
          </Card>

          {/* Q&A Chat */}
          <Card className="shadow-sm flex flex-col flex-1">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <MessageSquare className="size-4" />
                </div>
                <CardTitle className="text-base">Ask a Question</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 pt-0">
              <div className="min-h-24 max-h-48 overflow-y-auto flex flex-col gap-2">
                {messages.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    Ask anything about this document
                  </p>
                )}
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'rounded-lg px-3 py-2 text-xs leading-relaxed',
                      msg.role === 'user'
                        ? 'ml-4 bg-primary text-primary-foreground self-end'
                        : 'mr-4 bg-muted text-foreground self-start',
                    )}
                  >
                    {msg.content}
                  </div>
                ))}
                {isAsking && (
                  <div className="mr-4 rounded-lg bg-muted px-3 py-2 self-start">
                    <Loader2 className="size-3 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              <form onSubmit={sendQuestion} className="flex gap-2">
                <input
                  id="doc-qa-input"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="e.g. What is the total amount?"
                  className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-ring"
                  disabled={isProcessing || isAsking}
                />
                <Button type="submit" size="icon" className="size-8 shrink-0" disabled={isProcessing || isAsking || !inputValue.trim()}>
                  <Send className="size-3" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<ApiDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/documents')
      if (!response.ok) {
        setLoadError(await readError(response, 'Could not load documents'))
        return
      }
      const { documents: rows } = (await response.json()) as { documents: ApiDocument[] }
      setDocuments(rows)
      setLoadError(null)
    } catch (error) {
      setLoadError((error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  /**
   * Show the new row straight away as Processing, then re-read it from the
   * server once the process request settles.
   */
  const handleUploaded = useCallback(
    (doc: ApiDocument, processing: Promise<void>) => {
      setDocuments((prev) => [{ ...doc, status: 'PROCESSING' }, ...prev])
      void processing.finally(() => {
        void refresh()
      })
    },
    [refresh],
  )

  const selectedDoc = documents.find((doc) => doc.id === selectedDocId) ?? null

  return (
    <DashboardShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {selectedDoc ? (
          <DocumentDetailView
            documentId={selectedDoc.id}
            summary={selectedDoc}
            onBack={() => {
              setSelectedDocId(null)
              void refresh()
            }}
          />
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Documents</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload and analyze documents with AI-powered OCR and summarization
                </p>
              </div>
              <Button onClick={() => setShowUpload(true)} id="upload-document-button">
                <Upload className="size-4" />
                Upload
              </Button>
            </div>

            {isLoading ? (
              <Card className="shadow-sm">
                <div className="flex flex-col gap-3 p-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </Card>
            ) : documents.length === 0 ? (
              <Card className="shadow-sm">
                <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Inbox className="size-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-medium">
                      {loadError ? 'Could not load documents' : 'No documents yet'}
                    </p>
                    <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                      {loadError ??
                        'Upload your first document to get started with AI-powered processing.'}
                    </p>
                  </div>
                  <Button onClick={() => setShowUpload(true)}>
                    <Plus className="size-4" />
                    Upload document
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>All Documents</CardTitle>
                  <CardDescription>{documents.length} documents in your workspace</CardDescription>
                </CardHeader>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Upload Date</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow
                          key={doc.id}
                          className="cursor-pointer"
                          onClick={() => setSelectedDocId(doc.id)}
                          id={`doc-row-${doc.id}`}
                        >
                          <TableCell className="font-medium text-foreground">{doc.fileName}</TableCell>
                          <TableCell><DocTypeIcon type={doc.displayType} /></TableCell>
                          <TableCell className="text-muted-foreground">{formatUploadDate(doc.createdAt)}</TableCell>
                          <TableCell className="text-muted-foreground tabular-nums">{doc.size}</TableCell>
                          <TableCell><StatusBadge status={statusLabels[doc.status]} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={handleUploaded} />}
    </DashboardShell>
  )
}
