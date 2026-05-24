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

    if (user.role !== UserRole.TEACHER) {
      return NextResponse.json({ error: 'Forbidden - Teacher access only' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 })
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

    const fromDate = from ? new Date(from) : new Date()
    fromDate.setDate(fromDate.getDate() - 7)
    fromDate.setHours(0, 0, 0, 0)

    const toDate = to ? new Date(to) : new Date()
    toDate.setHours(23, 59, 59, 999)

    const enrollments = await prisma.enrollment.findMany({
      where: { classId },
    })
    const totalStudents = enrollments.length

    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        classId,
        date: {
          gte: fromDate,
          lte: toDate,
        },
      },
    })

    const groupedByDate = new Map<string, { present: number; absent: number; late: number }>()

    attendanceRecords.forEach((record) => {
      const dateKey = record.date.toISOString().split('T')[0]
      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, { present: 0, absent: 0, late: 0 })
      }
      const counts = groupedByDate.get(dateKey)!
      if (record.status === AttendanceStatus.PRESENT) {
        counts.present++
      } else if (record.status === AttendanceStatus.ABSENT) {
        counts.absent++
      } else if (record.status === AttendanceStatus.LATE) {
        counts.late++
      }
    })

    const history = Array.from(groupedByDate.entries())
      .map(([date, counts]) => ({
        date,
        present: counts.present,
        absent: counts.absent,
        late: counts.late,
        total: totalStudents,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({ history })
  } catch (error: any) {
    console.error('Error fetching attendance history:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}
