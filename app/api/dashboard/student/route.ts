import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole, AttendanceStatus } from '@prisma/client'
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

    const student = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        studentProfile: {
          include: {
            enrollments: {
              include: {
                class: {
                  include: {
                    classSubjects: {
                      include: {
                        subject: true,
                      },
                    },
                  },
                },
              },
            },
            attendanceRecords: {
              take: 30,
              orderBy: { date: 'desc' },
              include: {
                class: true,
              },
            },
            grades: {
              include: {
                exam: {
                  include: {
                    subject: true,
                  },
                },
              },
              orderBy: { gradedAt: 'desc' },
            },
          },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (!student.studentProfile) {
      return NextResponse.json({
        averageAttendance: 0,
        upcomingExams: 0,
        latestGrade: null,
        attendance: [],
        grades: [],
      })
    }

    const profile = student.studentProfile

    const currentClassId = profile.enrollments?.[0]?.classId
    if (!currentClassId) {
      return NextResponse.json({
        averageAttendance: 0,
        upcomingExams: 0,
        latestGrade: null,
        attendance: [],
        grades: [],
      })
    }

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        studentId: profile.id,
        classId: currentClassId,
      },
    })

    const totalClasses = attendanceRecords.length
    const presentCount = attendanceRecords.filter(
      (r) => r.status === AttendanceStatus.PRESENT
    ).length
    const averageAttendance = totalClasses > 0
      ? Math.round((presentCount / totalClasses) * 100)
      : 0

    const upcomingExamsCount = await prisma.exam.count({
      where: {
        classId: currentClassId,
        scheduledAt: {
          gte: new Date(),
        },
      },
    })

    const latestGradeRecord = await prisma.grade.findFirst({
      where: {
        studentId: profile.id,
      },
      include: {
        exam: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        gradedAt: 'desc',
      },
    })

    const formattedLatestGrade = latestGradeRecord && latestGradeRecord.exam && latestGradeRecord.exam.subject
      ? {
          subject: latestGradeRecord.exam.subject.name,
          exam: latestGradeRecord.exam.title,
          grade: latestGradeRecord.gradeLetter || 'N/A',
        }
      : null

    const recentGrades = await prisma.grade.findMany({
      where: {
        studentId: profile.id,
      },
      include: {
        exam: {
          include: {
            subject: true,
          },
        },
      },
      orderBy: {
        gradedAt: 'desc',
      },
      take: 5,
    })

    const grades = recentGrades
      .filter((grade) => grade.exam && grade.exam.subject) // Filter out grades with missing exam/subject
      .map((grade) => ({
        subject: grade.exam!.subject!.name,
        exam: grade.exam!.title,
        marks: grade.marksObtained || 0,
        grade: grade.gradeLetter || 'N/A',
        examType: grade.exam!.examType,
      }))

    const classSubjects = await prisma.classSubject.findMany({
      where: {
        classId: currentClassId,
      },
      include: {
        subject: true,
      },
    })

    const allAttendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        studentId: profile.id,
        classId: currentClassId,
      },
    })

    const totalAttendanceRecords = allAttendanceRecords.length
    const presentRecords = allAttendanceRecords.filter(
      (r) => r.status === AttendanceStatus.PRESENT
    ).length

    const attendance = classSubjects.length > 0
      ? classSubjects.map((cs) => {
          const subjectName = cs.subject.name
          const percentage = totalAttendanceRecords > 0
            ? Math.round((presentRecords / totalAttendanceRecords) * 100)
            : 0

          return {
            subject: subjectName,
            totalClasses: totalAttendanceRecords,
            attended: presentRecords,
            percentage,
          }
        })
      : []

    return NextResponse.json({
      averageAttendance,
      upcomingExams: upcomingExamsCount,
      latestGrade: formattedLatestGrade,
      attendance,
      grades,
    })
  } catch (error: any) {
    console.error('Error fetching student dashboard:', error)
    
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Database constraint violation' },
        { status: 400 }
      )
    }
    
    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}
