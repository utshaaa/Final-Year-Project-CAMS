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
          },
        },
      },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (!student.studentProfile) {
      return NextResponse.json({
        attendance: [],
        averageAttendance: 0,
      })
    }

    const profile = student.studentProfile

    const currentClassId = profile.enrollments?.[0]?.classId
    if (!currentClassId) {
      return NextResponse.json({
        attendance: [],
        averageAttendance: 0,
      })
    }

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

    const averageAttendance = totalAttendanceRecords > 0
      ? Math.round((presentRecords / totalAttendanceRecords) * 100)
      : 0

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
      attendance,
      averageAttendance,
    })
  } catch (error: any) {
    console.error('Error fetching student attendance:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}
