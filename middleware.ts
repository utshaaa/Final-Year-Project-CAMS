import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from './lib/auth-edge'

const protectedRoutes = {
  '/admin': ['ADMIN'],
  '/teacher': ['TEACHER'],
  '/student': ['STUDENT'],
}

const publicRoutes = ['/login', '/api/auth/login', '/api/auth/register', '/api/auth/logout']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  const token = request.cookies.get('token')?.value
  const payload = token ? await verifyToken(token) : null

  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(route)) {
      if (!allowedRoles.includes(payload.role)) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Forbidden - Insufficient permissions' },
            { status: 403 }
          )
        }
        const redirectPath = 
          payload.role === 'ADMIN' ? '/admin' :
          payload.role === 'TEACHER' ? '/teacher' :
          payload.role === 'STUDENT' ? '/student' :
          '/login'
        return NextResponse.redirect(new URL(redirectPath, request.url))
      }
    }
  }

  if (pathname === '/' || pathname === '') {
    const redirectPath = 
      payload.role === 'ADMIN' ? '/admin' :
      payload.role === 'TEACHER' ? '/teacher' :
      payload.role === 'STUDENT' ? '/student' :
      '/login'
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
