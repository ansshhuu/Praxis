import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const DOCUMENTS_BUCKET = 'documents'
export const MEETINGS_BUCKET = 'meetings'
export const AVATARS_BUCKET = 'avatars'

const SIGNED_URL_TTL_SECONDS = 60 * 10

const globalForSupabase = globalThis as unknown as {
  supabaseAdmin: SupabaseClient | undefined
}

export function getStorageClient(): SupabaseClient {
  if (globalForSupabase.supabaseAdmin) return globalForSupabase.supabaseAdmin

  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase storage is not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env',
    )
  }

  const client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  globalForSupabase.supabaseAdmin = client
  return client
}

export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'file'
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_')
  return cleaned.slice(0, 120) || 'file'
}

export type UploadedObject = { path: string; publicUrl: string }

export async function uploadDocument(
  userId: string,
  file: File,
  folder?: string,
  bucket: string = DOCUMENTS_BUCKET,
): Promise<UploadedObject> {
  const client = getStorageClient()
  const segment = folder ? `${sanitizeFileName(folder)}/` : ''
  const path = `${userId}/${segment}${crypto.randomUUID()}-${sanitizeFileName(file.name)}`

  const { error } = await client.storage
    .from(bucket)
    .upload(path, await file.arrayBuffer(), {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`)
  }

  const { data } = client.storage.from(bucket).getPublicUrl(path)
  return { path, publicUrl: data.publicUrl }
}

export async function createReadUrl(
  path: string,
  bucket: string = DOCUMENTS_BUCKET,
): Promise<string> {
  const client = getStorageClient()
  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS)

  if (error || !data?.signedUrl) {
    throw new Error(`Could not sign document URL: ${error?.message ?? 'unknown error'}`)
  }
  return data.signedUrl
}

export async function removeDocument(
  path: string,
  bucket: string = DOCUMENTS_BUCKET,
): Promise<void> {
  const client = getStorageClient()
  const { error } = await client.storage.from(bucket).remove([path])
  if (error) {
    console.error(`[storage] failed to remove ${path}:`, error.message)
  }
}
