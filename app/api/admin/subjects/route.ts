import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { getUserFromToken } from '@/lib/auth'
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

    const subjects = await prisma.subject.findMany({
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ subjects })
  } catch (error: any) {
    console.error('Error fetching subjects:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    const user = await getUserFromToken(token || undefined)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Admin access only' }, { status: 403 })
    }

    const body = await request.json()
    const { name, code } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Subject name is required' }, { status: 400 })
    }

    const existingSubject = await prisma.subject.findUnique({
      where: { name: name.trim() },
    })

    if (existingSubject) {
      return NextResponse.json({ error: 'Subject with this name already exists' }, { status: 409 })
    }

    if (code && code.trim()) {
      const existingCode = await prisma.subject.findUnique({
        where: { code: code.trim() },
      })

      if (existingCode) {
        return NextResponse.json({ error: 'Subject with this code already exists' }, { status: 409 })
      }
    }

    const newSubject = await prisma.subject.create({
      data: {
        id: generateId(),
        name: name.trim(),
        code: code?.trim() || null,
      },
    })

    return NextResponse.json({
      id: newSubject.id,
      name: newSubject.name,
      code: newSubject.code,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating subject:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}
