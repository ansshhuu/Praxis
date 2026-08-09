/**
 * Supabase Storage access for the Documents and Meetings modules.
 *
 * Server-only: this uses the service-role key, which bypasses RLS. It must
 * never be imported from a client component. Every call site is responsible
 * for scoping paths to the caller's own user id (`/{user_id}/…`).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const DOCUMENTS_BUCKET = 'documents'
export const MEETINGS_BUCKET = 'meetings'

/** How long extraction-time signed URLs stay valid. */
const SIGNED_URL_TTL_SECONDS = 60 * 10

const globalForSupabase = globalThis as unknown as {
  supabaseAdmin: SupabaseClient | undefined
}

/**
 * Lazily created so a missing key surfaces as a handled 500 from the route
 * that needs storage, rather than crashing module load for the whole app.
 */
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

/**
 * Strip anything that could escape the user's folder or upset the storage
 * key parser, while keeping the name recognisable in the UI.
 */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'file'
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/_{2,}/g, '_')
  return cleaned.slice(0, 120) || 'file'
}

export type UploadedObject = { path: string; publicUrl: string }

/**
 * Uploads to `/{userId}/{folder?}/{uuid}-{filename}` and returns its path plus
 * public URL. `folder` lets a module keep its files together (e.g. "resumes")
 * without escaping the caller's own directory.
 *
 * `bucket` defaults to `documents` so existing call sites are unaffected;
 * Meetings passes `MEETINGS_BUCKET`.
 */
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

/**
 * A URL the extractor can actually fetch. Signing works for private buckets
 * and is harmless for public ones, so extraction doesn't depend on how the
 * bucket happens to be configured.
 */
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

/** Best-effort removal — a missing object must not block the DB delete. */
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
