import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production'

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT'

export interface JWTPayload {
  userId: string
  email: string
  role: UserRole
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET)
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256']
    })
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as UserRole,
    }
  } catch (error) {
    return null
  }
}
