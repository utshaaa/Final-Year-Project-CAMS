import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, generateToken } from '@/lib/auth'
import { UserRole } from '@prisma/client'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'

function generateId(): string {
  return randomBytes(16).toString('hex')
}

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

    const roleUpper = role.toUpperCase()
    if (!['ADMIN', 'TEACHER', 'STUDENT'].includes(roleUpper)) {
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
    const userId = generateId()

    const user = await prisma.user.create({
      data: {
        id: userId,
        name,
        email,
        passwordHash: hashedPassword,
        role: roleUpper as UserRole,
        ...(roleUpper === 'STUDENT' && rollNo && className
          ? {
              studentProfile: {
                create: {
                  id: generateId(),
                  rollNo,
                  class: className,
                },
              },
            }
          : {}),
        ...(roleUpper === 'TEACHER' && department
          ? {
              teacherProfile: {
                create: {
                  id: generateId(),
                  department,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
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
