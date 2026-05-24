import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { UserRole } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn']

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

export async function verifyTokenAsync(token: string): Promise<JWTPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

export async function getUserFromToken(token: string | null | undefined) {
  if (!token) return null

  const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token

  const payload = verifyToken(cleanToken)
  if (!payload) return null

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
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

  return user
}

export async function authenticateUser(email: string, password: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
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

    if (!user) {
      return null
    }

    if (!user.passwordHash) {
      return null
    }

    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return null
    }

    return user
  } catch (error) {
    throw error
  }
}
