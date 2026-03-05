import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { hashPassword } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        studentProfile: true,
        teacherProfile: true,
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, email, role, password } = body

    const existingUser = await prisma.user.findUnique({
      where: { id },
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

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        studentProfile: true,
        teacherProfile: true,
      },
    })

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase(),
      status: 'active',
      createdAt: user.createdAt,
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
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
