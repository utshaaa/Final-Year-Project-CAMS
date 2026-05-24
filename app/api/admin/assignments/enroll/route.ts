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
      select: {
        id: true,
        class: {
          select: {
            id: true,
            name: true,
          }
        },
        student: {
          select: {
            id: true,
            rollNo: true,
            userId: true,
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
      studentUserId: enrollment.student.userId,
      studentName: enrollment.student.user.name,
      studentRollNo: enrollment.student.rollNo,
      className: enrollment.class.name,
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

    let student = await prisma.studentProfile.findUnique({
      where: { userId: studentId },
    })

    if (!student) {
      student = await prisma.studentProfile.create({
        data: {
          id: generateId(),
          userId: studentId,
          rollNo: `ROLL-${studentId.slice(0, 6)}`,
          class: 'Not Assigned',
        }
      })
    }

    const existing = await prisma.enrollment.findUnique({
      where: { studentId: student.id },
    })

    if (existing) {
      if (existing.classId === classId) {
        return NextResponse.json({
          message: 'Student is already enrolled in this class',
        })
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

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    const user = await getUserFromToken(token || undefined)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Admin access only' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: studentId },
    })

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    await prisma.enrollment.deleteMany({
      where: { studentId: studentProfile.id },
    })

    return NextResponse.json({ message: 'Student unenrolled successfully' })
  } catch (error: any) {
    console.error('Error unenrolling student:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
