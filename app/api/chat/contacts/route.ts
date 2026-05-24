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
      const teacherSubjects = new Map<string, { teacher: typeof classSubjects[number]['teacher']['user']; subjects: string[] }>()

      for (const cs of classSubjects) {
        const teacher = cs.teacher.user
        const entry = teacherSubjects.get(teacher.id)
        if (entry) {
          if (!entry.subjects.includes(cs.subject.name)) {
            entry.subjects.push(cs.subject.name)
          }
        } else {
          teacherSubjects.set(teacher.id, { teacher, subjects: [cs.subject.name] })
        }
      }

      const uniqueTeachers = new Map()
      for (const { teacher, subjects } of teacherSubjects.values()) {
        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: user.id, receiverId: teacher.id },
              { senderId: teacher.id, receiverId: user.id },
            ],
          },
          orderBy: { createdAt: 'desc' },
        })

        const unreadCount = await prisma.message.count({
          where: {
            senderId: teacher.id,
            receiverId: user.id,
            readAt: null,
          },
        })

        uniqueTeachers.set(teacher.id, {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          role: teacher.role.toLowerCase(),
          subject: subjects[0],
          subjects,
          lastMessage: lastMessage?.content || undefined,
          lastMessageTime: lastMessage?.createdAt.toISOString() || undefined,
          unreadCount: unreadCount > 0 ? unreadCount : undefined,
        })
      }

      const contacts = Array.from(uniqueTeachers.values())
      contacts.sort((a, b) => {
        if (!a.lastMessageTime && !b.lastMessageTime) return 0
        if (!a.lastMessageTime) return 1
        if (!b.lastMessageTime) return -1
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      })

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
      const studentClasses = new Map<string, { student: typeof classSubjects[number]['class']['enrollments'][number]['student']['user']; classes: string[]; rollNo?: string }>()

      for (const cs of classSubjects) {
        for (const enrollment of cs.class.enrollments) {
          const student = enrollment.student.user
          const className = cs.class.name
          const entry = studentClasses.get(student.id)
          if (entry) {
            if (!entry.classes.includes(className)) {
              entry.classes.push(className)
            }
          } else {
            studentClasses.set(student.id, {
              student,
              classes: [className],
              rollNo: enrollment.student.rollNo,
            })
          }
        }
      }

      const uniqueStudents = new Map()
      for (const { student, classes, rollNo } of studentClasses.values()) {
        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: user.id, receiverId: student.id },
              { senderId: student.id, receiverId: user.id },
            ],
          },
          orderBy: { createdAt: 'desc' },
        })

        const unreadCount = await prisma.message.count({
          where: {
            senderId: student.id,
            receiverId: user.id,
            readAt: null,
          },
        })

        uniqueStudents.set(student.id, {
          id: student.id,
          name: student.name,
          email: student.email,
          role: student.role.toLowerCase(),
          className: classes[0],
          classes,
          rollNo,
          lastMessage: lastMessage?.content || undefined,
          lastMessageTime: lastMessage?.createdAt.toISOString() || undefined,
          unreadCount: unreadCount > 0 ? unreadCount : undefined,
        })
      }

      const contacts = Array.from(uniqueStudents.values())
      contacts.sort((a, b) => {
        if (!a.lastMessageTime && !b.lastMessageTime) return 0
        if (!a.lastMessageTime) return 1
        if (!b.lastMessageTime) return -1
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      })

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
