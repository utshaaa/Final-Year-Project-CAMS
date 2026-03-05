import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'

function generateId(): string {
  return randomBytes(16).toString('hex')
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const role = searchParams.get('role')

    let studentClassId: string | null = null
    if (role === 'student') {
      const student = await prisma.user.findFirst({
        where: { role: UserRole.STUDENT },
        include: {
          studentProfile: {
            include: {
              enrollments: true,
            },
          },
        },
      })
      studentClassId = student?.studentProfile?.enrollments[0]?.classId || null
    }

    const where: any = {}

    if (startDate && endDate) {
      where.startAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (role === 'student') {
      where.OR = [
        { audience: 'ALL' },
        { audience: 'STUDENT' },
        ...(studentClassId ? [
          { 
            AND: [
              { audience: 'CLASS_ONLY' },
              { classId: studentClassId }
            ]
          }
        ] : []),
      ]
    } else if (role === 'teacher') {
      where.OR = [
        { audience: 'ALL' },
        { audience: 'TEACHER' },
      ]
    } else if (role === 'admin') {
    } else {
      where.audience = 'ALL'
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      include: {
        class: true,
      },
      orderBy: { startAt: 'asc' },
    })

    const formattedEvents = events.map((event) => ({
      id: event.id,
      title: event.title,
      date: event.startAt.toISOString().split('T')[0],
      type: event.type,
      description: event.description || '',
    }))

    return NextResponse.json(formattedEvents)
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, date, type, classId, audience, endDate } = body

    if (!title || !date || !type) {
      return NextResponse.json(
        { error: 'Title, date, and type are required' },
        { status: 400 }
      )
    }

    const startAt = new Date(date)
    const endAt = endDate ? new Date(endDate) : (type === 'holiday' ? new Date(startAt.getTime() + 7 * 24 * 60 * 60 * 1000) : null)

    const event = await prisma.calendarEvent.create({
      data: {
        id: generateId(),
        title,
        description: description || null,
        startAt,
        endAt,
        type,
        audience: audience || 'ALL',
        classId: classId || null,
      },
    })

    return NextResponse.json({
      id: event.id,
      title: event.title,
      date: event.startAt.toISOString().split('T')[0],
      type: event.type,
      description: event.description || '',
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating calendar event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
