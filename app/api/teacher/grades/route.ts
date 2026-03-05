import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole, ExamType } from '@prisma/client'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const examId = searchParams.get('examId')
    const classId = searchParams.get('classId')
    const subjectId = searchParams.get('subjectId')
    const examType = searchParams.get('examType')

    const teacher = await prisma.user.findFirst({
      where: { role: UserRole.TEACHER },
      include: {
        teacherProfile: true,
      },
    })

    if (!teacher || !teacher.teacherProfile) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    if (examId) {
      const exam = await prisma.exam.findFirst({
        where: {
          id: examId,
          createdByTeacherId: teacher.teacherProfile.id,
        },
        include: {
          subject: true,
          class: true,
        },
      })

      if (!exam) {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
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
            },
          },
        },
      })

      const submissions = enrollments.map((enrollment) => {
        const grade = enrollment.student.grades[0]
        return {
          id: grade?.id || `pending-${enrollment.student.id}`,
          studentId: enrollment.student.id,
          studentName: enrollment.student.user.name,
          exam: exam.title,
          examId: exam.id,
          marks: grade?.marksObtained || null,
          maxMarks: exam.totalMarks,
          examType: exam.examType,
          gradeLetter: grade?.gradeLetter || null,
          remarks: grade?.remarks || null,
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
        submissions,
      })
    }

    const teacherExams = await prisma.exam.findMany({
      where: {
        createdByTeacherId: teacher.teacherProfile.id,
        ...(examType && { examType: examType as ExamType }),
      },
      include: {
        subject: true,
        class: true,
        grades: true,
      },
    })

    const allSubmissions: any[] = []

    for (const exam of teacherExams) {
      const enrollments = await prisma.enrollment.findMany({
        where: { classId: exam.classId },
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      })

      for (const enrollment of enrollments) {
        const existingGrade = exam.grades.find(
          (g) => g.studentId === enrollment.student.id
        )

        const shouldShow =
          exam.examType === 'ONLINE'
            ? !existingGrade || existingGrade.marksObtained === null
            : !existingGrade

        if (shouldShow) {
          allSubmissions.push({
            id: existingGrade?.id || `pending-${enrollment.student.id}-${exam.id}`,
            studentId: enrollment.student.id,
            studentName: enrollment.student.user.name,
            exam: exam.title,
            examId: exam.id,
            marks: existingGrade?.marksObtained || null,
            maxMarks: exam.totalMarks,
            examType: exam.examType,
            gradeLetter: existingGrade?.gradeLetter || null,
            remarks: existingGrade?.remarks || null,
          })
        }
      }
    }

    return NextResponse.json(allSubmissions)
  } catch (error) {
    console.error('Error fetching grades:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { studentId, examId, marksObtained, gradeLetter, remarks } = body

    if (!studentId || !examId) {
      return NextResponse.json(
        { error: 'Student ID and Exam ID are required' },
        { status: 400 }
      )
    }

    const teacher = await prisma.user.findFirst({
      where: { role: UserRole.TEACHER },
      include: {
        teacherProfile: true,
      },
    })

    if (!teacher || !teacher.teacherProfile) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
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

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { grades } = body

    if (!Array.isArray(grades) || grades.length === 0) {
      return NextResponse.json(
        { error: 'Grades array is required' },
        { status: 400 }
      )
    }

    const teacher = await prisma.user.findFirst({
      where: { role: UserRole.TEACHER },
      include: {
        teacherProfile: true,
      },
    })

    if (!teacher || !teacher.teacherProfile) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const results = []

    for (const gradeData of grades) {
      const { studentId, examId, marksObtained, gradeLetter, remarks } = gradeData

      const exam = await prisma.exam.findFirst({
        where: {
          id: examId,
          createdByTeacherId: teacher.teacherProfile.id,
        },
      })

      if (!exam) {
        continue
      }

      if (marksObtained !== null && marksObtained !== undefined) {
        const marks = parseInt(marksObtained)
        if (isNaN(marks) || marks < 0 || marks > exam.totalMarks) {
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
      } catch (error) {
        results.push({ studentId, examId, success: false, error: String(error) })
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Error batch updating grades:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
