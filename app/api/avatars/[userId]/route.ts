import { NextResponse } from 'next/server'

import { getCurrentUserId } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { AVATARS_BUCKET, getStorageClient } from '@/lib/storage/supabase'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type RouteContext = { params: Promise<{ userId: string }> }

export async function GET(_request: Request, { params }: RouteContext) {
  const viewerId = await getCurrentUserId()
  if (!viewerId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId } = await params
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarPath: true },
  })

  if (!user?.avatarPath) {
    return NextResponse.json({ error: 'No profile photo' }, { status: 404 })
  }

  const { data, error } = await getStorageClient()
    .storage.from(AVATARS_BUCKET)
    .download(user.avatarPath)

  if (error || !data) {
    console.error('[avatars] download failed:', error?.message)
    return NextResponse.json({ error: 'No profile photo' }, { status: 404 })
  }

  return new NextResponse(await data.arrayBuffer(), {
    headers: {
      'Content-Type': data.type || 'image/jpeg',
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  })
}
