import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { getUserFromToken } from '@/lib/auth'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'

function generateId(): string {
  return randomBytes(16).toString('hex')
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    const user = await getUserFromToken(token || undefined)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== UserRole.TEACHER) {
      return NextResponse.json({ error: 'Forbidden - Teacher access only' }, { status: 403 })
    }

    const body = await request.json()
    const { studentId, examId, marksObtained, gradeLetter, remarks } = body

    if (!studentId || !examId) {
      return NextResponse.json(
        { error: 'Student ID and Exam ID are required' },
        { status: 400 }
      )
    }

    const teacher = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        teacherProfile: true,
      },
    })

    if (!teacher || !teacher.teacherProfile) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    const exam = await prisma.exam.findFirst({
      where: {
        id: examId,
        createdByTeacherId: teacher.teacherProfile.id,
      },
    })

    if (!exam) {
      return NextResponse.json(
        { error: 'Exam not found or access denied' },
        { status: 404 }
      )
    }

    if (marksObtained !== null && marksObtained !== undefined) {
      const marks = parseInt(marksObtained)
      if (isNaN(marks) || marks < 0 || marks > exam.totalMarks) {
        return NextResponse.json(
          { error: `Marks must be between 0 and ${exam.totalMarks}` },
          { status: 400 }
        )
      }
    }

    const existingGrade = await prisma.grade.findUnique({
      where: {
        studentId_examId: {
          studentId,
          examId,
        },
      },
    })

    if (existingGrade) {
      const updated = await prisma.grade.update({
        where: { id: existingGrade.id },
        data: {
          marksObtained: marksObtained !== null && marksObtained !== undefined
            ? parseInt(marksObtained)
            : null,
          gradeLetter: gradeLetter || null,
          remarks: remarks || null,
          gradedByTeacherId: teacher.teacherProfile.id,
          gradedAt: new Date(),
        },
        include: {
          student: {
            include: { user: true },
          },
          exam: {
            include: { subject: true },
          },
        },
      })

      return NextResponse.json({
        id: updated.id,
        studentId: updated.studentId,
        studentName: updated.student.user.name,
        exam: updated.exam.title,
        examId: updated.exam.id,
        marks: updated.marksObtained,
        maxMarks: updated.exam.totalMarks,
        examType: updated.exam.examType,
        gradeLetter: updated.gradeLetter,
        remarks: updated.remarks,
      })
    } else {
      const created = await prisma.grade.create({
        data: {
          id: generateId(),
          studentId,
          examId,
          marksObtained: marksObtained !== null && marksObtained !== undefined
            ? parseInt(marksObtained)
            : null,
          gradeLetter: gradeLetter || null,
          remarks: remarks || null,
          gradedByTeacherId: teacher.teacherProfile.id,
        },
        include: {
          student: {
            include: { user: true },
          },
          exam: {
            include: { subject: true },
          },
        },
      })

      return NextResponse.json({
        id: created.id,
        studentId: created.studentId,
        studentName: created.student.user.name,
        exam: created.exam.title,
        examId: created.exam.id,
        marks: created.marksObtained,
        maxMarks: created.exam.totalMarks,
        examType: created.exam.examType,
        gradeLetter: created.gradeLetter,
        remarks: created.remarks,
      })
    }
  } catch (error: any) {
    console.error('Error saving grade:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Grade already exists for this student and exam' },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    const user = await getUserFromToken(token || undefined)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== UserRole.TEACHER) {
      return NextResponse.json({ error: 'Forbidden - Teacher access only' }, { status: 403 })
    }

    const body = await request.json()
    const { grades } = body

    if (!Array.isArray(grades) || grades.length === 0) {
      return NextResponse.json(
        { error: 'Grades array is required' },
        { status: 400 }
      )
    }

    const teacher = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        teacherProfile: true,
      },
    })

    if (!teacher || !teacher.teacherProfile) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    const results: Array<{ studentId: string; examId: string; success: boolean; error?: string }> = []

    for (const gradeData of grades) {
      const { studentId, examId, marksObtained, gradeLetter, remarks } = gradeData

      const exam = await prisma.exam.findFirst({
        where: {
          id: examId,
          createdByTeacherId: teacher.teacherProfile.id,
        },
      })

      if (!exam) {
        results.push({ studentId, examId, success: false, error: 'Exam not found or not owned by you' })
        continue
      }

      if (marksObtained !== null && marksObtained !== undefined) {
        const marks = parseInt(marksObtained)
        if (isNaN(marks)) {
          results.push({ studentId, examId, success: false, error: 'Marks must be a number' })
          continue
        }
        if (marks < 0 || marks > exam.totalMarks) {
          results.push({
            studentId,
            examId,
            success: false,
            error: `Marks must be between 0 and ${exam.totalMarks}`,
          })
          continue
        }
      }

      try {
        const existingGrade = await prisma.grade.findUnique({
          where: {
            studentId_examId: {
              studentId,
              examId,
            },
          },
        })

        if (existingGrade) {
          await prisma.grade.update({
            where: { id: existingGrade.id },
            data: {
              marksObtained: marksObtained !== null && marksObtained !== undefined
                ? parseInt(marksObtained)
                : null,
              gradeLetter: gradeLetter || null,
              remarks: remarks || null,
              gradedByTeacherId: teacher.teacherProfile.id,
              gradedAt: new Date(),
            },
          })
        } else {
          await prisma.grade.create({
            data: {
              id: generateId(),
              studentId,
              examId,
              marksObtained: marksObtained !== null && marksObtained !== undefined
                ? parseInt(marksObtained)
                : null,
              gradeLetter: gradeLetter || null,
              remarks: remarks || null,
              gradedByTeacherId: teacher.teacherProfile.id,
            },
          })
        }

        results.push({ studentId, examId, success: true })
      } catch (error: any) {
        console.error('Grade save error', { studentId, examId, error })
        results.push({ studentId, examId, success: false, error: error?.message || String(error) })
      }
    }

    const failures = results.filter((r) => !r.success)
    const successes = results.filter((r) => r.success)

    if (successes.length === 0 && failures.length > 0) {
      return NextResponse.json(
        { error: 'No grades were saved', results },
        { status: 400 }
      )
    }

    return NextResponse.json({ results, savedCount: successes.length, failedCount: failures.length })
  } catch (error: any) {
    console.error('Error batch updating grades:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}
