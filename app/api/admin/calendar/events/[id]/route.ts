import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const { id } = resolvedParams
    const body = await request.json()
    const { title, description, date, type, classId, subjectId, audience, startTime, endTime } = body

    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id },
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
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
      const endDay = body.endDate || date
      endAt = new Date(`${endDay}T${endTime}:00`)
    } else if (body.endDate) {
      endAt = new Date(body.endDate)
    }

    const event = await prisma.calendarEvent.update({
      where: { id },
      data: {
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

    return NextResponse.json({
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
    })
  } catch (error: any) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
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
    const resolvedParams = await Promise.resolve(params)
    const { id } = resolvedParams
    
    const event = await prisma.calendarEvent.findUnique({
      where: { id },
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    await prisma.calendarEvent.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Event deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}
