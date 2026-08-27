import { describe, expect, it } from 'vitest'

import { avatarSelect, effectiveAvatar, type AvatarSource } from '@/lib/auth/avatar'

function source(overrides: Partial<AvatarSource> = {}): AvatarSource {
  return {
    id: 'user-1',
    avatarPath: null,
    oauthAvatarUrl: null,
    ...overrides,
  }
}

describe('effectiveAvatar', () => {
  it('returns null when there is no source at all', () => {
    expect(effectiveAvatar(null)).toBeNull()
    expect(effectiveAvatar(undefined)).toBeNull()
  })

  it('returns null when the user has neither an upload nor an OAuth photo', () => {
    expect(effectiveAvatar(source())).toBeNull()
  })

  it('serves an uploaded photo through the authenticated proxy route', () => {
    
    
    const url = effectiveAvatar(source({ avatarPath: 'user-1/abcd1234-photo.jpg' }))
    expect(url).toMatch(/^\/api\/avatars\/user-1\?v=/)
  })

  it('prefers an uploaded photo over the OAuth photo', () => {
    const url = effectiveAvatar(
      source({
        avatarPath: 'user-1/abcd1234-photo.jpg',
        oauthAvatarUrl: 'https://lh3.googleusercontent.com/x',
      }),
    )
    expect(url).toContain('/api/avatars/user-1')
    expect(url).not.toContain('googleusercontent')
  })

  it('falls back to the OAuth photo when there is no upload', () => {
    const url = effectiveAvatar(
      source({ oauthAvatarUrl: 'https://lh3.googleusercontent.com/x' }),
    )
    expect(url).toBe('https://lh3.googleusercontent.com/x')
  })

  it('treats whitespace-only values as absent', () => {
    expect(effectiveAvatar(source({ avatarPath: '   ', oauthAvatarUrl: '  ' }))).toBeNull()
    expect(effectiveAvatar(source({ avatarPath: '  ', oauthAvatarUrl: 'https://x/y' }))).toBe(
      'https://x/y',
    )
  })

  it('changes the version token when the photo is replaced, to bust caches', () => {
    const first = effectiveAvatar(source({ avatarPath: 'user-1/aaaaaaaa-old.jpg' }))
    const second = effectiveAvatar(source({ avatarPath: 'user-1/bbbbbbbb-new.jpg' }))
    expect(first).not.toBe(second)
  })

  it('produces a stable URL for the same stored path', () => {
    const path = 'user-1/abcd1234-photo.jpg'
    expect(effectiveAvatar(source({ avatarPath: path }))).toBe(
      effectiveAvatar(source({ avatarPath: path })),
    )
  })

  it('URL-encodes the version token', () => {
    const url = effectiveAvatar(source({ avatarPath: 'user-1/a b&c.jpg' }))
    expect(url).not.toContain(' ')
    expect(url).not.toMatch(/[?]v=.*&c/)
  })

  it('selects the columns the resolver actually reads', () => {
    
    expect(avatarSelect).toMatchObject({
      id: true,
      avatarPath: true,
      oauthAvatarUrl: true,
    })
  })
})
