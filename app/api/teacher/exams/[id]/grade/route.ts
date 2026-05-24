import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole, QuestionType } from '@prisma/client'
import { getUserFromToken } from '@/lib/auth'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'

function generateId(): string {
  return randomBytes(16).toString('hex')
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
    const { studentId, questionMarks, totalMarks, gradeLetter, remarks } = body

    if (!studentId || !questionMarks) {
      return NextResponse.json({ error: 'Student ID and question marks are required' }, { status: 400 })
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

    for (const [questionId, marks] of Object.entries(questionMarks)) {
      const marksValue = typeof marks === 'number' ? marks : parseInt(marks as string) || 0
      
      await prisma.answer.updateMany({
        where: {
          questionId,
          studentId,
        },
        data: {
          marksObtained: marksValue,
        },
      })
    }

    const finalMarks = totalMarks || Object.values(questionMarks).reduce((sum: number, marks: any) => sum + (typeof marks === 'number' ? marks : parseInt(marks) || 0), 0)
    const finalGradeLetter = gradeLetter || calculateGradeLetter(finalMarks, exam.totalMarks)

    const grade = await prisma.grade.upsert({
      where: {
        studentId_examId: {
          studentId,
          examId,
        },
      },
      create: {
        id: generateId(),
        studentId,
        examId,
        marksObtained: finalMarks,
        gradeLetter: finalGradeLetter,
        remarks: remarks || null,
        gradedByTeacherId: teacher.teacherProfile.id,
      },
      update: {
        marksObtained: finalMarks,
        gradeLetter: finalGradeLetter,
        remarks: remarks || null,
        gradedByTeacherId: teacher.teacherProfile.id,
        gradedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      grade: {
        marksObtained: grade.marksObtained,
        gradeLetter: grade.gradeLetter,
        remarks: grade.remarks,
      },
    })
  } catch (error: any) {
    console.error('Error grading exam:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}
