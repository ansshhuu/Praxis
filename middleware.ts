import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ROLE_GUARDED_ROUTES: { prefix: string; roles: string[] }[] = [
  { prefix: '/settings/users', roles: ['ADMIN'] },
  { prefix: '/resumes', roles: ['ADMIN', 'HR', 'MANAGER'] },
]

const PUBLIC_ROUTES = ['/login']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  const matchedGuard = ROLE_GUARDED_ROUTES.find((guard) => pathname.startsWith(guard.prefix))
  if (matchedGuard && !matchedGuard.roles.includes(token.role as string)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
