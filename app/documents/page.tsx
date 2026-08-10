'use client'

import {
  Bot,
  FileSpreadsheet,
  FileText,
  FileType,
  Image as ImageIcon,
  Inbox,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Upload,
  X,
  FolderOpen,
  PieChart,
  Users,
  Briefcase
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import React from 'react'

import { EASE_OUT } from '@/components/motion/primitives'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/ui/status-badge'
import { cn } from '@/lib/utils'

type DocumentStatus = 'Processed' | 'Processing' | 'Failed' | 'Pending'

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

function splitSentences(text: string): string[] {
  const parts = text.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g)
  return parts ? parts.map((s) => s.trim()).filter(Boolean) : [text]
}

function DocTypeIcon({ type }: { type: string }) {
  const icons: Record<string, React.ReactNode> = {
    PDF: <FileText className="size-8 text-red-500" />,
    DOC: <FileType className="size-8 text-blue-500" />,
    DOCX: <FileType className="size-8 text-blue-500" />,
    PPT: <FileType className="size-8 text-orange-500" />,
    PPTX: <FileType className="size-8 text-orange-500" />,
    XLS: <FileSpreadsheet className="size-8 text-green-500" />,
    XLSX: <FileSpreadsheet className="size-8 text-green-500" />,
    CSV: <FileSpreadsheet className="size-8 text-emerald-500" />,
    TXT: <FileText className="size-8 text-gray-400" />,
    PNG: <ImageIcon className="size-8 text-purple-500" />,
    JPG: <ImageIcon className="size-8 text-pink-500" />,
    JPEG: <ImageIcon className="size-8 text-pink-500" />,
  }
  return icons[type] ?? <FileText className="size-8 text-gray-400" />
}

