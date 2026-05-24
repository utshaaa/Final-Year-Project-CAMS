import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole, QuestionType } from '@prisma/client'
import { getUserFromToken } from '@/lib/auth'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'

function generateId(): string {
  return randomBytes(16).toString('hex')
}

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

    if (user.role !== UserRole.TEACHER) {
      return NextResponse.json({ error: 'Forbidden - Teacher access only' }, { status: 403 })
    }

    const resolvedParams = await Promise.resolve(params)
    const { id: examId } = resolvedParams

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

    const questions = await prisma.question.findMany({
      where: { examId },
      orderBy: { order: 'asc' },
    })

    const formattedQuestions = questions.map((q) => {
      let parsedOptions: string[] = []
      if (q.options) {
        try {
          const v = JSON.parse(q.options)
          parsedOptions = Array.isArray(v) ? v : []
        } catch {
          parsedOptions = []
        }
      }
      return {
        id: q.id,
        questionText: q.questionText,
        questionType: q.questionType,
        options: parsedOptions,
        correctAnswer: q.correctAnswer,
        marks: q.marks,
        order: q.order,
      }
    })

    return NextResponse.json({ questions: formattedQuestions })
  } catch (error: any) {
    console.error('Error fetching questions:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}

export async function POST(
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
    const { questionText, questionType, options, correctAnswer, marks, order } = body

    if (!questionText || !questionType) {
      return NextResponse.json(
        { error: 'Question text and type are required' },
        { status: 400 }
      )
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

    if (exam.examType === 'PHYSICAL') {
      return NextResponse.json(
        { error: 'Physical exams cannot have online questions.' },
        { status: 400 }
      )
    }

    const question = await prisma.question.create({
      data: {
        id: generateId(),
        examId,
        questionText: questionText.trim(),
        questionType: questionType as QuestionType,
        options: options && Array.isArray(options) ? JSON.stringify(options) : null,
        correctAnswer: correctAnswer || null,
        marks: marks || 1,
        order: order || 0,
      },
    })

    await syncExamTotalMarks(examId)

    return NextResponse.json({
      id: question.id,
      questionText: question.questionText,
      questionType: question.questionType,
      options: question.options ? JSON.parse(question.options) : [],
      correctAnswer: question.correctAnswer,
      marks: question.marks,
      order: question.order,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating question:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}
