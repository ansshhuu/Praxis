import { GoogleGenerativeAI } from '@google/generative-ai'

import { applyGuardrails } from '@/lib/ai/guardrails'
import { generateText } from '@/lib/ai/llm-gateway'
import { getCollection } from '@/lib/db/vector-db'

const DEFAULT_CHUNK_SIZE = 800
const DEFAULT_CHUNK_OVERLAP = 100
const DEFAULT_TOP_K = 5
const DEFAULT_SIMILARITY_THRESHOLD = 0.55
const GEMINI_EMBEDDING_MODEL = 'text-embedding-004'

export function chunkText(
  text: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_CHUNK_OVERLAP,
): string[] {
  const cleaned = text.replace(/\r\n/g, '\n').trim()
  if (!cleaned) return []
  if (cleaned.length <= chunkSize) return [cleaned]

  const stride = Math.max(chunkSize - overlap, 1)
  const chunks: string[] = []
  let start = 0
  while (start < cleaned.length) {
    const end = Math.min(start + chunkSize, cleaned.length)
    const chunk = cleaned.slice(start, end).trim()
    if (chunk) chunks.push(chunk)
    if (end >= cleaned.length) break
    start += stride
  }

  return chunks
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  const geminiKey = process.env.GEMINI_API_KEY?.trim()
  if (!geminiKey) {
    throw new Error('No embedding provider configured — set GEMINI_API_KEY')
  }

  const genAI = new GoogleGenerativeAI(geminiKey)
  const model = genAI.getGenerativeModel({ model: GEMINI_EMBEDDING_MODEL })
  return Promise.all(
    texts.map(async (text) => {
      const result = await model.embedContent(text)
      return result.embedding.values
    }),
  )
}

export interface IngestDocumentOptions {
  collectionName: string
  documentId: string
  text: string
  metadata?: Record<string, string | number | boolean>
  chunkSize?: number
  chunkOverlap?: number
}

export interface IngestDocumentResult {
  documentId: string
  chunkCount: number
}

export async function ingestDocument(options: IngestDocumentOptions): Promise<IngestDocumentResult> {
  const { sanitizedText } = applyGuardrails(options.text)
  const chunks = chunkText(sanitizedText, options.chunkSize, options.chunkOverlap)
  if (chunks.length === 0) {
    throw new Error('Document produced no chunks — text may be empty')
  }

  const embeddings = await embedTexts(chunks)
  const collection = await getCollection(options.collectionName)

  await collection.add({
    ids: chunks.map((_, index) => `${options.documentId}::${index}`),
    embeddings,
    documents: chunks,
    metadatas: chunks.map((_, index) => ({
      ...options.metadata,
      documentId: options.documentId,
      chunkIndex: index,
    })),
  })

  return { documentId: options.documentId, chunkCount: chunks.length }
}

export interface QueryKnowledgeBaseOptions {
  collectionName: string
  query: string
  topK?: number
  similarityThreshold?: number
  synthesize?: boolean
}

export interface RetrievedSnippet {
  text: string
  similarity: number
  documentId: string | undefined
  chunkIndex: number | undefined
}

export interface QueryKnowledgeBaseResult {
  snippets: RetrievedSnippet[]
  citations: string[]
  answer: string | null
}

export async function queryKnowledgeBase(
  options: QueryKnowledgeBaseOptions,
): Promise<QueryKnowledgeBaseResult> {
  const { sanitizedText, injectionFlagged } = applyGuardrails(options.query)
  const topK = options.topK ?? DEFAULT_TOP_K
  const threshold = options.similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD

  const [queryEmbedding] = await embedTexts([sanitizedText])
  const collection = await getCollection(options.collectionName)

  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: topK,
  })

  const documents = results.documents?.[0] ?? []
  const distances = results.distances?.[0] ?? []
  const metadatas = results.metadatas?.[0] ?? []

  const snippets: RetrievedSnippet[] = documents
    .map((text, index) => {
      const distance = distances[index] ?? 1
      const similarity = 1 - distance
      const metadata = metadatas[index] as Record<string, unknown> | null
      return {
        text: text ?? '',
        similarity,
        documentId: metadata?.documentId as string | undefined,
        chunkIndex: metadata?.chunkIndex as number | undefined,
      }
    })
    .filter((snippet) => snippet.text && snippet.similarity >= threshold)

  const citations = Array.from(
    new Set(snippets.map((snippet) => snippet.documentId).filter((id): id is string => Boolean(id))),
  )

  if (!options.synthesize || snippets.length === 0 || injectionFlagged) {
    return { snippets, citations, answer: null }
  }

  const context = snippets
    .map((snippet, index) => `[${index + 1}] ${snippet.text}`)
    .join('\n\n')

  const { text: answer } = await generateText({
    messages: [
      {
        role: 'system',
        content:
          'You answer questions using only the provided context snippets. Cite snippets inline using [1], [2], etc. If the context does not contain the answer, say so plainly.',
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${sanitizedText}`,
      },
    ],
    applyGuardrails: false,
    maxTokens: 1024,
  })

  return { snippets, citations, answer }
}
