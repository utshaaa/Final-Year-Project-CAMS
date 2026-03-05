import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { getUserFromToken } from '@/lib/auth'
import { randomBytes } from 'crypto'

export const runtime = 'nodejs'

function generateId(): string {
  return randomBytes(16).toString('hex')
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    const user = await getUserFromToken(token || undefined)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== UserRole.STUDENT) {
      return NextResponse.json({ error: 'Forbidden - Student access only' }, { status: 403 })
    }

    const todos = await prisma.todoItem.findMany({
      where: { userId: user.id },
      orderBy: [
        { isCompleted: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    const formattedTodos = todos.map((todo) => ({
      id: todo.id,
      text: todo.title,
      completed: todo.isCompleted,
    }))

    return NextResponse.json(formattedTodos)
  } catch (error: any) {
    console.error('Error fetching todos:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    const user = await getUserFromToken(token || undefined)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== UserRole.STUDENT) {
      return NextResponse.json({ error: 'Forbidden - Student access only' }, { status: 403 })
    }

    const body = await request.json()
    const { text } = body

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Todo text is required' }, { status: 400 })
    }

    const todo = await prisma.todoItem.create({
      data: {
        id: generateId(),
        userId: user.id,
        title: text.trim(),
        isCompleted: false,
      },
    })

    return NextResponse.json({
      id: todo.id,
      text: todo.title,
      completed: todo.isCompleted,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating todo:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    const user = await getUserFromToken(token || undefined)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== UserRole.STUDENT) {
      return NextResponse.json({ error: 'Forbidden - Student access only' }, { status: 403 })
    }

    const body = await request.json()
    const { id, completed } = body

    if (!id) {
      return NextResponse.json({ error: 'Todo ID is required' }, { status: 400 })
    }

    const existingTodo = await prisma.todoItem.findUnique({
      where: { id: String(id) },
    })

    if (!existingTodo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }

    if (existingTodo.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden - Not your todo' }, { status: 403 })
    }

    const todo = await prisma.todoItem.update({
      where: {
        id: String(id),
      },
      data: {
        isCompleted: completed,
        completedAt: completed ? new Date() : null,
      },
    })

    return NextResponse.json({
      id: todo.id,
      text: todo.title,
      completed: todo.isCompleted,
    })
  } catch (error: any) {
    console.error('Error updating todo:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    const user = await getUserFromToken(token || undefined)

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (user.role !== UserRole.STUDENT) {
      return NextResponse.json({ error: 'Forbidden - Student access only' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Todo ID required' }, { status: 400 })
    }

    const existingTodo = await prisma.todoItem.findUnique({
      where: { id },
    })

    if (!existingTodo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }

    if (existingTodo.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden - Not your todo' }, { status: 403 })
    }

    await prisma.todoItem.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting todo:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    )
  }
}
