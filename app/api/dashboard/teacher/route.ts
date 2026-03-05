import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { getUserFromToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    const user = await getUserFromToken(token || undefined)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== UserRole.TEACHER) {
      return NextResponse.json({ error: 'Forbidden - Teacher access only' }, { status: 403 })
    }

    const teacher = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        teacherProfile: {
          include: {
            classSubjects: {
              include: {
                class: {
                  include: {
                    enrollments: {
                      include: {
                        student: true,
                      },
                    },
                  },
                },
              },
            },
            createdExams: {
              include: {
                subject: true,
                class: true,
              },
              orderBy: { scheduledAt: 'desc' },
            },
            gradedGrades: true,
          },
        },
      },
    })

    if (!teacher || !teacher.teacherProfile) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const profile = teacher.teacherProfile

    const classIds = profile.classSubjects.map((cs) => cs.classId)
    const totalStudents = await prisma.enrollment.count({
      where: {
        classId: { in: classIds },
      },
    })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const activeExams = await prisma.exam.count({
      where: {
        createdByTeacherId: profile.id,
        OR: [
          { scheduledAt: { gte: new Date() } }, // Upcoming
          { scheduledAt: { gte: thirtyDaysAgo } }, // Recently created
        ],
      },
    })
    
    const teacherExamIds = profile.createdExams.map((e) => e.id)
    
    const enrolledStudentIds = await prisma.enrollment.findMany({
      where: {
        classId: { in: classIds },
      },
      select: {
        studentId: true,
      },
    })
    const studentIds = enrolledStudentIds.map((e) => e.studentId)
    
    const physicalExams = await prisma.exam.findMany({
      where: {
        id: { in: teacherExamIds },
        examType: 'PHYSICAL',
      },
      select: { id: true },
    })
    
    let pendingPhysicalGrades = 0
    for (const exam of physicalExams) {
      const existingGrades = await prisma.grade.count({
        where: {
          examId: exam.id,
          studentId: { in: studentIds },
        },
      })
      const expectedGrades = studentIds.length
      pendingPhysicalGrades += Math.max(0, expectedGrades - existingGrades)
    }
    
    const onlineExams = await prisma.exam.findMany({
      where: {
        id: { in: teacherExamIds },
        examType: 'ONLINE',
      },
      select: { id: true },
    })
    
    let pendingOnlineGrades = 0
    for (const exam of onlineExams) {
      const existingGrades = await prisma.grade.count({
        where: {
          examId: exam.id,
          studentId: { in: studentIds },
          marksObtained: { not: null },
        },
      })
      const expectedGrades = studentIds.length
      pendingOnlineGrades += Math.max(0, expectedGrades - existingGrades)
    }
    
    const pendingGrades = pendingOnlineGrades + pendingPhysicalGrades

    const exams = profile.createdExams.map((exam) => ({
      id: exam.id,
      name: exam.title,
      subject: exam.subject.name,
      questions: 0,
      date: exam.scheduledAt.toISOString().split('T')[0],
    }))

    return NextResponse.json({
      totalStudents,
      activeExams,
      pendingGrades,
      exams,
    })
  } catch (error) {
    console.error('Error fetching teacher dashboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
