export const RESUME_ROLES = ['ADMIN', 'HR', 'MANAGER'] as const

export const ROLE_GUARDED_ROUTES: { prefix: string; roles: readonly string[] }[] = [
  { prefix: '/settings/users', roles: ['ADMIN'] },
  { prefix: '/resumes', roles: RESUME_ROLES },
  { prefix: '/api/resumes', roles: RESUME_ROLES },
]

export function requiredRolesFor(pathname: string): readonly string[] | null {
  return ROLE_GUARDED_ROUTES.find((guard) => pathname.startsWith(guard.prefix))?.roles ?? null
}

export function canAccessRoute(pathname: string, role: string | undefined | null): boolean {
  const roles = requiredRolesFor(pathname)
  if (!roles) return true
  return Boolean(role && roles.includes(role))
}
