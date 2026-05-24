import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { hashPassword, getUserFromToken } from '@/lib/auth'
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

    const { searchParams } = new URL(request.url)
    const roleFilter = searchParams.get('role')

    const where: any = {}
    if (roleFilter) {
      where.role = roleFilter as UserRole
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        studentProfile: {
          select: {
            id: true,
            rollNo: true,
            class: true,
            enrollments: {
              select: {
                id: true,
                class: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              }
            }
          }
        },
        teacherProfile: {
          select: {
            id: true,
            department: true,
            classSubjects: {
              select: {
                id: true,
                class: {
                  select: {
                    id: true,
                    name: true,
                  }
                },
                subject: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              }
            }
          }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const formattedUsers = users.map((user) => {
      const studentEnrollment = user.studentProfile?.enrollments?.[0]
      const teacherAssignments = user.teacherProfile?.classSubjects || []
      
      const assignments = []

      if (user.role === 'STUDENT' && studentEnrollment) {
        assignments.push({
          id: studentEnrollment.id,
          classId: studentEnrollment.class.id,
          label: `${studentEnrollment.class.name}`
        })
      } else if (user.role === 'TEACHER') {
        teacherAssignments.forEach(as => {
          assignments.push({
            id: as.id,
            classId: as.class.id,
            subjectId: as.subject.id,
            label: `${as.class.name} (${as.subject.name})`
          })
        })
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        status: 'active',
        createdAt: user.createdAt,
        studentProfile: user.studentProfile,
        teacherProfile: user.teacherProfile,
        enrolled: assignments.length > 0,
        assignments,
      }
    })

    return NextResponse.json({ users: formattedUsers })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, role, password, rollNo, class: classInput, department } = body

    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { error: 'Name, email, role, and password are required' },
        { status: 400 }
      )
    }

    const validRoles = ['ADMIN', 'TEACHER', 'STUDENT']
    const roleUpper = role.toUpperCase()
    if (!validRoles.includes(roleUpper)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be ADMIN, TEACHER, or STUDENT' },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    let resolvedClassId: string | null = null
    let resolvedClassName: string | null = null
    if (roleUpper === 'STUDENT' && classInput) {
      const cls = await prisma.class.findFirst({
        where: { OR: [{ id: classInput }, { name: classInput }] },
      })
      if (cls) {
        resolvedClassId = cls.id
        resolvedClassName = cls.name
      }
    }

    const passwordHash = await hashPassword(password)
    const userId = generateId()
    const studentProfileId = generateId()

    const user = await prisma.user.create({
      data: {
        id: userId,
        name,
        email,
        passwordHash,
        role: roleUpper as UserRole,
        ...(roleUpper === 'STUDENT' && {
          studentProfile: {
            create: {
              id: studentProfileId,
              rollNo: rollNo || `ROLL-${userId.slice(0, 6)}`,
              class: resolvedClassName || 'Not Assigned',
            }
          }
        }),
        ...(roleUpper === 'TEACHER' && {
          teacherProfile: {
            create: {
              id: generateId(),
              department: department || 'General',
            }
          }
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        studentProfile: {
          select: {
            id: true,
            rollNo: true,
            class: true,
          }
        },
        teacherProfile: {
          select: {
            id: true,
            department: true,
          }
        },
      },
    })

    if (roleUpper === 'STUDENT' && resolvedClassId && user.studentProfile) {
      await prisma.enrollment.create({
        data: {
          id: generateId(),
          studentId: user.studentProfile.id,
          classId: resolvedClassId,
        },
      })
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase(),
      status: 'active',
      createdAt: user.createdAt,
      studentProfile: user.studentProfile,
      teacherProfile: user.teacherProfile,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}
