import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const [totalStudents, totalTeachers, activeUsers] = await Promise.all([
      prisma.user.count({
        where: { role: UserRole.STUDENT },
      }),
      prisma.user.count({
        where: { role: UserRole.TEACHER },
      }),
      prisma.user.count({
        where: {
          role: { in: [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN] },
        },
      }),
    ])

    return NextResponse.json({
      totalStudents,
      totalTeachers,
      activeUsers,
    })
  } catch (error) {
    console.error('Error fetching admin dashboard:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}
