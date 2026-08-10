export const avatarSelect = { avatarUrl: true, oauthAvatarUrl: true } as const

export type AvatarSource = {
  avatarUrl: string | null
  oauthAvatarUrl: string | null
}

export function effectiveAvatar(source: AvatarSource | null | undefined): string | null {
  if (!source) return null
  return source.avatarUrl?.trim() || source.oauthAvatarUrl?.trim() || null
}
