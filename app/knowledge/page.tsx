'use client'

import { Database, FileUp, Loader2, Search, Sparkles } from 'lucide-react'
import { useRef, useState } from 'react'

import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Textarea } from '@/components/ui/textarea'

interface Snippet {
  text: string
  similarity: number
  documentId: string | undefined
  chunkIndex: number | undefined
}

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => null)
  return (body as { error?: string } | null)?.error ?? fallback
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.readAsText(file)
  })
}

export default function KnowledgePage() {
  const [text, setText] = useState('')
  const [isIngesting, setIsIngesting] = useState(false)
  const [ingestError, setIngestError] = useState<string | null>(null)
  const [documentsIngested, setDocumentsIngested] = useState(0)
  const [chunksIngested, setChunksIngested] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const [query, setQuery] = useState('')
  const [isQuerying, setIsQuerying] = useState(false)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [answer, setAnswer] = useState<string | null>(null)
  const [snippets, setSnippets] = useState<Snippet[]>([])

  async function ingest() {
    if (!text.trim() || isIngesting) return
    setIsIngesting(true)
    setIngestError(null)
    try {
      const response = await fetch('/api/rag/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      if (!response.ok) {
        setIngestError(await readError(response, 'Could not ingest document'))
        return
      }
      const { chunkCount } = (await response.json()) as { documentId: string; chunkCount: number }
      setDocumentsIngested((prev) => prev + 1)
      setChunksIngested((prev) => prev + chunkCount)
      setText('')
    } catch (ingestErr) {
      setIngestError((ingestErr as Error).message)
    } finally {
      setIsIngesting(false)
    }
  }

  async function runQuery() {
    if (!query.trim() || isQuerying) return
    setIsQuerying(true)
    setQueryError(null)
    setAnswer(null)
    try {
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      })
      if (!response.ok) {
        setQueryError(await readError(response, 'Could not query the knowledge base'))
        return
      }
      const result = (await response.json()) as { snippets: Snippet[]; answer: string | null }
      setSnippets(result.snippets)
      setAnswer(result.answer)
    } catch (queryErr) {
      setQueryError((queryErr as Error).message)
    } finally {
      setIsQuerying(false)
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 p-4 md:p-6">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-gray-900">
            <Database className="size-6 text-[#D4A017]" /> RAG Knowledge Base
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500">Ingest documents and search them with cited, grounded answers.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
          <StatCard title="Documents Ingested" value={documentsIngested.toString()} icon={FileUp} />
          <StatCard title="Chunks Stored" value={chunksIngested.toString()} icon={Database} />
          <StatCard title="Last Query Matches" value={snippets.length.toString()} icon={Search} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Document Upload</CardTitle>
              <CardDescription>Paste text or drop a .txt file to ingest into the vector store.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div
                onClick={() => inputRef.current?.click()}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-4 text-[12.5px] font-bold text-gray-500 transition-colors hover:border-[#F5CA50]/50 hover:bg-[#FFFAEC]"
              >
                <FileUp className="size-4" /> Drop a .txt file or click to browse
                <input
                  ref={inputRef}
                  type="file"
                  accept=".txt,.md"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) setText(await readFileAsText(file))
                  }}
                />
              </div>
              <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste document text…" rows={8} />
              {ingestError && <p className="text-[13px] font-bold text-red-500">{ingestError}</p>}
              <Button className="bg-[#F5CA50] font-bold text-[#111111] hover:brightness-95" disabled={!text.trim() || isIngesting} onClick={ingest}>
                {isIngesting ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
                Ingest into knowledge base
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Semantic Search Playground</CardTitle>
              <CardDescription>Ask a question and get a cited, grounded answer.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex gap-2">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && runQuery()}
                  placeholder="What would you like to know?"
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13.5px] outline-none focus:border-[#F5CA50] focus:ring-1 focus:ring-[#F5CA50]"
                />
                <Button className="bg-[#F5CA50] font-bold text-[#111111] hover:brightness-95" disabled={!query.trim() || isQuerying} onClick={runQuery}>
                  {isQuerying ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                </Button>
              </div>
              {queryError && <p className="text-[13px] font-bold text-red-500">{queryError}</p>}

              {answer && (
                <div className="rounded-xl border border-[#F5CA50]/30 bg-[#FFFAEC] p-4 text-[13.5px] leading-relaxed font-medium text-gray-800">
                  {answer}
                </div>
              )}

              {snippets.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Citations</p>
                  {snippets.map((snippet, i) => (
                    <div key={i} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-500">
                          {snippet.documentId ? `${snippet.documentId.slice(0, 12)}… #${snippet.chunkIndex}` : 'Unknown source'}
                        </span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold tabular-nums text-gray-700 border border-gray-200">
                          {Math.round(snippet.similarity * 100)}% match
                        </span>
                      </div>
                      <p className="line-clamp-3 text-[12.5px] font-medium text-gray-600">{snippet.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  )
}
