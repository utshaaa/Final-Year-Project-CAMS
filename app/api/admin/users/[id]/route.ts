import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { hashPassword } from '@/lib/auth'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params)
    const user = await prisma.user.findUnique({
      where: { id },
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

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase(),
      status: 'active',
      createdAt: user.createdAt,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params)
    const body = await request.json()
    const { name, email, role, password, rollNo, class: className, department } = body

    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
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

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const updateData: any = {}
    
    if (name) updateData.name = name
    
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email },
      })
      
      if (emailTaken) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 409 }
        )
      }
      
      updateData.email = email
    }
    
    if (role) {
      const validRoles = ['ADMIN', 'TEACHER', 'STUDENT']
      const roleUpper = role.toUpperCase()
      if (!validRoles.includes(roleUpper)) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        )
      }
      updateData.role = roleUpper as UserRole
    }
    
    if (password) {
      updateData.passwordHash = await hashPassword(password)
    }

    const roleUpper = (role || existingUser.role).toUpperCase()

    let resolvedClassId: string | null = null
    let resolvedClassName: string | null = null
    let classProvided = false
    if (roleUpper === 'STUDENT' && className !== undefined) {
      classProvided = true
      if (className) {
        const cls = await prisma.class.findFirst({
          where: { OR: [{ id: className }, { name: className }] },
        })
        if (cls) {
          resolvedClassId = cls.id
          resolvedClassName = cls.name
        }
      }
    }

    if (roleUpper === 'STUDENT') {
      updateData.studentProfile = {
        upsert: {
          create: {
            id: randomBytes(16).toString('hex'),
            rollNo: rollNo || `ROLL-${id.slice(0, 6)}`,
            class: resolvedClassName || 'Not Assigned',
          },
          update: {
            ...(rollNo && { rollNo }),
            ...(classProvided && { class: resolvedClassName || 'Not Assigned' }),
          }
        }
      }
    } else if (roleUpper === 'TEACHER') {
      updateData.teacherProfile = {
        upsert: {
          create: {
            id: randomBytes(16).toString('hex'),
            department: department || 'General',
          },
          update: {
            ...(department && { department }),
          }
        }
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
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

    if (roleUpper === 'STUDENT' && classProvided && user.studentProfile) {
      const studentProfileId = user.studentProfile.id
      if (resolvedClassId) {
        const existingEnrollment = await prisma.enrollment.findUnique({
          where: { studentId: studentProfileId },
        })
        if (existingEnrollment) {
          if (existingEnrollment.classId !== resolvedClassId) {
            await prisma.enrollment.update({
              where: { id: existingEnrollment.id },
              data: { classId: resolvedClassId },
            })
          }
        } else {
          await prisma.enrollment.create({
            data: {
              id: randomBytes(16).toString('hex'),
              studentId: studentProfileId,
              classId: resolvedClassId,
            },
          })
        }
      } else {
        await prisma.enrollment.deleteMany({
          where: { studentId: studentProfileId },
        })
      }
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
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params)
    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
