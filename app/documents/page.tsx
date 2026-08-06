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
import { useRef, useState } from 'react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import { getDocumentById, getDocuments, type Document, type DocumentStatus, type DocumentType } from '@/lib/mock-data/documents'

// ─── Types & helpers ──────────────────────────────────────────────────────────

const statusStyles: Record<DocumentStatus, string> = {
  Processed: 'bg-success/10 text-success',
  Processing: 'bg-warning/15 text-warning',
  Failed: 'bg-destructive/10 text-destructive',
  Pending: 'bg-muted text-muted-foreground',
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

function DocTypeIcon({ type }: { type: DocumentType }) {
  const icons: Record<DocumentType, React.ReactNode> = {
    PDF: <FileText className="size-4 text-red-500" />,
    DOCX: <FileType className="size-4 text-blue-500" />,
    XLSX: <FileSpreadsheet className="size-4 text-green-500" />,
    CSV: <FileSpreadsheet className="size-4 text-emerald-500" />,
    TXT: <FileText className="size-4 text-muted-foreground" />,
    PNG: <Image className="size-4 text-purple-500" />,
    JPG: <Image className="size-4 text-pink-500" />,
  }
  return (
    <span className="flex items-center gap-1.5">
      {icons[type]}
      <span className="text-xs font-medium text-muted-foreground">{type}</span>
    </span>
  )
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({ onClose }: { onClose: () => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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
          onDrop={(e) => { e.preventDefault(); setIsDragging(false) }}
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
            <p className="text-sm font-medium text-foreground">Drop files here or click to browse</p>
            <p className="mt-1 text-xs text-muted-foreground">PDF, DOCX, XLSX, CSV, TXT, PNG — max 50 MB</p>
          </div>
          <input ref={inputRef} type="file" className="hidden" multiple accept=".pdf,.docx,.xlsx,.csv,.txt,.png,.jpg" />
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button className="flex-1" id="confirm-upload-button">Upload</Button>
        </div>
      </div>
    </div>
  )
}

// ─── Document Detail View ─────────────────────────────────────────────────────

interface ChatMsg { id: string; role: 'user' | 'assistant'; content: string }

function DocumentDetailView({ doc, onBack }: { doc: Document; onBack: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isAsking, setIsAsking] = useState(false)

  function sendQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!inputValue.trim()) return
    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: 'user', content: inputValue }
    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsAsking(true)
    // Simulate AI response
    setTimeout(() => {
      const aiMsg: ChatMsg = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: `Based on **${doc.name}**, here is what I found: This is a mock AI answer to your question about the document. In production, this would call the AI API with the document context and your query to provide a factual, grounded answer.`,
      }
      setMessages((prev) => [...prev, aiMsg])
      setIsAsking(false)
    }, 1200)
  }

  const isProcessing = doc.status === 'Processing' || doc.status === 'Pending'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onBack} id="back-to-documents-button">
          ← Back
        </Button>
        <div>
          <h2 className="text-lg font-semibold text-foreground">{doc.name}</h2>
          <p className="text-sm text-muted-foreground">{doc.uploadDate} · {doc.size}</p>
        </div>
        <div className="ml-auto">
          <StatusBadge status={doc.status} />
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
            ) : doc.ocrText ? (
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground/80 max-h-80 overflow-y-auto">
                {doc.ocrText}
              </pre>
            ) : (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                <FileText className="size-8 opacity-30" />
                <p className="text-sm">No text could be extracted from this document.</p>
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
              ) : doc.aiSummary ? (
                <p className="text-sm leading-relaxed text-foreground/80">{doc.aiSummary}</p>
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
  const documents = getDocuments()
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  const selectedDoc = selectedDocId ? getDocumentById(selectedDocId) : null

  return (
    <DashboardShell>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {selectedDoc ? (
          <DocumentDetailView doc={selectedDoc} onBack={() => setSelectedDocId(null)} />
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

            {documents.length === 0 ? (
              <Card className="shadow-sm">
                <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Inbox className="size-7" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-medium">No documents yet</p>
                    <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                      Upload your first document to get started with AI-powered processing.
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
                          <TableCell className="font-medium text-foreground">{doc.name}</TableCell>
                          <TableCell><DocTypeIcon type={doc.type} /></TableCell>
                          <TableCell className="text-muted-foreground">{doc.uploadDate}</TableCell>
                          <TableCell className="text-muted-foreground tabular-nums">{doc.size}</TableCell>
                          <TableCell><StatusBadge status={doc.status} /></TableCell>
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

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </DashboardShell>
  )
}
