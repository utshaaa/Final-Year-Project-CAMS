import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole, AttendanceStatus } from '@prisma/client'
import { getUserFromToken } from '@/lib/auth'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'

function generateId(): string {
  return randomBytes(16).toString('hex')
}

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

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const date = searchParams.get('date')

    if (!classId || !date) {
      return NextResponse.json({ error: 'Class ID and date are required' }, { status: 400 })
    }

    const teacher = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        teacherProfile: {
          include: {
            classSubjects: {
              where: { classId },
            },
          },
        },
      },
    })

    if (!teacher || !teacher.teacherProfile) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    const teachesClass = teacher.teacherProfile.classSubjects.some(
      (cs) => cs.classId === classId
    )

    if (!teachesClass) {
      return NextResponse.json(
        { error: 'Teacher does not teach this class' },
        { status: 403 }
      )
    }

    const attendanceDate = new Date(date)
    attendanceDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(attendanceDate)
    nextDay.setDate(nextDay.getDate() + 1)

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        classId,
        date: {
          gte: attendanceDate,
          lt: nextDay,
        },
      },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    const formattedAttendance = attendanceRecords.map((record) => ({
      studentId: record.studentId,
      status: record.status,
      studentName: record.student.user.name,
    }))

    return NextResponse.json({ attendance: formattedAttendance })
  } catch (error: any) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
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
    const { classId, date, entries } = body

    if (!classId || !date || !Array.isArray(entries)) {
      return NextResponse.json(
        { error: 'Class ID, date, and entries are required' },
        { status: 400 }
      )
    }

    const teacher = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        teacherProfile: {
          include: {
            classSubjects: {
              where: { classId },
            },
          },
        },
      },
    })

    if (!teacher || !teacher.teacherProfile) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const teachesClass = teacher.teacherProfile.classSubjects.some(
      (cs) => cs.classId === classId
    )

    if (!teachesClass) {
      return NextResponse.json(
        { error: 'Teacher does not teach this class' },
        { status: 403 }
      )
    }

    const attendanceDate = new Date(date)
    attendanceDate.setHours(0, 0, 0, 0)
    const nextDay = new Date(attendanceDate)
    nextDay.setDate(nextDay.getDate() + 1)

    let presentCount = 0
    let absentCount = 0
    let lateCount = 0

    for (const entry of entries) {
      const { studentId, status } = entry

      if (!studentId || !status) {
        continue
      }

      if (!['PRESENT', 'ABSENT', 'LATE'].includes(status)) {
        continue
      }

      try {
        const existing = await prisma.attendanceRecord.findFirst({
          where: {
            studentId,
            classId,
            date: {
              gte: attendanceDate,
              lt: nextDay,
            },
          },
        })

        if (existing) {
          await prisma.attendanceRecord.update({
            where: { id: existing.id },
            data: {
              status: status as AttendanceStatus,
              markedByTeacherId: teacher.id,
            },
          })
        } else {
          await prisma.attendanceRecord.create({
            data: {
              id: generateId(),
              studentId,
              classId,
              date: attendanceDate,
              status: status as AttendanceStatus,
              markedByTeacherId: teacher.id,
            },
          })
        }

        if (status === 'PRESENT') presentCount++
        else if (status === 'ABSENT') absentCount++
        else if (status === 'LATE') lateCount++
      } catch (error: any) {
        console.error(`Error saving attendance for student ${studentId}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      date: attendanceDate.toISOString().split('T')[0],
      summary: {
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        total: presentCount + absentCount + lateCount,
      },
    })
  } catch (error) {
    console.error('Error marking attendance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
