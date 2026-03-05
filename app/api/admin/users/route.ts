import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { hashPassword, getUserFromToken } from '@/lib/auth'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'

function generateId(): string {
  return randomBytes(16).toString('hex')
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    const user = await getUserFromToken(token || undefined)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Admin access only' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get('role')

    const where: any = {}
    if (roleFilter) {
      where.role = roleFilter as UserRole
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase(),
      status: 'active',
      createdAt: user.createdAt,
      rollNo: user.studentProfile?.rollNo || null,
    }))

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, role, password } = body

    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { error: 'Name, email, role, and password are required' },
        { status: 400 }
      )
    }

    const validRoles = ['ADMIN', 'TEACHER', 'STUDENT']
    const roleUpper = role.toUpperCase()
    if (!validRoles.includes(roleUpper)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be ADMIN, TEACHER, or STUDENT' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        id: generateId(),
        name,
        email,
        passwordHash,
        role: roleUpper as UserRole,
      },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    })

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase(),
      status: 'active',
      createdAt: user.createdAt,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}
