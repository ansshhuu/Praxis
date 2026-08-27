import { NextResponse } from 'next/server'

import { avatarSelect, effectiveAvatar } from '@/lib/auth/avatar'
import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { toSafeErrorMessage } from '@/lib/security/error-handler'
import { AVATARS_BUCKET, removeDocument, uploadDocument } from '@/lib/storage/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png'])
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png'])

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

function extensionOf(name: string): string {
  const parts = name.toLowerCase().split('.')
  return parts.length > 1 ? parts[parts.length - 1] : ''
}

function looksLikeImage(bytes: Uint8Array): 'image/jpeg' | 'image/png' | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg'
  }
  if (bytes.length >= 8 && PNG_MAGIC.every((byte, index) => bytes[index] === byte)) {
    return 'image/png'
  }
  return null
}

export async function POST(request: Request) {
  const userId = await getCurrentUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json(
      { error: 'Expected multipart/form-data with a "file" field' },
      { status: 400 },
    )
  }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'No image provided' }, { status: 400 })
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return NextResponse.json(
      { error: 'That image is larger than the 2 MB limit' },
      { status: 413 },
    )
  }

  const extension = extensionOf(file.name)
  if (!ALLOWED_MIME.has(file.type) || !ALLOWED_EXTENSIONS.has(extension)) {
    return NextResponse.json(
      { error: 'Only JPG and PNG images are supported' },
      { status: 415 },
    )
  }

  const signature = looksLikeImage(new Uint8Array(await file.slice(0, 8).arrayBuffer()))
  if (!signature) {
    return NextResponse.json(
      { error: 'That file is not a valid JPG or PNG image' },
      { status: 415 },
    )
  }

  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarPath: true },
  })

  let stored
  try {
    stored = await uploadDocument(userId, file, undefined, AVATARS_BUCKET)
  } catch (error) {
    return NextResponse.json(
      { error: toSafeErrorMessage(error, 'Failed to upload the profile photo') },
      { status: 502 },
    )
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null, avatarPath: stored.path },
      select: { name: true, email: true, ...avatarSelect },
    })

    if (existing?.avatarPath && existing.avatarPath !== stored.path) {
      await removeDocument(existing.avatarPath, AVATARS_BUCKET)
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: effectiveAvatar(user),
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('[profile/photo] db update failed:', error)
    await removeDocument(stored.path, AVATARS_BUCKET)
    return NextResponse.json({ error: 'Could not save the profile photo' }, { status: 500 })
  }
}
