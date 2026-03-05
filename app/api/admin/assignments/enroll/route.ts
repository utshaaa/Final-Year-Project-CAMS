import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
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

    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Admin access only' }, { status: 403 })
    }

    const enrollments = await prisma.enrollment.findMany({
      include: {
        class: true,
        student: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { class: { name: 'asc' } },
        { student: { rollNo: 'asc' } },
      ],
    })

    const formattedEnrollments = enrollments.map((enrollment) => ({
      id: enrollment.id,
      studentName: enrollment.student.user.name,
      studentRollNo: enrollment.student.rollNo,
      className: enrollment.class.name + (enrollment.class.section ? ` - ${enrollment.class.section}` : ''),
    }))

    return NextResponse.json({ enrollments: formattedEnrollments })
  } catch (error: any) {
    console.error('Error fetching enrollments:', error)
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

    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Admin access only' }, { status: 403 })
    }

    const body = await request.json()
    const { classId, studentId } = body

    if (!classId || !studentId) {
      return NextResponse.json(
        { error: 'Class ID and Student ID are required' },
        { status: 400 }
      )
    }

    const student = await prisma.studentProfile.findUnique({
      where: { userId: studentId },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const existing = await prisma.enrollment.findUnique({
      where: { studentId: student.id },
    })

    if (existing) {
      if (existing.classId === classId) {
        return NextResponse.json(
          { error: 'Student is already enrolled in this class' },
          { status: 409 }
        )
      }
      
      await prisma.enrollment.update({
        where: { id: existing.id },
        data: { classId },
      })

      return NextResponse.json({
        message: 'Student enrollment updated',
      })
    }

    await prisma.enrollment.create({
      data: {
        id: generateId(),
        studentId: student.id,
        classId,
      },
    })

    return NextResponse.json({
      message: 'Student enrolled successfully',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error enrolling student:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}
