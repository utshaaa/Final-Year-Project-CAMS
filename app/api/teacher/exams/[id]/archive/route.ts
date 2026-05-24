import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { getUserFromToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value
    const user = await getUserFromToken(token || undefined)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== UserRole.TEACHER) {
      return NextResponse.json({ error: 'Forbidden - Teacher access only' }, { status: 403 })
    }

    const resolvedParams = await Promise.resolve(params)
    const { id: examId } = resolvedParams

    const body = await request.json()
    const { archived } = body

    if (typeof archived !== 'boolean') {
      return NextResponse.json({ error: 'Archived status is required' }, { status: 400 })
    }

    const teacher = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        teacherProfile: true,
      },
    })

    if (!teacher?.teacherProfile) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
    })

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    if (exam.createdByTeacherId !== teacher.teacherProfile.id) {
      return NextResponse.json({ error: 'Forbidden - Not your exam' }, { status: 403 })
    }

    const updatedExam = await prisma.exam.update({
      where: { id: examId },
      data: { archived },
      include: {
        class: true,
        subject: true,
      },
    })

    return NextResponse.json({
      id: updatedExam.id,
      name: updatedExam.title,
      subject: updatedExam.subject.name,
      className: updatedExam.class.name,
      classId: updatedExam.classId,
      subjectId: updatedExam.subjectId,
      examType: updatedExam.examType,
      scheduledAt: updatedExam.scheduledAt.toISOString(),
      totalMarks: updatedExam.totalMarks,
      duration: updatedExam.duration,
      archived: updatedExam.archived,
    })
  } catch (error: any) {
    console.error('Error updating exam archive status:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}
