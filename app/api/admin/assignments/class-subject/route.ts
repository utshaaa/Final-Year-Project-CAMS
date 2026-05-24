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
      select: {
        id: true,
        classId: true,
        subjectId: true,
        class: {
          select: {
            id: true,
            name: true,
          }
        },
        subject: {
          select: {
            id: true,
            name: true,
          }
        },
        teacher: {
          select: {
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
      className: cs.class.name,
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

    let teacher = await prisma.teacherProfile.findUnique({
      where: { userId: teacherId },
    })

    if (!teacher) {
      teacher = await prisma.teacherProfile.create({
        data: {
          id: generateId(),
          userId: teacherId,
          department: 'General',
        }
      })
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
      await prisma.classSubject.update({
        where: { id: existing.id },
        data: { teacherId: teacher.id },
      })

      return NextResponse.json({
        message: 'Teacher assignment updated successfully',
      })
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
      className: classSubject.class.name,
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

export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Assignment ID is required' }, { status: 400 })
    }

    await prisma.classSubject.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Assignment removed successfully' })
  } catch (error: any) {
    console.error('Error removing assignment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
