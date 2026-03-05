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

    const classes = await prisma.class.findMany({
      include: {
        enrollments: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    const classesWithCount = classes.map((cls) => ({
      id: cls.id,
      name: cls.name,
      section: cls.section,
      studentCount: cls.enrollments.length,
    }))

    return NextResponse.json({ classes: classesWithCount })
  } catch (error: any) {
    console.error('Error fetching classes:', error)
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
    const { name, section } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 })
    }

    const existingClass = await prisma.class.findUnique({
      where: { name: name.trim() },
    })

    if (existingClass) {
      return NextResponse.json({ error: 'Class with this name already exists' }, { status: 409 })
    }

    const newClass = await prisma.class.create({
      data: {
        id: generateId(),
        name: name.trim(),
        section: section?.trim() || null,
      },
    })

    return NextResponse.json({
      id: newClass.id,
      name: newClass.name,
      section: newClass.section,
      studentCount: 0,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating class:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}
