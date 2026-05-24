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
    const { name, code } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Subject name is required' }, { status: 400 })
    }

    const trimmedName = name.trim()
    const trimmedCode = code?.trim() || null

    const nameConflict = await prisma.subject.findFirst({
      where: { name: trimmedName, NOT: { id } },
    })
    if (nameConflict) {
      return NextResponse.json({ error: 'Subject with this name already exists' }, { status: 409 })
    }

    if (trimmedCode) {
      const codeConflict = await prisma.subject.findFirst({
        where: { code: trimmedCode, NOT: { id } },
      })
      if (codeConflict) {
        return NextResponse.json({ error: 'Subject with this code already exists' }, { status: 409 })
      }
    }

    const updated = await prisma.subject.update({
      where: { id },
      data: { name: trimmedName, code: trimmedCode },
    })

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      code: updated.code,
    })
  } catch (error: any) {
    console.error('Error updating subject:', error)
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

    await prisma.subject.delete({ where: { id } })

    return NextResponse.json({ message: 'Subject deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting subject:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
      },
      { status: 500 }
    )
  }
}
