import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole, ExamType } from '@prisma/client'
import { getUserFromToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function PUT(
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
    const { title, classId, subjectId, examType, scheduledAt, totalMarks, duration } = body

    const teacher = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        teacherProfile: {
          include: { classSubjects: true },
        },
      },
    })

    if (!teacher?.teacherProfile) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    const exam = await prisma.exam.findUnique({ where: { id: examId } })

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    if (exam.createdByTeacherId !== teacher.teacherProfile.id) {
      return NextResponse.json({ error: 'Forbidden - Not your exam' }, { status: 403 })
    }

    if (classId && subjectId) {
      const isAssigned = teacher.teacherProfile.classSubjects.some(
        (cs) => cs.classId === classId && cs.subjectId === subjectId
      )
      if (!isAssigned) {
        return NextResponse.json(
          { error: 'You are not assigned to teach this class-subject combination' },
          { status: 403 }
        )
      }
    }

    const data: any = {}
    if (title !== undefined) data.title = title.trim()
    if (classId !== undefined) data.classId = classId
    if (subjectId !== undefined) data.subjectId = subjectId
    if (examType !== undefined) data.examType = examType as ExamType
    if (scheduledAt !== undefined) data.scheduledAt = new Date(scheduledAt)

    if (data.title || data.classId || data.subjectId) {
      const checkTitle = data.title ?? exam.title
      const checkClass = data.classId ?? exam.classId
      const checkSubject = data.subjectId ?? exam.subjectId
      const duplicate = await prisma.exam.findFirst({
        where: {
          classId: checkClass,
          subjectId: checkSubject,
          title: checkTitle,
          archived: false,
          id: { not: examId },
        },
        select: { id: true },
      })
      if (duplicate) {
        return NextResponse.json(
          { error: 'An exam with this name already exists for this class and subject.' },
          { status: 409 }
        )
      }
    }
    if (totalMarks !== undefined) {
      data.totalMarks = typeof totalMarks === 'number'
        ? totalMarks
        : parseInt(totalMarks ?? '0') || 0
    }
    if (duration !== undefined) data.duration = duration?.trim() || null

    if (examType === 'PHYSICAL') {
      const existingQuestions = await prisma.question.count({ where: { examId } })
      if (existingQuestions > 0) {
        return NextResponse.json(
          { error: 'Cannot mark exam as PHYSICAL while it has questions. Delete questions first.' },
          { status: 400 }
        )
      }
    }

    const updated = await prisma.exam.update({
      where: { id: examId },
      data,
      include: { class: true, subject: true },
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.title,
      subject: updated.subject.name,
      className: updated.class.name,
      classId: updated.classId,
      subjectId: updated.subjectId,
      examType: updated.examType,
      scheduledAt: updated.scheduledAt.toISOString(),
      totalMarks: updated.totalMarks,
      duration: updated.duration,
      archived: updated.archived,
    })
  } catch (error: any) {
    console.error('Error updating exam:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}
