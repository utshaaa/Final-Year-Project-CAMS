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

    if (user.role === UserRole.STUDENT) {
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
                          teacher: {
                            include: {
                              user: {
                                select: {
                                  id: true,
                                  name: true,
                                  email: true,
                                  role: true,
                                },
                              },
                            },
                          },
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

      if (!student?.studentProfile) {
        return NextResponse.json({ contacts: [] })
      }

      const enrollments = student.studentProfile.enrollments
      if (enrollments.length === 0) {
        return NextResponse.json({ contacts: [] })
      }

      const classSubjects = enrollments[0].class.classSubjects
      const uniqueTeachers = new Map()

      classSubjects.forEach((cs) => {
        const teacher = cs.teacher.user
        if (!uniqueTeachers.has(teacher.id)) {
          uniqueTeachers.set(teacher.id, {
            id: teacher.id,
            name: teacher.name,
            email: teacher.email,
            role: teacher.role.toLowerCase(),
            subject: cs.subject.name,
          })
        }
      })

      const contacts = Array.from(uniqueTeachers.values())

      return NextResponse.json({ contacts })
    } else if (user.role === UserRole.TEACHER) {
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
                          student: {
                            include: {
                              user: {
                                select: {
                                  id: true,
                                  name: true,
                                  email: true,
                                  role: true,
                                },
                              },
                            },
                          },
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

      if (!teacher?.teacherProfile) {
        return NextResponse.json({ contacts: [] })
      }

      const classSubjects = teacher.teacherProfile.classSubjects
      const uniqueStudents = new Map()

      classSubjects.forEach((cs) => {
        cs.class.enrollments.forEach((enrollment) => {
          const student = enrollment.student.user
          if (!uniqueStudents.has(student.id)) {
            uniqueStudents.set(student.id, {
              id: student.id,
              name: student.name,
              email: student.email,
              role: student.role.toLowerCase(),
            })
          }
        })
      })

      const contacts = Array.from(uniqueStudents.values())

      return NextResponse.json({ contacts })
    } else {
      return NextResponse.json({ error: 'Forbidden - Only students and teachers can use chat' }, { status: 403 })
    }
  } catch (error: any) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}
