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
      include: {
        questions: {
          orderBy: { order: 'asc' },
        },
        class: true,
        subject: true,
      },
    })

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    if (exam.createdByTeacherId !== teacher.teacherProfile.id) {
      return NextResponse.json({ error: 'Forbidden - Not your exam' }, { status: 403 })
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { classId: exam.classId },
      include: {
        student: {
          include: {
            user: true,
            grades: {
              where: { examId },
            },
            answers: {
              where: {
                questionId: {
                  in: exam.questions.map(q => q.id),
                },
              },
              include: {
                question: true,
              },
            },
          },
        },
      },
    })

    const submissions = enrollments.map((enrollment) => {
      const grade = enrollment.student.grades[0]
      const answers = enrollment.student.answers.map((answer) => ({
        questionId: answer.questionId,
        questionText: answer.question.questionText,
        questionType: answer.question.questionType,
        questionMarks: answer.question.marks,
        answerText: answer.answerText,
        marksObtained: answer.marksObtained,
        isCorrect: answer.isCorrect,
      }))

      return {
        studentId: enrollment.student.id,
        studentName: enrollment.student.user.name,
        studentRollNo: enrollment.student.rollNo,
        grade: grade ? {
          id: grade.id,
          marksObtained: grade.marksObtained,
          gradeLetter: grade.gradeLetter,
          remarks: grade.remarks,
        } : null,
        answers,
        submitted: answers.length > 0,
      }
    })

    return NextResponse.json({
      exam: {
        id: exam.id,
        title: exam.title,
        subject: exam.subject.name,
        class: exam.class.name,
        examType: exam.examType,
        totalMarks: exam.totalMarks,
      },
      questions: exam.questions.map(q => {
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
          marks: q.marks,
          options: parsedOptions,
          correctAnswer: q.correctAnswer,
        }
      }),
      submissions,
    })
  } catch (error: any) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}
