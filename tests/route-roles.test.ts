import { describe, expect, it } from 'vitest'

import {
  RESUME_ROLES,
  ROLE_GUARDED_ROUTES,
  canAccessRoute,
  requiredRolesFor,
} from '@/lib/auth/route-roles'

const ALL_ROLES = ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'] as const

describe('requiredRolesFor', () => {
  it('returns null for routes that are not guarded', () => {
    expect(requiredRolesFor('/dashboard')).toBeNull()
    expect(requiredRolesFor('/documents')).toBeNull()
    expect(requiredRolesFor('/api/documents/upload')).toBeNull()
  })

  it('guards the HR page and its subpaths', () => {
    expect(requiredRolesFor('/hr')).toEqual(RESUME_ROLES)
    expect(requiredRolesFor('/hr/abc-123')).toEqual(RESUME_ROLES)
  })

  it('guards the resumes API, not just the page', () => {
    expect(requiredRolesFor('/api/resumes')).toEqual(RESUME_ROLES)
    expect(requiredRolesFor('/api/resumes/screen')).toEqual(RESUME_ROLES)
    expect(requiredRolesFor('/api/resumes/abc/questions')).toEqual(RESUME_ROLES)
  })

  it('restricts user management to admins', () => {
    expect(requiredRolesFor('/settings/users')).toEqual(['ADMIN'])
  })

  it('does not guard the settings root, only the users subpath', () => {
    expect(requiredRolesFor('/settings')).toBeNull()
  })
})

describe('canAccessRoute', () => {
  it('allows any role, and no role at all, on unguarded routes', () => {
    for (const role of ALL_ROLES) {
      expect(canAccessRoute('/dashboard', role)).toBe(true)
    }
    expect(canAccessRoute('/dashboard', null)).toBe(true)
    expect(canAccessRoute('/dashboard', undefined)).toBe(true)
  })

  it('allows ADMIN, HR and MANAGER into HR', () => {
    expect(canAccessRoute('/hr', 'ADMIN')).toBe(true)
    expect(canAccessRoute('/hr', 'HR')).toBe(true)
    expect(canAccessRoute('/hr', 'MANAGER')).toBe(true)
  })

  it('blocks EMPLOYEE from HR — page and API alike', () => {
    expect(canAccessRoute('/hr', 'EMPLOYEE')).toBe(false)
    expect(canAccessRoute('/api/resumes', 'EMPLOYEE')).toBe(false)
    expect(canAccessRoute('/api/resumes/screen', 'EMPLOYEE')).toBe(false)
  })

  it('blocks a missing role on guarded routes', () => {
    expect(canAccessRoute('/hr', null)).toBe(false)
    expect(canAccessRoute('/hr', undefined)).toBe(false)
    expect(canAccessRoute('/hr', '')).toBe(false)
  })

  it('only ADMIN reaches user management', () => {
    expect(canAccessRoute('/settings/users', 'ADMIN')).toBe(true)
    for (const role of ['HR', 'MANAGER', 'EMPLOYEE']) {
      expect(canAccessRoute('/settings/users', role)).toBe(false)
    }
  })

  it('is case sensitive — lowercase roles must not pass', () => {
    
    
    expect(canAccessRoute('/hr', 'admin')).toBe(false)
    expect(canAccessRoute('/settings/users', 'admin')).toBe(false)
  })
})

describe('guard configuration', () => {
  it('keeps the page and API guards in sync for HR', () => {
    
    
    expect(requiredRolesFor('/hr')).toEqual(requiredRolesFor('/api/resumes'))
  })

  it('declares every guard with a leading slash and a non-empty role list', () => {
    for (const guard of ROLE_GUARDED_ROUTES) {
      expect(guard.prefix.startsWith('/')).toBe(true)
      expect(guard.roles.length).toBeGreaterThan(0)
    }
  })
})
