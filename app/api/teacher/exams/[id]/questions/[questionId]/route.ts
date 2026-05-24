import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole, QuestionType } from '@prisma/client'
import { getUserFromToken } from '@/lib/auth'

export const runtime = 'nodejs'

async function syncExamTotalMarks(examId: string) {
  const aggregate = await prisma.question.aggregate({
    where: { examId },
    _sum: { marks: true },
  })

  await prisma.exam.update({
    where: { id: examId },
    data: { totalMarks: aggregate._sum.marks || 0 },
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> | { id: string; questionId: string } }
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
    const { id: examId, questionId } = resolvedParams

    const body = await request.json()
    const { questionText, questionType, options, correctAnswer, marks, order } = body

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

    if (exam.examType === 'PHYSICAL') {
      return NextResponse.json(
        { error: 'Physical exams cannot have online questions.' },
        { status: 400 }
      )
    }

    const question = await prisma.question.update({
      where: { id: questionId },
      data: {
        questionText: questionText?.trim(),
        questionType: questionType as QuestionType,
        options: options && Array.isArray(options) ? JSON.stringify(options) : null,
        correctAnswer: correctAnswer !== undefined ? correctAnswer : null,
        marks: marks !== undefined ? marks : undefined,
        order: order !== undefined ? order : undefined,
      },
    })

    await syncExamTotalMarks(examId)

    let parsedOptions: string[] = []
    if (question.options) {
      try {
        const v = JSON.parse(question.options)
        parsedOptions = Array.isArray(v) ? v : []
      } catch {
        parsedOptions = []
      }
    }

    return NextResponse.json({
      id: question.id,
      questionText: question.questionText,
      questionType: question.questionType,
      options: parsedOptions,
      correctAnswer: question.correctAnswer,
      marks: question.marks,
      order: question.order,
    })
  } catch (error: any) {
    console.error('Error updating question:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> | { id: string; questionId: string } }
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
    const { id: examId, questionId } = resolvedParams

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

    await prisma.question.delete({
      where: { id: questionId },
    })

    await syncExamTotalMarks(examId)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting question:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}
