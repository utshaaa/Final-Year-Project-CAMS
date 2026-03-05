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
                class: true,
                subject: true,
              },
            },
          },
        },
      },
    })

    if (!teacher || !teacher.teacherProfile) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const classMap = new Map()
    const subjectMap = new Map()

    teacher.teacherProfile.classSubjects.forEach((cs) => {
      if (!classMap.has(cs.classId)) {
        classMap.set(cs.classId, {
          id: cs.class.id,
          name: cs.class.name,
          section: cs.class.section,
        })
      }
      if (!subjectMap.has(cs.subjectId)) {
        subjectMap.set(cs.subjectId, {
          id: cs.subject.id,
          name: cs.subject.name,
          code: cs.subject.code,
        })
      }
    })

    const classSubjects = teacher.teacherProfile.classSubjects.map((cs) => ({
      classId: cs.classId,
      class: cs.class.name,
      subjectId: cs.subjectId,
      subject: cs.subject.name,
    }))

    return NextResponse.json({
      classes: Array.from(classMap.values()),
      subjects: Array.from(subjectMap.values()),
      classSubjects,
    })
  } catch (error) {
    console.error('Error fetching classes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