function UploadModal({
  onClose,
  onUploaded,
}: {
  onClose: () => void
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
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Upload Document</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-4 text-gray-500" />
          </Button>
        </div>

        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); addFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed py-12 transition-colors',
            isDragging
              ? 'border-[#F5CA50] bg-[#FFFAEC]'
              : 'border-gray-200 bg-gray-50 hover:border-[#F5CA50]/50 hover:bg-[#FFFAEC]',
          )}
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-[#EAE3D9] text-[#111111]">
            <Upload className="size-5" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-gray-900">
              {files.length === 0
                ? 'Drop files here or click to browse'
                : files.length === 1
                  ? files[0].name
                  : `${files.length} files selected`}
            </p>
            <p className="mt-1 text-xs text-gray-500">PDF, DOCX, XLSX, CSV, TXT, PNG — max 50 MB</p>
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

        {error && <p className="mt-3 text-xs text-red-500 font-medium">{error}</p>}

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isUploading}>Cancel</Button>
          <Button className="flex-1 bg-[#F5CA50] text-[#111111] hover:brightness-95" onClick={handleUpload} disabled={isUploading || files.length === 0}>
            {isUploading && <Loader2 className="size-4 animate-spin mr-2" />}
            {isUploading ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface ChatMsg { id: string; role: 'user' | 'assistant'; content: string }

function DocumentDetailView({
  documentId,
  summary,
}: {
  documentId: string
  summary: ApiDocument
}) {
  const [doc, setDoc] = useState<ApiDocumentDetail | null>(null)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isAsking, setIsAsking] = useState(false)
  const [activeTab, setActiveTab] = useState<'summary' | 'ocr' | 'qa'>('summary')

  const status = statusLabels[doc?.status ?? summary.status]
  const isProcessing = status === 'Processing' || status === 'Pending'

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const response = await fetch(`/api/documents/${documentId}`)
        if (!response.ok || cancelled) return
        const { document } = (await response.json()) as { document: ApiDocumentDetail }
        if (!cancelled) setDoc(document)
      } catch {}
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
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: (error as Error).message }])
    } finally {
      setIsAsking(false)
    }
  }

  const extractedText = doc?.extractedText ?? null
  const aiSummary = doc?.aiSummary ?? null

  return (
    <Card className="h-full flex flex-col overflow-hidden rounded-2xl shadow-sm border-gray-100 p-0">
      <div className="p-5 border-b border-gray-100 shrink-0">
        <h3 className="font-bold text-gray-900 text-base truncate pr-2">{doc?.fileName ?? summary.fileName}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500 font-medium">{formatUploadDate(doc?.createdAt ?? summary.createdAt)} · {doc?.size ?? summary.size}</span>
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="flex px-4 border-b border-gray-100 shrink-0">
        {([
          { id: 'summary', label: 'Summary' },
          { id: 'ocr', label: 'OCR Text' },
          { id: 'qa', label: 'Q&A' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-3 text-[13px] font-semibold transition-colors border-b-2",
              activeTab === tab.id
                ? "border-[#F5CA50] text-[#111111]"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-200"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 relative bg-gray-50/30">
        {activeTab === 'summary' && (
          <div className="flex flex-col gap-4">
            <AnimatePresence mode="wait" initial={false}>
              {isProcessing ? (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25, ease: EASE_OUT }}
                  className="flex flex-col gap-3"
                >
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </motion.div>
              ) : aiSummary ? (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: EASE_OUT }}
                  className="prose prose-sm prose-gray max-w-none"
                >
                  <p className="text-[13.5px] leading-relaxed text-gray-700 whitespace-pre-wrap">
                    {splitSentences(aiSummary).map((sentence, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.12 + i * 0.11, ease: EASE_OUT }}
                        style={{ display: 'inline' }}
                      >
                        {sentence}
                        {i < splitSentences(aiSummary).length - 1 ? ' ' : ''}
                      </motion.span>
                    ))}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center justify-center py-10 text-center opacity-50"
                >
                  <Bot className="size-8 mb-3 text-gray-400" />
                  <p className="text-sm text-gray-500 font-medium">Summary not available</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {activeTab === 'ocr' && (
           <div className="h-full bg-white rounded-xl border border-gray-100 p-4 shadow-sm overflow-y-auto">
             <AnimatePresence mode="wait" initial={false}>
               {isProcessing ? (
                  <motion.div
                    key="ocr-processing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex items-center gap-2 text-sm text-gray-500"
                  >
                    <Loader2 className="size-4 animate-spin" /> Processing OCR...
                  </motion.div>
               ) : extractedText ? (
                  <motion.pre
                    key="ocr-text"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: EASE_OUT }}
                    className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-gray-600"
                  >
                    {extractedText}
                  </motion.pre>
               ) : (
                  <motion.p
                    key="ocr-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="text-sm text-gray-500 italic"
                  >
                    No text could be extracted.
                  </motion.p>
               )}
             </AnimatePresence>
           </div>
        )}

        {activeTab === 'qa' && (
          <div className="flex flex-col h-full bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
             <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
               {messages.length === 0 && (
                 <div className="m-auto text-center">
                   <MessageSquare className="size-8 mx-auto text-gray-300 mb-2" />
                   <p className="text-[13px] text-gray-500 font-medium">Ask any question about this document</p>
                 </div>
               )}
               {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed max-w-[85%]',
                      msg.role === 'user'
                        ? 'ml-auto bg-[#FFFAEC] text-gray-900 font-medium border border-[#F5CA50]/30 rounded-tr-sm'
                        : 'mr-auto bg-gray-50 border border-gray-100 text-gray-800 rounded-tl-sm',
                    )}
                  >
                    {msg.content}
                  </div>
                ))}
                {isAsking && (
                  <div className="mr-auto bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-2.5">
                    <Loader2 className="size-3.5 animate-spin text-gray-400" />
                  </div>
                )}
             </div>
             <form onSubmit={sendQuestion} className="p-3 border-t border-gray-100 bg-gray-50/50 flex gap-2">
                <input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 rounded-full border border-gray-200 bg-white px-4 py-2 text-[13px] outline-none focus:ring-1 focus:ring-[#F5CA50] focus:border-[#F5CA50] transition-all"
                  disabled={isProcessing || isAsking}
                />
                <Button type="submit" size="icon" className="size-9 shrink-0 rounded-full bg-[#F5CA50] text-[#111111] hover:brightness-95" disabled={isProcessing || isAsking || !inputValue.trim()}>
                  <Send className="size-4" />
                </Button>
             </form>
          </div>
        )}
      </div>
    </Card>
  )
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<ApiDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [activeFolder, setActiveFolder] = useState('All')

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/documents')
      if (response.ok) {
        const { documents: rows } = (await response.json()) as { documents: ApiDocument[] }
        setDocuments(rows)
        if (rows.length > 0 && !selectedDocId) {
          setSelectedDocId(rows[0].id)
        }
      }
    } catch {} finally {
      setIsLoading(false)
    }
  }, [selectedDocId])

  useEffect(() => { void refresh() }, [refresh])

  const handleUploaded = useCallback((doc: ApiDocument, processing: Promise<void>) => {
    setDocuments((prev) => [{ ...doc, status: 'PROCESSING' }, ...prev])
    setSelectedDocId(doc.id)
    void processing.finally(() => { void refresh() })
  }, [refresh])

  const selectedDoc = documents.find((doc) => doc.id === selectedDocId) ?? null

  const folders = [
    { name: 'All', icon: Inbox },
    { name: 'Financials', icon: PieChart },
    { name: 'Contracts', icon: Briefcase },
    { name: 'HR', icon: Users },
    { name: 'Reports', icon: FolderOpen },
  ]

  return (
    <DashboardShell mainClassName="p-0 h-[calc(100vh-64px)] flex flex-col">
      <div className="flex h-full max-w-[1600px] mx-auto w-full">

        <div className="w-60 border-r border-gray-100 bg-white flex flex-col p-4 shrink-0 hidden md:flex">
          <Button
            className="w-full justify-start bg-[#F5CA50] text-gray-900 hover:brightness-95 shadow-sm rounded-lg h-10 font-bold mb-6"
            onClick={() => setShowUpload(true)}
          >
            <Plus className="size-4 mr-2" /> Upload Document
          </Button>

          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Folders</h4>
          <ul className="flex flex-col gap-1">
            {folders.map(f => (
              <li key={f.name}>
                <button
                  onClick={() => setActiveFolder(f.name)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-colors",
                    activeFolder === f.name
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <f.icon className={cn("size-4", activeFolder === f.name ? "text-gray-900" : "text-gray-400")} />
                  {f.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex-1 min-w-0 bg-gray-50/30 border-r border-gray-100 flex flex-col">
          <div className="p-4 md:p-6 border-b border-gray-100 bg-white flex items-center justify-between shrink-0">
             <h2 className="text-xl font-bold text-gray-900">Documents</h2>
             <Button variant="outline" size="sm" className="md:hidden" onClick={() => setShowUpload(true)}>Upload</Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-3">
             {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)
             ) : documents.length === 0 ? (
                <div className="m-auto text-center flex flex-col items-center">
                  <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <FileText className="size-8 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900">No documents found</h3>
                  <p className="text-[13px] text-gray-500 mt-1 max-w-xs">Upload a document to automatically extract text and generate AI summaries.</p>
                </div>
             ) : (
               documents.map(doc => (
                 <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border text-left transition-all",
                      selectedDocId === doc.id
                        ? "border-[#F5CA50] bg-[#FFFAEC] shadow-sm ring-1 ring-[#F5CA50]/50"
                        : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                    )}
                 >
                    <div className="shrink-0 bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                      <DocTypeIcon type={doc.displayType} />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <p className="text-[14px] font-bold text-gray-900 truncate">{doc.fileName}</p>
                      <div className="flex items-center gap-3 text-[12px] text-gray-500 font-medium">
                        <span>{doc.size}</span>
                        <span>·</span>
                        <span>{formatUploadDate(doc.createdAt)}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                       <StatusBadge status={statusLabels[doc.status]} />
                    </div>
                 </button>
               ))
             )}
          </div>
        </div>

        <div className="w-[360px] xl:w-[420px] bg-white p-4 md:p-6 shrink-0 hidden lg:block overflow-hidden h-full">
           {selectedDoc ? (
             <DocumentDetailView documentId={selectedDoc.id} summary={selectedDoc} />
           ) : (
             <div className="h-full border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-center p-8 text-gray-400">
                <FileText className="size-10 mb-4 opacity-30" />
                <p className="text-sm font-semibold text-gray-500">Select a document to view details</p>
             </div>
           )}
        </div>

      </div>
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onUploaded={handleUploaded} />}
    </DashboardShell>
  )
}
