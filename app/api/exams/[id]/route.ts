import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { getUserFromToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value
    const user = await getUserFromToken(token || undefined)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== UserRole.STUDENT) {
      return NextResponse.json({ error: 'Forbidden - Student access only' }, { status: 403 })
    }

    const resolvedParams = await Promise.resolve(params)
    const { id } = resolvedParams

    const student = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        studentProfile: {
          include: {
            enrollments: {
              include: {
                class: true,
              },
            },
          },
        },
      },
    })

    if (!student?.studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    const enrollment = student.studentProfile.enrollments[0]
    if (!enrollment) {
      return NextResponse.json({ error: 'Student not enrolled in any class' }, { status: 404 })
    }

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        class: true,
        subject: true,
      },
    })

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    if (exam.classId !== enrollment.classId) {
      return NextResponse.json({ error: 'Exam not available for your class' }, { status: 403 })
    }

    return NextResponse.json({
      exam: {
        id: exam.id,
        name: exam.title,
        subject: exam.subject.name,
        duration: exam.duration,
      },
      questions: [],
    })
  } catch (error: any) {
    console.error('Error fetching exam:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}
