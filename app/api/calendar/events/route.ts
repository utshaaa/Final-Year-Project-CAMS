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

    const formattedEvents = events.map((event) => {
      const startAt = event.startAt.toISOString()
      const endAt = event.endAt?.toISOString() || null
      
      return {
        id: event.id,
        title: event.title,
        date: startAt.split('T')[0],
        startTime: startAt.split('T')[1].substring(0, 5),
        endTime: endAt ? endAt.split('T')[1].substring(0, 5) : null,
        type: event.type,
        description: event.description || '',
        classId: event.classId,
        subjectId: event.subjectId,
        className: event.class?.name || null,
      }
    })

    return NextResponse.json(formattedEvents)
  } catch (error) {
    console.error('Error fetching calendar events:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description, date, type, classId, subjectId, audience, endDate, startTime, endTime } = body

    if (!title || !date || !type) {
      return NextResponse.json(
        { error: 'Title, date, and type are required' },
        { status: 400 }
      )
    }

    let startAt: Date
    if (startTime) {
      startAt = new Date(`${date}T${startTime}:00`)
    } else {
      startAt = new Date(date)
    }

    let endAt: Date | null = null
    if (endTime) {
      const endDay = endDate || date
      endAt = new Date(`${endDay}T${endTime}:00`)
    } else if (endDate) {
      endAt = new Date(endDate)
    } else if (type === 'holiday') {
      endAt = new Date(startAt.getTime() + 7 * 24 * 60 * 60 * 1000)
    }

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
        subjectId: subjectId || null,
      },
      include: {
        class: true
      }
    })

    const formattedEvent = {
      id: event.id,
      title: event.title,
      date: event.startAt.toISOString().split('T')[0],
      startTime: event.startAt.toISOString().split('T')[1].substring(0, 5),
      endTime: event.endAt ? event.endAt.toISOString().split('T')[1].substring(0, 5) : null,
      type: event.type,
      description: event.description || '',
      classId: event.classId,
      subjectId: event.subjectId,
      className: event.class?.name || null,
    }

    return NextResponse.json(formattedEvent, { status: 201 })
  } catch (error) {
    console.error('Error creating calendar event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
