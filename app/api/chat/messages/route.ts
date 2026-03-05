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

    const { searchParams } = new URL(request.url)
    const otherUserId = searchParams.get('userId')

    if (!otherUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
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
                              user: true,
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

      if (!student?.studentProfile) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
      }

      const enrollments = student.studentProfile.enrollments
      if (enrollments.length === 0) {
        return NextResponse.json({ error: 'Student not enrolled in any class' }, { status: 404 })
      }

      const classSubjects = enrollments[0].class.classSubjects
      const teachers = classSubjects.map((cs) => cs.teacher.user.id)

      if (!teachers.includes(otherUserId)) {
        return NextResponse.json({ error: 'Forbidden - Can only chat with your teachers' }, { status: 403 })
      }
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
                              user: true,
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
        return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
      }

      const classSubjects = teacher.teacherProfile.classSubjects
      const allStudents = classSubjects.flatMap((cs) => cs.class.enrollments.map((e) => e.student.user.id))

      if (!allStudents.includes(otherUserId)) {
        return NextResponse.json({ error: 'Forbidden - Can only chat with your students' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Forbidden - Only students and teachers can use chat' }, { status: 403 })
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: user.id, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: user.id },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      sender: msg.sender.role.toLowerCase(),
      senderName: msg.sender.name,
      text: msg.content,
      time: msg.createdAt.toISOString(),
      isRead: !!msg.readAt,
    }))

    return NextResponse.json({ messages: formattedMessages })
  } catch (error: any) {
    console.error('Error fetching messages:', error)
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

    const body = await request.json()
    const { receiverId, content } = body

    if (!receiverId || !content || !content.trim()) {
      return NextResponse.json({ error: 'Receiver ID and message content are required' }, { status: 400 })
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
                              user: true,
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

      if (!student?.studentProfile) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
      }

      const enrollments = student.studentProfile.enrollments
      if (enrollments.length === 0) {
        return NextResponse.json({ error: 'Student not enrolled in any class' }, { status: 404 })
      }

      const classSubjects = enrollments[0].class.classSubjects
      const teachers = classSubjects.map((cs) => cs.teacher.user.id)

      if (!teachers.includes(receiverId)) {
        return NextResponse.json({ error: 'Forbidden - Can only chat with your teachers' }, { status: 403 })
      }
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
                              user: true,
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
        return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 })
      }

      const classSubjects = teacher.teacherProfile.classSubjects
      const allStudents = classSubjects.flatMap((cs) => cs.class.enrollments.map((e) => e.student.user.id))

      if (!allStudents.includes(receiverId)) {
        return NextResponse.json({ error: 'Forbidden - Can only chat with your students' }, { status: 403 })
      }
    } else {
      return NextResponse.json({ error: 'Forbidden - Only students and teachers can use chat' }, { status: 403 })
    }

    const message = await prisma.message.create({
      data: {
        id: generateId(),
        senderId: user.id,
        receiverId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    })

    return NextResponse.json({
      id: message.id,
      sender: message.sender.role.toLowerCase(),
      senderName: message.sender.name,
      text: message.content,
      time: message.createdAt.toISOString(),
      isRead: false,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}
