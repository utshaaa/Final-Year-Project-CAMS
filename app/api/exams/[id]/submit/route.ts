import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole, QuestionType } from '@prisma/client'
import { getUserFromToken } from '@/lib/auth'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'

function generateId(): string {
  return randomBytes(16).toString('hex')
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

    if (user.role !== UserRole.STUDENT) {
      return NextResponse.json({ error: 'Forbidden - Student access only' }, { status: 403 })
    }

    const resolvedParams = await Promise.resolve(params)
    const { id: examId } = resolvedParams

    const body = await request.json()
    const { answers } = body

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json({ error: 'Answers are required' }, { status: 400 })
    }

    const student = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        studentProfile: true,
      },
    })

    if (!student?.studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: {
        questions: true,
      },
    })

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    if (exam.examType === 'PHYSICAL') {
      return NextResponse.json(
        { error: 'Physical exams cannot be submitted online.' },
        { status: 400 }
      )
    }

    if (exam.scheduledAt.getTime() > Date.now()) {
      return NextResponse.json(
        { error: 'Exam is not yet available. Please wait until the scheduled start time.' },
        { status: 400 }
      )
    }

    const existingGrade = await prisma.grade.findUnique({
      where: {
        studentId_examId: {
          studentId: student.studentProfile.id,
          examId: exam.id,
        },
      },
    })

    if (existingGrade) {
      return NextResponse.json({ error: 'Exam already submitted. You cannot retake this exam.' }, { status: 400 })
    }

    let totalMarks = 0
    let obtainedMarks = 0

    for (const question of exam.questions) {
      totalMarks += question.marks
      const studentAnswer = answers[question.id]

      if (!studentAnswer) {
        continue
      }

      let isCorrect = false
      let marksObtained = 0

      if (question.questionType === QuestionType.MCQ || question.questionType === QuestionType.TRUE_FALSE) {
        if (question.correctAnswer && studentAnswer === question.correctAnswer) {
          isCorrect = true
          marksObtained = question.marks
        }
      }

      await prisma.answer.upsert({
        where: {
          questionId_studentId: {
            questionId: question.id,
            studentId: student.studentProfile.id,
          },
        },
        create: {
          id: generateId(),
          questionId: question.id,
          studentId: student.studentProfile.id,
          answerText: typeof studentAnswer === 'string' ? studentAnswer : JSON.stringify(studentAnswer),
          isCorrect: question.questionType === QuestionType.MCQ || question.questionType === QuestionType.TRUE_FALSE ? isCorrect : null,
          marksObtained: marksObtained,
        },
        update: {
          answerText: typeof studentAnswer === 'string' ? studentAnswer : JSON.stringify(studentAnswer),
          isCorrect: question.questionType === QuestionType.MCQ || question.questionType === QuestionType.TRUE_FALSE ? isCorrect : null,
          marksObtained: marksObtained,
        },
      })

      obtainedMarks += marksObtained
    }

    const hasManualGrading = exam.questions.some(
      q => q.questionType === QuestionType.SHORT_ANSWER || q.questionType === QuestionType.LONG_ANSWER
    )

    const finalMarks = hasManualGrading ? null : obtainedMarks

    await prisma.grade.create({
      data: {
        id: generateId(),
        studentId: student.studentProfile.id,
        examId: exam.id,
        marksObtained: finalMarks,
        gradeLetter: finalMarks !== null ? calculateGradeLetter(finalMarks, totalMarks) : null,
        remarks: hasManualGrading ? 'Pending manual grading' : null,
        gradedByTeacherId: exam.createdByTeacherId,
      },
    })

    return NextResponse.json({
      success: true,
      totalMarks,
      obtainedMarks,
      requiresManualGrading: hasManualGrading,
      message: hasManualGrading 
        ? 'Exam submitted successfully. Your answers are pending manual grading by the teacher.'
        : 'Exam submitted successfully',
    })
  } catch (error: any) {
    console.error('Error submitting exam:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}

function calculateGradeLetter(marks: number, totalMarks: number): string {
  const percentage = (marks / totalMarks) * 100
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B+'
  if (percentage >= 60) return 'B'
  if (percentage >= 50) return 'C+'
  if (percentage >= 40) return 'C'
  return 'F'
}
