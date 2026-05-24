import { NextRequest, NextResponse } from 'next/server'
import { getUserFromToken } from './auth'

export async function requireAuth(request: NextRequest) {
  const token = request.headers.get('authorization') || 
                request.cookies.get('token')?.value ||
                new URL(request.url).searchParams.get('token')

  const user = await getUserFromToken(token || undefined)

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized - Authentication required' },
      { status: 401 }
    )
  }

  return { user }
}

export async function requireRole(
  request: NextRequest,
  allowedRoles: string[]
) {
  const authResult = await requireAuth(request)
  
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const { user } = authResult

  if (!allowedRoles.includes(user.role)) {
    return NextResponse.json(
      { error: 'Forbidden - Insufficient permissions' },
      { status: 403 }
    )
  }

  return { user }
}
