import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { getUserFromToken } from '@/lib/auth'

export const runtime = 'nodejs'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value
    const user = await getUserFromToken(token || undefined)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Admin access only' }, { status: 403 })
    }

    const resolvedParams = await Promise.resolve(params)
    const { id } = resolvedParams

    const body = await request.json()
    const { name } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 })
    }

    const trimmed = name.trim()

    const conflict = await prisma.class.findFirst({
      where: { name: trimmed, NOT: { id } },
    })
    if (conflict) {
      return NextResponse.json({ error: 'Class with this name already exists' }, { status: 409 })
    }

    const updated = await prisma.class.update({
      where: { id },
      data: { name: trimmed },
      include: { enrollments: true },
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      studentCount: updated.enrollments.length,
    })
  } catch (error: any) {
    console.error('Error updating class:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const token = request.cookies.get('token')?.value
    const user = await getUserFromToken(token || undefined)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'Forbidden - Admin access only' }, { status: 403 })
    }

    const resolvedParams = await Promise.resolve(params)
    const { id } = resolvedParams

    await prisma.class.delete({ where: { id } })

    return NextResponse.json({ message: 'Class deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting class:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}
