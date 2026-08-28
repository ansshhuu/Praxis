import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { ROLE_GUARDED_ROUTES } from '@/lib/auth/route-roles'

/** Auth entry points: signed-out visitors only - a signed-in user is sent to the dashboard. */
const PUBLIC_ROUTES = ['/', '/login', '/register', '/forgot-password', '/reset-password']

/**
 * Open to everyone, signed in or not, with no redirect either way.
 * `/api/health` must stay here - platform health checks are unauthenticated,
 * and a 401 or redirect makes the host mark the service permanently unhealthy.
 */
const OPEN_ROUTES = ['/privacy', '/terms', '/api/contact', '/api/health']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  if (OPEN_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return NextResponse.next()
  }

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname === route || (route !== '/' && pathname.startsWith(`${route}/`))
  )

  if (isPublicRoute) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  const isApiRoute = pathname.startsWith('/api/')

  if (!token) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const matchedGuard = ROLE_GUARDED_ROUTES.find((guard) => pathname.startsWith(guard.prefix))
  if (matchedGuard && !matchedGuard.roles.includes(token.role as string)) {
    if (isApiRoute) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 })
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
