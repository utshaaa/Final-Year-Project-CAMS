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

    const classSubjects = await prisma.classSubject.findMany({
      include: {
        class: true,
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { class: { name: 'asc' } },
        { subject: { name: 'asc' } },
      ],
    })

    const assignments = classSubjects.map((cs) => ({
      id: cs.id,
      classId: cs.classId,
      className: cs.class.name + (cs.class.section ? ` - ${cs.class.section}` : ''),
      subjectId: cs.subjectId,
      subjectName: cs.subject.name,
      teacherId: cs.teacher.user.id,
      teacherName: cs.teacher.user.name,
    }))

    return NextResponse.json({ assignments })
  } catch (error: any) {
    console.error('Error fetching assignments:', error)
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
    const { classId, subjectId, teacherId } = body

    if (!classId || !subjectId || !teacherId) {
      return NextResponse.json(
        { error: 'Class ID, Subject ID, and Teacher ID are required' },
        { status: 400 }
      )
    }

    const teacher = await prisma.teacherProfile.findUnique({
      where: { userId: teacherId },
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const existing = await prisma.classSubject.findUnique({
      where: {
        classId_subjectId: {
          classId,
          subjectId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'This class-subject combination already has a teacher assigned' },
        { status: 409 }
      )
    }

    const classSubject = await prisma.classSubject.create({
      data: {
        id: generateId(),
        classId,
        subjectId,
        teacherId: teacher.id,
      },
      include: {
        class: true,
        subject: true,
        teacher: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({
      id: classSubject.id,
      className: classSubject.class.name + (classSubject.class.section ? ` - ${classSubject.class.section}` : ''),
      subjectName: classSubject.subject.name,
      teacherName: classSubject.teacher.user.name,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating assignment:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}
