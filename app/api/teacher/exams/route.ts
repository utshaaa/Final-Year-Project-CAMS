import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole, ExamType } from '@prisma/client'
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

    const teacher = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        teacherProfile: {
          include: {
            classSubjects: {
              include: {
                class: true,
                subject: true,
              },
            },
          },
        },
      },
    })

    if (!teacher?.teacherProfile) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    const classSubjectIds = teacher.teacherProfile.classSubjects.map((cs) => ({
      classId: cs.classId,
      subjectId: cs.subjectId,
    }))

    const exams = await prisma.exam.findMany({
      where: {
        createdByTeacherId: teacher.teacherProfile.id,
      },
      include: {
        class: true,
        subject: true,
      },
      orderBy: {
        scheduledAt: 'desc',
      },
    })

    const formattedExams = exams.map((exam) => ({
      id: exam.id,
      name: exam.title,
      subject: exam.subject.name,
      className: exam.class.name + (exam.class.section ? ` - ${exam.class.section}` : ''),
      classId: exam.classId,
      subjectId: exam.subjectId,
      examType: exam.examType,
      scheduledAt: exam.scheduledAt.toISOString(),
      totalMarks: exam.totalMarks,
      duration: exam.duration,
    }))

    const availableClassSubjects = teacher.teacherProfile.classSubjects.map((cs) => ({
      classId: cs.classId,
      className: cs.class.name + (cs.class.section ? ` - ${cs.class.section}` : ''),
      subjectId: cs.subjectId,
      subjectName: cs.subject.name,
    }))

    return NextResponse.json({
      exams: formattedExams,
      availableClassSubjects,
    })
  } catch (error: any) {
    console.error('Error fetching exams:', error)
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
    const { title, classId, subjectId, examType, scheduledAt, totalMarks, duration } = body

    if (!title || !classId || !subjectId || !examType || !scheduledAt || !totalMarks) {
      return NextResponse.json(
        { error: 'Title, class, subject, exam type, scheduled date, and total marks are required' },
        { status: 400 }
      )
    }

    const teacher = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        teacherProfile: {
          include: {
            classSubjects: true,
          },
        },
      },
    })

    if (!teacher?.teacherProfile) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
    }

    const isAssigned = teacher.teacherProfile.classSubjects.some(
      (cs) => cs.classId === classId && cs.subjectId === subjectId
    )

    if (!isAssigned) {
      return NextResponse.json(
        { error: 'You are not assigned to teach this class-subject combination' },
        { status: 403 }
      )
    }

    const exam = await prisma.exam.create({
      data: {
        id: generateId(),
        classId,
        subjectId,
        title: title.trim(),
        examType: examType as ExamType,
        scheduledAt: new Date(scheduledAt),
        totalMarks: parseInt(totalMarks),
        duration: duration?.trim() || null,
        createdByTeacherId: teacher.teacherProfile.id,
      },
      include: {
        class: true,
        subject: true,
      },
    })

    return NextResponse.json({
      id: exam.id,
      name: exam.title,
      subject: exam.subject.name,
      className: exam.class.name + (exam.class.section ? ` - ${exam.class.section}` : ''),
      classId: exam.classId,
      subjectId: exam.subjectId,
      examType: exam.examType,
      scheduledAt: exam.scheduledAt.toISOString(),
      totalMarks: exam.totalMarks,
      duration: exam.duration,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating exam:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}
