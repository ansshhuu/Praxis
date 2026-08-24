import { ChromaClient, type Collection } from 'chromadb'

const DEFAULT_COLLECTIONS = ['agent_knowledge_base', 'document_embeddings'] as const

const globalForChroma = globalThis as unknown as {
  chromaClient: ChromaClient | undefined
  chromaReady: Promise<void> | undefined
}

function createClient(): ChromaClient {
  const host = process.env.CHROMA_HOST
  if (host) {
    return new ChromaClient({ path: host })
  }
  // Falls back to the local default (http://localhost:8000) — Chroma's JS
  // client always talks to a server; CHROMA_PERSIST_DIR configures that
  // server's on-disk storage (see docker-compose.yml), not the client here.
  return new ChromaClient()
}

export function getChromaClient(): ChromaClient {
  if (!globalForChroma.chromaClient) {
    globalForChroma.chromaClient = createClient()
  }
  return globalForChroma.chromaClient
}

/** Idempotently ensures the default collections exist. Safe to call repeatedly. */
export async function ensureDefaultCollections(): Promise<void> {
  if (!globalForChroma.chromaReady) {
    globalForChroma.chromaReady = (async () => {
      const client = getChromaClient()
      for (const name of DEFAULT_COLLECTIONS) {
        await client.getOrCreateCollection({ name })
      }
    })()
  }
  return globalForChroma.chromaReady
}

export async function getCollection(name: string): Promise<Collection> {
  const client = getChromaClient()
  return client.getOrCreateCollection({ name })
}

export async function pingChroma(): Promise<boolean> {
  try {
    await getChromaClient().heartbeat()
    return true
  } catch {
    return false
  }
}
