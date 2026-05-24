"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { UserRole } from "@prisma/client"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      const redirectPath = 
        user.role === UserRole.ADMIN ? '/admin' :
        user.role === UserRole.TEACHER ? '/teacher' :
        user.role === UserRole.STUDENT ? '/student' :
        '/login'
      router.push(redirectPath)
    } else if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return null
}
