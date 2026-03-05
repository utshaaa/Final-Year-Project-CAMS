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
    const { title, description, date, type, classId, audience } = body

    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id },
    })

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    const startAt = new Date(date)
    const endAt = body.endDate ? new Date(body.endDate) : null

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
      },
    })

    return NextResponse.json({
      id: event.id,
      title: event.title,
      date: event.startAt.toISOString().split('T')[0],
      type: event.type,
      description: event.description || '',
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
