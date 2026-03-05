import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'
import { UserRole } from '@prisma/client'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, role, rollNo, class: className, department } = body

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Name, email, password, and role are required' },
        { status: 400 }
      )
    }

    if (!['ADMIN', 'TEACHER', 'STUDENT'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
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

    const hashedPassword = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role: role as UserRole,
        ...(role === 'STUDENT' && rollNo && className
          ? {
              studentProfile: {
                create: {
                  rollNo,
                  class: className,
                },
              },
            }
          : {}),
        ...(role === 'TEACHER' && department
          ? {
              teacherProfile: {
                create: {
                  department,
                },
              },
            }
          : {}),
      },
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    })

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          studentProfile: user.studentProfile,
          teacherProfile: user.teacherProfile,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
