import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole, ExamType } from '@prisma/client'
import { getUserFromToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    const user = await getUserFromToken(token || undefined)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== UserRole.STUDENT) {
      return NextResponse.json({ error: 'Forbidden - Student access only' }, { status: 403 })
    }

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

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (!student.studentProfile) {
      return NextResponse.json({
        exams: [],
      })
    }

    const profile = student.studentProfile

    const currentClassId = profile.enrollments?.[0]?.classId
    if (!currentClassId) {
      return NextResponse.json({
        exams: [],
      })
    }

    const exams = await prisma.exam.findMany({
      where: {
        classId: currentClassId,
      },
      include: {
        subject: true,
        class: true,
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    })

    const formattedExams = exams.map((exam) => ({
      id: exam.id,
      name: exam.title,
      subject: exam.subject.name,
      date: exam.scheduledAt.toISOString().split('T')[0],
      duration: exam.duration || 'N/A',
      totalMarks: exam.totalMarks,
      examType: exam.examType,
      scheduledAt: exam.scheduledAt.toISOString(),
    }))

    return NextResponse.json({
      exams: formattedExams,
    })
  } catch (error: any) {
    console.error('Error fetching student exams:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}
