export const avatarSelect = { id: true, avatarPath: true, oauthAvatarUrl: true } as const

export type AvatarSource = {
  id: string
  avatarPath: string | null
  oauthAvatarUrl: string | null
}

function versionOf(path: string): string {
  return (path.split('/').pop() ?? path).slice(0, 8)
}

export function effectiveAvatar(source: AvatarSource | null | undefined): string | null {
  if (!source) return null

  const path = source.avatarPath?.trim()
  if (path) {
    return `/api/avatars/${source.id}?v=${encodeURIComponent(versionOf(path))}`
  }

  return source.oauthAvatarUrl?.trim() || null
}
