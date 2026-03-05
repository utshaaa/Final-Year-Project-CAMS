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

    const { searchParams } = new URL(request.url)
    const examTypeFilter = searchParams.get('examType')
    const subjectFilter = searchParams.get('subject')

    const student = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        studentProfile: true,
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (!student.studentProfile) {
      return NextResponse.json({
        grades: [],
        subjects: [],
        counts: {
          online: 0,
          physical: 0,
          total: 0,
        },
      })
    }

    const profile = student.studentProfile

    const where: any = {
      studentId: profile.id,
    }

    const allGrades = await prisma.grade.findMany({
      where: { studentId: profile.id },
      include: {
        exam: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: { gradedAt: 'desc' },
    })

    let filteredGrades = allGrades.filter((grade) => {
      if (!grade.exam || !grade.exam.subject) return false
      
      if (examTypeFilter && (examTypeFilter === 'ONLINE' || examTypeFilter === 'PHYSICAL')) {
        if (grade.exam.examType !== examTypeFilter) return false
      }
      
      if (subjectFilter) {
        if (grade.exam.subject.name !== subjectFilter) return false
      }
      
      return true
    })

    const formattedGrades = filteredGrades
      .filter((grade) => grade.exam && grade.exam.subject) // Filter out grades with missing exam/subject
      .map((grade) => ({
        subject: grade.exam!.subject!.name,
        exam: grade.exam!.title,
        marks: grade.marksObtained || 0,
        grade: grade.gradeLetter || 'N/A',
        examType: grade.exam!.examType,
      }))

    const uniqueSubjects = Array.from(
      new Set(
        allGrades
          .filter((g) => g.exam && g.exam.subject)
          .map((g) => g.exam!.subject!.name)
      )
    ).sort()

    const onlineCount = allGrades.filter(
      (g) => g.exam && g.exam.examType === ExamType.ONLINE
    ).length
    const physicalCount = allGrades.filter(
      (g) => g.exam && g.exam.examType === ExamType.PHYSICAL
    ).length

    return NextResponse.json({
      grades: formattedGrades,
      subjects: uniqueSubjects,
      counts: {
        online: onlineCount,
        physical: physicalCount,
        total: formattedGrades.length,
      },
    })
  } catch (error: any) {
    console.error('Error fetching student grades:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}
