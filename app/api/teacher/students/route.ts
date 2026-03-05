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

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('classId')

    if (!classId) {
      return NextResponse.json({ error: 'Class ID required' }, { status: 400 })
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

    const enrollments = await prisma.enrollment.findMany({
      where: { classId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    })

    const students = enrollments.map((enrollment) => ({
      id: enrollment.student.id,
      studentId: enrollment.student.id,
      name: enrollment.student.user.name,
      rollNo: enrollment.student.rollNo,
      class: enrollment.student.class,
    }))

    return NextResponse.json(students)
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
